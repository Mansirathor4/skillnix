
// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const pdfParse = require('pdf-parse');

// const upload = multer({ storage: multer.memoryStorage() });

// // controllers/candidateController.js mein dhoondo


// // POST: http://localhost:5000/candidates/parse-logic
// router.post('/parse-logic', upload.single('resume'), async (req, res) => {
//     try {
//         if (!req.file) return res.status(400).json({ message: "File missing" });

//         const data = await pdfParse(req.file.buffer);
//         const text = data.text;

//         // DEBUG: Terminal mein check karein ye print ho raha hai ya nahi
//         console.log("Extracted Text:", text.substring(0, 100)); 

//         const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
//         const phoneMatch = text.match(/(\+?\d{1,3}[- ]?)?\d{10}/);
        
//         // Name extraction: Pehli aisi line jo khali na ho aur jisme symbols na hon
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

// module.exports = router;


const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Candidate = require('../models/Candidate'); // Ensure model is imported

const upload = multer({ storage: multer.memoryStorage() });

// --- 1. GET ALL CANDIDATES (Dashboard ke liye zaroori hai) ---
router.get('/', async (req, res) => {
    try {
        const candidates = await Candidate.find().sort({ createdAt: -1 });
        res.status(200).json(candidates);
    } catch (err) {
        res.status(500).json({ message: "Error fetching candidates", error: err.message });
    }
});

// --- 2. UPDATE CANDIDATE (Call Back remove/edit karne ke liye) ---
router.put('/update/:id', async (req, res) => {
    try {
        // Ye route aapke Dashboard ki 'Save' function se call hoga
        const updatedCandidate = await Candidate.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, // Isme callBackDate: "" jayega toh DB update ho jayega
            { new: true }
        );
        res.status(200).json(updatedCandidate);
    } catch (err) {
        res.status(500).json({ message: "Update failed", error: err.message });
    }
});

// --- 3. RESUME PARSING LOGIC ---
router.post('/parse-logic', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "File missing" });

        const data = await pdfParse(req.file.buffer);
        const text = data.text;

        console.log("Extracted Text Preview:", text.substring(0, 100)); 

        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        const phoneMatch = text.match(/(\+?\d{1,3}[- ]?)?\d{10}/);
        
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        const name = lines.find(l => /^[a-zA-Z\s]+$/.test(l)) || lines[0];

        res.json({
            name: name || "",
            email: emailMatch ? emailMatch[0] : "",
            contact: phoneMatch ? phoneMatch[0] : ""
        });
    } catch (err) {
        console.error("Parse Error:", err);
        res.status(500).json({ error: "Failed to parse" });
    }
});

// Email Duplicate Check
router.get('/check-email/:email', async (req, res) => {
    try {
        const existingCandidate = await Candidate.findOne({ email: req.params.email });
        res.status(200).json({ exists: !!existingCandidate });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;