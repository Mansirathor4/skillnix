
// const mongoose = require('mongoose');

// const CandidateSchema = new mongoose.Schema({
//   srNo: { type: String },
//   date: { type: String },
//   location: { type: String },
//   position: { type: String, required: true },
//   fls: { type: String },
//   name: { type: String, required: true },
//   contact: { type: String, required: true },
//   email: { type: String, required: true },
//   callBackDate: { type: String, default: "" },
//   companyName: { type: String },
//   experience: { type: String },
//   ctc: { type: String },
//   expectedCtc: { type: String },
//   noticePeriod: { type: String },
//   status: { 
//     type: String, 
//     default: 'Applied',
//     enum: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'] 
//   },
//   client: { type: String },
//   spoc: { type: String },
//   source: { type: String },
//   resume: { type: String }, 
  
//   // ✅ History Tracking Field
//   statusHistory: [{
//     status: { type: String },
//     remark: { type: String, default: "Status Updated" },
//     updatedAt: { type: Date, default: Date.now },
//     updatedBy: { type: String, default: 'Recruiter' }
//   }],

//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Candidate', CandidateSchema);


const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  srNo: { type: String },
  date: { type: String },
  location: { type: String },
  position: { type: String, required: true },
  fls: { type: String },
  name: { type: String, required: true },
  contact: { type: String, required: true }, // Removed unique - we auto-generate anyway
  email: { type: String, required: true, unique: true, lowercase: true }, // Keep unique for email only
  callBackDate: { type: String, default: "" },
  companyName: { type: String },
  experience: { type: String },
  ctc: { type: String },
  expectedCtc: { type: String },
  noticePeriod: { type: String },
  status: { 
    type: String, 
    default: 'Applied',
    enum: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired','Joined', 'Rejected'] 
  },
  client: { type: String },
  spoc: { type: String },
  source: { type: String },
  resume: { type: String }, 
  hiredDate: { type: Date },
  statusHistory: [{
    status: { type: String },
    remark: { type: String, default: "Status Updated" },
    updatedAt: { type: Date, default: Date.now },
    updatedBy: { type: String, default: 'Recruiter' }
  }],
  createdAt: { type: Date, default: Date.now }
});

// 🚀 Performance Indexes for faster queries
CandidateSchema.index({ createdAt: -1 }); // For sorting by date
// Note: email index is automatically created by unique: true constraint above
CandidateSchema.index({ position: 1 }); // For filtering by position
CandidateSchema.index({ name: 'text', email: 'text', position: 'text' }); // Full-text search

module.exports = mongoose.model('Candidate', CandidateSchema);