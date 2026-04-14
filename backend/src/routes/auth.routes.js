const router = require('express').Router();
const { registerUser, verifyOTP, resendOTP, loginUser, loginAdmin, loginEmployee, forgotPassword, resetPassword, getMe } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser);
router.post('/login/admin', loginAdmin);
router.post('/login/employee', loginEmployee);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', authenticate, getMe);

module.exports = router;
