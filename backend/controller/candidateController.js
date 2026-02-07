// const Candidate = require('../models/Candidate');

// // 1. Add Candidate with Duplicate Check
// exports.createCandidate = async (req, res) => {
//   try {
//     const { email, contact, status } = req.body;

//     // Check if email or contact already exists
//     const existing = await Candidate.findOne({ $or: [{ email }, { contact }] });
//     if (existing) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Duplicate: Candidate with this ${existing.email === email ? 'Email' : 'Contact'} already exists!` 
//       });
//     }

//     const newCandidate = new Candidate({
//       ...req.body,
//       // Initialize history with current status
//       statusHistory: [{ status: status || 'Applied' }]
//     });

//     await newCandidate.save();
//     res.status(201).json({ success: true, data: newCandidate });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // 2. Update Status with History Tracking
/* exports.bulkUploadCandidates = async (req, res) => {
    console.log("--- 🚀 STEP 1: API Hit & File Received ---");
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });

    const filePath = req.file.path;
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        console.log("--- ✅ STEP 2: Excel File Read Success ---");

        // Send headers for streaming response
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Transfer-Encoding', 'chunked');

        const STREAM_BATCH_SIZE = 50; // 🔥 OPTIMIZATION: Stream every 50 records (faster UI updates)
        const DB_BATCH_SIZE = 500; // 🔥 OPTIMIZATION: Insert 500 records at a time (faster than 1000)
        let dbBatch = [];
        let streamBatch = [];
        let totalRowsInFile = 0;
        let validRows = 0;
        let duplicateSkipped = 0;
        let successCount = 0;
        let dbDuplicates = 0;
        const failedRecords = [];
        const seenEmails = new Set();
        const seenContacts = new Set();
        const qualityReport = { excellent: 0, good: 0, poor: 0, validationIssues: [] };
        const flushBatch = async () => {
            if (dbBatch.length === 0) return;
            console.log(`--- 📤 Inserting batch of ${dbBatch.length} records (Total so far: ${successCount}) ---`);
            try {
                const result = await Candidate.insertMany(dbBatch, { ordered: false });
                successCount += result.length;
                console.log(`--- ✅ Batch inserted successfully ---`);
            } catch (bulkErr) {
                if (bulkErr.writeErrors) {
                    const batchSuccess = dbBatch.length - bulkErr.writeErrors.length;
                    successCount += batchSuccess;
                    bulkErr.writeErrors.forEach(e => {
                        if (e.code === 11000) dbDuplicates++;
                        else failedRecords.push({ reason: e.errmsg || 'Insert error' });
                    });
                } else {
                    failedRecords.push({ reason: bulkErr.message || 'Batch insert error' });
                }
            } finally {
                dbBatch = [];
            }
        };

        // Helper: normalize cell value to string
        const cellToString = (cell) => {
            if (cell === null || cell === undefined) return "";
            // ExcelJS rich text or object handling
            if (typeof cell === 'object') {
                if (cell.text) return String(cell.text).trim();
                if (cell.richText && Array.isArray(cell.richText)) return cell.richText.map(r => r.text || '').join('').trim();
                if (cell.result) return String(cell.result).trim();
                if (cell instanceof Date) return cell.toISOString().split('T')[0];
                return String(cell).trim();
            }
            return String(cell).trim();
        };

        // Helper: determine header row by scoring first few rows (pick row with most header-like cells)
        const detectHeaderRow = (worksheet) => {
            const scores = {};
            const rowLimit = Math.min(6, worksheet.actualRowCount || worksheet.rowCount);
            for (let r = 1; r <= rowLimit; r++) {
                let score = 0;
                const row = worksheet.getRow(r);
                row.eachCell((cell) => {
                    const text = cellToString(cell.value).toLowerCase();
                    if (!text) return;
                    if (text.includes('name') || text.includes('email') || text.includes('contact') || text.includes('position') || text.includes('company') || text.includes('ctc') || text.includes('client') || text.includes('experience') || text.includes('notice')) score++;
                });
                scores[r] = score;
            }
            // choose row with highest score
            let best = 1, bestScore = -1;
            for (const k of Object.keys(scores)) {
                if (scores[k] > bestScore) { best = Number(k); bestScore = scores[k]; }
            }
            return best;
        };

        const normalizeHeader = (value) => String(value || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim();

        const headerAliases = {
            name: ['name', 'candidatename', 'fullname'],
            email: ['email', 'emailid', 'mailid'],
            contact: ['contact', 'contactno', 'contactnumber', 'phone', 'mobile', 'mobileno', 'phoneno'],
            position: ['position', 'designation', 'role', 'profile'],
            companyName: ['company', 'companyname', 'currentcompany', 'employer', 'organisation', 'organization'],
            experience: ['experience', 'exp', 'workexp'],
            ctc: ['ctc', 'currentctc', 'salary'],
            expectedCtc: ['expectedctc', 'expectedctc', 'ectc', 'expectedsalary'],
            noticePeriod: ['noticeperiod', 'notice', 'np'],
            location: ['location', 'city', 'place'],
            date: ['date', 'joiningdate', 'applieddate'],
            status: ['status', 'feedback'],
            client: ['client'],
            spoc: ['spoc', 'contactperson'],
            source: ['source', 'sourceofcv'],
            fls: ['fls', 'nonfls', 'flsnonfls', 'flsnon', 'flsnonfls', 'flsnonfls']
        };

        const headerMatchesField = (field, headerText) => {
            const norm = normalizeHeader(headerText);
            const aliases = headerAliases[field] || [];
            return aliases.includes(norm);
        };

        // Status keywords that sometimes appear in Client column
        const statusKeywords = ['interested', 'not interested', 'notselected', 'not selected', 'scheduled', 'interview', 'selected', 'rejected','notgraduate','not graduate'];

        // Helper: build column scores using sample rows (for smart remapping)
        const buildColumnScores = (worksheet, headerRowNum) => {
            const maxCols = Math.max(worksheet.columnCount, 30);
            const startRow = headerRowNum + 1;
            // 🔥 OPTIMIZATION: Reduce sample rows from 80 to 20 (5x faster column detection)
            const endRow = Math.min(worksheet.rowCount, headerRowNum + 20);

            const emailRe = /@/;
            const phoneRe = /\d{7,15}/;
            const expRe = /(yr|yrs|year|years|month|months|mos)\b/i;
            const ctcRe = /(lpa|k\b|\bpa\b|per annum|p\.a\b|lakh|lakhs|₹|rs\b|ctc)\b/i;
            const noticeRe = /(notice|np|days|months|immediate|serving)/i;
            const statusRe = /(interested|not interested|notselected|not selected|scheduled|interview|selected|rejected|not graduate|notgraduate)/i;
            const companyRe = /(pvt|ltd|llp|inc|corp|co\.?\b|company|technologies|solutions|systems|services)/i;
            const positionRe = /(developer|engineer|manager|analyst|associate|designer|lead|intern|tester|qa|sales|marketing|hr|recruiter|accountant|architect|consultant|executive|officer|admin|support)/i;

            const colScores = {};
            for (let c = 1; c <= maxCols; c++) {
                colScores[c] = { email: 0, phone: 0, name: 0, exp: 0, ctc: 0, status: 0, notice: 0, company: 0, position: 0 };
            }

            // 🔥 OPTIMIZATION: Skip columns after column 25 (most data is in first 15-20 columns)
            const maxColsToCheck = Math.min(maxCols, 25);

            for (let r = startRow; r <= endRow; r++) {
                const row = worksheet.getRow(r);
                for (let c = 1; c <= maxColsToCheck; c++) {
                    const raw = row.getCell(c) ? cellToString(row.getCell(c).value) : '';
                    if (!raw) continue;
                    const low = raw.toLowerCase();
                    if (emailRe.test(raw)) colScores[c].email += 1;
                    if (phoneRe.test(raw)) colScores[c].phone += 1;
                    if (expRe.test(raw)) colScores[c].exp += 1;
                    if (ctcRe.test(raw)) colScores[c].ctc += 1;
                    if (noticeRe.test(low)) colScores[c].notice += 1;
                    if (statusRe.test(low)) colScores[c].status += 1;
                    if (companyRe.test(low)) colScores[c].company += 1;
                    if (positionRe.test(low)) colScores[c].position += 1;
                    // name heuristic: letters + spaces, not email, not mostly numbers
                    if (!emailRe.test(raw) && /[a-zA-Z]/.test(raw) && raw.replace(/[^0-9]/g, '').length < raw.length - 2) {
                        colScores[c].name += 1;
                    }
                }
            }

            return { colScores, maxCols: maxColsToCheck };
        };

        // Iterate sheets (sync loop so we can await batch flushes)
        for (let sheetIndex = 0; sheetIndex < workbook.worksheets.length; sheetIndex++) {
            const worksheet = workbook.worksheets[sheetIndex];
            const sheetId = sheetIndex + 1;
            try {
                const headerRowNum = detectHeaderRow(worksheet);
                const headerMap = {};

                // build headerMap from detected header row
                const headerRow = worksheet.getRow(headerRowNum);
                headerRow.eachCell((cell, colNumber) => {
                    const header = cellToString(cell.value).toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
                    if (!header) return;
                    
                    // Exact matches first (higher priority)
                    if (header === 'name') headerMap['name'] = colNumber;
                    else if (header === 'email' || header === 'emailid') headerMap['email'] = colNumber;
                    else if (header === 'position' || header === 'designation') headerMap['position'] = colNumber;
                    else if (header === 'companyname' || header === 'company name' || header === 'company') headerMap['company'] = colNumber;
                    else if (header === 'experience') headerMap['experience'] = colNumber;
                    else if (header === 'ctc') headerMap['ctc'] = colNumber;
                    else if (header === 'expected ctc' || header === 'expectedctc') headerMap['expectedCtc'] = colNumber;
                    else if (header === 'notice period' || header === 'noticeperiod') headerMap['notice'] = colNumber;
                    else if (header === 'contact no' || header === 'contactno' || header === 'contact') headerMap['contact'] = colNumber;
                    else if (header === 'location') headerMap['location'] = colNumber;
                    else if (header === 'date') headerMap['date'] = colNumber;
                    else if (header === 'client') headerMap['client'] = colNumber;
                    else if (header === 'spoc') headerMap['spoc'] = colNumber;
                    else if (header === 'status') headerMap['status'] = colNumber;
                    else if (header === 'source' || header === 'source of cv') headerMap['source'] = colNumber;
                    else if (header === 'fls' || header.includes('fls')) headerMap['flsStatus'] = colNumber;
                    // Partial matches (lower priority)
                    else if (!headerMap['name'] && (header.includes('candidate') || header.includes('name'))) headerMap['name'] = colNumber;
                    else if (!headerMap['email'] && header.includes('email')) headerMap['email'] = colNumber;
                    else if (!headerMap['contact'] && (header.includes('mobile') || header.includes('phone') || header.includes('contact'))) headerMap['contact'] = colNumber;
                    else if (!headerMap['position'] && (header.includes('role') || header.includes('profile') || header.includes('job'))) headerMap['position'] = colNumber;
                    else if (!headerMap['company'] && (header.includes('organisation') || header.includes('organization') || header.includes('employer') || header.includes('current company'))) headerMap['company'] = colNumber;
                    else if (!headerMap['experience'] && (header.includes('exp') || header.includes('work exp'))) headerMap['experience'] = colNumber;
                    else if (!headerMap['expectedCtc'] && (header.includes('expected') || header.includes('ectc'))) headerMap['expectedCtc'] = colNumber;
                    else if (!headerMap['notice'] && (header.includes('notice') || header === 'np')) headerMap['notice'] = colNumber;
                    else if (!headerMap['location'] && (header.includes('city') || header.includes('place'))) headerMap['location'] = colNumber;
                    else if (!headerMap['spoc'] && (header.includes('contact person') || header.includes('spoc'))) headerMap['spoc'] = colNumber;
                    else if (!headerMap['status'] && header.includes('feedback')) headerMap['status'] = colNumber;
                });

                const { colScores, maxCols } = buildColumnScores(worksheet, headerRowNum);

                const pickBestColumn = (scoreKey, excludeCols = new Set()) => {
                    let bestCol = null;
                    let bestScore = 0;
                    for (let c = 1; c <= maxCols; c++) {
                        if (excludeCols.has(c)) continue;
                        const score = colScores[c][scoreKey] || 0;
                        if (score > bestScore) {
                            bestScore = score;
                            bestCol = c;
                        }
                    }
                    return bestCol ? { col: bestCol, score: bestScore } : null;
                };

                // ONLY do auto-correction if NO user mapping was provided
                if (!userMapping || Object.keys(userMapping).length === 0) {
                    const ensureHeader = (key, scoreKey, minScore = 2) => {
                        const assigned = new Set(Object.values(headerMap).filter(Boolean));
                        const currentCol = headerMap[key];
                        const currentScore = currentCol ? (colScores[currentCol]?.[scoreKey] || 0) : 0;
                        const best = pickBestColumn(scoreKey, new Set([...assigned].filter(c => c !== currentCol)));

                        if (!currentCol || currentScore < minScore) {
                            if (best && best.score >= minScore) headerMap[key] = best.col;
                        } else if (best && best.score > currentScore * 1.5) {
                            headerMap[key] = best.col;
                        }
                    };

                    // Only auto-enhance if no user mapping
                    ensureHeader('email', 'email', 3);
                    ensureHeader('contact', 'phone', 3);
                    ensureHeader('name', 'name', 3);
                    ensureHeader('company', 'company', 2);
                    ensureHeader('experience', 'exp', 2);
                    ensureHeader('ctc', 'ctc', 2);
                    ensureHeader('expectedCtc', 'ctc', 1);
                    ensureHeader('notice', 'notice', 2);
                    ensureHeader('position', 'position', 2);
                    ensureHeader('status', 'status', 1);

                    const swapIf = (keyA, keyB, scoreA, scoreB) => {
                        const colA = headerMap[keyA];
                        const colB = headerMap[keyB];
                        if (!colA || !colB) return;
                        const aScoreA = colScores[colA]?.[scoreA] || 0;
                        const aScoreB = colScores[colA]?.[scoreB] || 0;
                        const bScoreA = colScores[colB]?.[scoreA] || 0;
                        const bScoreB = colScores[colB]?.[scoreB] || 0;
                        if (aScoreB > aScoreA && bScoreA > bScoreB) {
                            headerMap[keyA] = colB;
                            headerMap[keyB] = colA;
                        }
                    };

                    swapIf('name', 'company', 'name', 'company');
                    swapIf('experience', 'ctc', 'exp', 'ctc');
                    swapIf('notice', 'expectedCtc', 'notice', 'ctc');
                    swapIf('company', 'expectedCtc', 'company', 'ctc');
                }

                console.log(`--- 📋 Final headerMap for sheet ${sheetId}:`, JSON.stringify(headerMap, null, 2));
                console.log(`--- 📊 Column Assignments:`);
                console.log(`  Name column: ${headerMap['name'] || 'NOT FOUND'}`);
                console.log(`  Company column: ${headerMap['company'] || 'NOT FOUND'}`);
                console.log(`  Position column: ${headerMap['position'] || 'NOT FOUND'}`);
                console.log(`  Experience column: ${headerMap['experience'] || 'NOT FOUND'}`);
                console.log(`  CTC column: ${headerMap['ctc'] || 'NOT FOUND'}`);
                console.log(`  Expected CTC column: ${headerMap['expectedCtc'] || 'NOT FOUND'}`);
                console.log(`  Notice Period column: ${headerMap['notice'] || 'NOT FOUND'}`);
                console.log(`  Email column: ${headerMap['email'] || 'NOT FOUND'}`);
                console.log(`  Contact column: ${headerMap['contact'] || 'NOT FOUND'}`);

                if (!headerMap['name']) {
                    console.log(`--- ⚠️ Sheet ${sheetId} still missing Name mapping after profiling — skipping sheet`);
                    return;
                }

                // Process rows starting after headerRowNum
                for (let r = headerRowNum + 1; r <= worksheet.rowCount; r++) {
                    totalRowsInFile++;
                    const row = worksheet.getRow(r);
                    const rawName = cellToString(row.getCell(headerMap['name']).value || '');

                    if (!rawName) {
                        duplicateSkipped++; // empty name -> skip
                        continue;
                    }

                    // skip repeated header rows inside data
                    if (rawName.toLowerCase().trim() === 'name') { duplicateSkipped++; continue; }

                    const getData = (key) => {
                        const idx = headerMap[key];
                        if (idx && idx > 0) return cellToString(row.getCell(idx).value || '');
                        return '';
                    };

                    let nameVal = rawName;
                    let emailVal = getData('email');
                    let contactVal = getData('contact') || getData('spoc');
                    let clientVal = getData('client');
                    let statusVal = getData('status');
                    let companyVal = getData('company');
                    let expectedCtcVal = getData('expectedCtc') || getData('expected');

                    // Debug first 3 rows to see data extraction
                    if (r <= headerRowNum + 3) {
                        console.log(`\n--- 🔍 ROW ${r} Data Extraction (sheet ${sheetId}):`);
                        console.log(`  Raw Name from col ${headerMap['name']}: "${rawName}"`);
                        console.log(`  Company from col ${headerMap['company']}: "${companyVal}"`);
                        console.log(`  Position from col ${headerMap['position']}: "${getData('position')}"`);
                        console.log(`  Experience from col ${headerMap['experience']}: "${getData('experience')}"`);
                        console.log(`  CTC from col ${headerMap['ctc']}: "${getData('ctc')}"`);
                        console.log(`  Expected CTC from col ${headerMap['expectedCtc']}: "${expectedCtcVal}"`);
                        console.log(`  Notice from col ${headerMap['notice']}: "${getData('notice')}"`);
                        console.log(`  Email from col ${headerMap['email']}: "${emailVal}"`);
                        console.log(`  Contact from col ${headerMap['contact']}: "${contactVal}"`);
                    }

                    // If client cell contains status keywords, move it to status
                    const clientNorm = clientVal.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
                    if (clientNorm) {
                        for (const k of statusKeywords) {
                            if (clientNorm.includes(k.replace(/\s+/g, ''))) {
                                // treat as status
                                statusVal = clientVal;
                                clientVal = '';
                                break;
                            }
                        }
                    }

                    // If companyName empty but client exists and client doesn't look like a status, use it
                    if (!companyVal && clientVal) {
                        companyVal = clientVal;
                        clientVal = '';
                    }

                    // Fallback email
                    if (!emailVal || !emailVal.includes('@')) {
                        emailVal = `user_sheet${sheetId}_row${r}_${Date.now()}@ats.local`;
                    }

                    // Fallback contact
                    if (!contactVal) contactVal = `PHONE_sheet${sheetId}_row${r}`;

                    // Avoid duplicates within batch
                    if (seenEmails.has(emailVal.toLowerCase()) || seenContacts.has(contactVal)) {
                        // Track this duplicate for display
                        duplicateRecords.push({
                            row: r,
                            name: nameVal,
                            email: emailVal,
                            contact: contactVal,
                            position: getData('position') || 'N/A',
                            company: companyVal || 'N/A',
                            reason: seenEmails.has(emailVal.toLowerCase()) ? 'Duplicate Email' : 'Duplicate Contact'
                        });
                        
                        if (validRows < 10) { // Log first 10 duplicates only
                            console.log(`\n⚠️  DUPLICATE DETECTED - Row ${r}:`);
                            console.log(`  Name: "${nameVal}"`);
                            console.log(`  Email: "${emailVal}" ${seenEmails.has(emailVal.toLowerCase()) ? '(DUPLICATE EMAIL)' : ''}`);
                            console.log(`  Contact: "${contactVal}" ${seenContacts.has(contactVal) ? '(DUPLICATE CONTACT)' : ''}`);
                        }
                        duplicateSkipped++; 
                        continue;
                    }
                    seenEmails.add(emailVal.toLowerCase());
                    seenContacts.add(contactVal);

                    // Date handling: try date column else today
                    let finalDate = new Date().toISOString().split('T')[0];
                    if (headerMap['date']) {
                        const rawDate = row.getCell(headerMap['date']).value;
                        if (rawDate instanceof Date) finalDate = rawDate.toISOString().split('T')[0];
                        else if (!isNaN(rawDate)) finalDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000)).toISOString().split('T')[0];
                    }

                    const candidateData = {
                        name: String(nameVal).trim(),
                        email: String(emailVal).trim().toLowerCase(),
                        contact: String(contactVal).trim(),
                        location: getData('location') || 'N/A',
                        position: getData('position') || 'N/A',
                        companyName: companyVal || 'N/A',
                        experience: getData('experience') || '0',
                        ctc: getData('ctc') || '',
                        expectedCtc: expectedCtcVal || '',
                        noticePeriod: getData('notice') || 'N/A',
                        client: clientVal || 'N/A',
                        spoc: getData('spoc') || '',
                        fls: getData('flsStatus') || 'N/A',
                        date: finalDate,
                        status: statusVal || 'Applied',
                        source: getData('source') || 'Excel Import'
                    };

                    // ✅ VALIDATE & AUTO-FIX DATA QUALITY
                    const validation = DataValidator.validateCandidate(candidateData);
                    const fixedData = DataValidator.autoFixCandidate(candidateData);

                    // Update quality report
                    if (validation.score >= 90) qualityReport.excellent++;
                    else if (validation.score >= 70) qualityReport.good++;
                    else qualityReport.poor++;

                    // Log validation issues (first 10 only)
                    if (validRows < 10 && validation.issues.length > 0) {
                        console.log(`\n⚠️  Row ${r} has quality issues (Score: ${validation.score}%):`);
                        validation.issues.forEach(issue => console.log(`    - ${issue}`));
                        if (validation.suggestions.length > 0) {
                            console.log(`  💡 Suggestions:`);
                            validation.suggestions.forEach(sugg => console.log(`    - ${sugg}`));
                        }
                    }

                    // Log final candidate data for first 3 records
                    if (validRows < 3) {
                        console.log(`\n--- ✅ FINAL Candidate Data #${validRows + 1}:`);
                        console.log(`  Name: "${fixedData.name}" (Quality: ${validation.score}%)`);
                        console.log(`  Company: "${fixedData.companyName}"`);
                        console.log(`  Position: "${fixedData.position}"`);
                        console.log(`  Experience: "${fixedData.experience}"`);
                        console.log(`  CTC: "${fixedData.ctc}"`);
                        console.log(`  Expected CTC: "${fixedData.expectedCtc}"`);
                        console.log(`  Notice Period: "${fixedData.noticePeriod}"`);
                    }

                    dbBatch.push(fixedData);
                    streamBatch.push(fixedData);
                    validRows++;

                    // Stream data every 100 records
                    if (streamBatch.length >= STREAM_BATCH_SIZE) {
                        const chunk = {
                            type: 'progress',
                            records: streamBatch,
                            processed: validRows,
                            total: totalRowsInFile
                        };
                        res.write(JSON.stringify(chunk) + '\n');
                        console.log(`--- 📤 Streamed ${validRows}/${totalRowsInFile} records ---`);
                        streamBatch = [];
                    }

                    // Insert in DB in batches
                    if (dbBatch.length >= DB_BATCH_SIZE) {
                        await flushBatch();
                    }
                }
            } catch (sheetErr) {
                console.error(`--- ❌ Error processing sheet ${sheetId}:`, sheetErr.message);
            }
        }

        // Flush any remaining stream records
        if (streamBatch.length > 0) {
            const chunk = {
                type: 'progress',
                records: streamBatch,
                processed: validRows,
                total: totalRowsInFile
            };
            res.write(JSON.stringify(chunk) + '\n');
            console.log(`--- 📤 Streamed ${validRows}/${totalRowsInFile} records ---`);
            streamBatch = [];
        }

        // Flush any remaining DB records
        await flushBatch();

        const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(2);
        console.log(`\n--- 📦 ✅ UPLOAD COMPLETE ---`);
        console.log(`--- ⏱️ Total Duration: ${uploadDuration} seconds ---`);
        console.log(`--- 📊 SUMMARY REPORT:`);
        console.log(`  📥 Total Rows in File: ${totalRowsInFile}`);
        console.log(`  ✅ Valid Records: ${validRows}`);
        console.log(`  💾 Successfully Saved: ${successCount}`);
        console.log(`  ⚠️  Duplicates in File: ${duplicateSkipped}`);
        console.log(`  ⚠️  Duplicates in DB: ${dbDuplicates}`);
        console.log(`  💯 Success Rate: ${((validRows / totalRowsInFile) * 100).toFixed(1)}%`);
        console.log(`\n--- 📈 DATA QUALITY BREAKDOWN:`);
        console.log(`  🟢 Excellent Quality (90-100%): ${qualityReport.excellent} records`);
        console.log(`  🟡 Good Quality (70-89%): ${qualityReport.good} records`);
        console.log(`  🔴 Poor Quality (<70%): ${qualityReport.poor} records`);
        const qualityPercent = ((qualityReport.excellent + qualityReport.good) / (qualityReport.excellent + qualityReport.good + qualityReport.poor) * 100).toFixed(1);
        console.log(`  📊 Overall Data Quality: ${qualityPercent}% good or better`);
        console.log(`--- ================== ---\n`);

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        if (validRows > 0) {
            // Send final completion message
            const finalMsg = {
                type: 'complete',
                success: true,
                message: `✅ All ${validRows} records streamed and mapped!`,
                processed: successCount,
                duplicatesInFile: duplicateSkipped,
                duplicatesInDB: dbDuplicates,
                totalProcessed: validRows,
                totalInFile: totalRowsInFile,
                failedRecords: failedRecords.length > 0 ? failedRecords : [],
                qualityBreakdown: {
                    excellent: qualityReport.excellent,
                    good: qualityReport.good,
                    poor: qualityReport.poor,
                    overallQualityPercent: (((qualityReport.excellent + qualityReport.good) / (qualityReport.excellent + qualityReport.good + qualityReport.poor)) * 100).toFixed(1)
                }
            };
            res.write(JSON.stringify(finalMsg) + '\n');
            res.end();

            return;
        } else {
            const errorMsg = {
                type: 'error',
                success: false,
                message: 'No valid candidates found. Check headers.',
                totalInFile: totalRowsInFile,
                duplicatesSkipped: duplicateSkipped
            };
            res.write(JSON.stringify(errorMsg) + '\n');
            res.end();
            return;
        }

    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.error('--- ‼️ FATAL ERROR ---', err.message);
        res.status(500).json({ success: false, message: `Error: ${err.message}` });
    }
};
//                             .replace(/\s+/g, '') 
//                             .replace(/[.\-_]/g, ''); 
        
//         normalizedRow[cleanKey] = row[key];
//     });

//     // Smart Mapping: Multiple keywords check karein
//     return {
//         srNo: normalizedRow['sr'] || normalizedRow['srno'] || normalizedRow['sno'],
//         date: normalizedRow['date'] || new Date().toISOString().split('T')[0],
//         location: normalizedRow['location'] || normalizedRow['city'] || normalizedRow['address'],
//         position: normalizedRow['position'] || normalizedRow['jobrole'] || normalizedRow['role'],
//         fls: normalizedRow['fls'] || normalizedRow['flsnonfls'] || normalizedRow['flsnon'],
//         name: normalizedRow['name'] || normalizedRow['candidate'] || normalizedRow['candidatename'],
//         // "Contact no" ya "contact" dono pakad lega
//         contact: String(normalizedRow['contactno'] || normalizedRow['contact'] || normalizedRow['phone'] || normalizedRow['mob'] || ''),
//         email: normalizedRow['email'] || normalizedRow['emailid'],
//         companyName: normalizedRow['companyname'] || normalizedRow['company'] || normalizedRow['currentcompany'],
//         experience: normalizedRow['experience'] || normalizedRow['exp'] || normalizedRow['totalexp'],
//         ctc: normalizedRow['ctc'] || normalizedRow['currentctc'],
//         expectedCtc: normalizedRow['expectedctc'] || normalizedRow['ectc'],
//         noticePeriod: normalizedRow['noticeperiod'] || normalizedRow['np'] || normalizedRow['notice'],
//         status: normalizedRow['status'] || 'Applied',
//         client: normalizedRow['client'] || normalizedRow['clientname'],
//         spoc: normalizedRow['spoc'] || normalizedRow['contactperson'],
//         source: normalizedRow['sourceofcv'] || normalizedRow['source'] || normalizedRow['cvsource']
//     };
// });


        
//         const saved = await Candidate.insertMany(finalResults, { ordered: false });
//         console.log("Records Saved in DB:", saved.length);
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//         res.status(200).json({ success: true, message: "Upload Successful!", count: saved.length });

//     } catch (err) {
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//         res.status(500).json({ success: false, message: "Import Error", error: err.message });
//     }
// };



// const Candidate = require('../models/Candidate');
// const fs = require('fs');
// const csv = require('csv-parser');
// const xlsx = require('xlsx');

// exports.bulkUploadCandidates = async (req, res) => {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded." });
//     const filePath = req.file.path;
//     let rawResults = [];

//     try {
//         const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
//         if (fileExtension === 'csv') {
//             const results = [];
//             const stream = fs.createReadStream(filePath).pipe(csv());
//             for await (const row of stream) { results.push(row); }
//             rawResults = results;
//         } else {
//             const workbook = xlsx.readFile(filePath);
//             rawResults = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
//         }

//         const finalResults = rawResults.map((row, index) => {
//             const normalizedRow = {};
//             // Sabse pehle headers ko lowercase aur clean karlo
//             Object.keys(row).forEach(key => {
//                 const cleanKey = key.toLowerCase().trim().replace(/[\s_\-]/g, ''); 
//                 normalizedRow[cleanKey] = row[key];
//             });

//             // FUZZY MAPPING: Name, Email aur Position ke liye multiple options check karo
//             const name = normalizedRow['name'] || normalizedRow['candidatename'] || normalizedRow['fullname'] || normalizedRow['candidate'];
//             const email = normalizedRow['email'] || normalizedRow['emailid'] || normalizedRow['mail'];
//             const contact = normalizedRow['contact'] || normalizedRow['contactno'] || normalizedRow['phone'] || normalizedRow['phonenumber'];
//             const position = normalizedRow['position'] || normalizedRow['jobrole'] || normalizedRow['role'] || normalizedRow['designation'];

//             if (!name) return null; // Bina naam waale skip

//             return {
//                 srNo: String(normalizedRow['srno'] || index + 1),
//                 date: normalizedRow['date'] || new Date().toISOString().split('T')[0],
//                 location: normalizedRow['location'] || 'N/A',
//                 position: position || 'General', 
//                 fls: normalizedRow['fls'] || normalizedRow['flsnonfls'] || '',
//                 name: String(name).trim(),
//                 contact: contact ? String(contact).trim() : `Pending_${index}`, 
//                 email: email ? String(email).trim() : `noemail_${index}@ats.com`,
//                 companyName: normalizedRow['companyname'] || normalizedRow['company'] || '',
//                 experience: String(normalizedRow['experience'] || normalizedRow['exp'] || '0'),
//                 ctc: String(normalizedRow['ctc'] || ''),
//                 expectedCtc: String(normalizedRow['expectedctc'] || ''),
//                 noticePeriod: String(normalizedRow['noticeperiod'] || ''),
//                 status: normalizedRow['status'] || 'Applied',
//                 client: normalizedRow['client'] || '',
//                 spoc: normalizedRow['spoc'] || '',
//                 source: normalizedRow['source'] || normalizedRow['sourceofcv'] || 'Excel Import'
//             };
//         }).filter(item => item !== null);

//         if (finalResults.length > 0) {
//             // ordered: false matlab agar ek record fail ho toh baaki stop na ho
//             const saved = await Candidate.insertMany(finalResults, { ordered: false, runValidators: false });
//             if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//             return res.status(200).json({ success: true, message: `✅ ${saved.length} Candidates imported successfully!` });
//         } else {
//             throw new Error("Excel mein koi valid data nahi mila. Make sure 'Name' column exists.");
//         }

//     } catch (err) {
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//         console.error("Import Error:", err);
//         res.status(500).json({ success: false, message: "Error: " + err.message });
//     }
// };

// exports.createCandidate = async (req, res) => {
//     try {
//         if (typeof req.body.statusHistory === 'string') {
//             req.body.statusHistory = JSON.parse(req.body.statusHistory);
//         }
//         if (req.file) {
//             req.body.resume = `/uploads/${req.file.filename}`;
//         }

//         const newCandidate = new Candidate(req.body);
//         await newCandidate.save();
//         res.status(201).json({ success: true, message: "Candidate Added Successfully" });
//     } catch (error) {
//         console.error("Create Error:", error);
//         if (error.code === 11000) {
//             return res.status(400).json({ success: false, message: "Email already exists!" });
//         }
//         res.status(500).json({ success: false, message: error.message || "Server Error" });
//     }
// };

// exports.updateCandidate = async (req, res) => {
//     try {
//         const { id } = req.params;
//         if (typeof req.body.statusHistory === 'string') {
//             try {
//                 req.body.statusHistory = JSON.parse(req.body.statusHistory);
//             } catch (e) {
//                 req.body.statusHistory = [];
//             }
//         }
//         if (req.file) {
//             req.body.resume = `/uploads/${req.file.filename}`;
//         }

//         const updatedCandidate = await Candidate.findByIdAndUpdate(
//             id, 
//             { $set: req.body }, 
//             { new: true, runValidators: true }
//         );

//         if (!updatedCandidate) {
//             return res.status(404).json({ success: false, message: "Candidate not found" });
//         }
//         res.status(200).json({ success: true, message: "Updated Successfully", data: updatedCandidate });
//     } catch (error) {
//         console.error("Update Error:", error);
//         res.status(500).json({ success: false, message: error.message });
//     }
// };

*/

