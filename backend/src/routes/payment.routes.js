const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { createPaymentOrder, verifyPayment, paymentWebhook, getPaymentHistory } = require('../controllers/payment.controller');

router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);
router.post('/webhook', paymentWebhook);
router.get('/history/me', authenticate, getPaymentHistory);

module.exports = router;
