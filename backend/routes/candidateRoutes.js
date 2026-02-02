
// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const pdfParse = require('pdf-parse');
// const fs = require('fs');
// const csv = require('csv-parser');
// const Candidate = require('../models/Candidate');

// // Multer Setup: Parse ke liye memory storage, Bulk ke liye uploads folder
// const memoryUpload = multer({ storage: multer.memoryStorage() });
// const diskUpload = multer({ dest: 'uploads/' }); // CSV file temp store karne ke liye

// // --- 1. GET ALL CANDIDATES ---
// router.get('/', async (req, res) => {
//     try {
//         const candidates = await Candidate.find().sort({ createdAt: -1 });
//         res.status(200).json(candidates);
//     } catch (err) {
//         res.status(500).json({ message: "Error fetching candidates", error: err.message });
//     }
// });

// // --- 2. UPDATE CANDIDATE ---
// router.put('/update/:id', async (req, res) => {
//     try {
//         const updatedCandidate = await Candidate.findByIdAndUpdate(
//             req.params.id,
//             { $set: req.body },
//             { new: true }
//         );
//         res.status(200).json(updatedCandidate);
//     } catch (err) {
//         res.status(500).json({ message: "Update failed", error: err.message });
//     }
// });

// // --- 3. BULK UPLOAD (Excel/CSV Migration) ---
// // 10,000 data handle karne ke liye ye route use karein
// router.post('/bulk-upload', diskUpload.single('file'), async (req, res) => {
//     const results = [];
//     if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//     // Stream reading start
//     fs.createReadStream(req.file.path)
//         .pipe(csv())
//         .on('data', (data) => results.push(data))
//         .on('end', async () => {
//             try {
//                 // Bulk Insert in MongoDB
//                 // Note: CSV ke headers aapke Model fields se match hone chahiye (Name, Email, Position, etc.)
//                 await Candidate.insertMany(results, { ordered: false }); 
                
//                 // Temp file delete karna
//                 fs.unlinkSync(req.file.path); 
                
//                 res.status(200).json({ 
//                     message: `${results.length} Candidates imported successfully!` 
//                 });
//             } catch (err) {
//                 if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
//                 res.status(500).json({ message: "Bulk upload failed", error: err.message });
//             }
//         });
// });

// // --- 4. RESUME PARSING LOGIC ---
// router.post('/parse-logic', memoryUpload.single('resume'), async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ message: "File missing" });

//         const data = await pdfParse(req.file.buffer);
//         const text = data.text;

//         console.log("Extracted Text Preview:", text.substring(0, 100)); 

//         const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
//         const phoneMatch = text.match(/(\+?\d{1,3}[- ]?)?\d{10}/);
        
//         const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
//         const name = lines.find(l => /^[a-zA-Z\s]+$/.test(l)) || lines[0];

//         res.json({
//             name: name || "",
//             email: emailMatch ? emailMatch[0] : "",
//             contact: phoneMatch ? phoneMatch[0] : ""
//         });
//     } catch (err) {
//         console.error("Parse Error:", err);
//         res.status(500).json({ error: "Failed to parse" });
//     }
// });

// // --- 5. EMAIL DUPLICATE CHECK ---
// router.get('/check-email/:email', async (req, res) => {
//     try {
//         const existingCandidate = await Candidate.findOne({ email: req.params.email });
//         res.status(200).json({ exists: !!existingCandidate });
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });

// module.exports = router;



// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const candidateController = require('../controller/candidateController');

// // Multer Setup
// const memoryUpload = multer({ storage: multer.memoryStorage() });
// const diskUpload = multer({ dest: 'uploads/' });

// // --- 1. GET ALL CANDIDATES ---
// // Is line ko replace karein:
// router.get('/', async (req, res) => {
//     try {
//         const Candidate = require('../models/Candidate');
//         const candidates = await Candidate.find().sort({ createdAt: -1 });
//         res.status(200).json(candidates);
//     } catch (err) {
//         res.status(500).json({ message: "Error", error: err.message });
//     }
// });

