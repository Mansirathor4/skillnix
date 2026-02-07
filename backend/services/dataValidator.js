/**
 * Data Validator Service
 * 
 * Validates and scores candidate data quality
 * Suggests automatic fixes for common issues
 * Used during bulk upload
 */

class DataValidator {
    /**
     * Validate a single candidate record
     * Returns: { isValid, issues, score, suggestions, fixed }
     */
    static validateCandidate(candidate) {
        const issues = [];
        const suggestions = [];
        let score = 100;

        // 1. NAME VALIDATION
        if (!candidate.name || candidate.name.trim().length === 0) {
            issues.push('Name is empty');
            score -= 25;
        } else {
            const nameQuality = this.validateName(candidate.name);
            if (!nameQuality.isValid) {
                issues.push(...nameQuality.issues);
                score -= nameQuality.penalty;
                suggestions.push(...nameQuality.suggestions);
            }
        }

        // 2. EMAIL VALIDATION
        if (!candidate.email || !candidate.email.includes('@')) {
            issues.push('Email is invalid or missing @');
            score -= 20;
        } else {
            const emailQuality = this.validateEmail(candidate.email);
            if (!emailQuality.isValid) {
                issues.push(...emailQuality.issues);
                score -= emailQuality.penalty;
            }
        }

        // 3. CONTACT VALIDATION
        if (!candidate.contact || candidate.contact.length < 7) {
            issues.push('Contact number is too short');
            score -= 15;
        } else {
            const contactQuality = this.validateContact(candidate.contact);
            if (!contactQuality.isValid) {
                issues.push(...contactQuality.issues);
                score -= contactQuality.penalty;
            }
        }

        // 4. POSITION VALIDATION
        if (!candidate.position || candidate.position === 'N/A') {
            issues.push('Position is missing');
            score -= 10;
        }

        // 5. COMPANY VALIDATION
        if (!candidate.companyName || candidate.companyName === 'N/A') {
            // Company not critical, minor penalty
            score -= 5;
        }

        // 6. EXPERIENCE VALIDATION
        if (candidate.experience && candidate.experience !== '0') {
            const expQuality = this.validateExperience(candidate.experience);
            if (!expQuality.isValid) {
                issues.push(...expQuality.issues);
                score -= expQuality.penalty;
            }
        }

        // 7. NOTICE PERIOD VALIDATION
        if (candidate.noticePeriod && candidate.noticePeriod !== 'N/A') {
            const noticeQuality = this.validateNotice(candidate.noticePeriod);
            if (!noticeQuality.isValid) {
                issues.push(...noticeQuality.issues);
                score -= noticeQuality.penalty;
            }
        }

        // Ensure score doesn't go negative
        score = Math.max(0, score);

        return {
            isValid: score >= 70, // 70% or higher is acceptable
            issues,
            score,
            suggestions,
            severity: score >= 90 ? 'good' : score >= 70 ? 'warning' : 'error'
        };
    }

