const { Queue, Worker } = require("bullmq");
const { 
  sendOTPEmail, 
  sendRejectionEmail, 
  sendInterviewEmail, 
  sendDocumentEmail, 
  sendOnboardingEmail 
} = require("./email.service");

// Redis connection config
const redisConnection = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null,
};

// Create email queue
const emailQueue = new Queue("bulk-emails", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1, // Single attempt - NO RETRIES (user requested)
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: false, // Keep completed jobs for tracking! (was true)
    removeOnFail: false, // Keep failed jobs for debugging
  },
});

// Queue event listeners
emailQueue.on("error", (error) => {
  console.error("❌ Queue Error:", error);
});

emailQueue.on("waiting", (job) => {
  console.log(`⏳ Job ${job.id} waiting...`);
});

emailQueue.on("active", (job) => {
  console.log(`▶️  Job ${job.id} processing...`);
});

// Worker to process emails
const emailWorker = new Worker("bulk-emails", async (job) => {
  const { 
    email, 
    otp, 
    candidateName, 
    position, 
    salary, 
    joiningDate, 
    department, 
    offerMessage, 
    isOTP, 
    isOfferLetter,
    isRejectionLetter,
    isInterviewCall,
    isDocumentCollection,
    isOnboarding
  } = job.data;
  
  console.log(`\n📧 Processing Job ${job.id}: Sending to ${email}`);
  
  try {
    if (isOTP) {
      await sendOTPEmail(email, otp);
    } else if (isOfferLetter) {
      const { sendOfferLetter } = require("./offer.service");
      const candidate = {
        name: candidateName,
        email: email,
        position: position,
        salary: salary,
        joiningDate: joiningDate,
        department: department,
        offerMessage: offerMessage || "",
        ccEmails: [],
        bccEmails: []
      };
      await sendOfferLetter(candidate);
    } else if (isRejectionLetter) {
      await sendRejectionEmail(email, candidateName, position);
    } else if (isInterviewCall) {
      await sendInterviewEmail(email, candidateName, position);
    } else if (isDocumentCollection) {
      await sendDocumentEmail(email, candidateName, position);
    } else if (isOnboarding) {
      await sendOnboardingEmail(email, candidateName, position, department, joiningDate);
    }
    
    console.log(`✅ Job ${job.id} completed for ${email}`);
    return { success: true, email, jobId: job.id };
  } catch (error) {
    console.error(`❌ Job ${job.id} failed for ${email}:`, error.message);
    throw new Error(`Failed to send email to ${email}: ${error.message}`);
  }
}, {
  connection: redisConnection,
  concurrency: 5, // Process 5 emails in parallel
});

// Worker event listeners
emailWorker.on("completed", (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result);
});

emailWorker.on("failed", (job, error) => {
  console.error(`❌ Job ${job.id} failed:`, error.message);
});

emailWorker.on("error", (error) => {
  console.error("❌ Worker Error:", error);
});

// Add job to queue
const addEmailJob = async (emailData) => {
  try {
    const job = await emailQueue.add("send-email", emailData, {
      jobId: `email-${emailData.email}-${Date.now()}`, // Unique job ID
    });
    console.log(`📨 Job added to queue: ${job.id}`);
    return job.id;
  } catch (error) {
    console.error("❌ Error adding job to queue:", error.message);
    throw error;
  }
};

// Add multiple jobs (bulk)
const addBulkEmailJobs = async (emailDataArray) => {
  try {
    const timestamp = Date.now();
    const jobs = await emailQueue.addBulk(
      emailDataArray.map((data, index) => ({
        name: "send-email",
        data: data,
        opts: {
          jobId: `email-${data.email}-${timestamp}-${index}`, // Add index to make each unique
        },
      }))
    );
    console.log(`📨 ${jobs.length} jobs added to queue`);
    return jobs.map((job) => job.id);
  } catch (error) {
    console.error("❌ Error adding bulk jobs to queue:", error.message);
    throw error;
  }
};

// Get queue stats
const getQueueStats = async () => {
  try {
    const counts = await emailQueue.getCountsPerPriority();
    const waitingCount = await emailQueue.getWaitingCount();
    const activeCount = await emailQueue.getActiveCount();
    const completedCount = await emailQueue.getCompletedCount();
    const failedCount = await emailQueue.getFailedCount();

    return {
      waiting: waitingCount,
      active: activeCount,
      completed: completedCount,
      failed: failedCount,
      total: waitingCount + activeCount + completedCount + failedCount,
    };
  } catch (error) {
    console.error("❌ Error getting queue stats:", error.message);
    throw error;
  }
};

// Get job details
const getJobDetails = async (jobId) => {
  try {
    const job = await emailQueue.getJob(jobId);
    if (!job) {
      console.warn(`⚠️ Job ${jobId} not found in queue`);
      return null;
    }
    
    const state = await job.getState();
    const progress = job._progress;
    
    console.log(`📊 Job ${jobId}: state=${state}, email=${job.data?.email}, attempted=${job.attemptsMade}, finished=${job.finishedOn}`);
    
    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: progress,
      state: state, // 'completed', 'failed', 'active', 'waiting', 'delayed'
      attemptsMade: job.attemptsMade || 0,
      finishedOn: job.finishedOn,
      processedOn: job.processedOn,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnValue: job.returnValue, // Result from completed job
    };
  } catch (error) {
    console.error(`❌ Error getting job details for ${jobId}:`, error.message);
    return null;
  }
};

// Close queue and worker gracefully
const closeQueue = async () => {
  try {
    await emailQueue.close();
    await emailWorker.close();
    console.log("✅ Queue and worker closed");
  } catch (error) {
    console.error("❌ Error closing queue:", error.message);
  }
};

module.exports = {
  emailQueue,
  emailWorker,
  addEmailJob,
  addBulkEmailJobs,
  getQueueStats,
  getJobDetails,
  closeQueue,
};
