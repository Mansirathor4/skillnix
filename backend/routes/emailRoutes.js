const express = require('express');
const router = express.Router();
const {
  sendInterviewEmail,
  sendRejectionEmail,
  sendDocumentEmail,
  sendOnboardingEmail,
  sendCustomEmail,
  sendBulkEmails
} = require('../services/emailService');

/**
 * 📧 Send single email to a candidate
 * POST /api/email/send
 * Body: { email, name, position, emailType, customMessage, department, joiningDate }
 */
router.post('/send', async (req, res) => {
  try {
    const { email, name, position, emailType, customMessage, department, joiningDate } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required'
      });
    }

    if (!name || !position) {
      return res.status(400).json({
        success: false,
        message: 'Name and position are required'
      });
    }

    if (!emailType) {
      return res.status(400).json({
        success: false,
        message: 'Email type is required (interview, rejection, document, onboarding, custom)'
      });
    }

    let result;
    
    switch (emailType) {
      case 'interview':
        result = await sendInterviewEmail(email, name, position);
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
        if (!customMessage) {
          return res.status(400).json({
            success: false,
            message: 'Custom message is required for custom email type'
          });
        }
        result = await sendCustomEmail(email, name, position, customMessage);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid email type. Must be: interview, rejection, document, onboarding, or custom'
        });
    }

    console.log(`✅ Email sent successfully to ${email} (Type: ${emailType})`);
    
    res.json({
      success: true,
      message: `Email sent successfully to ${email}`,
      data: result
    });

  } catch (error) {
    console.error('❌ Send Email Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email'
    });
  }
});

/**
 * 📧 Send bulk emails to multiple candidates
 * POST /api/email/send-bulk
 * Body: { candidates: [{ email, name, position, department, joiningDate }], emailType, customMessage }
 */
router.post('/send-bulk', async (req, res) => {
  try {
    const { candidates, emailType, customMessage } = req.body;

    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Candidates array is required and must not be empty'
      });
    }

    if (!emailType) {
      return res.status(400).json({
        success: false,
        message: 'Email type is required (interview, rejection, document, onboarding, custom)'
      });
    }

    console.log(`\n📊 BULK EMAIL CAMPAIGN STARTED:`);
    console.log(`   Type: ${emailType}`);
    console.log(`   Total Recipients: ${candidates.length}`);
    console.log(`   Timestamp: ${new Date().toLocaleString()}\n`);

    const results = await sendBulkEmails(candidates, emailType, customMessage);

    console.log(`\n✅ BULK EMAIL CAMPAIGN COMPLETED:`);
    console.log(`   Success: ${results.success.length}`);
    console.log(`   Failed: ${results.failed.length}`);
    console.log(`   Success Rate: ${((results.success.length / results.total) * 100).toFixed(2)}%\n`);

    res.json({
      success: true,
      message: `Bulk email campaign completed`,
      data: {
        total: results.total,
        sent: results.success.length,
        failed: results.failed.length,
        successRate: `${((results.success.length / results.total) * 100).toFixed(2)}%`,
        failedEmails: results.failed
      }
    });

  } catch (error) {
    console.error('❌ Bulk Email Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send bulk emails'
    });
  }
});

/**
 * 🧪 Test email configuration
 * POST /api/email/test
 * Body: { email }
 */
router.post('/test', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        message: 'Valid email address is required'
      });
    }

    await sendInterviewEmail(email, 'Test User', 'Test Position');

    res.json({
      success: true,
      message: `Test email sent successfully to ${email}`
    });

  } catch (error) {
    console.error('❌ Test Email Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send test email'
    });
  }
});

module.exports = router;
