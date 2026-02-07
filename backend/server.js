

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const homeRoutes = require('./routes/home');
const analyticsRoutes = require('./routes/analyticsRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const emailRoutes = require('./routes/emailRoutes');

// Models Import (Sirf User aur Job yahan rakhein, Candidate routes mein handle hoga)
const Job = require('./models/Job');
const Candidate = require('./models/Candidate');
const JDTemplate = require('./models/JDTemplate');

const app = express();
const PORT = process.env.PORT || 5000;

// Set timeout for large file uploads (5 minutes)
app.use((req, res, next) => {
  req.setTimeout(600000); // 10 minutes
  res.setTimeout(600000);
  next();
});

// Middleware
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// --- ROUTES REDIRECTION ---
app.use('/api/analytics', analyticsRoutes);
app.use('/api', homeRoutes);
// Ye line saare /candidates waale calls ko aapki router file par bhej degi
app.use('/candidates', candidateRoutes); 
app.use('/api/email', emailRoutes);

// Static Folder for Uploads
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/allinone')
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ Mongo Error:', err));

// Drop legacy unique indexes if they still exist
mongoose.connection.once('open', async () => {
  try {
    const indexes = await Candidate.collection.indexes();
    const hasContactIndex = indexes.find(idx => idx.name === 'contact_1');
    const hasEmailIndex = indexes.find(idx => idx.name === 'email_1');
    if (hasContactIndex) {
      await Candidate.collection.dropIndex('contact_1');
      console.log('✅ Dropped legacy contact_1 index');
    }
    if (hasEmailIndex) {
      await Candidate.collection.dropIndex('email_1');
      console.log('✅ Dropped legacy email_1 index');
    }
  } catch (err) {
    console.warn('⚠️ Failed to drop legacy indexes:', err.message);
  }
});

// --- USER SCHEMA ---
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

/* ================= AUTH ROUTES ================= */
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || user.password !== password) return res.status(401).json({ message: "Invalid credentials" });
        res.json({ message: "Login Successful", user: { email: user.email } });
    } catch (err) { res.status(500).json({ message: err.message }); }
});

/* ================= REGISTER ROUTE ================= */
app.post('/register', async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const newUser = new User({ email, password });
        await newUser.save();

        return res.status(201).json({ message: 'Registration successful' });
    } catch (err) {
        console.error('Register Error:', err.message);
        return res.status(500).json({ message: 'Server error' });
    }
});

/* ================= JOB ROUTES ================= */
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

const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// Ye do lines wait time badha dengi taaki Network Error na aaye
server.timeout = 600000; 
server.keepAliveTimeout = 61000;

/* ========== DIAGNOSTICS ========== */
app.get('/diagnostics', async (req, res) => {
    try {
        const dbName = mongoose.connection.name || (mongoose.connection.db && mongoose.connection.db.databaseName) || 'unknown';
        const userCount = await User.countDocuments().catch(() => 0);
        const jobCount = await Job.countDocuments().catch(() => 0);
        const candidateCount = await Candidate.countDocuments().catch(() => 0);
        const jdCount = await JDTemplate.countDocuments().catch(() => 0);

        return res.json({
            connected: mongoose.connection.readyState === 1,
            dbName,
            counts: {
                users: userCount,
                jobs: jobCount,
                candidates: candidateCount,
                jdTemplates: jdCount
            }
        });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

/* ========== SEED DATA ========== */
app.get('/seed-candidates', async (req, res) => {
  try {
    const sampleCandidates = [
      {
        name: 'Mansi Rathor',
        email: 'mansi.rathor@example.com',
        contact: '9876543210',
        position: 'Full Stack Developer',
        location: 'Mumbai',
        companyName: 'Tech Corp',
        experience: '3 years',
        ctc: '12 LPA',
        expectedCtc: '15 LPA',
        status: 'Interview',
        date: new Date().toISOString().split('T')[0],
        source: 'LinkedIn'
      },
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.k@example.com',
        contact: '9876543211',
        position: 'Senior Developer',
        location: 'Bangalore',
        companyName: 'InfoTech',
        experience: '5 years',
        ctc: '18 LPA',
        expectedCtc: '22 LPA',
        status: 'Offer',
        date: new Date().toISOString().split('T')[0],
        source: 'Referral'
      },
      {
        name: 'Priya Singh',
        email: 'priya.singh@example.com',
        contact: '9876543212',
        position: 'Frontend Engineer',
        location: 'Delhi',
        companyName: 'Digital Solutions',
        experience: '2 years',
        ctc: '10 LPA',
        expectedCtc: '12 LPA',
        status: 'Screening',
        date: new Date().toISOString().split('T')[0],
        source: 'Indeed'
      },
      {
        name: 'Arjun Patel',
        email: 'arjun.patel@example.com',
        contact: '9876543213',
        position: 'DevOps Engineer',
        location: 'Pune',
        companyName: 'Cloud Innovations',
        experience: '4 years',
        ctc: '14 LPA',
        expectedCtc: '16 LPA',
        status: 'Applied',
        date: new Date().toISOString().split('T')[0],
        source: 'LinkedIn'
      },
      {
        name: 'Neha Sharma',
        email: 'neha.sharma@example.com',
        contact: '9876543214',
        position: 'Backend Developer',
        location: 'Hyderabad',
        companyName: 'StartUp XYZ',
        experience: '3 years',
        ctc: '11 LPA',
        expectedCtc: '14 LPA',
        status: 'Hired',
        date: new Date().toISOString().split('T')[0],
        source: 'Referral'
      }
    ];

    // Insert candidates
    await Candidate.insertMany(sampleCandidates);
    
    // Also create a sample user for login
    const sampleUser = new User({
      email: 'admin@example.com',
      password: 'admin123'
    });
    await sampleUser.save().catch(() => null); // Ignore if already exists

    return res.json({
      success: true,
      message: `✅ Seeded ${sampleCandidates.length} candidates!`,
      candidates: sampleCandidates
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});