const Candidate = require('../models/Candidate');
const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const ExcelJS = require('exceljs');
const DataValidator = require('../services/dataValidator');

// exports.bulkUploadCandidates = async (req, res) => {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded." });
//     const filePath = req.file.path;

//     try {
//         console.log("--- 1. File Received ---", req.file.originalname);
//         const workbook = xlsx.readFile(filePath);
//         const rawResults = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "" });

//         console.log("--- 2. Raw Rows Found ---", rawResults.length);

//         const finalResults = rawResults.map((row, index) => {
//             const normalizedRow = {};
//             Object.keys(row).forEach(key => {
//                 const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, ''); 
//                 normalizedRow[cleanKey] = row[key];
//             });

//             const name = normalizedRow['name']; 
//             const email = normalizedRow['email'];
            
//             if (!name || !email) {
//                 console.log(`⚠️ Row ${index + 1} Skipped: Name/Email missing in Excel columns`);
//                 return null;
//             }

//             return {
//                 srNo: String(normalizedRow['srno'] || index + 1),
//                 date: normalizedRow['date'] || new Date().toISOString().split('T')[0],
//                 location: normalizedRow['location'] || 'N/A',
//                 position: normalizedRow['position'] || 'General', 
//                 fls: String(normalizedRow['flsnonfls'] || '').trim(),
//                 name: String(name).trim(),
//                 contact: String(normalizedRow['contactno'] || normalizedRow['contact'] || `Pending_${index}`).trim(), 
//                 email: String(email).trim().toLowerCase(),
//                 companyName: normalizedRow['companyname'] || '',
//                 experience: String(normalizedRow['experience'] || '0'),
//                 ctc: String(normalizedRow['ctc'] || ''),
//                 expectedCtc: String(normalizedRow['expectedctc'] || ''),
//                 noticePeriod: String(normalizedRow['noticeperiod'] || ''),
//                 status: normalizedRow['status'] || 'Applied',
//                 source: normalizedRow['sourceofcv'] || 'Excel Import'
//             };
//         }).filter(item => item !== null);

