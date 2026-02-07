const express = require("express");
const { generateOTP, saveOTP, verifyOTP } = require("../utils/otp.util");
const { sendOTPEmail } = require("../services/email.service");
const { sendOfferLetter } = require("../services/offer.service");

const router = express.Router();
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }
    const otp = generateOTP();
    console.log(`📧 OTP: ${otp} for ${email.trim()}`);
    await sendOTPEmail(email.trim(), otp);
    saveOTP(email.trim(), otp);
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/verify-otp", (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ success: false, message: "Invalid input" });
    }
    const result = verifyOTP(email.trim(), otp);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, message: "Email verified!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/generate-offer", async (req, res) => {
  try {
    const { email, candidateName, position, salary, joiningDate, department, offerMessage, ccEmails, bccEmails } = req.body;
    
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }
    
    if (!candidateName || !position || !salary || !joiningDate || !department) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const candidate = {
      name: candidateName.trim(),
      email: email.trim(),
      position: position.trim(),
      salary: salary.trim(),
      joiningDate: joiningDate,
      department: department.trim(),
      offerMessage: offerMessage || "",
      ccEmails: ccEmails || [],
      bccEmails: bccEmails || []
    };

    console.log(`📄 Generating offer letter for: ${candidate.name} (${candidate.email})`);
    if (candidate.ccEmails.length > 0) {
      console.log(`   📋 CC: ${candidate.ccEmails.join(", ")}`);
    }
    if (candidate.bccEmails.length > 0) {
      console.log(`   🔒 BCC: ${candidate.bccEmails.join(", ")}`);
    }
    
    await sendOfferLetter(candidate);
    
    res.json({ success: true, message: "Offer letter sent successfully via Amazon SES!" });
  } catch (err) {
    console.error("Error sending offer:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/download-offer", async (req, res) => {
  try {
    const { candidateName, position, salary, joiningDate, department, offerMessage } = req.body;
    
    if (!candidateName || !position || !salary || !joiningDate || !department) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const candidate = {
      name: candidateName.trim(),
      position: position.trim(),
      salary: salary.trim(),
      joiningDate: joiningDate,
      department: department.trim(),
      offerMessage: offerMessage || ""
    };

    console.log(`📥 Downloading offer letter for: ${candidate.name}`);
    const { generateOfferPDF } = require("../utils/pdf.util");
    const pdfBuffer = await generateOfferPDF(candidate);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="OfferLetter_${candidate.name.replace(/\s+/g, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error downloading offer:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
