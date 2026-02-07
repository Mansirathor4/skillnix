const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

// Parse Excel file and extract records
const parseExcelFile = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // Get first sheet
    const worksheet = workbook.Sheets[sheetName];
    const records = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✅ Parsed ${records.length} records from Excel`);
    return records;
  } catch (error) {
    console.error("❌ Error parsing Excel file:", error.message);
    throw error;
  }
};

// Validate email records for bulk sending
const validateEmailRecords = (records) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validated = [];
  const failed = [];

  // Detect which columns exist in the data
  let hasName = false;
  let hasPosition = false;
  let hasSalary = false;
  let hasDepartment = false;

  if (records.length > 0) {
    const firstRecord = records[0];
    hasName = !!(firstRecord.name || firstRecord.Name || firstRecord.NAME);
    hasPosition = !!(firstRecord.position || firstRecord.Position || firstRecord.POSITION);
    hasSalary = !!(firstRecord.salary || firstRecord.Salary || firstRecord.SALARY);
    hasDepartment = !!(firstRecord.department || firstRecord.Department || firstRecord.DEPARTMENT);
  }

  records.forEach((record, index) => {
    const email = record.email || record.Email || record.EMAIL;
    
    if (!email) {
      failed.push({
        row: index + 1,
        reason: "Missing email field",
        record,
      });
      return;
    }

    const trimmedEmail = email.toString().trim();
    
    if (!emailRegex.test(trimmedEmail)) {
      failed.push({
        row: index + 1,
        reason: "Invalid email format",
        email: trimmedEmail,
        record,
      });
      return;
    }

    validated.push({
      ...record,
      email: trimmedEmail, // Normalize email
    });
  });

  return {
    valid: validated,
    failed: failed,
    validCount: validated.length,
    failedCount: failed.length,
    totalCount: records.length,
    columns: {
      hasName,
      hasPosition,
      hasSalary,
      hasDepartment
    }
  };
};

// Transform records for OTP sending
const transformForOTPEmail = (records, otp) => {
  return records.map((record) => ({
    email: record.email,
    otp: otp,
    isOTP: true,
  }));
};

// Transform records for offer letter sending
const transformForOfferLetter = (records) => {
  return records.map((record) => ({
    email: record.email,
    candidateName: record.candidateName || record.name || "Candidate",
    position: record.position || "Position Not Specified",
    salary: record.salary || "0",
    joiningDate: record.joiningDate || new Date().toISOString().split("T")[0],
    department: record.department || "Department",
    offerMessage: record.offerMessage || "",
    isOfferLetter: true,
  }));
};

module.exports = {
  parseExcelFile,
  validateEmailRecords,
  transformForOTPEmail,
  transformForOfferLetter,
};
