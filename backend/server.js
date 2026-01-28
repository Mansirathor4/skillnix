
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const homeRoutes = require('./routes/home');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Models Import
const Candidate = require('./models/Candidate'); 
const Job = require('./models/Job');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/analytics', analyticsRoutes);


app.use('/api', homeRoutes);

// Upload Directory Check
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/allinone')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Mongo Error:', err));

// --- USER SCHEMA (Optional/Login ke liye) ---
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

/* ================= ROUTES ================= */

// --- 1. AUTH ROUTES ---
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.password !== password) return res.status(401).json({ message: "Invalid credentials" });
        res.json({ message: "Login Successful", user: { email: user.email } });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- 2. CANDIDATE ROUTES ---

// CREATE
app.post('/candidates', upload.single('resume'), async (req, res) => {
    try {
        const candidateData = { ...req.body };
        const existing = await Candidate.findOne({ $or: [{ email: candidateData.email }, { contact: candidateData.contact }] });
        if (existing) return res.status(400).json({ message: "Candidate already exists!" });

        let resumeUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;
        
        const newCandidate = new Candidate({
            ...candidateData,
            resume: resumeUrl,
            statusHistory: [{ status: candidateData.status || 'Applied', updatedAt: new Date() }]
        });
        await newCandidate.save();
        res.status(201).json(newCandidate);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// UPDATE (The Clean Version)
app.put('/candidates/:id', upload.single('resume'), async (req, res) => {
    try {
        const { id } = req.params;
        const existingCandidate = await Candidate.findById(id);
        if (!existingCandidate) return res.status(404).json({ message: "Candidate not found" });

        let incomingData = { ...req.body };
        delete incomingData.statusHistory;
        delete incomingData._id;

        if (req.file) {
            incomingData.resume = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        } else {
            delete incomingData.resume; 
        }

        const updateObject = {};
        Object.keys(incomingData).forEach(key => {
            if (incomingData[key] !== "" && incomingData[key] !== "null" && incomingData[key] !== "undefined") {
                updateObject[key] = incomingData[key];
            }
        });

        let pushUpdate = {};
        if (updateObject.status && updateObject.status !== existingCandidate.status) {
            pushUpdate = { 
                $push: { 
                    statusHistory: { 
                        status: updateObject.status, 
                        updatedAt: new Date(),
                        remark: "Status updated from ATS"
                    } 
                } 
            };
        }

        const updated = await Candidate.findByIdAndUpdate(
            id, 
            { $set: updateObject, ...pushUpdate }, 
            { new: true, runValidators: false } 
        );
        res.json(updated);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/candidates', async (req, res) => {
    const data = await Candidate.find().sort({ createdAt: -1 });
    res.json(data);
});

app.delete('/candidates/:id', async (req, res) => {
    await Candidate.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

// --- 3. JOB ROUTES ---
app.get('/jobs', async (req, res) => {
    try {
        const { isTemplate } = req.query;
        const query = isTemplate === 'true' ? { isTemplate: true } : { $or: [{ isTemplate: false }, { isTemplate: { $exists: false } }] };
        const jobs = await Job.find(query).sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/jobs', async (req, res) => {
    try {
        const newJob = new Job(req.body);
        await newJob.save();
        res.status(201).json(newJob);
    } catch (err) { res.status(500).json({ message: err.message }); }
});

// --- 4. BULK PARSE ---
app.post('/candidates/bulk-parse', async (req, res) => {
    try {
        const { ids } = req.body;
        const selectedCandidates = await Candidate.find({ _id: { $in: ids } });
        let results = [];
        for (let candidate of selectedCandidates) {
            if (candidate.resume) {
                const fileName = candidate.resume.split('/').pop();
                const filePath = path.join(__dirname, 'uploads', fileName);
                if (fs.existsSync(filePath)) {
                    const dataBuffer = fs.readFileSync(filePath);
                    const pdfData = await pdf(dataBuffer);
                    const emailMatch = pdfData.text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
                    const phoneMatch = pdfData.text.match(/(\+?\d{1,3}[- ]?)?\d{10}/);
                    const updated = await Candidate.findByIdAndUpdate(candidate._id, {
                        email: emailMatch ? emailMatch[0] : candidate.email,
                        contact: phoneMatch ? phoneMatch[0] : candidate.contact,
                    }, { new: true });
                    results.push(updated);
                }
            }
        }
        res.json({ message: "Bulk Parsing Complete!", results });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));