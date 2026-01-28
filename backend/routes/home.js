const express = require('express');
const router = express.Router();

const dailyTasks = [
  "Shortlist 5 candidates for Full Stack Developer role.",
  "Follow up with Ritika regarding the interview schedule.",
  "Check new applications for the CSE position.",
  "Update the status of candidates from Capgemini."
];

// 1. Endpoint for Pop-up Task (URL: /api/daily-task)
router.get('/daily-task', (req, res) => { // <-- Yahan se /api hata diya
  const randomIndex = Math.floor(Math.random() * dailyTasks.length);
  res.json({ 
    task: dailyTasks[randomIndex],
    date: new Date().toLocaleDateString()
  });
});

// 2. Endpoint for Home Cards (URL: /api/home-updates)
router.get('/home-updates', (req, res) => { // <-- Yahan se /api hata diya
  res.json({
    birthdays: ["Mansi", "Rahul Sharma"],
    holiday: { name: "Republic Day", date: "Jan 26" },
    achievement: "Sales Team hit ₹10 Lakh milestone!",
    version: "ATS v2.1 is now live"
  });
});

module.exports = router;