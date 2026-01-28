const Job = require('../models/Job');

// 1. Create a New Job
exports.createJob = async (req, res) => {
    try {
        const { role, location, ctc, experience, skills, description, hiringManagers, isTemplate } = req.body;

        const newJob = new Job({
            role,
            location,
            ctc,
            experience,
            skills,
            description,
            hiringManagers, // Array of emails/IDs
            isTemplate: isTemplate || false
        });

        const savedJob = await newJob.save();
        res.status(201).json(savedJob);
    } catch (error) {
        res.status(500).json({ message: "Error creating job", error: error.message });
    }
};

// 2. Get All Jobs (With optional filtering)
exports.getJobs = async (req, res) => {
    try {
        const { isTemplate, managerEmail } = req.query;
        let query = {};

        // Agar humein sirf active jobs chahiye templates nahi
        if (isTemplate !== undefined) {
            query.isTemplate = isTemplate === 'true';
        }

        // Agar specific Hiring Manager ki jobs dekhni ho
        if (managerEmail) {
            query.hiringManagers = { $in: [managerEmail] };
        }

        const jobs = await Job.find(query).sort({ createdAt: -1 });
        res.status(200).json(jobs);
    } catch (error) {
        res.status(500).json({ message: "Error fetching jobs", error: error.message });
    }
};

// 3. Delete Job
exports.deleteJob = async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Job deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting job", error: error.message });
    }
};