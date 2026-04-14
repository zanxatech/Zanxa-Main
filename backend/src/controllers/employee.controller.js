const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { asyncHandler, AppError, generateOTP } = require('../utils/helpers');
const { uploadMultipleToCloudinary } = require('../services/storage.service');
const { sendOTPEmail } = require('../services/email.service');

const prisma = new PrismaClient();

/**
 * Register a new employee (Public)
 */
const registerEmployee = asyncHandler(async (req, res) => {
  const { name, email, phone, password, assignedService } = req.body;

  if (!name || !email || !phone || !password || !assignedService)
    throw AppError('All fields are required', 400);

  const existing = await prisma.employee.findUnique({ where: { email } });
  if (existing) throw AppError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const employee = await prisma.employee.create({
    data: { name, email, phone, passwordHash, assignedService, status: 'PENDING' }
  });

  // OTP for email verification
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60000);
  await prisma.oTP.create({
    data: { identifier: email, code: otp, type: 'email', purpose: 'employee_register', expiresAt, employeeId: employee.id }
  });
  await sendOTPEmail(email, otp, 'employee_register');

  // Create an Approval request for Admin automatically
  await prisma.approval.create({
    data: {
      type: 'EMPLOYEE_REGISTRATION',
      userId: employee.id, // Reusing userId field for employeeId in approvals if needed, or link appropriately
      data: { employeeId: employee.id, name: employee.name, service: employee.assignedService }
    }
  });

  res.status(201).json({ message: 'Registration successful. Verify email then wait for admin approval.', employeeId: employee.id });
});

/**
 * Get employee profile (Protected)
 */
const getEmployeeProfile = asyncHandler(async (req, res) => {
  const employee = await prisma.employee.findUnique({
    where: { id: req.user.id }
  });
  res.json({ user: employee });
});

/**
 * Get assigned orders for the logged-in employee
 */
const getAssignedOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { employeeId: req.user.id },
    include: {
      user: { select: { name: true, email: true } },
      templateFolder: true
    },
    orderBy: { updatedAt: 'desc' }
  });
  res.json({ orders });
});

/**
 * Upload completed work (output) for an order
 */
const deliverOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { images } = req.body; // base64 array

  if (!images || images.length === 0) throw AppError('Work images are required', 400);

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.employeeId !== req.user.id) throw AppError('Unauthorized', 403);

  const imageUrls = await uploadMultipleToCloudinary(images, `outputs/${orderId}`);

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { 
      outputImages: imageUrls,
      status: 'COMPLETED'
    }
  });

  await prisma.approval.create({
    data: {
      type: 'TASK',
      userId: req.user.id,
      data: { orderId, outputImages: imageUrls }
    }
  });

  res.json({ message: 'Work delivered and sent for approval', order: updatedOrder });
});

module.exports = {
  registerEmployee,
  getEmployeeProfile,
  getAssignedOrders,
  deliverOrder
};