//         console.log("--- 3. Final Processed Count ---", finalResults.length);
//         console.log("--- 🔍 Sample Data to Save ---", finalResults[0]); // Check karega data kaisa dikh raha hai

//         if (finalResults.length > 0) {
//             try {
//                 // BulkWrite use kar rahe hain debugger ke saath
//                 const bulkOps = finalResults.map(doc => ({
//                     updateOne: {
//                         filter: { email: doc.email },
//                         update: { $set: doc },
//                         upsert: true
//                     }
//                 }));

//                 const result = await Candidate.bulkWrite(bulkOps);
                
//                 console.log("--- 4. DB Write Result ---");
//                 console.log("New Inserted:", result.upsertedCount);
//                 console.log("Updated Existing:", result.modifiedCount);
//                 console.log("Already Matched:", result.matchedCount);

//                 const successCount = result.upsertedCount + result.modifiedCount + result.matchedCount;

//                 if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//                 return res.status(200).json({ 
//                     success: true, 
//                     message: `✅ ${successCount} Candidates processed!` 
//                 });

//             } catch (dbErr) {
//                 console.error("--- ❌ DATABASE REJECTED DATA ---");
//                 console.error("Error Message:", dbErr.message);
                
//                 // Agar validation error hai (e.g. Mobile number required)
//                 if (dbErr.errors) {
//                     Object.keys(dbErr.errors).forEach(key => {
//                         console.error(`Validation Failed for: ${key} -> ${dbErr.errors[key].message}`);
//                     });
//                 }
                
