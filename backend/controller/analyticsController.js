// backend/controllers/analyticsController.js
const Candidate = require('../models/Candidate');

exports.getAnalytics = async (req, res) => {
  try {
    // 1. Daily CV Submission Tracking (Last 7 days)
    const dailySubmissions = await Candidate.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }, // STEP 1: Pehle Latest dates upar lao
      { $limit: 7 },          // STEP 2: Sirf top 7 uthao
      { $sort: { _id: 1 } }   // STEP 3: Graph ke liye wapas chronological order mein karo
    ]);

    // 2. Source-wise Performance
    const sourcePerformance = await Candidate.aggregate([
      {
        $group: {
          _id: "$source", 
          count: { $sum: 1 }
        }
      }
    ]);

    // 3. Offer vs Joining Ratio
    const statusCounts = await Candidate.aggregate([
      {
        $match: { status: { $in: ["Offer", "Joined"] } } 
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // 4. Time-to-Hire (Average days)
    const timeToHire = await Candidate.aggregate([
      { $match: { status: "Joined", hiredDate: { $exists: true } } },
      {
        $project: {
          days: {
            $divide: [
              { $subtract: ["$hiredDate", "$createdAt"] }, // Dates ka difference
              1000 * 60 * 60 * 24 // Ms to Days conversion
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avgDays: { $avg: "$days" }
        }
      }
    ]);

    res.status(200).json({
      dailySubmissions,
      sourcePerformance,
      statusCounts,
      avgTimeToHire: timeToHire[0]?.avgDays || 0
    });

  } catch (err) {
  console.log("Database Error:", err); // Ye Render logs mein dikhega
  res.status(500).json({ message: "Error fetching analytics", error: err.message });
}    
};