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
  const { orderId, enrollmentId } = req.body;
  
  if (!orderId && !enrollmentId) throw AppError('orderId or enrollmentId required', 400);

  let finalAmount = 0;

  // 1. Fetch source of truth (Price) from DB
  if (enrollmentId) {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true }
    });
    if (!enrollment) throw AppError('Enrollment not found', 404);
    finalAmount = enrollment.course.price;
  } else if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { websiteProject: true, templateFolder: true }
    });
    if (!order) throw AppError('Order not found', 404);
    
    // Resolve price based on service type
    if (order.serviceType === 'WEB_DEVELOPMENT' && order.websiteProject) {
      finalAmount = order.websiteProject.price;
    } else if (order.serviceType === 'CREATIVE_DESIGN' && order.templateFolder) {
      finalAmount = order.templateFolder.price;
    } else {
      finalAmount = order.totalAmount || 0; // Fallback to manual order amount
    }
  }

  if (finalAmount <= 0) throw AppError('Invalid payment amount detected', 400);

  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(finalAmount * 100), // paise
    currency: 'INR',
    receipt: `zanxa_${Date.now()}`,
    notes: { orderId: orderId || '', enrollmentId: enrollmentId || '' }
  });

  // Save payment record — upsert to handle re-attempts gracefully
  let payment;
  if (enrollmentId) {
    payment = await prisma.payment.upsert({
      where: { enrollmentId },
      update: { razorpayOrderId: rzpOrder.id, amount: finalAmount, status: 'CREATED' },
      create: {
        razorpayOrderId: rzpOrder.id,
        amount: finalAmount,
        currency: 'INR',
        status: 'CREATED',
        enrollmentId,
      }
    });
  } else {
    // For orders: check whether a CREATED payment already exists
    const existing = await prisma.payment.findUnique({ where: { orderId } });
    if (existing && existing.status === 'PAID') {
      throw AppError('This order has already been paid.', 400);
    }
    payment = existing
      ? await prisma.payment.update({
          where: { orderId },
          data: { razorpayOrderId: rzpOrder.id, amount: finalAmount, status: 'CREATED' }
        })
      : await prisma.payment.create({
          data: {
            razorpayOrderId: rzpOrder.id,
            amount: finalAmount,
            currency: 'INR',
            status: 'CREATED',
            orderId,
          }
        });
  }

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
    include: { 
      order: { include: { user: true, websiteProject: true, templateFolder: true } }, 
      enrollment: { include: { course: true } } 
    }
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
        templateId: order.templateFolder?.folderNumber || order.websiteProject?.title || 'Custom Service',
        description: order.description,
        paymentId: razorpayPaymentId,
        amount: payment.amount,
        createdAt: payment.createdAt,
      });
    } catch (e) {
      console.error('Order email failed:', e.message);
    }
  }

  // Auto-approve enrollment immediately after successful payment
  // Payment is the proof — user gets instant access to course content
  if (payment.enrollmentId) {
    await prisma.courseEnrollment.update({
      where: { id: payment.enrollmentId },
      data: { 
        status: 'APPROVED',
        approvedAt: new Date()
      }
    });
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