    /**
     * Detect and fix misaligned columns (email/contact swapped, etc)
     * Returns: { fixed candidate, corrections made }
     */
    static detectAndFixMisalignment(candidate) {
        const original = { ...candidate };
        const fixed = { ...candidate };
        const corrections = [];

        // Pattern Detection
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phonePattern = /^\d{7,15}$/;

        const isEmail = (val) => val && emailPattern.test(String(val).toLowerCase());
        const isPhone = (val) => val && phonePattern.test(String(val).replace(/\D/g, ''));

        // Check EMAIL field
        const emailFieldIsPhone = isPhone(fixed.email) && !isEmail(fixed.email);
        const emailFieldIsName = fixed.email && fixed.email.length > 20 && !isEmail(fixed.email) && fixed.email.includes(' ');

        // Check CONTACT field
        const contactFieldIsEmail = isEmail(fixed.contact);
        const contactFieldHasSymbols = fixed.contact && /[^0-9\-+\s]/.test(String(fixed.contact));

        // Check NAME field
        const nameFieldIsEmail = isEmail(fixed.name);
        const nameFieldIsPhone = isPhone(fixed.name);

        // FIX 1: Email and Contact are swapped
        if (emailFieldIsPhone && contactFieldIsEmail) {
            // Swap them!
            const temp = fixed.email;
            fixed.email = fixed.contact;
            fixed.contact = temp;
            corrections.push({
                type: 'SWAPPED',
                from: `Email: "${original.email}" / Contact: "${original.contact}"`,
                to: `Email: "${fixed.email}" / Contact: "${fixed.contact}"`,
                reason: 'Email field had phone, Contact field had email - swapped automatically'
            });
        }
        // FIX 2: Email field has phone number (but contact is also odd)
        else if (emailFieldIsPhone && fixed.contact && !isEmail(fixed.contact) && !isPhone(fixed.contact)) {
            // Email field has phone, keep it there and flag
            corrections.push({
                type: 'MISALIGNED',
                field: 'email',
                original: original.email,
                current: fixed.email,
                reason: 'Email field contains phone number (should be email)'
            });
        }
        // FIX 3: Contact field has email (but email field is empty/odd)
        else if (contactFieldIsEmail && (!isEmail(fixed.email) || !fixed.email)) {
            // Move contact email to email field
            if (!isEmail(fixed.email)) {
                fixed.email = fixed.contact;
                fixed.contact = original.email || '';
                corrections.push({
                    type: 'SWAPPED',
                    from: `Email: "${original.email}" / Contact: "${original.contact}"`,
                    to: `Email: "${fixed.email}" / Contact: "${fixed.contact}"`,
                    reason: 'Contact field had email - moved to email field'
                });
            }
        }

        // FIX 4: Name field has email
        if (nameFieldIsEmail) {
            fixed.email = fixed.name;
            fixed.name = original.name || 'Unknown';
            corrections.push({
                type: 'FIELD_MOVED',
                from: `Name: "${original.name}"`,
                to: `Email: "${fixed.email}"`,
                reason: 'Name field contained email address - moved to email field'
            });
        }

        // FIX 5: Name field has phone
        if (nameFieldIsPhone) {
            fixed.contact = fixed.name;
            fixed.name = original.name || 'Unknown';
            corrections.push({
                type: 'FIELD_MOVED',
                from: `Name: "${original.name}"`,
                to: `Contact: "${fixed.contact}"`,
                reason: 'Name field contained phone number - moved to contact field'
            });
        }

        return {
            fixed,
            corrections,
            wasCorrected: corrections.length > 0
        };
    }

    /**
     * Auto-fix common data quality issues
     */
    static autoFixCandidate(candidate) {
        const fixed = { ...candidate };

        // Trim all string fields
        Object.keys(fixed).forEach(key => {
            if (typeof fixed[key] === 'string') {
                fixed[key] = fixed[key].trim();
            }
        });

        // Fix name: proper case
        if (fixed.name) {
            fixed.name = this.properCase(fixed.name);
        }

        // Fix email: lowercase
        if (fixed.email) {
            fixed.email = fixed.email.toLowerCase();
        }

        // Fix contact: remove all non-digits
        if (fixed.contact) {
            fixed.contact = fixed.contact.replace(/\D/g, '');
            // If it starts with 0, remove it (Indian numbers)
            if (fixed.contact.startsWith('0')) {
                fixed.contact = fixed.contact.substring(1);
            }
        }

        // Fix CTC: remove common formatting
        if (fixed.ctc && fixed.ctc !== 'N/A') {
            fixed.ctc = fixed.ctc
                .replace(/lpa|lakh|lakhs|pa|p\.a/gi, '')
                .replace(/[,₹rs]/g, '')
                .trim();
        }

        // Fix Expected CTC: same as CTC
        if (fixed.expectedCtc && fixed.expectedCtc !== 'N/A') {
            fixed.expectedCtc = fixed.expectedCtc
                .replace(/lpa|lakh|lakhs|pa|p\.a/gi, '')
                .replace(/[,₹rs]/g, '')
                .trim();
        }

        // Fix experience: remove common words
        if (fixed.experience && fixed.experience !== '0') {
            fixed.experience = fixed.experience
                .replace(/years?|yrs?|months?|mos?/gi, '')
                .replace(/\+/g, '')
                .trim();
        }

        return fixed;
    }

