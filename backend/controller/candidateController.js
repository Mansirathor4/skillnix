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
exports.bulkUploadCandidates = async (req, res) => {
    console.log("--- 🚀 STEP 1: API Hit & File Received ---");
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });

    const filePath = req.file.path;
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        console.log("--- ✅ STEP 2: Excel File Read Success ---");

        const finalResults = [];
        let totalRowsInFile = 0;
        let duplicateSkipped = 0;
        const seenEmails = new Set();
        const seenContacts = new Set();

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
            for (let r = 1; r <= Math.min(6, worksheet.rowCount); r++) {
                let score = 0;
                const row = worksheet.getRow(r);
                row.eachCell((cell) => {
                    const text = cellToString(cell.value).toLowerCase();
                    if (!text) return;
                    if (text.includes('name') || text.includes('email') || text.includes('contact') || text.includes('position') || text.includes('company') || text.includes('ctc') || text.includes('client')) score++;
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

        // Status keywords that sometimes appear in Client column
        const statusKeywords = ['interested', 'not interested', 'notselected', 'not selected', 'scheduled', 'interview', 'selected', 'rejected','notgraduate','not graduate'];

        // Iterate sheets
        workbook.eachSheet((worksheet, sheetId) => {
            try {
                const headerRowNum = detectHeaderRow(worksheet);
                const headerMap = {};

                // build headerMap from detected header row
                const headerRow = worksheet.getRow(headerRowNum);
                headerRow.eachCell((cell, colNumber) => {
                    const header = cellToString(cell.value).toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
                    if (!header) return;
                    if (header.includes('name')) headerMap['name'] = colNumber;
                    else if (header.includes('email')) headerMap['email'] = colNumber;
                    else if (header.includes('spoc') || header.includes('contact person') || header.includes('spoc name')) headerMap['spoc'] = colNumber;
                    else if (header.includes('contact') || header.includes('mobile') || header.includes('phone')) headerMap['contact'] = colNumber;
                    else if (header.includes('location') || header.includes('city') || header.includes('place')) headerMap['location'] = colNumber;
                    else if (header.includes('position') || header.includes('role') || header.includes('designation')) headerMap['position'] = colNumber;
                    else if (header.includes('company') || header.includes('company name') || header.includes('current company')) headerMap['company'] = colNumber;
                    else if (header.includes('experience') || header.includes('exp')) headerMap['experience'] = colNumber;
                    else if (header.includes('expected') || header.includes('expectedctc') || header.includes('expected ctc') || header.includes('expected salary')) headerMap['expectedCtc'] = colNumber;
                    else if (header === 'ctc' || header.includes('current ctc') || header.includes('salary')) headerMap['ctc'] = colNumber;
                    else if (header.includes('notice')) headerMap['notice'] = colNumber;
                    else if (header.includes('client') || header.includes('client name')) headerMap['client'] = colNumber;
                    else if (header.includes('fls')) headerMap['flsStatus'] = colNumber;
                    else if (header.includes('date')) headerMap['date'] = colNumber;
                    else if (header.includes('source')) headerMap['source'] = colNumber;
                    else if (header.includes('status') || header.includes('feedback')) headerMap['status'] = colNumber;
                });

                if (!headerMap['name']) {
                    console.log(`--- ⚠️ Sheet ${sheetId} header row ${headerRowNum} didn't contain a Name header - attempting column profiling fallback`);

                    // Column profiling fallback: analyze next N rows to guess which column is name/email/contact
                    const colScores = {};
                    const maxCols = Math.max(worksheet.columnCount, Object.keys(headerMap).length + 10);
                    const startRow = headerRowNum + 1;
                    const endRow = Math.min(worksheet.rowCount, headerRowNum + 80);

                    const emailRe = /@/;
                    const phoneRe = /\d{7,15}/;
                    const expRe = /(yr|yrs|year|years|month|months)/i;
                    const ctcRe = /(lpa|k\b|\bpa\b|per annum|p\.a\b|lakh|lakhs|₹|rs\b)/i;
                    const statusRe = /(interested|not interested|notselected|not selected|scheduled|interview|selected|rejected|not graduate|notgraduate)/i;

                    for (let c = 1; c <= maxCols; c++) colScores[c] = { email:0, phone:0, name:0, exp:0, ctc:0, status:0 };

                    for (let r = startRow; r <= endRow; r++) {
                        const row = worksheet.getRow(r);
                        for (let c = 1; c <= maxCols; c++) {
                            const raw = row.getCell(c) ? cellToString(row.getCell(c).value) : '';
                            if (!raw) continue;
                            const low = raw.toLowerCase();
                            if (emailRe.test(raw)) colScores[c].email += 1;
                            if (phoneRe.test(raw)) colScores[c].phone += 1;
                            if (expRe.test(raw)) colScores[c].exp += 1;
                            if (ctcRe.test(raw)) colScores[c].ctc += 1;
                            if (statusRe.test(low)) colScores[c].status += 1;
                            // name heuristic: contains letters and spaces, not email, not mostly numbers
                            if (!emailRe.test(raw) && /[a-zA-Z]/.test(raw) && raw.replace(/[^0-9]/g,'').length < raw.length - 2) colScores[c].name += 1;
                        }
                    }

                    // choose best columns if headerMap missing
                    const assignIfMissing = (key, scoreKey) => {
                        if (headerMap[key]) return;
                        let bestCol = null, bestScore = 0;
                        for (let col in colScores) {
                            if (colScores[col][scoreKey] > bestScore) { bestScore = colScores[col][scoreKey]; bestCol = Number(col); }
                        }
                        if (bestCol && bestScore > 0) headerMap[key] = bestCol;
                    };

                    assignIfMissing('email','email');
                    assignIfMissing('contact','phone');
                    assignIfMissing('position','name');
                    assignIfMissing('name','name');
                    assignIfMissing('ctc','ctc');
                    assignIfMissing('experience','exp');
                    assignIfMissing('status','status');

                    console.log(`--- 🔎 Fallback headerMap for sheet ${sheetId}:`, headerMap);

                    if (!headerMap['name']) {
                        console.log(`--- ⚠️ Sheet ${sheetId} still missing Name mapping after profiling — skipping sheet`);
                        return;
                    }
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
                        duplicateSkipped++; continue;
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

                    finalResults.push(candidateData);
                }
            } catch (sheetErr) {
                console.error(`--- ❌ Error processing sheet ${sheetId}:`, sheetErr.message);
            }
        });

        console.log(`--- 📦 Total Valid Unique Rows: ${finalResults.length} out of ${totalRowsInFile} data rows ---`);
        console.log(`--- ⏭️ Duplicates Skipped: ${duplicateSkipped} ---`);

        // Database Sync
        if (finalResults.length > 0) {
            let successCount = 0;
            let dbDuplicates = 0;
            const failedRecords = [];

            for (let doc of finalResults) {
                try {
                    await Candidate.findOneAndUpdate(
                        { email: doc.email },
                        { $set: doc },
                        { upsert: true, new: true }
                    );
                    successCount++;
                } catch (dbErr) {
                    if (dbErr.code === 11000) {
                        console.log(`--- ⏭️ DB Duplicate for ${doc.email}, skipping ---`);
                        dbDuplicates++;
                        failedRecords.push({ name: doc.name, email: doc.email, reason: 'Already exists' });
                    } else {
                        console.error(`--- ❌ Error saving ${doc.name}:`, dbErr.message);
                        failedRecords.push({ name: doc.name, email: doc.email, reason: dbErr.message });
                    }
                }
            }

            console.log('--- 🎉 STEP 4: Database Write Complete ---');
            console.log('Successfully Saved:', successCount);
            console.log('DB Duplicates Skipped:', dbDuplicates);

            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            const allCandidates = await Candidate.find({}).sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                message: `✅ Successfully processed ${successCount} candidates! (${duplicateSkipped + dbDuplicates} duplicates skipped)`,
                processed: successCount,
                duplicatesInFile: duplicateSkipped,
                duplicatesInDB: dbDuplicates,
                totalProcessed: finalResults.length,
                totalInFile: totalRowsInFile,
                failedRecords: failedRecords.length > 0 ? failedRecords : [],
                allCandidates: allCandidates
            });
        } else {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ success: false, message: 'No valid candidates found. Check headers.', totalInFile: totalRowsInFile, duplicatesSkipped: duplicateSkipped });
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