// // --- 2. UPDATE CANDIDATE ---
// router.put('/update/:id', diskUpload.single('resume'), candidateController.updateCandidate);

// // --- 3. SMART BULK UPLOAD (Excel & CSV) ---
// // Note: Isse controller.bulkUploadCandidates se link kiya hai jo capital letters/spaces ignore karega
// router.post('/bulk-upload', diskUpload.single('file'), candidateController.bulkUploadCandidates);

// // --- 4. RESUME PARSING LOGIC ---
// router.post('/parse-logic', memoryUpload.single('resume'), async (req, res) => {
//     const pdfParse = require('pdf-parse');
//     try {
//         if (!req.file) return res.status(400).json({ message: "File missing" });
//         const data = await pdfParse(req.file.buffer);
//         const text = data.text;
//         const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
//         const phoneMatch = text.match(/(\+?\d{1,3}[- ]?)?\d{10}/);
//         const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
//         res.json({
//             name: lines[0] || "",
//             email: emailMatch ? emailMatch[0] : "",
//             contact: phoneMatch ? phoneMatch[0] : ""
//         });
//     } catch (err) {
//         res.status(500).json({ error: "Failed to parse" });
//     }
// });

// // --- 5. EMAIL CHECK ---
// router.get('/check-email/:email', async (req, res) => {
//     try {
//         const Candidate = require('../models/Candidate');
//         const existing = await Candidate.findOne({ email: req.params.email });
//         res.status(200).json({ exists: !!existing });
//     } catch (err) {
//         res.status(500).json({ message: "Server error" });
//     }
// });

// module.exports = router;


const express = require('express');
const router = express.Router();
const multer = require('multer');
const candidateController = require('../controller/candidateController');
const Candidate = require('../models/Candidate'); // Baar-baar require karne se achha hai ek baar upar kar lein

// Multer Setup
const memoryUpload = multer({ storage: multer.memoryStorage() });
const diskUpload = multer({ dest: 'uploads/' });

// --- 1. GET ALL CANDIDATES ---
router.get('/', async (req, res) => {
    try {
        const candidates = await Candidate.find().sort({ createdAt: -1 });
        res.status(200).json(candidates);
    } catch (err) {
        res.status(500).json({ message: "Error fetching candidates", error: err.message });
    }
});

// --- 2. CREATE SINGLE CANDIDATE (Manual Add) ---
// Frontend se jab aap single candidate add karengi, toh wo isi route pe aayega
router.post('/', diskUpload.single('resume'), candidateController.createCandidate);

// --- 3. SMART BULK UPLOAD (Excel & CSV) ---
router.post('/bulk-upload', diskUpload.single('file'), candidateController.bulkUploadCandidates);

// --- 4. UPDATE CANDIDATE ---
// Isko standard rakhein: /:id (taki update/id call ho sake)
router.put('/:id', diskUpload.single('resume'), candidateController.updateCandidate);
// --- 7. DELETE CANDIDATE ---
// Is route ko file ke end mein (module.exports se pehle) add karein
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCandidate = await Candidate.findByIdAndDelete(id);

        if (!deletedCandidate) {
            return res.status(404).json({ success: false, message: "Candidate not found" });
        }

        res.status(200).json({ success: true, message: "Candidate deleted successfully" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting candidate", error: err.message });
    }
});

// --- 5. RESUME PARSING LOGIC ---
router.post('/parse-logic', memoryUpload.single('resume'), async (req, res) => {
    const pdfParse = require('pdf-parse');
    try {
        if (!req.file) return res.status(400).json({ message: "File missing" });
        const data = await pdfParse(req.file.buffer);
        const text = data.text;
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = text.match(/(\+?\d{1,3}[- ]?)?\d{10}/);
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        res.json({
            name: lines[0] || "",
            email: emailMatch ? emailMatch[0] : "",
            contact: phoneMatch ? phoneMatch[0] : ""
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to parse" });
    }
});

// --- 6. EMAIL CHECK ---
router.get('/check-email/:email', async (req, res) => {
    try {
        const existing = await Candidate.findOne({ email: req.params.email });
        res.status(200).json({ exists: !!existing });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;