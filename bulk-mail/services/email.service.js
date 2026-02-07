const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");

console.log("AWS Config:", {
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ? "***" + process.env.AWS_ACCESS_KEY_ID.slice(-4) : "NOT SET",
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? "***SET***" : "NOT SET",
});

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const sendOTPEmail = async (email, otp) => {
  const params = {
    Source: process.env.FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Your Verification Code",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center; border-radius: 10px 10px 0 0;">
                <h2 style="margin: 0;">🔐 Email Verification</h2>
              </div>
              <div style="padding: 40px; background: #f9f9f9; border-radius: 0 0 10px 10px;">
                <p style="color: #333; font-size: 16px;">Your verification code is:</p>
                <h1 style="color: #667eea; letter-spacing: 8px; font-size: 48px; margin: 30px 0;">${otp}</h1>
                <p style="color: #666; font-size: 14px;">This code will expire in <strong>5 minutes</strong>.</p>
                <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">If you didn't request this code, please ignore this email.</p>
              </div>
            </div>
          `,
          Charset: "UTF-8",
        },
        Text: {
          Data: `Your OTP is ${otp}. It is valid for 5 minutes.`,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
    console.log(`✅ Email sent to ${email}`);
  } catch (error) {
    console.error("❌ SES Error Details:", {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
    });
    throw error;
  }
};

const sendRejectionEmail = async (email, candidateName, position) => {
  const params = {
    Source: process.env.FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Application Status Update",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #f5f5f5; padding: 40px; text-align: center;">
                <h2 style="color: #333; margin: 0;">Application Update</h2>
              </div>
              <div style="padding: 40px; background: white; border: 1px solid #ddd;">
                <p style="color: #333; font-size: 16px;">Dear ${candidateName},</p>
                <p style="color: #666; line-height: 1.6;">Thank you for your interest in the <strong>${position}</strong> position. After careful consideration of your application and qualifications, we regret to inform you that we have decided to move forward with other candidates whose experience more closely matches our current needs.</p>
                <p style="color: #666; line-height: 1.6;">We appreciate the time you invested in applying and interviewing with us. We encourage you to apply for future positions that match your skills and experience.</p>
                <p style="color: #666; line-height: 1.6;">Best regards,<br>HR Team</p>
              </div>
            </div>
          `,
          Charset: "UTF-8",
        },
        Text: {
          Data: `Dear ${candidateName}, Thank you for your interest in the ${position} position. We regret to inform you that we have decided to move forward with other candidates. Best regards, HR Team`,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
    console.log(`✅ Rejection email sent to ${email}`);
  } catch (error) {
    console.error("❌ SES Error Details:", {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
    });
    throw error;
  }
};

const sendInterviewEmail = async (email, candidateName, position) => {
  const params = {
    Source: process.env.FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Interview Invitation - " + position,
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center;">
                <h2 style="margin: 0;">📞 Interview Invitation</h2>
              </div>
              <div style="padding: 40px; background: white; border: 1px solid #ddd;">
                <p style="color: #333; font-size: 16px;">Dear ${candidateName},</p>
                <p style="color: #666; line-height: 1.6;">Congratulations! We are pleased to invite you for an interview for the <strong>${position}</strong> position.</p>
                <p style="color: #666; line-height: 1.6;">Our HR team will contact you shortly with interview details including date, time, and format.</p>
                <p style="color: #666; line-height: 1.6;">If you have any questions, please feel free to reach out to us.</p>
                <p style="color: #666; line-height: 1.6;">Best regards,<br>HR Team</p>
              </div>
            </div>
          `,
          Charset: "UTF-8",
        },
        Text: {
          Data: `Dear ${candidateName}, Congratulations! We invite you for an interview for the ${position} position. Our HR team will contact you shortly with details. Best regards, HR Team`,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
    console.log(`✅ Interview email sent to ${email}`);
  } catch (error) {
    console.error("❌ SES Error Details:", {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
    });
    throw error;
  }
};

const sendDocumentEmail = async (email, candidateName, position) => {
  const params = {
    Source: process.env.FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Document Submission Required",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #2c3e50; padding: 40px; color: white; text-align: center;">
                <h2 style="margin: 0;">📄 Documents Required</h2>
              </div>
              <div style="padding: 40px; background: white; border: 1px solid #ddd;">
                <p style="color: #333; font-size: 16px;">Dear ${candidateName},</p>
                <p style="color: #666; line-height: 1.6;">Thank you for your interest in the <strong>${position}</strong> position. We would like to proceed further and request you to submit the following documents:</p>
                <ul style="color: #666; line-height: 1.8;">
                  <li>Copy of Government-issued ID</li>
                  <li>Educational certificates</li>
                  <li>Previous employment letters</li>
                  <li>Address proof</li>
                </ul>
                <p style="color: #666; line-height: 1.6;">Please submit these documents at your earliest convenience. If you have any questions, feel free to contact us.</p>
                <p style="color: #666; line-height: 1.6;">Best regards,<br>HR Team</p>
              </div>
            </div>
          `,
          Charset: "UTF-8",
        },
        Text: {
          Data: `Dear ${candidateName}, We request you to submit documents: ID, educational certificates, employment letters, and address proof. Best regards, HR Team`,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
    console.log(`✅ Document email sent to ${email}`);
  } catch (error) {
    console.error("❌ SES Error Details:", {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
    });
    throw error;
  }
};

const sendOnboardingEmail = async (email, candidateName, position, department, joiningDate) => {
  const params = {
    Source: process.env.FROM_EMAIL,
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Subject: {
        Data: "Welcome to Our Company - Onboarding Information",
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px; color: white; text-align: center;">
                <h2 style="margin: 0;">🎯 Welcome to Our Team!</h2>
              </div>
              <div style="padding: 40px; background: white; border: 1px solid #ddd;">
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
                <p style="color: #666; line-height: 1.6;">Best regards,<br>HR Team</p>
              </div>
            </div>
          `,
          Charset: "UTF-8",
        },
        Text: {
          Data: `Dear ${candidateName}, Welcome! You are joining as ${position} in ${department} from ${joiningDate}. Your manager will contact you soon. Best regards, HR Team`,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    await sesClient.send(new SendEmailCommand(params));
    console.log(`✅ Onboarding email sent to ${email}`);
  } catch (error) {
    console.error("❌ SES Error Details:", {
      message: error.message,
      code: error.code,
      statusCode: error.$metadata?.httpStatusCode,
    });
    throw error;
  }
};

module.exports = { sendOTPEmail, sendRejectionEmail, sendInterviewEmail, sendDocumentEmail, sendOnboardingEmail, ses: sesClient };