//                 // Agar Duplicate Key error hai (Code 11000)
//                 if (dbErr.code === 11000) {
//                     console.error("Duplicate Key Error Details:", JSON.stringify(dbErr.keyValue));
//                 }

//                 if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//                 return res.status(400).json({ success: false, message: "DB Error: " + dbErr.message });
//             }
//         } else {
//             console.log("--- ❌ No valid data after mapping ---");
//             if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//             return res.status(400).json({ message: "No valid data found in Excel" });
//         }

//     } catch (err) {
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//         console.error("--- ❌ CRITICAL SYSTEM ERROR ---", err);
//         res.status(500).json({ success: false, message: "System Error: " + err.message });
//     }
// };

// exports.bulkUploadCandidates = async (req, res) => {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded." });
//     const filePath = req.file.path;

//     try {
//         console.log("--- 1. File Received ---", req.file.originalname);
//         const workbook = xlsx.readFile(filePath);
//         const sheetName = workbook.SheetNames[0];
//         const rawResults = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

//         console.log("--- 2. Raw Rows Found in Excel ---", rawResults.length);

//         const finalResults = rawResults.map((row, index) => {
//             const normalizedRow = {};
//             Object.keys(row).forEach(key => {
//                 // Header cleaning: Spaces aur dots hatao
//                 const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, ''); 
//                 normalizedRow[cleanKey] = row[key];
//             });

//             // Mapping Headers (Aapki sheet ke hisaab se)
//             const name = normalizedRow['name'] || normalizedRow['candidate']; 
//             let email = normalizedRow['email'] || normalizedRow['emailid'];
//             const contact = normalizedRow['contactno'] || normalizedRow['contact'];

//             // Validation: Agar name hi nahi hai toh skip karo
//             if (!name) {
//                 if(index < 10) console.log(`⚠️ Row ${index + 2} skipped: Name column missing.`);
//                 return null;
//             }

//             // Email cleaning: Agar email "NA" hai ya galat hai, toh use unique dummy banao taaki upload ho jaye
//             const emailStr = String(email || '').trim().toLowerCase();
//             const finalEmail = (emailStr && emailStr.includes('@')) 
//                 ? emailStr 
//                 : `pending_${index}_${Date.now()}@ats.com`;

//             // Date processing: Excel numbers (45914) ko sahi date mein badlo
//             let finalDate = normalizedRow['date'];
//             if (typeof finalDate === 'number') {
//                 finalDate = new Date((finalDate - 25569) * 86400 * 1000).toISOString().split('T')[0];
//             }

//             return {
//                 srNo: String(normalizedRow['srno'] || index + 1),
//                 date: finalDate || new Date().toISOString().split('T')[0],
//                 location: String(normalizedRow['location'] || 'N/A').trim(),
//                 position: String(normalizedRow['position'] || 'General').trim(), 
//                 fls: String(normalizedRow['flsnonfls'] || '').trim(),
//                 name: String(name).trim(),
//                 contact: contact ? String(contact).trim() : 'N/A', 
//                 email: finalEmail,
//                 companyName: String(normalizedRow['companyname'] || '').trim(),
//                 experience: String(normalizedRow['experience'] || '0'),
//                 ctc: String(normalizedRow['ctc'] || ''),
//                 expectedCtc: String(normalizedRow['expectedctc'] || ''),
//                 noticePeriod: String(normalizedRow['noticeperiod'] || ''),
//                 status: String(normalizedRow['status'] || 'Applied').trim(),
//                 source: String(normalizedRow['sourceofcv'] || 'Excel Import').trim()
//             };
//         }).filter(item => item !== null);

//         console.log("--- 3. Final Processed Count ---", finalResults.length);

//         if (finalResults.length > 0) {
//             // BulkWrite with UPSERT (Email match hua toh update, nahi toh insert)
//             const bulkOps = finalResults.map(doc => ({
//                 updateOne: {
//                     filter: { email: doc.email },
//                     update: { $set: doc },
//                     upsert: true
//                 }
//             }));

//             // Large files ke liye batch processing (Optional but recommended for 15k+)
//             const result = await Candidate.bulkWrite(bulkOps, { ordered: false });
            
//             console.log("--- 4. DB Success ---");
//             console.log("Total Records in File:", finalResults.length);
//             console.log("Newly Added:", result.upsertedCount);
//             console.log("Updated/Matched:", result.modifiedCount + result.matchedCount);
            
//             if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            
//             return res.status(200).json({ 
//                 success: true, 
//                 message: `✅ ${finalResults.length} Candidates processed successfully!` 
//             });
//         } else {
//             throw new Error("No valid data found. Check if 'Name' column exists.");
//         }

//     } catch (err) {
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//         console.error("--- ❌ CRITICAL ERROR ---", err.message);
//         res.status(500).json({ success: false, message: "Error: " + err.message });
//     }
// };

// exports.bulkUploadCandidates = async (req, res) => {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded." });
//     const filePath = req.file.path;

//     try {
//         console.log("--- 1. File Received ---", req.file.originalname);

//         // ✅ UPDATED: Optimized reading to prevent 'Out of Memory'
//         const workbook = xlsx.readFile(filePath, { 
//             cellDates: true, 
//             cellFormula: false, 
//             cellHTML: false, 
//             cellText: false 
//         });

//         const sheetName = workbook.SheetNames[0];
//         const rawResults = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

//         console.log("--- 2. Raw Rows Found in Excel ---", rawResults.length);

//         const finalResults = rawResults.map((row, index) => {
//             const normalizedRow = {};
//             Object.keys(row).forEach(key => {
//                 // Header cleaning
//                 const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, ''); 
//                 normalizedRow[cleanKey] = row[key];
//             });

//             // ✅ UPDATED: Added more flexible name mapping
//             const name = normalizedRow['name'] || normalizedRow['candidate'] || normalizedRow['candidatename']; 
//             let email = normalizedRow['email'] || normalizedRow['emailid'] || normalizedRow['mail'];
//             const contact = normalizedRow['contactno'] || normalizedRow['contact'] || normalizedRow['phone'];

//             // Validation: Skip if name is missing
//             if (!name) {
//                 if(index < 5) console.log(`⚠️ Row ${index + 2} skipped: Name missing.`);
//                 return null;
//             }

//             const emailStr = String(email || '').trim().toLowerCase();
//             const finalEmail = (emailStr && emailStr.includes('@')) 
//                 ? emailStr 
//                 : `pending_${index}_${Date.now()}@ats.com`;

//             // Date processing
//             let finalDate = normalizedRow['date'];
//             if (typeof finalDate === 'number') {
//                 finalDate = new Date((finalDate - 25569) * 86400 * 1000).toISOString().split('T')[0];
//             }

//             return {
//                 srNo: String(normalizedRow['srno'] || index + 1),
//                 date: finalDate || new Date().toISOString().split('T')[0],
//                 location: String(normalizedRow['location'] || 'N/A').trim(),
//                 position: String(normalizedRow['position'] || 'General').trim(), 
//                 fls: String(normalizedRow['flsnonfls'] || '').trim(),
//                 name: String(name).trim(),
//                 contact: contact ? String(contact).trim() : 'N/A', 
//                 email: finalEmail,
//                 companyName: String(normalizedRow['companyname'] || '').trim(),
//                 experience: String(normalizedRow['experience'] || '0'),
//                 ctc: String(normalizedRow['ctc'] || ''),
//                 expectedCtc: String(normalizedRow['expectedctc'] || ''),
//                 noticePeriod: String(normalizedRow['noticeperiod'] || ''),
//                 status: String(normalizedRow['status'] || 'Applied').trim(),
//                 source: String(normalizedRow['sourceofcv'] || 'Excel Import').trim()
//             };
//         }).filter(item => item !== null);

//         console.log("--- 3. Final Processed Count ---", finalResults.length);

//         if (finalResults.length > 0) {
//             // ✅ UPDATED: Batching records for better DB performance
//             const bulkOps = finalResults.map(doc => ({
//                 updateOne: {
//                     filter: { email: doc.email },
//                     update: { $set: doc },
//                     upsert: true
//                 }
//             }));

//             const result = await Candidate.bulkWrite(bulkOps, { ordered: false });
            
//             console.log("--- 4. DB Success ---");
//             if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            
//             return res.status(200).json({ 
//                 success: true, 
//                 message: `✅ ${finalResults.length} Candidates processed successfully!` 
//             });
//         } else {
//             throw new Error("No valid data found. Check your Excel headers.");
//         }

//     } catch (err) {
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//         console.error("--- ❌ CRITICAL ERROR ---", err);
//         res.status(500).json({ success: false, message: "Error: " + err.message });
//     }
// };

 

// exports.bulkUploadCandidates = async (req, res) => {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded." });
//     const filePath = req.file.path;

//     try {
//         console.log("--- 1. File Received (Streaming Mode) ---", req.file.originalname);
        
//         const workbook = new ExcelJS.Workbook();
//         await workbook.xlsx.readFile(filePath);
//         const worksheet = workbook.getWorksheet(1); // Pehli sheet uthayi

//         const finalResults = [];
//         const headers = [];

//         // Headers detect karein
//         worksheet.getRow(1).eachCell((cell, colNumber) => {
//             headers[colNumber] = cell.value.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
//         });

//         // Rows read karein (Skip first row as it's header)
//         worksheet.eachRow((row, rowNumber) => {
//             if (rowNumber === 1) return;

//             const rowData = {};
//             row.eachCell((cell, colNumber) => {
//                 rowData[headers[colNumber]] = cell.value;
//             });

//             // Mapping (Same as before)
//             const name = rowData['name'] || rowData['candidate'] || rowData['candidatename'];
//             const email = rowData['email'] || rowData['emailid'] || rowData['mail'];

