const { SendRawEmailCommand } = require("@aws-sdk/client-ses");
const { ses } = require("./email.service");
const { generateOfferPDF } = require("../utils/pdf.util");

const sendOfferLetter = async (candidate) => {
  try {
    const pdfBuffer = await generateOfferPDF(candidate);

    const htmlBody = `<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">You have been selected for an exciting opportunity</p>
      </div>

      <!-- Body -->
      <div style="padding: 40px 20px; background: white; margin: 20px;">
        <p style="color: #333; font-size: 16px; margin-bottom: 20px;">Dear <strong>${candidate.name}</strong>,</p>

        <p style="color: #666; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          We are pleased to offer you the position of <strong style="color: #667eea;">${candidate.position}</strong> in the <strong style="color: #667eea;">${candidate.department}</strong> department at <strong>PeopleConnect HRMS</strong>.
        </p>

        <!-- Offer Details -->
        <div style="background: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #666; font-weight: 600;">Position:</td>
              <td style="padding: 10px 0; color: #333; text-align: right;">${candidate.position}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666; font-weight: 600;">Department:</td>
              <td style="padding: 10px 0; color: #333; text-align: right;">${candidate.department}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666; font-weight: 600;">Annual Salary:</td>
              <td style="padding: 10px 0; color: #667eea; text-align: right; font-size: 18px; font-weight: bold;">₹${candidate.salary}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666; font-weight: 600;">Joining Date:</td>
              <td style="padding: 10px 0; color: #333; text-align: right;">${new Date(candidate.joiningDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
          </table>
        </div>

        <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 20px 0;">
          We are confident that your skills and experience will be a valuable addition to our team. We look forward to welcoming you on board and working together to achieve great things.
        </p>

        ${candidate.offerMessage ? `<div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="color: #856404; font-size: 14px; margin: 0;"><strong>Additional Note:</strong> ${candidate.offerMessage}</p>
        </div>` : ''}

        <p style="color: #666; font-size: 15px; margin: 20px 0;">
          Please find the detailed offer letter attached to this email. Should you have any questions or require further clarification, please don't hesitate to reach out.
        </p>

        <p style="color: #666; font-size: 15px; margin: 20px 0;">
          <strong>Next Steps:</strong><br>
          1. Review the attached offer letter carefully<br>
          2. Contact HR if you have any questions<br>
          3. Sign and return the acceptance form<br>
          4. Coordinate with HR for onboarding
        </p>

        <p style="color: #666; font-size: 15px; margin-top: 30px;">
          Best regards,<br>
          <strong style="color: #667eea;">PeopleConnect HR Team</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background: #333; color: #fff; padding: 20px; text-align: center; font-size: 12px; line-height: 1.6;">
        <p style="margin: 5px 0;">PeopleConnect HRMS | Human Resources Management System</p>
        <p style="margin: 5px 0;">📧 hr@peopleconnecthr.com | 🌐 www.peopleconnecthr.com</p>
        <p style="margin: 10px 0 0 0; color: #999;">© 2026 PeopleConnect. All rights reserved.</p>
      </div>
    </div>`;

    const textBody = `Congratulations!

Dear ${candidate.name},

We are pleased to offer you the position of ${candidate.position} in the ${candidate.department} department at PeopleConnect HRMS.

OFFER DETAILS:
Position: ${candidate.position}
Department: ${candidate.department}
Annual Salary: ₹${candidate.salary}
Joining Date: ${new Date(candidate.joiningDate).toLocaleDateString('en-IN')}

We look forward to welcoming you on board. Please find the detailed offer letter attached.

Best regards,
PeopleConnect HR Team
hr@peopleconnecthr.com`;

    // Create proper MIME structure
    const boundary1 = "==_mimepart_1";
    const boundary2 = "==_mimepart_2";
    const fromEmail = process.env.FROM_EMAIL;
    const toEmail = candidate.email;
    const pdfBase64 = pdfBuffer.toString("base64");

    // Build headers with CC and BCC
    let headers = `From: ${fromEmail}
To: ${toEmail}`;

    if (candidate.ccEmails && candidate.ccEmails.length > 0) {
      headers += `
Cc: ${candidate.ccEmails.join(", ")}`;
    }

    if (candidate.bccEmails && candidate.bccEmails.length > 0) {
      headers += `
Bcc: ${candidate.bccEmails.join(", ")}`;
    }

    headers += `
Subject: Offer Letter - ${candidate.position} at PeopleConnect HRMS
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="${boundary1}"`;

    const rawEmail = `${headers}

--${boundary1}
Content-Type: multipart/alternative; boundary="${boundary2}"

--${boundary2}
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 7bit

${textBody}

--${boundary2}
Content-Type: text/html; charset=UTF-8
Content-Transfer-Encoding: 7bit

${htmlBody}

--${boundary2}--

--${boundary1}
Content-Type: application/pdf; name="OfferLetter.pdf"
Content-Disposition: attachment; filename="OfferLetter.pdf"
Content-Transfer-Encoding: base64

${pdfBase64}

--${boundary1}--`;

    console.log("Sending offer letter with PDF attachment via SES...");
    
    // Combine all recipients for SES
    const destinations = [toEmail];
    if (candidate.ccEmails && candidate.ccEmails.length > 0) {
      destinations.push(...candidate.ccEmails);
    }
    if (candidate.bccEmails && candidate.bccEmails.length > 0) {
      destinations.push(...candidate.bccEmails);
    }

    await ses.send(
      new SendRawEmailCommand({
        RawMessage: { Data: Buffer.from(rawEmail) },
        Source: fromEmail,
        Destinations: destinations
      })
    );
    console.log(`✅ Offer letter with PDF sent to ${toEmail}${candidate.ccEmails && candidate.ccEmails.length > 0 ? ', CC: ' + candidate.ccEmails.join(', ') : ''}${candidate.bccEmails && candidate.bccEmails.length > 0 ? ', BCC: ' + candidate.bccEmails.join(', ') : ''}`);
  } catch (error) {
    console.error("Error in sendOfferLetter:", error);
    throw error;
  }
};

module.exports = { sendOfferLetter };
