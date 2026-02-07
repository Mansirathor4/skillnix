const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

console.log("📧 AWS SES Config:", {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? "***" + process.env.AWS_ACCESS_KEY_ID.slice(-4) : "NOT SET",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? "***SET***" : "NOT SET",
  fromEmail: process.env.FROM_EMAIL
});

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Generic email sender
const sendEmail = async (to, subject, htmlBody, textBody) => {
  const params = {
    Source: process.env.FROM_EMAIL,
    Destination: {
      ToAddresses: Array.isArray(to) ? to : [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: "UTF-8",
        },
        Text: {
          Data: textBody || subject,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
    console.log(`✅ Email sent to ${Array.isArray(to) ? to.join(', ') : to}`);
    return { success: true, email: to };
  } catch (error) {
    console.error("❌ SES Error Details:", {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
      email: to
    });
    throw error;
  }
};

// Interview invitation email
const sendInterviewEmail = async (email, candidateName, position) => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center; border-radius: 10px 10px 0 0;">
        <h2 style="margin: 0;">📞 Interview Invitation</h2>
      </div>
      <div style="padding: 40px; background: white; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">Dear ${candidateName},</p>
        <p style="color: #666; line-height: 1.6;">Congratulations! We are pleased to invite you for an interview for the <strong>${position}</strong> position.</p>
        <p style="color: #666; line-height: 1.6;">Our HR team will contact you shortly with interview details including date, time, and format.</p>
        <p style="color: #666; line-height: 1.6;">If you have any questions, please feel free to reach out to us.</p>
        <p style="color: #666; line-height: 1.6;">Best regards,<br><strong>HR Team</strong></p>
      </div>
    </div>
  `;
  
  const textBody = `Dear ${candidateName}, Congratulations! We invite you for an interview for the ${position} position. Our HR team will contact you shortly with details. Best regards, HR Team`;
  
  return await sendEmail(email, `Interview Invitation - ${position}`, htmlBody, textBody);
};

// Rejection email
const sendRejectionEmail = async (email, candidateName, position) => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f5f5f5; padding: 40px; text-align: center; border-radius: 10px 10px 0 0;">
        <h2 style="color: #333; margin: 0;">Application Status Update</h2>
      </div>
      <div style="padding: 40px; background: white; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">Dear ${candidateName},</p>
        <p style="color: #666; line-height: 1.6;">Thank you for your interest in the <strong>${position}</strong> position. After careful consideration of your application and qualifications, we regret to inform you that we have decided to move forward with other candidates whose experience more closely matches our current needs.</p>
        <p style="color: #666; line-height: 1.6;">We appreciate the time you invested in applying and interviewing with us. We encourage you to apply for future positions that match your skills and experience.</p>
        <p style="color: #666; line-height: 1.6;">Best regards,<br><strong>HR Team</strong></p>
      </div>
    </div>
  `;
  
  const textBody = `Dear ${candidateName}, Thank you for your interest in the ${position} position. We regret to inform you that we have decided to move forward with other candidates. Best regards, HR Team`;
  
  return await sendEmail(email, "Application Status Update", htmlBody, textBody);
};

// Document request email
const sendDocumentEmail = async (email, candidateName, position) => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2c3e50; padding: 40px; color: white; text-align: center; border-radius: 10px 10px 0 0;">
        <h2 style="margin: 0;">📄 Documents Required</h2>
      </div>
      <div style="padding: 40px; background: white; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">Dear ${candidateName},</p>
        <p style="color: #666; line-height: 1.6;">Thank you for your interest in the <strong>${position}</strong> position. We would like to proceed further and request you to submit the following documents:</p>
        <ul style="color: #666; line-height: 1.8;">
          <li>Copy of Government-issued ID</li>
          <li>Educational certificates</li>
          <li>Previous employment letters</li>
          <li>Address proof</li>
        </ul>
        <p style="color: #666; line-height: 1.6;">Please submit these documents at your earliest convenience. If you have any questions, feel free to contact us.</p>
        <p style="color: #666; line-height: 1.6;">Best regards,<br><strong>HR Team</strong></p>
      </div>
    </div>
  `;
  
  const textBody = `Dear ${candidateName}, We request you to submit documents: ID, educational certificates, employment letters, and address proof. Best regards, HR Team`;
  
  return await sendEmail(email, "Document Submission Required", htmlBody, textBody);
};

// Offer letter email
const sendOfferEmail = async (email, candidateName, position, department = 'TBD', joiningDate = 'TBD') => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; color: white; text-align: center; border-radius: 10px 10px 0 0;">
        <h2 style="margin: 0;">💼 Congratulations!</h2>
      </div>
      <div style="padding: 40px; background: white; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">Dear ${candidateName},</p>
        <p style="color: #666; line-height: 1.6;">We are delighted to offer you the position of <strong>${position}</strong> at our organization!</p>
        <table style="width: 100%; color: #666; line-height: 1.8; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0; font-weight: bold;">Position:</td>
            <td style="padding: 10px 0;">${position}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0; font-weight: bold;">Department:</td>
            <td style="padding: 10px 0;">${department}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold;">Expected Joining Date:</td>
            <td style="padding: 10px 0;">${joiningDate}</td>
          </tr>
        </table>
        <p style="color: #666; line-height: 1.6;">Please review the attached offer letter and respond at your earliest convenience. We look forward to welcoming you to our team!</p>
        <p style="color: #666; line-height: 1.6;">Best regards,<br><strong>HR Team</strong></p>
      </div>
    </div>
  `;
  
  const textBody = `Dear ${candidateName}, We are pleased to offer you the position of ${position} in ${department}. Expected joining: ${joiningDate}. Best regards, HR Team`;
  
  return await sendEmail(email, `Job Offer - ${position}`, htmlBody, textBody);
};

