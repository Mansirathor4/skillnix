const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const saveOTP = (email, otp) => {
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0
  });
};

const verifyOTP = (email, otp) => {
  const record = otpStore.get(email);
  if (!record) return { success: false, message: "No OTP found" };
  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return { success: false, message: "OTP expired" };
  }
  if (record.attempts >= 5) {
    otpStore.delete(email);
    return { success: false, message: "Too many attempts" };
  }
  if (record.otp !== otp) {
    record.attempts++;
    return { success: false, message: "Invalid OTP" };
  }
  otpStore.delete(email);
  return { success: true };
};

module.exports = { generateOTP, saveOTP, verifyOTP };