//             if (name) {
//                 const finalEmail = (email && String(email).includes('@')) 
//                     ? String(email).trim().toLowerCase() 
//                     : `pending_${rowNumber}_${Date.now()}@ats.com`;

//                 finalResults.push({
//                     name: String(name).trim(),
//                     email: finalEmail,
//                     location: String(rowData['location'] || 'N/A'),
//                     position: String(rowData['position'] || 'General'),
//                     contact: rowData['contactno'] || rowData['contact'] || 'N/A',
//                     date: rowData['date'] instanceof Date ? rowData['date'].toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
//                     status: 'Applied'
//                 });
//             }
//         });

//         console.log("--- 2. Rows Processed ---", finalResults.length);

//         if (finalResults.length > 0) {
//             const bulkOps = finalResults.map(doc => ({
//                 updateOne: {
//                     filter: { email: doc.email },
//                     update: { $set: doc },
//                     upsert: true
//                 }
//             }));

//             await Candidate.bulkWrite(bulkOps, { ordered: false });
//             console.log("--- 3. DB Upload Success ---");

//             if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//             return res.status(200).json({ success: true, message: `✅ ${finalResults.length} Records Uploaded!` });
//         } else {
//             throw new Error("No valid data found in Excel.");
//         }

//     } catch (err) {
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//         console.error("--- ❌ ERROR ---", err);
//         res.status(500).json({ success: false, message: err.message });
//     }
// };
// exports.bulkUploadCandidates = async (req, res) => {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded." });
//     const filePath = req.file.path;

//     try {
//         console.log("--- 1. File Received ---", req.file.originalname);
        
//         const workbook = new ExcelJS.Workbook();
//         await workbook.xlsx.readFile(filePath);
//         const worksheet = workbook.getWorksheet(1);

//         const finalResults = [];
//         const headers = [];

//         // Headers detect karein aur clean karein
//         worksheet.getRow(1).eachCell((cell, colNumber) => {
//             // "Contact no." becomes "contactno"
//             headers[colNumber] = cell.value.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
//         });

//         worksheet.eachRow((row, rowNumber) => {
//             if (rowNumber === 1) return;

//             const rowData = {};
//             row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
//                 rowData[headers[colNumber]] = cell.value;
//             });

//             const name = rowData['name'] || rowData['candidate'];
//             const email = rowData['email'];
//             const rawContact = rowData['contactno'] || rowData['contact'];
//             const contact = rawContact ? String(rawContact).trim() : null;

//             if (name) {
//                 // --- 1. DATE FIX LOGIC ---
//                 let finalDate = new Date().toISOString().split('T')[0];
//                 let rawDate = rowData['date'];

//                 if (rawDate) {
//                     if (rawDate instanceof Date) {
//                         finalDate = rawDate.toISOString().split('T')[0];
//                     } else if (!isNaN(rawDate)) {
//                         // Excel serial number (e.g., 45914) to JS Date conversion
//                         const convertedDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
//                         finalDate = convertedDate.toISOString().split('T')[0];
//                     }
//                 }

//                 const finalEmail = (email && String(email).includes('@')) 
//                     ? String(email).trim().toLowerCase() 
//                     : `pending_${rowNumber}_${Date.now()}@ats.com`;

//                 finalResults.push({
//                     name: String(name).trim(),
//                     email: finalEmail,
//                     location: String(rowData['location'] || 'N/A'),
//                     position: String(rowData['position'] || 'General'),
//                     contact: contact || 'N/A',
//                     date: finalDate, // Ab ye "45914" nahi, sahi date dikhayega
//                     status: 'Applied'
//                 });
//             }
//         });

//         console.log("--- 2. Rows Processed ---", finalResults.length);

//         if (finalResults.length > 0) {
//             // --- 2. DUPLICATE ERROR FIX ---
//             // Aapke screenshot mein "contact_1" duplicate error hai.
//             // Hum filter mein email OR contact dono check karenge.
//             const bulkOps = finalResults.map(doc => ({
//                 updateOne: {
//                     filter: { 
//                         $or: [
//                             { email: doc.email },
//                             { contact: doc.contact !== 'N/A' ? doc.contact : 'unique_dummy_non_existent' }
//                         ]
//                     },
//                     update: { $set: doc },
//                     upsert: true
//                 }
//             }));

//             await Candidate.bulkWrite(bulkOps, { ordered: false });
//             console.log("--- 3. DB Upload Success ---");

//             if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//             return res.status(200).json({ success: true, message: `✅ ${finalResults.length} Records Uploaded/Updated!` });
//         } else {
//             throw new Error("No valid data found in Excel.");
//         }

//     } catch (err) {
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//         console.error("--- ❌ ERROR ---", err);
//         // User ko saaf error message bhejein
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// exports.bulkUploadCandidates = async (req, res) => {
//     if (!req.file) return res.status(400).json({ message: "No file uploaded." });
//     const filePath = req.file.path;

//     try {
//         const workbook = new ExcelJS.Workbook();
//         await workbook.xlsx.readFile(filePath);
//         const worksheet = workbook.getWorksheet(1);

//         const finalResults = [];
//         const headerMap = {};

//         // 1. Sabhi Headers ko identify karein (Client aur FLS status ke saath)
//         const firstRow = worksheet.getRow(1);
//         firstRow.eachCell((cell, colNumber) => {
//             const header = cell.value ? cell.value.toString().toLowerCase().trim() : "";
            
//             if (header.includes("name")) headerMap["name"] = colNumber;
//             if (header.includes("email")) headerMap["email"] = colNumber;
//             if (header.includes("contact") || header.includes("mobile")) headerMap["contact"] = colNumber;
//             if (header.includes("location")) headerMap["location"] = colNumber;
//             if (header.includes("position")) headerMap["position"] = colNumber;
//             if (header.includes("company")) headerMap["company"] = colNumber;
//             if (header.includes("experience") || header.includes("exp")) headerMap["experience"] = colNumber;
//             if (header === "ctc") headerMap["ctc"] = colNumber;
//             if (header.includes("notice")) headerMap["notice"] = colNumber;
//             if (header.includes("date")) headerMap["date"] = colNumber;
            
//             // Nayi Fields Mapping:
//             if (header.includes("client")) headerMap["client"] = colNumber;
//             if (header.includes("fls")) headerMap["flsStatus"] = colNumber; // FLS/Non FLS column
//         });

//         worksheet.eachRow((row, rowNumber) => {
//             if (rowNumber === 1) return; // Skip Header

//             const name = row.getCell(headerMap["name"] || 0).value;
//             if (name) {
//                 // Date logic (Excel Serial to JS Date)
//                 let rawDate = row.getCell(headerMap["date"] || 0).value;
//                 let finalDate = new Date().toISOString().split('T')[0];
//                 if (rawDate && !isNaN(rawDate)) {
//                     finalDate = new Date(Math.round((rawDate - 25569) * 86400 * 1000)).toISOString().split('T')[0];
//                 }

//                 // Email fallback
//                 const emailCell = row.getCell(headerMap["email"] || 0).value;
//                 const finalEmail = (emailCell && String(emailCell).includes('@')) 
//                     ? String(emailCell).trim().toLowerCase() 
//                     : `pending_${rowNumber}_${Date.now()}@ats.com`;

//                 finalResults.push({
//                     name: String(name).trim(),
//                     email: finalEmail,
//                     contact: String(row.getCell(headerMap["contact"] || 0).value || 'N/A').trim(),
//                     location: String(row.getCell(headerMap["location"] || 0).value || 'N/A'),
//                     position: String(row.getCell(headerMap["position"] || 0).value || 'N/A'),
//                     companyName: String(row.getCell(headerMap["company"] || 0).value || 'N/A'),
//                     experience: String(row.getCell(headerMap["experience"] || 0).value || '0'),
//                     ctc: String(row.getCell(headerMap["ctc"] || 0).value || '0'),
//                     noticePeriod: String(row.getCell(headerMap["notice"] || 0).value || 'N/A'),
//                     date: finalDate,
                    
//                     // Dashboard pe ye dikhane ke liye:
//                     client: String(row.getCell(headerMap["client"] || 0).value || 'N/A'),
//                     flsStatus: String(row.getCell(headerMap["flsStatus"] || 0).value || 'N/A'),
                    
//                     status: 'Applied'
//                 });
//             }
//         });

//         if (finalResults.length > 0) {
//             const bulkOps = finalResults.map(doc => ({
//                 updateOne: {
//                     filter: { 
//                         $or: [
//                             { email: doc.email },
//                             { contact: doc.contact !== 'N/A' ? doc.contact : `dummy_${Math.random()}` }
//                         ]
//                     },
//                     update: { $set: doc },
//                     upsert: true
//                 }
//             }));

//             await Candidate.bulkWrite(bulkOps, { ordered: false });
//             if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//             return res.status(200).json({ success: true, message: `✅ ${finalResults.length} Records (including Client & FLS) Uploaded!` });
//         }
//     } catch (err) {
//         if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//         res.status(500).json({ success: false, message: err.message });
//     }
// };

