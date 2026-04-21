const express = require("express");
const router = express.Router();

const {
  createPaymentOrder,
  verifyPayment,
  paymentWebhook
} = require("../controllers/payment.controller");

router.post("/create-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);
router.post("/webhook", paymentWebhook);

module.exports = router;