    /**
     * Validate name
     */
    static validateName(name) {
        const issues = [];
        let penalty = 0;

        if (!name || name.length === 0) {
            issues.push('Name is empty');
            penalty = 25;
        } else if (name.length < 3) {
            issues.push('Name is too short');
            penalty = 15;
        } else if (name.includes('@')) {
            issues.push('Name looks like an email');
            penalty = 20;
        } else if (/^\d+$/.test(name)) {
            issues.push('Name is only numbers');
            penalty = 25;
        } else if (name.includes('_') || name.includes('.')) {
            issues.push('Name contains invalid characters');
            penalty = 10;
        }

        return {
            isValid: penalty === 0,
            issues,
            penalty,
            suggestions: penalty > 0 ? ['Name should be readable text without special characters'] : []
        };
    }

    /**
     * Validate email
     */
    static validateEmail(email) {
        const issues = [];
        let penalty = 0;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !emailRegex.test(email)) {
            issues.push('Email format is invalid');
            penalty = 20;
        } else if (email.includes('..')) {
            issues.push('Email has consecutive dots');
            penalty = 10;
        } else if (email.length > 100) {
            issues.push('Email is too long');
            penalty = 5;
        }

        return {
            isValid: penalty === 0,
            issues,
            penalty
        };
    }

    /**
     * Validate contact number
     */
    static validateContact(contact) {
        const issues = [];
        let penalty = 0;

        const cleanContact = String(contact).replace(/\D/g, '');

        if (cleanContact.length < 7) {
            issues.push('Phone number too short (less than 7 digits)');
            penalty = 15;
        } else if (cleanContact.length > 15) {
            issues.push('Phone number too long (more than 15 digits)');
            penalty = 15;
        } else if (cleanContact.length >= 10 && cleanContact.length <= 12) {
            // This is good - typical phone number
            penalty = 0;
        }

        return {
            isValid: penalty === 0,
            issues,
            penalty
        };
    }

    /**
     * Validate experience
     */
    static validateExperience(experience) {
        const issues = [];
        let penalty = 0;

        if (!experience || experience === '0') {
            penalty = 0; // Not critical
        } else {
            const numbers = experience.match(/\d+/);
            if (!numbers || numbers.length === 0) {
                issues.push('Experience has no numeric value');
                penalty = 10;
            } else {
                const exp = parseInt(numbers[0]);
                if (exp > 60) {
                    issues.push('Experience seems unrealistic (>60 years)');
                    penalty = 10;
                }
            }
        }

        return {
            isValid: penalty === 0,
            issues,
            penalty
        };
    }

    /**
     * Validate notice period
     */
    static validateNotice(notice) {
        const issues = [];
        let penalty = 0;

        if (!notice || notice === 'N/A') {
            penalty = 0;
        } else {
            const validNotices = ['immediate', 'negotiable', '15', '30', '45', '60', '90', 'days', 'day', 'weeks', 'week', 'months', 'month'];
            const normalized = notice.toLowerCase();
            
            if (!validNotices.some(v => normalized.includes(v))) {
                issues.push('Notice period format unclear');
                penalty = 5;
            }
        }

        return {
            isValid: penalty === 0,
            issues,
            penalty
        };
    }

    /**
     * Convert string to proper case
     */
    static properCase(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Generate quality report for batch of records
     */
    static generateReport(records) {
        const report = {
            totalRecords: records.length,
            byScore: {
                excellent: [], // 90-100
                good: [],      // 70-89
                poor: []       // <70
            },
            issues: {},
            suggestions: []
        };

        records.forEach((record, index) => {
            const validation = this.validateCandidate(record);
            
            if (validation.score >= 90) {
                report.byScore.excellent.push({ index, score: validation.score, record });
            } else if (validation.score >= 70) {
                report.byScore.good.push({ index, score: validation.score, record, issues: validation.issues });
            } else {
                report.byScore.poor.push({ index, score: validation.score, record, issues: validation.issues });
            }

            // Collect suggestions
            if (validation.suggestions.length > 0) {
                validation.suggestions.forEach(sugg => {
                    if (!report.suggestions.includes(sugg)) {
                        report.suggestions.push(sugg);
                    }
                });
            }
        });

        // Calculate percentages
        report.summary = {
            excellent: {
                count: report.byScore.excellent.length,
                percent: ((report.byScore.excellent.length / records.length) * 100).toFixed(1)
            },
            good: {
                count: report.byScore.good.length,
                percent: ((report.byScore.good.length / records.length) * 100).toFixed(1)
            },
            poor: {
                count: report.byScore.poor.length,
                percent: ((report.byScore.poor.length / records.length) * 100).toFixed(1)
            }
        };

        return report;
    }
}

module.exports = DataValidator;
