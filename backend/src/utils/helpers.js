const crypto = require('crypto');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generateMeetingCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 9; i++) {
    if (i === 3 || i === 6) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const generateVideoToken = (userId, videoId, secret) => {
  const payload = `${userId}:${videoId}:${Date.now()}`;
  return crypto.createHmac('sha256', secret || process.env.JWT_SECRET).update(payload).digest('hex');
};

const AppError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = { generateOTP, generateMeetingCode, generateVideoToken, AppError, asyncHandler };