const Candidate = require('../models/Candidate');
const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const ExcelJS = require('exceljs');

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

exports.bulkUploadCandidates = async (req, res) => {
    console.log("--- 🚀 STEP 1: API Hit & File Received ---");
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded." });
    
    const filePath = req.file.path;
    try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        console.log("--- ✅ STEP 2: Excel File Read Success ---");

        const finalResults = [];
        let totalRowsInFile = 0;
        let duplicateSkipped = 0;
        const seenEmails = new Set();
        const seenContacts = new Set();

        // 1. Iterate all sheets (some exports split data across multiple sheets)
        workbook.eachSheet((worksheet, sheetId) => {
            try {
                const headerMap = {};
                const firstRow = worksheet.getRow(1);
                firstRow.eachCell((cell, colNumber) => {
                    const header = cell.value ? cell.value.toString().toLowerCase().trim() : "";
                    if (header.includes("name")) headerMap["name"] = colNumber;
                    else if (header.includes("email")) headerMap["email"] = colNumber;
                    else if (header.includes("contact") || header.includes("mobile") || header.includes("phone")) headerMap["contact"] = colNumber;
                    else if (header.includes("location") || header.includes("city")) headerMap["location"] = colNumber;
                    else if (header.includes("position") || header.includes("role")) headerMap["position"] = colNumber;
                    else if (header.includes("company")) headerMap["company"] = colNumber;
                    else if (header.includes("experience") || header.includes("exp")) headerMap["experience"] = colNumber;
                    else if (header === "ctc" || header.includes("salary")) headerMap["ctc"] = colNumber;
                    else if (header.includes("notice")) headerMap["notice"] = colNumber;
                    else if (header.includes("client")) headerMap["client"] = colNumber;
                    else if (header.includes("fls")) headerMap["flsStatus"] = colNumber;
                    else if (header.includes("date")) headerMap["date"] = colNumber;
                });

                // If this sheet doesn't have a name column, skip it
                if (!headerMap["name"]) {
                    console.log(`--- ⚠️ Sheet ${sheetId} skipped: no Name header`);
                    return;
                }

                // Process rows in this sheet
                worksheet.eachRow((row, rowNumber) => {
                    if (rowNumber === 1) return; // skip header

                    totalRowsInFile++;
                    const nameIdx = headerMap["name"];
                    const nameCell = row.getCell(nameIdx).value;

                    // Skip header-like rows inside data
                    if (nameCell && String(nameCell).toLowerCase().trim() === "name") {
                        duplicateSkipped++;
                        return;
                    }

                    if (nameCell && String(nameCell).trim()) {
                        const getData = (key) => {
                            const idx = headerMap[key];
                            if (idx && idx > 0) {
                                const val = row.getCell(idx).value;
                                return val !== null && val !== undefined ? String(val).trim() : "";
                            }
                            return "";
                        };

                        let email = getData("email");
                        let contact = getData("contact");

                        if (!email || !email.includes("@")) {
                            email = `user_sheet${sheetId}_row${rowNumber}_${Date.now()}@ats.local`;
                        }

                        if (!contact) {
                            contact = `PHONE_sheet${sheetId}_row${rowNumber}`;
                        }

                        // Skip duplicates within the batch
                        if (seenEmails.has(email.toLowerCase())) {
                            duplicateSkipped++;
                            return;
                        }
                        if (seenContacts.has(contact)) {
                            duplicateSkipped++;
                            return;
                        }

                        seenEmails.add(email.toLowerCase());
                        seenContacts.add(contact);

                        // Date handling
                        let finalDate = new Date().toISOString().split('T')[0];

                        const candidateData = {
                            name: String(nameCell).trim(),
                            email: email.toLowerCase(),
                            contact: contact,
                            location: getData("location") || 'N/A',
                            position: getData("position") || 'N/A',
                            companyName: getData("company") || 'N/A',
                            experience: getData("experience") || '0',
                            ctc: getData("ctc") || '0',
                            noticePeriod: getData("notice") || 'N/A',
                            client: getData("client") || 'N/A',
                            fls: getData("flsStatus") || 'N/A',
                            date: finalDate,
                            status: 'Applied'
                        };

                        finalResults.push(candidateData);
                    }
                });
            } catch (sheetErr) {
                console.error(`--- ❌ Error processing sheet ${sheetId}:`, sheetErr.message);
            }
        });

        console.log(`--- 📦 Total Valid Unique Rows: ${finalResults.length} out of ${totalRowsInFile} data rows ---`);
        console.log(`--- ⏭️ Duplicates Skipped: ${duplicateSkipped} ---`);

        // 3. Database Sync using BulkWrite
        if (finalResults.length > 0) {
            try {
                // ✅ SKIP ON ERROR MODE - Insert individually so duplicates don't block entire upload
                let successCount = 0;
                let dbDuplicates = 0;
                const failedRecords = [];

                for (let doc of finalResults) {
                    try {
                        // Try to update if exists, insert if not
                        const result = await Candidate.findOneAndUpdate(
                            { email: doc.email },
                            { $set: doc },
                            { upsert: true, new: true }
                        );
                        successCount++;
                    } catch (dbErr) {
                        // ✅ If duplicate error, log and continue (don't break)
                        if (dbErr.code === 11000) {
                            console.log(`--- ⏭️ DB Duplicate for ${doc.email}, skipping ---`);
                            dbDuplicates++;
                            failedRecords.push({
                                name: doc.name,
                                email: doc.email,
                                reason: "Already exists in database"
                            });
                        } else {
                            console.error(`--- ❌ Error saving ${doc.name}:`, dbErr.message);
                            failedRecords.push({
                                name: doc.name,
                                email: doc.email,
                                reason: dbErr.message
                            });
                        }
                    }
                }

                console.log("--- 🎉 STEP 4: Database Write Complete ---");
                console.log("Successfully Saved:", successCount);
                console.log("DB Duplicates Skipped:", dbDuplicates);
                console.log("Total Processed:", finalResults.length);

                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

                // ✅ FETCH ALL CANDIDATES TO RETURN
                const allCandidates = await Candidate.find({}).sort({ createdAt: -1 });

                return res.status(200).json({ 
                    success: true, 
                    message: `✅ Successfully processed ${successCount} candidates! (${duplicateSkipped + dbDuplicates} duplicates skipped)`,
                    processed: successCount,
                    duplicatesInFile: duplicateSkipped,
                    duplicatesInDB: dbDuplicates,
                    totalProcessed: finalResults.length,
                    totalInFile: totalRowsInFile,
                    failedRecords: failedRecords.length > 0 ? failedRecords : [],
                    allCandidates: allCandidates
                });

            } catch (dbErr) {
                console.error("--- ❌ Database Error ---", dbErr.message);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                return res.status(500).json({ 
                    success: false, 
                    message: `Database error: ${dbErr.message}` 
                });
            }
        } else {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return res.status(400).json({ 
                success: false, 
                message: "No valid candidates found. All rows were either headers or duplicates.",
                totalInFile: totalRowsInFile,
                duplicatesSkipped: duplicateSkipped
            });
        }

    } catch (err) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        console.error("--- ‼️ FATAL ERROR ---", err.message);
        res.status(500).json({ success: false, message: `Error: ${err.message}` });
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