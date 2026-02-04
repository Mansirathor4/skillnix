

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const candidateController = require('../controller/candidateController');
const Candidate = require('../models/Candidate'); // Baar-baar require karne se achha hai ek baar upar kar lein

// Multer Setup with increased file size limits
const memoryUpload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});
const diskUpload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// --- 1. GET ALL CANDIDATES ---
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const rawLimit = req.query.limit;
        const parsedLimit = rawLimit === 'all' ? 0 : parseInt(rawLimit, 10);
        const limit = Number.isNaN(parsedLimit) ? 50 : parsedLimit;
        const shouldPaginate = limit > 0;
        const skip = shouldPaginate ? (page - 1) * limit : 0;
        const search = (req.query.search || '').trim();
        const position = (req.query.position || '').trim();
        const location = (req.query.location || '').trim();
        const companyName = (req.query.companyName || '').trim();

        const filter = {};
        if (search) {
            const regex = new RegExp(search, 'i');
            filter.$or = [
                { name: regex },
                { email: regex },
                { position: regex },
                { companyName: regex },
                { contact: regex },
                { location: regex }
            ];
        }
        if (position) {
            filter.position = position;
        }
        if (location) {
            filter.location = new RegExp(location, 'i');
        }
        if (companyName) {
            filter.companyName = new RegExp(companyName, 'i');
        }

        // Fetch paginated candidates
        let candidatesQuery = Candidate.find(filter)
            .sort({ createdAt: -1 })
            .lean(); // Use .lean() for faster read-only queries

        if (shouldPaginate) {
            candidatesQuery = candidatesQuery.limit(limit).skip(skip);
        }

        const candidates = await candidatesQuery;
        console.log(`📊 Backend Query - limit: ${limit}, skip: ${skip}, shouldPaginate: ${shouldPaginate}`);
        console.log(`📊 Backend Query - Returned ${candidates.length} records`);

        const parseNumber = (value) => {
            if (!value) return null;
            const numbers = String(value).match(/\d+(?:\.\d+)?/g);
            if (!numbers || numbers.length === 0) return null;
            return Math.max(...numbers.map(n => parseFloat(n)));
        };

        const expMin = parseFloat(req.query.expMin);
        const expMax = parseFloat(req.query.expMax);
        const ctcMin = parseFloat(req.query.ctcMin);
        const ctcMax = parseFloat(req.query.ctcMax);
        const expectedCtcMin = parseFloat(req.query.expectedCtcMin);
        const expectedCtcMax = parseFloat(req.query.expectedCtcMax);

        const hasRangeFilter =
            !isNaN(expMin) || !isNaN(expMax) ||
            !isNaN(ctcMin) || !isNaN(ctcMax) ||
            !isNaN(expectedCtcMin) || !isNaN(expectedCtcMax);

        const finalCandidates = hasRangeFilter
            ? candidates.filter((c) => {
                const expVal = parseNumber(c.experience);
                const ctcVal = parseNumber(c.ctc);
                const expectedVal = parseNumber(c.expectedCtc);

                if (!isNaN(expMin) && (expVal === null || expVal < expMin)) return false;
                if (!isNaN(expMax) && (expVal === null || expVal > expMax)) return false;
                if (!isNaN(ctcMin) && (ctcVal === null || ctcVal < ctcMin)) return false;
                if (!isNaN(ctcMax) && (ctcVal === null || ctcVal > ctcMax)) return false;
                if (!isNaN(expectedCtcMin) && (expectedVal === null || expectedVal < expectedCtcMin)) return false;
                if (!isNaN(expectedCtcMax) && (expectedVal === null || expectedVal > expectedCtcMax)) return false;

                return true;
            })
            : candidates;

        // Get total count for pagination metadata
        const totalCount = hasRangeFilter
            ? finalCandidates.length
            : await Candidate.countDocuments(filter);
        const totalPages = shouldPaginate ? Math.ceil(totalCount / limit) : 1;

        res.status(200).json({
            success: true,
            data: finalCandidates,
            pagination: {
                currentPage: shouldPaginate ? page : 1,
                totalPages: totalPages,
                totalCount: totalCount,
                pageSize: shouldPaginate ? limit : totalCount,
                hasMore: shouldPaginate ? page < totalPages : false
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching candidates", error: err.message });
    }
});

// --- 2. CREATE SINGLE CANDIDATE (Manual Add) ---
// Frontend se jab aap single candidate add karengi, toh wo isi route pe aayega
router.post('/', diskUpload.single('resume'), candidateController.createCandidate);

// --- 3. EXTRACT HEADERS (for column mapping) ---
router.post('/extract-headers', diskUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const ext = path.extname(req.file.originalname || '').toLowerCase();
        if (ext === '.csv') {
            await workbook.csv.readFile(req.file.path);
        } else if (ext === '.xls') {
            return res.status(400).json({ success: false, message: "Old .xls format not supported. Please save as .xlsx or .csv." });
        } else {
            await workbook.xlsx.readFile(req.file.path);
        }

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            return res.status(400).json({ success: false, message: "No worksheet found" });
        }

        const headers = [];
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            const value = cell.value;
            let headerText = '';
            if (value === null || value === undefined) {
                headerText = `Column ${headers.length + 1}`;
            } else if (typeof value === 'object' && value.text) {
                headerText = String(value.text).trim();
            } else if (typeof value === 'object' && value.richText) {
                headerText = value.richText.map(rt => rt.text || '').join('').trim();
            } else {
                headerText = String(value).trim();
            }
            if (headerText) headers.push(headerText);
        });

        // Cleanup
        if (req.file && require('fs').existsSync(req.file.path)) {
            require('fs').unlinkSync(req.file.path);
        }

        res.status(200).json({ success: true, headers });
    } catch (err) {
        console.error("Extract Headers Error:", err);
        res.status(500).json({ success: false, message: "Error reading file: " + err.message });
    }
});

// --- 4. SMART BULK UPLOAD (Excel & CSV) ---
router.post('/bulk-upload', diskUpload.single('file'), candidateController.bulkUploadCandidates);

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

// --- 7. UPDATE CANDIDATE ---
router.put('/:id', diskUpload.single('resume'), candidateController.updateCandidate);

// --- 8. DELETE CANDIDATE ---
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

module.exports = router;