// Onboarding email
const sendOnboardingEmail = async (email, candidateName, position, department = 'TBD', joiningDate = 'TBD') => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px; color: white; text-align: center; border-radius: 10px 10px 0 0;">
        <h2 style="margin: 0;">🎯 Welcome to Our Team!</h2>
      </div>
      <div style="padding: 40px; background: white; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">Dear ${candidateName},</p>
        <p style="color: #666; line-height: 1.6;">Welcome to our organization! We are excited to have you join our team. Here are your onboarding details:</p>
        <table style="width: 100%; color: #666; line-height: 1.8; margin: 20px 0;">
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0; font-weight: bold;">Position:</td>
            <td style="padding: 10px 0;">${position}</td>
          </tr>
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0; font-weight: bold;">Department:</td>
            <td style="padding: 10px 0;">${department}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: bold;">Joining Date:</td>
            <td style="padding: 10px 0;">${joiningDate}</td>
          </tr>
        </table>
        <p style="color: #666; line-height: 1.6;">Your manager will contact you with next steps. We look forward to working with you!</p>
        <p style="color: #666; line-height: 1.6;">Best regards,<br><strong>HR Team</strong></p>
      </div>
    </div>
  `;
  
  const textBody = `Dear ${candidateName}, Welcome! You are joining as ${position} in ${department} from ${joiningDate}. Your manager will contact you soon. Best regards, HR Team`;
  
  return await sendEmail(email, "Welcome to Our Company - Onboarding Information", htmlBody, textBody);
};

// Custom email template
const sendCustomEmail = async (email, candidateName, position, customMessage) => {
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center; border-radius: 10px 10px 0 0;">
        <h2 style="margin: 0;">📧 Message from HR</h2>
      </div>
      <div style="padding: 40px; background: white; border: 1px solid #ddd; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 16px;">Dear ${candidateName},</p>
        <div style="color: #666; line-height: 1.6; white-space: pre-wrap;">${customMessage}</div>
        <p style="color: #666; line-height: 1.6; margin-top: 20px;">Best regards,<br><strong>HR Team</strong></p>
      </div>
    </div>
  `;
  
  const textBody = `Dear ${candidateName}, ${customMessage} Best regards, HR Team`;
  
  return await sendEmail(email, `Message Regarding ${position}`, htmlBody, textBody);
};

// Bulk email sender with progress tracking
const sendBulkEmails = async (candidates, emailType, customMessage = '') => {
  const results = {
    total: candidates.length,
    success: [],
    failed: []
  };

  for (const candidate of candidates) {
    try {
      const { email, name, position, department, joiningDate } = candidate;
      
      if (!email || !email.includes('@')) {
        results.failed.push({ email, error: 'Invalid email' });
        continue;
      }

      let result;
      switch (emailType) {
        case 'interview':
          result = await sendInterviewEmail(email, name, position);
          break;
        case 'offer':
          result = await sendOfferEmail(email, name, position, department, joiningDate);
          break;
        case 'rejection':
          result = await sendRejectionEmail(email, name, position);
          break;
        case 'document':
          result = await sendDocumentEmail(email, name, position);
          break;
        case 'onboarding':
          result = await sendOnboardingEmail(email, name, position, department, joiningDate);
          break;
        case 'custom':
          result = await sendCustomEmail(email, name, position, customMessage);
          break;
        default:
          throw new Error('Invalid email type');
      }

      results.success.push(result);
      
      // Small delay to avoid rate limiting (AWS SES has 14 emails/sec limit)
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      results.failed.push({ 
        email: candidate.email, 
        error: error.message 
      });
    }
  }

  return results;
};

module.exports = {
  sendEmail,
  sendInterviewEmail,
  sendOfferEmail,
  sendRejectionEmail,
  sendDocumentEmail,
  sendOnboardingEmail,
  sendCustomEmail,
  sendBulkEmails
};