// 🔥 AUTO-DETECT EXCEL HEADERS - No manual mapping needed!
function autoDetectHeaderMapping(headerRow) {
    const headerMap = {};
    const candidates = {}; // Store multiple candidates for each field
    
    headerRow.eachCell((cell, colNumber) => {
        const header = String(cell.value || '').toLowerCase().trim();
        const norm = header.replace(/[^a-z0-9]/g, '');
        const has = (s) => header.includes(s) || norm.includes(s.replace(/[^a-z0-9]/g, ''));
        
        // Priority-based matching with exact matches getting priority
        
        // Name - EXACT matches first, avoid company
        if (norm === 'name' || norm === 'candidatename' || norm === 'fullname') {
            if (!candidates['name'] || candidates['name'].priority < 10) {
                candidates['name'] = { col: colNumber, priority: 10 };
            }
        } else if ((has('name') || has('candidate') || has('applicant')) && !has('company')) {
            if (!candidates['name'] || candidates['name'].priority < 5) {
                candidates['name'] = { col: colNumber, priority: 5 };
            }
        }
        
        // Email - Must have email/mail keyword
        if (norm === 'email' || norm === 'emailid') {
            if (!candidates['email'] || candidates['email'].priority < 10) {
                candidates['email'] = { col: colNumber, priority: 10 };
            }
        } else if (has('email') || has('mail')) {
            if (!candidates['email'] || candidates['email'].priority < 5) {
                candidates['email'] = { col: colNumber, priority: 5 };
            }
        }
        
        // Contact - Must have contact/phone/mobile keyword
        if (norm === 'contact' || norm === 'contactno' || norm === 'mobileno' || norm === 'phoneno') {
            if (!candidates['contact'] || candidates['contact'].priority < 10) {
                candidates['contact'] = { col: colNumber, priority: 10 };
            }
        } else if (has('contact') || has('phone') || has('mobile')) {
            if (!candidates['contact'] || candidates['contact'].priority < 5) {
                candidates['contact'] = { col: colNumber, priority: 5 };
            }
        }
        
        // Position
        if (norm === 'position' || norm === 'designation' || norm === 'role') {
            if (!candidates['position'] || candidates['position'].priority < 10) {
                candidates['position'] = { col: colNumber, priority: 10 };
            }
        } else if (has('position') || has('role') || has('designation') || has('jobrole') || has('profile')) {
            if (!candidates['position'] || candidates['position'].priority < 5) {
                candidates['position'] = { col: colNumber, priority: 5 };
            }
        }
        
        // Company Name
        if (norm === 'company' || norm === 'companyname') {
            if (!candidates['companyName'] || candidates['companyName'].priority < 10) {
                candidates['companyName'] = { col: colNumber, priority: 10 };
            }
        } else if (has('company') || has('organisation') || has('organization') || has('employer')) {
            if (!candidates['companyName'] || candidates['companyName'].priority < 5) {
                candidates['companyName'] = { col: colNumber, priority: 5 };
            }
        }
        
        // Experience
        if (norm === 'experience' || norm === 'exp') {
            if (!candidates['experience'] || candidates['experience'].priority < 10) {
                candidates['experience'] = { col: colNumber, priority: 10 };
            }
        } else if (has('experience') || has('exp') || has('workexp')) {
            if (!candidates['experience'] || candidates['experience'].priority < 5) {
                candidates['experience'] = { col: colNumber, priority: 5 };
            }
        }
        
        // CTC
        if (norm === 'ctc' || norm === 'currentctc') {
            if (!candidates['ctc'] || candidates['ctc'].priority < 10) {
                candidates['ctc'] = { col: colNumber, priority: 10 };
            }
        } else if (has('ctc') || has('salary')) {
            if (!candidates['ctc'] || candidates['ctc'].priority < 5) {
                candidates['ctc'] = { col: colNumber, priority: 5 };
            }
        }
        
        // Expected CTC
        if (norm === 'expectedctc' || norm === 'ectc') {
            if (!candidates['expectedCtc'] || candidates['expectedCtc'].priority < 10) {
                candidates['expectedCtc'] = { col: colNumber, priority: 10 };
            }
        } else if (has('expected') && has('ctc')) {
            if (!candidates['expectedCtc'] || candidates['expectedCtc'].priority < 5) {
                candidates['expectedCtc'] = { col: colNumber, priority: 5 };
            }
        }
        
        // Notice Period
        if (norm === 'noticeperiod' || norm === 'np') {
            if (!candidates['noticePeriod'] || candidates['noticePeriod'].priority < 10) {
                candidates['noticePeriod'] = { col: colNumber, priority: 10 };
            }
        } else if (has('notice')) {
            if (!candidates['noticePeriod'] || candidates['noticePeriod'].priority < 5) {
                candidates['noticePeriod'] = { col: colNumber, priority: 5 };
            }
        }
        
        // Location
        if (norm === 'location' || norm === 'city') {
            if (!candidates['location'] || candidates['location'].priority < 10) {
                candidates['location'] = { col: colNumber, priority: 10 };
            }
        } else if (has('location') || has('city') || has('place')) {
            if (!candidates['location'] || candidates['location'].priority < 5) {
                candidates['location'] = { col: colNumber, priority: 5 };
            }
        }
        
        // Date
        if (norm === 'date') {
            if (!candidates['date'] || candidates['date'].priority < 10) {
                candidates['date'] = { col: colNumber, priority: 10 };
            }
        } else if (has('date')) {
            if (!candidates['date'] || candidates['date'].priority < 5) {
                candidates['date'] = { col: colNumber, priority: 5 };
            }
        }
        
        // FLS
        if (norm === 'fls' || norm === 'flsnonfls') {
            if (!candidates['fls'] || candidates['fls'].priority < 10) {
                candidates['fls'] = { col: colNumber, priority: 10 };
            }
        } else if (has('fls')) {
            if (!candidates['fls'] || candidates['fls'].priority < 5) {
                candidates['fls'] = { col: colNumber, priority: 5 };
            }
        }
        
        // Client
        if (norm === 'client') {
            if (!candidates['client'] || candidates['client'].priority < 10) {
                candidates['client'] = { col: colNumber, priority: 10 };
            }
        } else if (has('client')) {
            if (!candidates['client'] || candidates['client'].priority < 5) {
                candidates['client'] = { col: colNumber, priority: 5 };
            }
        }
        
        // Status
        if (norm === 'status') {
            if (!candidates['status'] || candidates['status'].priority < 10) {
                candidates['status'] = { col: colNumber, priority: 10 };
            }
        } else if (has('status')) {
            if (!candidates['status'] || candidates['status'].priority < 5) {
                candidates['status'] = { col: colNumber, priority: 5 };
            }
        }
        
        // SPOC
        if (norm === 'spoc') {
            if (!candidates['spoc'] || candidates['spoc'].priority < 10) {
                candidates['spoc'] = { col: colNumber, priority: 10 };
            }
        } else if (has('spoc') || has('contactperson')) {
            if (!candidates['spoc'] || candidates['spoc'].priority < 5) {
                candidates['spoc'] = { col: colNumber, priority: 5 };
            }
        }
        
        // Source
        if (norm === 'source') {
            if (!candidates['source'] || candidates['source'].priority < 10) {
                candidates['source'] = { col: colNumber, priority: 10 };
            }
        } else if (has('source')) {
            if (!candidates['source'] || candidates['source'].priority < 5) {
                candidates['source'] = { col: colNumber, priority: 5 };
            }
        }
        
        // Feedback
        if (norm === 'feedback') {
            if (!candidates['feedback'] || candidates['feedback'].priority < 10) {
                candidates['feedback'] = { col: colNumber, priority: 10 };
            }
        } else if (has('feedback')) {
            if (!candidates['feedback'] || candidates['feedback'].priority < 5) {
                candidates['feedback'] = { col: colNumber, priority: 5 };
            }
        }
    });
    
    // Convert candidates to headerMap (use highest priority)
    for (const [field, candidate] of Object.entries(candidates)) {
        headerMap[field] = candidate.col;
    }
    
    return headerMap;
}

