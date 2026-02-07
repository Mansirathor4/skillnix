const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const {
  parseExcelFile,
  validateEmailRecords,
  transformForOTPEmail,
  transformForOfferLetter,
} = require("../utils/bulk.util");
const {
  addBulkEmailJobs,
  getQueueStats,
  getJobDetails,
  emailQueue,
} = require("../services/queue.service");
const { generateOTP, saveOTP } = require("../utils/otp.util");

// Setup multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Store preview data temporarily (in production, use database or Redis)
let previewCache = {};

// Store last upload data for viewing
let lastUploadData = null;

const router = express.Router();

/**
 * 📥 Upload Excel file (with file handling)
 * POST /api/bulk/upload-file
 * Returns validation results with valid/invalid records
 */

/**
 * 📥 Upload Excel file (with file handling)
 * POST /api/bulk/upload-file
 * Returns validation results with valid/invalid records
 */
router.post("/bulk/upload-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const { type } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: "Missing type (otp or offer)"
      });
    }

    console.log(`📂 Processing uploaded file: ${req.file.originalname}`);

    // Save uploaded file
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const uploadPath = path.join(uploadsDir, `${Date.now()}-${req.file.originalname}`);
    fs.writeFileSync(uploadPath, req.file.buffer);

    // Parse Excel file
    const records = parseExcelFile(uploadPath);
    
    // Print to console - VISIBLE OUTPUT
    console.log("\n" + "═".repeat(100));
    console.log("📊 EXCEL FILE DATA UPLOADED - COMPLETE");
    console.log("═".repeat(100));
    console.log("📁 File Name:", req.file.originalname);
    console.log("📈 Total Records:", records.length);
    if (records.length > 0) {
      console.log("🔑 Column Names:", Object.keys(records[0]));
    }
    console.log("═".repeat(100));
    console.log("📋 FULL DATA:");
    records.forEach((record, idx) => {
      console.log(`\n▶️ Record ${idx + 1}:`);
      console.log(JSON.stringify(record, null, 2));
    });
    console.log("\n" + "═".repeat(100) + "\n");
    
    // Validate records
    const validation = validateEmailRecords(records);
    
    // Store for later viewing
    lastUploadData = {
      fileName: req.file.originalname,
      records: records,
      timestamp: Date.now(),
    };

    // Generate preview ID
    const previewId = `preview-${Date.now()}`;
    
    // Store preview data
    previewCache[previewId] = {
      filePath: req.file.originalname,
      type,
      records: validation.valid,
      validation,
      timestamp: Date.now(),
      uploadPath
    };

    console.log(`✅ Preview Created:`, {
      previewId,
      valid: validation.validCount,
      failed: validation.failedCount,
    });

    res.json({
      success: true,
      previewId,
      summary: {
        totalRecords: validation.totalCount,
        validRecords: validation.validCount,
        failedRecords: validation.failedCount,
        validPercentage: ((validation.validCount / validation.totalCount) * 100).toFixed(2) + "%",
      },
      records: validation.valid,
      failed: validation.failed,
      type,
      columns: validation.columns,
    });
  } catch (error) {
    console.error("❌ Upload Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * 📥 Upload and preview Excel file (legacy - filePath based)
 * POST /api/bulk/upload-preview
 * Returns validation results with valid/invalid records
 */
router.post("/bulk/upload-preview", async (req, res) => {
  try {
    const { filePath, type } = req.body; // filePath: "testing-devanshu_accessKeys (1).csv" or similar
    
    if (!filePath || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing filePath or type (otp or offer)",
      });
    }

    // Security: Ensure file is in uploads or public directory
    const fullPath = path.join(__dirname, "..", filePath);
    
    console.log(`📂 Reading file: ${fullPath}`);
    
    // Parse Excel file
    const records = parseExcelFile(fullPath);
    
    // Print to console - VISIBLE OUTPUT
    console.log("\n" + "═".repeat(100));
    console.log("📊 EXCEL FILE DATA - COMPLETE");
    console.log("═".repeat(100));
    console.log("📁 File Path:", filePath);
    console.log("📈 Total Records:", records.length);
    if (records.length > 0) {
      console.log("🔑 Column Names:", Object.keys(records[0]));
    }
    console.log("═".repeat(100));
    console.log("📋 FULL DATA:");
    records.forEach((record, idx) => {
      console.log(`\n▶️ Record ${idx + 1}:`);
      console.log(JSON.stringify(record, null, 2));
    });
    console.log("\n" + "═".repeat(100) + "\n");
    
    // Validate records
    const validation = validateEmailRecords(records);

    // Generate preview ID
    const previewId = `preview-${Date.now()}`;
    
    // Store preview data
    previewCache[previewId] = {
      filePath,
      type,
      records: validation.valid,
      validation,
      timestamp: Date.now(),
    };

    console.log(`✅ Preview Created:`, {
      previewId,
      valid: validation.validCount,
      failed: validation.failedCount,
    });

    res.json({
      success: true,
      previewId,
      summary: {
        totalRecords: validation.totalCount,
        validRecords: validation.validCount,
        failedRecords: validation.failedCount,
        validPercentage: ((validation.validCount / validation.totalCount) * 100).toFixed(2) + "%",
      },
      records: validation.valid.slice(0, 5), // Show first 5 as preview
      failed: validation.failed,
      type,
      columns: validation.columns,
    });
  } catch (error) {
    console.error("❌ Upload Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * ✅ Confirm and send bulk emails
 * POST /api/bulk/confirm-send
 * Adds jobs to queue and returns job IDs
 */
router.post("/bulk/confirm-send", async (req, res) => {
  try {
    const { previewId, type, selectedEmails } = req.body;

    if (!previewId || !previewCache[previewId]) {
      return res.status(400).json({
        success: false,
        message: "Invalid preview ID. Please upload and preview first.",
      });
    }

    if (!selectedEmails || selectedEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No emails selected. Please select at least one email.",
      });
    }

    const preview = previewCache[previewId];
    // Filter records to only include selected emails
    const records = preview.records.filter(
      (record) => selectedEmails.includes(record.email || record.Email)
    );

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No matching records found for selected emails.",
      });
    }

    let emailDataArray = [];

    if (type === "otp") {
      // Generate OTP and prepare email data
      const otp = require("../utils/otp.util").generateOTP();
      emailDataArray = transformForOTPEmail(records, otp);
      
      // Save OTP for each email
      records.forEach((record) => {
        require("../utils/otp.util").saveOTP(record.email || record.Email, otp);
      });
    } else if (type === "offer") {
      emailDataArray = transformForOfferLetter(records);
    } else if (type === "rejection") {
      // Rejection letter campaign
      emailDataArray = records.map(record => ({
        email: record.email || record.Email,
        candidateName: record.Name || record.name || "Candidate",
        position: record.Position || record.position || "Position",
        isRejectionLetter: true,
      }));
    } else if (type === "interview") {
      // Interview call campaign
      emailDataArray = records.map(record => ({
        email: record.email || record.Email,
        candidateName: record.Name || record.name || "Candidate",
        position: record.Position || record.position || "Position",
        isInterviewCall: true,
      }));
    } else if (type === "document") {
      // Document collection campaign
      emailDataArray = records.map(record => ({
        email: record.email || record.Email,
        candidateName: record.Name || record.name || "Candidate",
        position: record.Position || record.position || "Position",
        isDocumentCollection: true,
      }));
    } else if (type === "onboarding") {
      // Onboarding campaign
      emailDataArray = records.map(record => ({
        email: record.email || record.Email,
        candidateName: record.Name || record.name || "Candidate",
        position: record.Position || record.position || "Position",
        department: record.Department || record.department || "Department",
        joiningDate: record.JoiningDate || record.joiningDate || "TBD",
        isOnboarding: true,
      }));
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be 'otp', 'offer', 'rejection', 'interview', 'document', or 'onboarding'.",
      });
    }

    // Add jobs to queue (this will trigger batch processing)
    const jobIds = await addBulkEmailJobs(emailDataArray);

    console.log(`\n📊 BULK EMAIL CAMPAIGN STARTED:`, {
      previewId,
      type,
      selectedCount: records.length,
      totalJobs: jobIds.length,
      jobIds: jobIds.slice(0, 5), // Show first 5 job IDs
      timestamp: new Date().toLocaleString(),
    });
    console.log(`════════════════════════════════════════════════════════════\n`);

    // Clean up preview cache
    setTimeout(() => {
      delete previewCache[previewId];
    }, 3600000); // Keep for 1 hour

    res.json({
      success: true,
      message: `${records.length} emails queued for sending`,
      campaign: {
        previewId,
        type,
        totalEmails: records.length,
        jobIds: jobIds,
        estimatedTime: `${Math.ceil(records.length / 5)} seconds (5 concurrent)`,
      },
    });
  } catch (error) {
    console.error("❌ Confirm Send Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * 📊 Get bulk campaign status
 * GET /api/bulk/status
 * Returns real-time queue statistics
 */
router.get("/bulk/status", async (req, res) => {
  try {
    const stats = await getQueueStats();

    res.json({
      success: true,
      queue: {
        waiting: stats.waiting,
        processing: stats.active,
        completed: stats.completed,
        failed: stats.failed,
        total: stats.total,
        completionPercentage: stats.total > 0 
          ? ((stats.completed / stats.total) * 100).toFixed(2) + "%"
          : "0%",
      },
    });
  } catch (error) {
    console.error("❌ Status Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * 📋 Get job details
 * GET /api/bulk/job/:jobId
 * Returns individual job status and details
 */
router.get("/bulk/job/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const jobDetails = await getJobDetails(jobId);

    if (!jobDetails) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    res.json({
      success: true,
      job: jobDetails,
    });
  } catch (error) {
    console.error("❌ Job Details Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * 📧 Get email statuses
 * POST /api/bulk/email-statuses
 * Returns status of each email in the campaign
 */
router.post("/bulk/email-statuses", async (req, res) => {
  try {
    const { jobIds, emails } = req.body;

    if (!jobIds || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No job IDs provided",
      });
    }

    const emailStatuses = {};
    
    // Initialize all emails as queued
    if (emails && emails.length > 0) {
      emails.forEach((email) => {
        emailStatuses[email] = {
          email: email,
          status: "queued",
          retries: 0,
          timestamp: Date.now(),
        };
      });
    }

    // Get job details for each job
    for (const jobId of jobIds) {
      try {
        const jobDetails = await getJobDetails(jobId);
        if (jobDetails && jobDetails.data) {
          const email = jobDetails.data.email;
          
          // Determine status based on job state
          let status = "queued";
          if (jobDetails.state === "completed") {
            status = "sent";
          } else if (jobDetails.state === "failed") {
            status = "failed";
          } else if (jobDetails.state === "active") {
            status = "processing";
          } else if (jobDetails.state === "delayed") {
            status = "retrying";
          }

          emailStatuses[email] = {
            email: email,
            status: status,
            retries: jobDetails.attemptsMade || 0,
            timestamp: jobDetails.processedOn || Date.now(),
            failedReason: jobDetails.failedReason,
          };
        }
      } catch (err) {
        console.error(`Error getting details for job ${jobId}:`, err.message);
      }
    }

    res.json({
      success: true,
      emailStatuses: emailStatuses,
    });
  } catch (error) {
    console.error("❌ Email Statuses Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * 🧪 Test bulk email with sample data
 * GET /api/bulk/test-sample
 * Simulates 4 test records from CSV
 */
router.get("/bulk/test-sample", async (req, res) => {
  try {
    // Sample data from your test records
    const testRecords = [
      { email: "test1@example.com", name: "John Doe", position: "Developer", salary: "50000", department: "Engineering" },
      { email: "test2@example.com", name: "Jane Smith", position: "Designer", salary: "45000", department: "Design" },
      { email: "test3@example.com", name: "Bob Johnson", position: "Manager", salary: "60000", department: "Management" },
      { email: "test4@example.com", name: "Alice Williams", position: "Analyst", salary: "48000", department: "Analytics" },
    ];

    // Validate
    const validation = validateEmailRecords(testRecords);

    // Print to console - VISIBLE OUTPUT
    console.log("\n" + "═".repeat(100));
    console.log("📊 TEST SAMPLE DATA - COMPLETE");
    console.log("═".repeat(100));
    console.log("📈 Total Records:", testRecords.length);
    console.log("🔑 Column Names:", Object.keys(testRecords[0]));
    console.log("═".repeat(100));
    console.log("📋 TEST DATA:");
    testRecords.forEach((record, idx) => {
      console.log(`\n▶️ Record ${idx + 1}:`);
      console.log(JSON.stringify(record, null, 2));
    });
    console.log("\n" + "═".repeat(100) + "\n");

    // Create preview
    const previewId = `preview-sample-${Date.now()}`;
    previewCache[previewId] = {
      filePath: "sample-data",
      type: "offer",
      records: validation.valid,
      validation,
      timestamp: Date.now(),
    };

    res.json({
      success: true,
      previewId,
      summary: {
        totalRecords: validation.totalCount,
        validRecords: validation.validCount,
        failedRecords: validation.failedCount,
      },
      records: validation.valid,
      columns: validation.columns,
      message: "Sample preview ready. Use this previewId to confirm send.",
    });
  } catch (error) {
    console.error("❌ Test Sample Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * 👁️ View last uploaded Excel data
 * GET /api/bulk/view-last-upload
 * Returns the last uploaded Excel file data
 */
router.get("/bulk/view-last-upload", async (req, res) => {
  if (!lastUploadData) {
    return res.json({
      success: false,
      message: "No data uploaded yet. Please upload a file first.",
    });
  }
  
  res.json({
    success: true,
    uploadedAt: new Date(lastUploadData.timestamp).toLocaleString(),
    fileName: lastUploadData.fileName,
    totalRecords: lastUploadData.records.length,
    columns: Object.keys(lastUploadData.records[0] || {}),
    data: lastUploadData.records,
  });
});

/**
 * 🔍 Get all jobs with details (for debugging)
 * GET /api/bulk/all-jobs
 */
router.get("/bulk/all-jobs", async (req, res) => {
  try {
    const completed = await emailQueue.getCompleted();
    const failed = await emailQueue.getFailed();
    const waiting = await emailQueue.getWaiting();
    const active = await emailQueue.getActive();
    
    const allJobs = [...completed, ...failed, ...waiting, ...active];
    
    const jobDetails = await Promise.all(
      allJobs.map(async (job) => ({
        id: job.id,
        email: job.data?.email,
        state: await job.getState(),
        attempts: job.attemptsMade,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
      }))
    );
    
    res.json({
      success: true,
      total: allJobs.length,
      counts: {
        completed: completed.length,
        failed: failed.length,
        waiting: waiting.length,
        active: active.length,
      },
      jobs: jobDetails,
    });
  } catch (error) {
    console.error("❌ All Jobs Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * 🧹 Clear queue (for testing/debugging)
 * DELETE /api/bulk/clear-queue
 */
router.delete("/bulk/clear-queue", async (req, res) => {
  try {
    // Get all jobs and remove them
    const completedJobs = await emailQueue.getCompleted();
    const failedJobs = await emailQueue.getFailed();
    const waitingJobs = await emailQueue.getWaiting();
    const activeJobs = await emailQueue.getActive();
    
    const allJobs = [...completedJobs, ...failedJobs, ...waitingJobs, ...activeJobs];
    
    for (const job of allJobs) {
      await job.remove();
    }
    
    console.log(`🧹 Queue cleared: Removed ${allJobs.length} jobs`);
    
    res.json({
      success: true,
      message: `Queue cleared. Removed ${allJobs.length} jobs`,
      removed: {
        completed: completedJobs.length,
        failed: failedJobs.length,
        waiting: waitingJobs.length,
        active: activeJobs.length,
      },
    });
  } catch (error) {
    console.error("❌ Clear Queue Error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
