const Razorpay = require('razorpay');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../utils/helpers');
const { sendOrderConfirmationEmail } = require('../services/email.service');

const prisma = new PrismaClient();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─── CREATE RAZORPAY ORDER ────────────────────────────────────────────────────
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { orderId, enrollmentId, amount } = req.body;
  if (!amount) throw AppError('Amount is required', 400);
  if (!orderId && !enrollmentId) throw AppError('orderId or enrollmentId required', 400);

  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(parseFloat(amount) * 100), // paise
    currency: 'INR',
    receipt: `zanxa_${Date.now()}`,
    notes: { orderId: orderId || '', enrollmentId: enrollmentId || '' }
  });

  // Save payment record
  const payment = await prisma.payment.create({
    data: {
      razorpayOrderId: rzpOrder.id,
      amount: parseFloat(amount),
      currency: 'INR',
      status: 'CREATED',
      orderId: orderId || null,
      enrollmentId: enrollmentId || null,
    }
  });

  res.json({
    razorpayOrderId: rzpOrder.id,
    amount: rzpOrder.amount,
    currency: rzpOrder.currency,
    key: process.env.RAZORPAY_KEY_ID,
    paymentId: payment.id
  });
});

// ─── VERIFY PAYMENT ───────────────────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

  // Verify signature
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpaySignature)
    throw AppError('Payment verification failed', 400);

  // Update payment record
  const payment = await prisma.payment.update({
    where: { razorpayOrderId },
    data: { razorpayPaymentId, razorpaySignature, status: 'PAID' },
    include: { order: { include: { user: true, template: true } }, enrollment: { include: { course: true } } }
  });

  // Update order status
  if (payment.orderId) {
    const order = await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: 'PAID' },
      include: { user: true }
    });

    // Send email to zanxatech
    try {
      await sendOrderConfirmationEmail({
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        serviceType: order.serviceType,
        templateId: order.templateId,
        description: order.description,
        paymentId: razorpayPaymentId,
        amount: payment.amount,
        createdAt: payment.createdAt,
      });
    } catch (e) {
      console.error('Order email failed:', e.message);
    }
  }

  // Update enrollment status to WAITING_APPROVAL after successful payment
  if (payment.enrollmentId) {
    await prisma.courseEnrollment.update({
      where: { id: payment.enrollmentId },
      data: { status: 'WAITING_APPROVAL' }
    });
    // Note: No approval record needed here — admin sees it in enrollment list
  }

  res.json({ message: 'Payment verified successfully', payment });
});

// ─── PAYMENT WEBHOOK (Razorpay) ───────────────────────────────────────────────
const paymentWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const event = req.body.event;
  if (event === 'payment.captured') {
    console.log('Payment captured via webhook:', req.body.payload?.payment?.entity?.id);
  }

  res.json({ status: 'ok' });
});

// ─── GET PAYMENT HISTORY (User) ───────────────────────────────────────────────
const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { order: { userId: req.user.id } },
        { enrollment: { userId: req.user.id } }
      ]
    },
    include: {
      order: { select: { serviceType: true, customerName: true, status: true } },
      enrollment: { include: { course: { select: { title: true } } } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ payments });
});

module.exports = { createPaymentOrder, verifyPayment, paymentWebhook, getPaymentHistory };
