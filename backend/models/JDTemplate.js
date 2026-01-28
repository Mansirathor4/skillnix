const mongoose = require('mongoose');

const jdTemplateSchema = new mongoose.Schema({
    roleTitle: { type: String, required: true },
    experience: { type: String },
    description: { type: String }, // Ismein detail JD hoga
    skills: [{ type: String }],
    category: { type: String } // e.g., Tech, Marketing
});

module.exports = mongoose.model('JDTemplate', jdTemplateSchema);