exports.bulkUploadCandidates = async (req, res) => {
    const uploadStartTime = Date.now();
    console.log("--- 🚀 STEP 1: API Hit & File Received ---");
    console.log(`--- ⏱️  Upload Start Time: ${new Date().toISOString()} ---`);
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });

    const filePath = req.file.path;
    let userMapping = null;

    try {
        console.log('--- 📥 Incoming body keys:', Object.keys(req.body || {}));
        console.log('--- 📥 columnMapping raw type:', typeof req.body?.columnMapping);
        console.log('--- 📥 columnMapping raw value:', req.body?.columnMapping);

        // Parse column mapping if provided
        if (req.body.columnMapping) {
            console.log("--- 📋 Raw columnMapping received:", req.body.columnMapping);
            try {
                if (typeof req.body.columnMapping === 'string') {
                    userMapping = JSON.parse(req.body.columnMapping);
                } else if (typeof req.body.columnMapping === 'object') {
                    userMapping = req.body.columnMapping;
                }
                console.log("--- ✅ columnMapping parsed successfully:", JSON.stringify(userMapping, null, 2));
                console.log('--- ✅ columnMapping keys:', Object.keys(userMapping || {}));
            } catch (parseErr) {
                console.error("--- ❌ Failed to parse columnMapping:", parseErr.message);
                userMapping = null;
            }
        } else {
            console.log("--- ⚠️ No columnMapping provided - will use auto-detection");
        }

        const workbook = new ExcelJS.Workbook();
        const ext = (req.file.originalname || '').toLowerCase();
        if (ext.endsWith('.csv')) {
            await workbook.csv.readFile(filePath);
        } else {
            await workbook.xlsx.readFile(filePath);
        }
        console.log("--- ✅ STEP 2: Excel File Read Success ---");

        // Streaming response setup
        res.setHeader('Content-Type', 'application/x-ndjson');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Timeout', '3600000'); // 1 hour timeout

        const STREAM_BATCH_SIZE = 50; // Reduce to flush more frequently
        const DB_BATCH_SIZE = 250; // Further reduce batch size to use less memory
        let streamCount = 0;
        let dbBatch = [];
        let totalRowsInFile = 0;
        let validRows = 0;
        let duplicateSkipped = 0;
        let missingNameCount = 0;
        let headerLikeCount = 0;
        let successCount = 0;
        let dbDuplicates = 0;
        const failedRecords = [];
        let failedRecordsCount = 0;
        const skipSamples = [];
        let sampleLogged = 0;
        const seenEmails = new Set();
        const seenContacts = new Set();
        const qualityReport = { excellent: 0, good: 0, poor: 0 };
        const duplicateRecords = []; // Track all duplicates for display
        const correctionRecords = []; // Track all field misalignments that were fixed

        const recordFailure = (reason) => {
            failedRecordsCount += 1;
            if (failedRecords.length < 100) {
                failedRecords.push({ reason });
            }
        };

        const flushDbBatch = async () => {
            if (dbBatch.length === 0) return;
            try {
                // Use bulkWrite with updateOne + upsert instead of insertMany
                // This way duplicates don't fail, they just update
                const bulkOps = dbBatch.map(doc => ({
                    updateOne: {
                        filter: { email: doc.email },
                        update: { $set: doc },
                        upsert: true
                    }
                }));
                const result = await Candidate.bulkWrite(bulkOps, { ordered: false });
                successCount += result.upsertedCount + result.modifiedCount;
                
                // Clear references to help with garbage collection
                bulkOps.length = 0;
            } catch (bulkErr) {
                console.error('BulkWrite error:', bulkErr.message);
                recordFailure(bulkErr.message || 'Batch insert error');
            } finally {
                dbBatch = [];
                // Allow event loop to process other tasks
                await new Promise(resolve => setImmediate(resolve));
            }
        };

        const flushStream = () => {
            if (streamCount === 0) return;
            try {
                const message = {
                    type: 'progress',
                    processed: validRows,
                    total: totalRowsInFile
                };
                const jsonStr = JSON.stringify(message);
                res.write(jsonStr + '\n');
            } catch (err) {
                console.error('Error serializing stream batch:', err.message);
            }
        };

        const cellToString = (cell) => {
            if (cell === null || cell === undefined) return "";
            if (typeof cell === 'object') {
                if (cell.text) return String(cell.text).trim();
                if (cell.richText && Array.isArray(cell.richText)) return cell.richText.map(r => r.text || '').join('').trim();
                if (cell.result) return String(cell.result).trim();
                if (cell instanceof Date) return cell.toISOString().split('T')[0];
                return String(cell).trim();
            }
            return String(cell).trim();
        };

        // ✅ Sanitize field values to prevent JSON parsing issues
        const sanitizeField = (value) => {
            if (!value) return '';
            let str = String(value).trim();
            // Remove control characters except spaces and tabs
            str = str.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
            // Ensure it won't break JSON by being properly escaped
            return str;
        };

        const detectHeaderRow = (worksheet) => {
            let bestRow = 1;
            let bestHeaderScore = -1;
            let bestNonEmpty = -1;
            const scanRows = Math.min(20, worksheet.rowCount || 0);
            for (let r = 1; r <= scanRows; r++) {
                let headerScore = 0;
                let nonEmpty = 0;
                const row = worksheet.getRow(r);
                row.eachCell({ includeEmpty: true }, (cell) => {
                    const text = cellToString(cell.value).toLowerCase();
                    if (!text) return;
                    nonEmpty++;
                    if (text.includes('name') || text.includes('email') || text.includes('contact') || text.includes('position') || text.includes('company') || text.includes('ctc') || text.includes('client') || text.includes('experience') || text.includes('notice')) headerScore++;
                });
                if (headerScore > bestHeaderScore || (headerScore === bestHeaderScore && nonEmpty > bestNonEmpty)) {
                    bestHeaderScore = headerScore;
                    bestNonEmpty = nonEmpty;
                    bestRow = r;
                }
            }
            return { rowNum: bestRow, headerScore: bestHeaderScore, nonEmpty: bestNonEmpty };
        };

        const inferNameColumn = (worksheet, dataStartRow) => {
            const maxCols = Math.max(worksheet.columnCount || 0, 30);
            const startRow = dataStartRow;
            const endRow = Math.min(worksheet.rowCount || startRow + 1, dataStartRow + 50);
            let bestCol = null;
            let bestScore = -1;

            for (let c = 1; c <= maxCols; c++) {
                let score = 0;
                for (let r = startRow; r <= endRow; r++) {
                    const row = worksheet.getRow(r);
                    const raw = cellToString(row.getCell(c).value || '');
                    if (!raw) continue;
                    // likely not name if email or mostly numbers
                    if (/@/.test(raw)) continue;
                    if (raw.replace(/[^0-9]/g, '').length >= raw.length - 2) continue;
                    if (/[a-zA-Z]/.test(raw)) score++;
                }
                if (score > bestScore) {
                    bestScore = score;
                    bestCol = c;
                }
            }
            return bestCol;
        };

        for (let sheetIndex = 0; sheetIndex < workbook.worksheets.length; sheetIndex++) {
            const worksheet = workbook.worksheets[sheetIndex];
            const sheetId = sheetIndex + 1;

            try {
                let headerMap = {};
                const headerInfo = detectHeaderRow(worksheet);
                const headerRowNum = headerInfo.rowNum;
                const headerLikely = headerInfo.headerScore >= 2;
                const actualRows = worksheet.actualRowCount || worksheet.rowCount || 0;
                let lastRowNumber = (worksheet.lastRow && worksheet.lastRow.number) ? worksheet.lastRow.number : (worksheet.rowCount || actualRows);
                if (lastRowNumber < headerRowNum) {
                    lastRowNumber = Math.max(actualRows, worksheet.rowCount || 0, headerRowNum);
                }
                const dataStartRow = headerLikely ? headerRowNum + 1 : headerRowNum;
                console.log(`--- 📄 Sheet ${sheetId}: rowCount=${worksheet.rowCount}, lastRow=${lastRowNumber}, columnCount=${worksheet.columnCount}, headerRow=${headerRowNum}, headerLikely=${headerLikely}, dataStartRow=${dataStartRow} ---`);

                if (userMapping && Object.keys(userMapping).length > 0) {
                    console.log("--- ✅ Using USER MAPPING:", JSON.stringify(userMapping, null, 2));
                    // userMapping format: { excelColumnIndex: 'fieldName' }
                    // excelColumnIndex is 0-based (0, 1, 2, 3...) representing which column the user selected in the modal

                    const headerRow = worksheet.getRow(headerRowNum);
                    
                    // DEBUG: Print all mappings with detailed info
                    console.log("--- 🔍 MAPPING DETAILS:");
                    const sortedMappings = Object.entries(userMapping).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
                    sortedMappings.forEach(([excelColumnIndex, fieldName]) => {
                        if (!fieldName || fieldName === '') {
                            console.log(`   Column Index ${excelColumnIndex}: [SKIPPED - no mapping]`);
                            return;
                        }
                        const colNum = parseInt(excelColumnIndex, 10) + 1; // Convert to 1-based for ExcelJS
                        headerMap[fieldName] = colNum;
                        console.log(`   Column Index ${excelColumnIndex} → ExcelJS Column ${colNum} → Database Field "${fieldName}"`);
                    });
                    console.log("--- 🗺️ Final headerMap:", JSON.stringify(headerMap, null, 2));
                    console.log("--- 🧭 headerMap keys:", Object.keys(headerMap || {}));

                    // 🔍 DEBUG: Print actual Excel headers for verification
                    console.log("--- 📋 ACTUAL EXCEL HEADERS FROM ROW " + headerRowNum + ":");
                    for (let c = 1; c <= 20; c++) {
                        const headerText = cellToString(headerRow.getCell(c).value || '');
                        console.log(`   Col ${c}: "${headerText}"`);
                    }
                } else {
                    console.log("--- ⚠️ No user mapping, using AUTO-DETECTION");
                    if (headerLikely) {
                        const headerRow = worksheet.getRow(headerRowNum);
                        headerMap = autoDetectHeaderMapping(headerRow);
                        console.log("--- 🤖 AUTO-DETECTED headerMap (before validation):", JSON.stringify(headerMap, null, 2));
                        
                        // ✅ VALIDATE detected columns using sample data
                        const sampleSize = Math.min(10, lastRowNumber - dataStartRow + 1);
                        if (sampleSize > 0) {
                            console.log(`--- 🔍 Validating detected columns with ${sampleSize} sample rows...`);
                            
                            // Validate email column
                            if (headerMap['email']) {
                                let emailMatches = 0;
                                for (let r = dataStartRow; r < dataStartRow + sampleSize; r++) {
                                    const val = cellToString(worksheet.getRow(r).getCell(headerMap['email']).value || '');
                                    if (val && val.includes('@')) emailMatches++;
                                }
                                const emailPercent = (emailMatches / sampleSize) * 100;
                                console.log(`   Email col ${headerMap['email']}: ${emailMatches}/${sampleSize} (${emailPercent.toFixed(0)}%) have @`);
                                if (emailPercent < 30) {
                                    console.log(`   ⚠️ Email column validation failed - removing mapping`);
                                    delete headerMap['email'];
                                }
                            }
                            
                            // Validate contact column
                            if (headerMap['contact']) {
                                let phoneMatches = 0;
                                for (let r = dataStartRow; r < dataStartRow + sampleSize; r++) {
                                    const val = cellToString(worksheet.getRow(r).getCell(headerMap['contact']).value || '');
                                    if (val && /\d{7,}/.test(val)) phoneMatches++;
                                }
                                const phonePercent = (phoneMatches / sampleSize) * 100;
                                console.log(`   Contact col ${headerMap['contact']}: ${phoneMatches}/${sampleSize} (${phonePercent.toFixed(0)}%) have 7+ digits`);
                                if (phonePercent < 30) {
                                    console.log(`   ⚠️ Contact column validation failed - removing mapping`);
                                    delete headerMap['contact'];
                                }
                            }
                            
                            // Validate name column - should have alphabets, not mostly numbers
                            if (headerMap['name']) {
                                let nameMatches = 0;
                                for (let r = dataStartRow; r < dataStartRow + sampleSize; r++) {
                                    const val = cellToString(worksheet.getRow(r).getCell(headerMap['name']).value || '');
                                    if (val && /[a-zA-Z]{3,}/.test(val) && !/@/.test(val)) nameMatches++;
                                }
                                const namePercent = (nameMatches / sampleSize) * 100;
                                console.log(`   Name col ${headerMap['name']}: ${nameMatches}/${sampleSize} (${namePercent.toFixed(0)}%) look like names`);
                                if (namePercent < 50) {
                                    console.log(`   ⚠️ Name column validation failed - removing mapping`);
                                    delete headerMap['name'];
                                }
                            }
                        }
                        
                        console.log("--- ✅ AUTO-DETECTED headerMap (after validation):", JSON.stringify(headerMap, null, 2));
                    } else {
                        console.log("--- 🤖 No header-like row found; will infer name column from data");
                        headerMap = {};
                    }
                }

                if (!headerMap['name']) {
                    const inferredNameCol = inferNameColumn(worksheet, dataStartRow);
                    if (inferredNameCol) {
                        headerMap['name'] = inferredNameCol;
                        console.log(`--- 🛠️ Name column inferred for sheet ${sheetId}: col ${inferredNameCol}`);
                    } else {
                        console.log(`--- ⚠️ Sheet ${sheetId} skipped: no Name mapping`);
                        continue;
                    }
                }

                console.log(`--- 🧭 Sheet ${sheetId} headerMap:`, headerMap);
                console.log(`--- 📌 Sheet ${sheetId} headerRowNum: ${headerRowNum}`);
                console.log(`--- 📌 Sheet ${sheetId} columnCount: ${worksheet.columnCount}`);


                for (let r = dataStartRow; r <= lastRowNumber; r++) {
                    const row = worksheet.getRow(r);
                    if (!row) {
                        continue;
                    }
                    totalRowsInFile++;

                    // ✅ CRITICAL FIX: getData ab EXACT column se value lega - no shifting!
                    // Empty cells empty hi rahenge, values ko shift nahi hone denge
                    const getData = (key) => {
                        const idx = headerMap[key];
                        if (!idx || idx <= 0) return ''; // Column mapped nahi hai
                        
                        // Get cell from EXACT column number - preserve structure
                        const cell = row.getCell(idx);
                        if (!cell || cell.value === null || cell.value === undefined) return ''; // Empty cell
                        
                        // Convert cell value to string
                        return cellToString(cell.value);
                    };

                    // Name ke liye bhi exact column se value lenge
                    let rawName = '';
                    if (headerMap['name'] && headerMap['name'] > 0) {
                        const nameCell = row.getCell(headerMap['name']);
                        rawName = nameCell && nameCell.value ? cellToString(nameCell.value) : '';
                    }
                    
                    let emailVal = getData('email');
                    let contactVal = getData('contact');

                    if (sampleLogged < 5) {
                        console.log(`--- 🔎 Sample Row ${r} => name: "${rawName}" | email: "${emailVal}" | contact: "${contactVal}"`);
                        sampleLogged++;
                    }

                    // 🔍 DEBUG: For first few rows, print what we're extracting from each column
                    if (validRows < 5) {
                        console.log(`\n--- 🔍 ROW ${r} FULL EXTRACTION (sheet ${sheetId}):`);
                        console.log(`   🗺️ headerMap['name'] = ${headerMap['name']} => Excel Column ${headerMap['name']}`);
                        console.log(`   📝 RAW VALUE from that column: "${rawName}"`);
                        console.log(`   🗺️ headerMap['email'] = ${headerMap['email']} => Excel Column ${headerMap['email']}`);
                        console.log(`   📧 RAW VALUE from that column: "${emailVal}"`);
                        console.log(`   🗺️ headerMap['contact'] = ${headerMap['contact']} => Excel Column ${headerMap['contact']}`);
                        console.log(`   📞 RAW VALUE from that column: "${contactVal}"`);
                        console.log(`   🗺️ headerMap['position'] = ${headerMap['position']} => Excel Column ${headerMap['position']}`);
                        console.log(`   💼 RAW VALUE from that column: "${getData('position')}"`);
                        console.log(`   🗺️ headerMap['companyName'] = ${headerMap['companyName']} => Excel Column ${headerMap['companyName']}`);
                        console.log(`   🏢 RAW VALUE from that column: "${getData('companyName')}"`);
                        console.log(`   🗺️ headerMap['experience'] = ${headerMap['experience']} => Excel Column ${headerMap['experience']}`);
                        console.log(`   📅 RAW VALUE from that column: "${getData('experience')}"`);
                        console.log(`   🗺️ headerMap['ctc'] = ${headerMap['ctc']} => Excel Column ${headerMap['ctc']}`);
                        console.log(`   💰 RAW VALUE from that column: "${getData('ctc')}"`);
                        console.log(`   🗺️ headerMap['expectedCtc'] = ${headerMap['expectedCtc']} => Excel Column ${headerMap['expectedCtc']}`);
                        console.log(`   💵 RAW VALUE from that column: "${getData('expectedCtc')}"`);
                        console.log(`   🗺️ headerMap['noticePeriod'] = ${headerMap['noticePeriod']} => Excel Column ${headerMap['noticePeriod']}`);
                        console.log(`   ⏰ RAW VALUE from that column: "${getData('noticePeriod')}"`);
                        console.log(`   🗺️ headerMap['status'] = ${headerMap['status']} => Excel Column ${headerMap['status']}`);
                        console.log(`   📊 RAW VALUE from that column: "${getData('status')}"`);
                        console.log(`   🗺️ headerMap['client'] = ${headerMap['client']} => Excel Column ${headerMap['client']}`);
                        console.log(`   🏷️ RAW VALUE from that column: "${getData('client')}"`);
                        
                        // Print raw cells for verification
                        console.log(`\n   📋 RAW CELLS INSPECTION:`);
                        for (let col = 1; col <= 15; col++) {
                            const cell = row.getCell(col);
                            const value = cell && cell.value ? cellToString(cell.value) : '[EMPTY]';
                            console.log(`      Cell(${col}): "${value}"`);
                        }
                    }

                    // Skip rows that have header-like values
                    const headerLikeValues = new Set(['name', 'email', 'contact', 'contact no', 'contactno', 'phone', 'mobile']);
                    const rawNameNormalized = String(rawName || '').toLowerCase().trim();
                    if (rawNameNormalized && headerLikeValues.has(rawNameNormalized)) {
                        headerLikeCount++;
                        if (skipSamples.length < 10) skipSamples.push({ row: r, reason: `Header-like row value: ${rawNameNormalized}` });
                        continue; // Skip this row
                    }

                    // ✅ ONLY SKIP if name is completely missing/empty
                    // DO NOT skip for empty email/contact - we'll handle those
                    if (!rawName || rawName.length === 0) {
                        missingNameCount++;
                        if (skipSamples.length < 10) skipSamples.push({ row: r, reason: 'Missing name' });
                        continue; // Skip rows without name
                    }

                    // ✅ VALIDATION UPDATED: Allow empty fields - just use placeholders if required by schema
                    const hasValidEmail = emailVal && emailVal.includes('@') && emailVal.length > 3;
                    const hasValidContact = contactVal && contactVal.length >= 5;

                    // If email/contact missing or invalid, generate placeholders
                    // But preserve exact values if they exist
                    if (!hasValidEmail) {
                        // Only generate placeholder if email is required or empty
                        emailVal = emailVal || `pending_sheet${sheetId}_row${r}_${Date.now()}@ats.local`;
                    }
                    if (!hasValidContact) {
                        // Only generate placeholder if contact is required or empty
                        contactVal = contactVal || `PHONE_sheet${sheetId}_row${r}`;
                    }

                    // Check for duplicates before adding to batch
                    const emailLower = emailVal.toLowerCase();
                    if (seenEmails.has(emailLower)) {
                        duplicateRecords.push({
                            row: r,
                            name: rawName,
                            email: emailVal,
                            contact: contactVal,
                            position: getData('position') || 'N/A',
                            company: getData('companyName') || 'N/A',
                            reason: 'Duplicate Email'
                        });
                        duplicateSkipped++;
                        if (skipSamples.length < 10) skipSamples.push({ row: r, reason: `Duplicate email: ${emailVal}` });
                        continue; // Skip duplicate emails
                    }
                    if (contactVal && seenContacts.has(contactVal)) {
                        duplicateRecords.push({
                            row: r,
                            name: rawName,
                            email: emailVal,
                            contact: contactVal,
                            position: getData('position') || 'N/A',
                            company: getData('companyName') || 'N/A',
                            reason: 'Duplicate Contact'
                        });
                        duplicateSkipped++;
                        if (skipSamples.length < 10) skipSamples.push({ row: r, reason: `Duplicate contact: ${contactVal}` });
                        continue; // Skip duplicate contacts
                    }

                    // Mark as seen
                    seenEmails.add(emailLower);
                    if (contactVal) seenContacts.add(contactVal);

                    let finalDate = new Date().toISOString().split('T')[0];
                    if (headerMap['date'] && headerMap['date'] > 0) {
                        const dateCell = row.getCell(headerMap['date']);
                        const rawDate = dateCell ? dateCell.value : null;
                        if (rawDate instanceof Date) {
                            finalDate = rawDate.toISOString().split('T')[0];
                        }
                    }

                    // ✅ EXACT FIELD EXTRACTION - Har field apni exact column se value lega
                    // Empty values empty hi rahenge - NO SHIFTING!
                    const candidateData = {
                        name: sanitizeField(rawName) || '',
                        email: sanitizeField(emailVal).toLowerCase() || '',
                        contact: sanitizeField(contactVal) || '',
                        date: finalDate,
                        location: sanitizeField(getData('location')) || '',
                        position: sanitizeField(getData('position')) || '',
                        companyName: sanitizeField(getData('companyName')) || '',
                        experience: sanitizeField(getData('experience')) || '',
                        ctc: sanitizeField(getData('ctc')) || '',
                        expectedCtc: sanitizeField(getData('expectedCtc')) || '',
                        noticePeriod: sanitizeField(getData('noticePeriod')) || '',
                        status: sanitizeField(getData('status')) || 'Applied',
                        client: sanitizeField(getData('client')) || '',
                        spoc: sanitizeField(getData('spoc')) || '',
                        source: sanitizeField(getData('source')) || '',
                        feedback: sanitizeField(getData('feedback')) || '',
                        fls: sanitizeField(getData('fls')) || ''
                    };

                    // 🚨 CRITICAL DEBUGGING: Compare what we extracted vs what we're storing
                    if (validRows < 3) {
                        console.log(`\n--- 🔥 ROW ${r} FINAL CANDIDATEDATA TO BE STORED:`);
                        console.log(JSON.stringify(candidateData, null, 2));
                        console.log(`\n--- ✅ VERIFICATION:`);
                        console.log(`   Name from Excel Col ${headerMap['name']}: "${rawName}" → Stored: "${candidateData.name}"`);
                        console.log(`   Email from Excel Col ${headerMap['email']}: "${emailVal}" → Stored: "${candidateData.email}"`);
                        console.log(`   Contact from Excel Col ${headerMap['contact']}: "${contactVal}" → Stored: "${candidateData.contact}"`);
                        console.log(`   Position from Excel Col ${headerMap['position']}: "${getData('position')}" → Stored: "${candidateData.position}"`);
                        console.log(`   Company from Excel Col ${headerMap['companyName']}: "${getData('companyName')}" → Stored: "${candidateData.companyName}"`);
                        console.log(`   Experience from Excel Col ${headerMap['experience']}: "${getData('experience')}" → Stored: "${candidateData.experience}"`);
                        console.log(`   CTC from Excel Col ${headerMap['ctc']}: "${getData('ctc')}" → Stored: "${candidateData.ctc}"`);
                        console.log(`   Expected CTC from Excel Col ${headerMap['expectedCtc']}: "${getData('expectedCtc')}" → Stored: "${candidateData.expectedCtc}"`);
                        console.log(`   Notice Period from Excel Col ${headerMap['noticePeriod']}: "${getData('noticePeriod')}" → Stored: "${candidateData.noticePeriod}"`);
                    }

                    // ✅ VALIDATE & AUTO-FIX DATA QUALITY
                    const validation = DataValidator.validateCandidate(candidateData);
                    const fixedData = DataValidator.autoFixCandidate(candidateData);

                    // ✅ DETECT & FIX FIELD MISALIGNMENT (email/contact swapped, etc)
                    const { fixed: misalignmentFixed, corrections, wasCorrected } = DataValidator.detectAndFixMisalignment(fixedData);
                    
                    // If corrections were made, track them for display
                    if (wasCorrected) {
                        correctionRecords.push({
                            row: r,
                            name: misalignmentFixed.name,
                            email: misalignmentFixed.email,
                            contact: misalignmentFixed.contact,
                            corrections: corrections.map(c => ({
                                type: c.type,
                                description: c.reason || `${c.from} → ${c.to}`,
                                from: c.from || c.original,
                                to: c.to || misalignmentFixed[c.field]
                            }))
                        });
                    }

                    // Update quality report
                    if (validation.score >= 90) qualityReport.excellent++;
                    else if (validation.score >= 70) qualityReport.good++;
                    else qualityReport.poor++;

                    // Log validation issues (first 10 only)
                    if (validRows < 10 && validation.issues.length > 0) {
                        console.log(`\n⚠️  Row ${headerRowNum + validRows + 1} has quality issues (Score: ${validation.score}%):`);
                        validation.issues.forEach(issue => console.log(`    - ${issue}`));
                        if (validation.suggestions.length > 0) {
                            console.log(`  💡 Suggestions:`);
                            validation.suggestions.forEach(sugg => console.log(`    - ${sugg}`));
                        }
                    }

                    streamCount += 1;
                    dbBatch.push(misalignmentFixed); // Use the misalignment-fixed data
                    validRows++;

                    if (streamCount >= STREAM_BATCH_SIZE) {
                        flushStream();
                        streamCount = 0;
                    }
                    if (dbBatch.length >= DB_BATCH_SIZE) await flushDbBatch();
                }
            } catch (sheetErr) {
                console.error(`--- ❌ Error processing sheet ${sheetId}:`, sheetErr.message);
            }
        }

        flushStream();
        await flushDbBatch();

        console.log('--- 📦 BULK UPLOAD SUMMARY ---');
        console.log(`Total rows in file: ${totalRowsInFile}`);
        console.log(`Valid rows prepared: ${validRows}`);
        console.log(`Inserted (successCount): ${successCount}`);
        console.log(`Header-like rows detected: ${headerLikeCount}`);
        console.log(`Missing name rows (auto-filled): ${missingNameCount}`);
        console.log(`Skipped duplicates in file: ${duplicateSkipped}`);
        console.log(`Duplicates in DB (E11000): ${dbDuplicates}`);
        console.log(`Failed records: ${failedRecordsCount}`);
        
        // Quality Breakdown
        console.log('\n--- 📊 DATA QUALITY BREAKDOWN:');
        console.log(`  🟢 Excellent Quality (90-100%): ${qualityReport.excellent} records`);
        console.log(`  🟡 Good Quality (70-89%): ${qualityReport.good} records`);
        console.log(`  🔴 Poor Quality (<70%): ${qualityReport.poor} records`);
        const totalQualityRecords = qualityReport.excellent + qualityReport.good + qualityReport.poor;
        const qualityPercent = totalQualityRecords > 0 ? (((qualityReport.excellent + qualityReport.good) / totalQualityRecords) * 100).toFixed(1) : '0';
        console.log(`  📈 Overall Data Quality: ${qualityPercent}% good or better`);
        
        if (skipSamples.length > 0) {
            console.log('--- 🔍 Skip samples (first 10) ---');
            skipSamples.forEach(s => console.log(`Row ${s.row}: ${s.reason}`));
        }

        res.write(JSON.stringify({
            type: 'complete',
            totalProcessed: validRows,
            duplicatesInFile: duplicateSkipped,
            duplicatesInDB: dbDuplicates,
            missingNameCount,
            headerLikeCount,
            inserted: successCount,
            totalRowsInFile,
            failedRecordsCount: failedRecordsCount,
            qualityBreakdown: {
                excellent: qualityReport.excellent,
                good: qualityReport.good,
                poor: qualityReport.poor,
                overallQualityPercent: qualityPercent
            },
            duplicateRecords: duplicateRecords.slice(0, 100), // Return first 100 duplicates for display
            correctionRecords: correctionRecords.slice(0, 100) // Return first 100 corrections (field misalignments that were fixed)
        }) + '\n');
        res.end();

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    } catch (err) {
        console.error("--- ‼️ FATAL ERROR ---", err.message);
        if (res.headersSent) {
            res.write(JSON.stringify({ type: 'error', message: err.message }) + '\n');
            res.end();
        } else {
            res.status(500).json({ success: false, message: `Error: ${err.message}` });
        }
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
};

// Baaki createCandidate aur updateCandidate function pehle jaise hi rahenge

exports.createCandidate = async (req, res) => {
    try {
        if (typeof req.body.statusHistory === 'string') {
            req.body.statusHistory = JSON.parse(req.body.statusHistory);
        }
        if (req.file) {
            req.body.resume = `/uploads/${req.file.filename}`;
        }

        const newCandidate = new Candidate(req.body);
        await newCandidate.save();
        res.status(201).json({ success: true, message: "Candidate Added Successfully" });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ success: false, message: "Email already exists!" });
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

exports.updateCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof req.body.statusHistory === 'string') {
            try { req.body.statusHistory = JSON.parse(req.body.statusHistory); } 
            catch (e) { req.body.statusHistory = []; }
        }
        if (req.file) { req.body.resume = `/uploads/${req.file.filename}`; }

        const updatedCandidate = await Candidate.findByIdAndUpdate(id, { $set: req.body }, { new: true, runValidators: true });
        if (!updatedCandidate) return res.status(404).json({ success: false, message: "Candidate not found" });
        res.status(200).json({ success: true, message: "Updated Successfully", data: updatedCandidate });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};