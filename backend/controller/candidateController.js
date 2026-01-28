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
// exports.updateStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const candidate = await Candidate.findById(id);
//     if (!candidate) return res.status(404).json({ message: "Not found" });

//     // Status update logic for Drag-and-Drop
//     candidate.status = status;
//     candidate.statusHistory.push({ status: status });

//     await candidate.save();
//     res.json({ success: true, data: candidate });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// const Candidate = require('../models/Candidate');

// // 1. Create Candidate with Duplicate Check
// exports.createCandidate = async (req, res) => {
//   try {
//     const { email, contact, status } = req.body;

//     // Check Duplicate
//     const existing = await Candidate.findOne({ $or: [{ email }, { contact }] });
//     if (existing) {
//       return res.status(400).json({ 
//         success: false, 
//         message: `Duplicate: ${existing.email === email ? 'Email' : 'Contact'} already registered!` 
//       });
//     }

//     const newCandidate = new Candidate({
//       ...req.body,
//       statusHistory: [{ status: status || 'Applied', remark: 'Initial Registration' }]
//     });

//     await newCandidate.save();
//     res.status(201).json({ success: true, data: newCandidate });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // 2. Update Status & History
// exports.updateStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, remark } = req.body; // remark optional hai

//     const candidate = await Candidate.findById(id);
//     if (!candidate) return res.status(404).json({ message: "Candidate Not Found" });

//     // Agar status change ho raha hai, tabhi history mein push karo
//     if (candidate.status !== status) {
//         candidate.status = status;
//         candidate.statusHistory.push({ 
//             status: status, 
//             remark: remark || `Moved to ${status}` 
//         });
//         await candidate.save();
//     }

//     res.json({ success: true, data: candidate });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// const Candidate = require('../models/Candidate');

// // 1. Add Candidate with Duplicate Check
// // candidateController.js mein
// exports.createCandidate = async (req, res) => {
//     try {
//         const newCandidate = new Candidate(req.body);
//         await newCandidate.save();
//         res.status(201).json({ message: "Candidate Added Successfully" });
//     } catch (error) {
//         if (error.code === 11000) { // MongoDB duplicate key error code
//             return res.status(400).json({ message: "Email already exists!" });
//         }
//         res.status(500).json({ message: "Server Error" });
//     }
// };

// // 2. Update Status with History Tracking & Remark
// exports.updateStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, remark } = req.body;

//     const candidate = await Candidate.findById(id);
//     if (!candidate) return res.status(404).json({ message: "Not found" });

//     // Update history only if status actually changes
//     if (candidate.status !== status) {
//         candidate.status = status;
//         candidate.statusHistory.push({ 
//             status: status, 
//             remark: remark || `Moved to ${status}` 
//         });
//         await candidate.save();
//     }

//     res.json({ success: true, data: candidate });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// // };
// const Candidate = require('../models/Candidate');
// exports.createCandidate = async (req, res) => {
//     try {
//         // ✅ Fix: Agar statusHistory string ban ke aa raha hai, to usse wapas Array banao
//         if (typeof req.body.statusHistory === 'string') {
//             req.body.statusHistory = JSON.parse(req.body.statusHistory);
//         }

//         // Resume file ka path agar multer use kar rahe ho (Optional but good)
//         if (req.file) {
//             req.body.resume = `/uploads/${req.file.filename}`;
//         }

//         const newCandidate = new Candidate(req.body);
//         await newCandidate.save();
//         res.status(201).json({ message: "Candidate Added Successfully" });
//     } catch (error) {
//         console.error("Create Error:", error); // Debugging ke liye zaroori hai
//         if (error.code === 11000) {
//             return res.status(400).json({ message: "Email already exists!" });
//         }
//         res.status(500).json({ message: error.message || "Server Error" });
//     }
// };
// // candidateController.js mein ye wala function bhi update karein
// exports.updateCandidate = async (req, res) => {
//     try {
//         const { id } = req.params;
        
//         // ✅ Sabse important fix: String ko wapas Array banao
//         if (typeof req.body.statusHistory === 'string') {
//             try {
//                 req.body.statusHistory = JSON.parse(req.body.statusHistory);
//             } catch (e) {
//                 req.body.statusHistory = [];
//             }
//         }

//         // Resume handle karein agar file upload hui hai
//         if (req.file) {
//             req.body.resume = `/uploads/${req.file.filename}`;
//         }

//         const updatedCandidate = await Candidate.findByIdAndUpdate(
//             id, 
//             req.body, 
//             { new: true, runValidators: true }
//         );

//         if (!updatedCandidate) {
//             return res.status(404).json({ message: "Candidate not found" });
//         }

//         res.status(200).json({ message: "Updated Successfully", data: updatedCandidate });
//     } catch (error) {
//         console.error("Update Error:", error);
//         res.status(500).json({ message: error.message });
//     }
// };

const Candidate = require('../models/Candidate');

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
        console.error("Create Error:", error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Email already exists!" });
        }
        res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
};

exports.updateCandidate = async (req, res) => {
    try {
        const { id } = req.params;
        if (typeof req.body.statusHistory === 'string') {
            try {
                req.body.statusHistory = JSON.parse(req.body.statusHistory);
            } catch (e) {
                req.body.statusHistory = [];
            }
        }
        if (req.file) {
            req.body.resume = `/uploads/${req.file.filename}`;
        }

        const updatedCandidate = await Candidate.findByIdAndUpdate(
            id, 
            { $set: req.body }, 
            { new: true, runValidators: true }
        );

        if (!updatedCandidate) {
            return res.status(404).json({ success: false, message: "Candidate not found" });
        }
        res.status(200).json({ success: true, message: "Updated Successfully", data: updatedCandidate });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};