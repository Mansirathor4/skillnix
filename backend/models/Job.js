const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  role: { type: String, required: true },
  location: { type: String, required: true },
  ctc: { type: String },
  experience: { type: String },
  skills: [String],             // Array of strings
  description: { type: String }, // Detailed Job Description
  hiringManagers: [String],      // Array of emails
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  isTemplate: { type: Boolean, default: false }, // Template vs Active Job distinction
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);