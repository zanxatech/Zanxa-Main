const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { generateOTP, asyncHandler, AppError } = require('../utils/helpers');
const { sendOTPEmail } = require('../services/email.service');

const prisma = new PrismaClient();

const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ─── USER REGISTER (Sync with Firebase) ──────────────────────────────────────
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, username, phone, firebaseUid, isFirebaseUser, role } = req.body;

  if (!email || !name) {
    throw AppError('Missing required registration data', 400);
  }

  // Check if user already exists in DB
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // If user exists, update their Firebase UID if missing
    user = await prisma.user.update({
      where: { id: user.id },
      data: { 
        firebaseUid: firebaseUid || user.firebaseUid,
        isFirebaseUser: isFirebaseUser ?? user.isFirebaseUser,
        name: name || user.name,
        username: username || user.username,
        phone: phone || user.phone
      }
    });
  } else {
    // Create new user record matched to Firebase UID
    user = await prisma.user.create({
      data: {
        name,
        email,
        username: username || `user_${Math.random().toString(36).slice(2, 7)}`,
        phone,
        firebaseUid,
        isFirebaseUser: !!isFirebaseUser,
        passwordHash: null // Password managed by Firebase
      }
    });
  }

  res.status(201).json({ 
    message: 'User synchronized successfully', 
    user: { id: user.id, email: user.email, name: user.name, role: 'USER' } 
  });
});

// ─── USER LOGIN (Sync / Verification) ─────────────────────────────────────────
const loginUser = asyncHandler(async (req, res) => {
  // In Firebase flow, the "login" on backend is often just a "getMe" 
  // or a sync check after the client-side Firebase login.
  // We'll use the 'authenticate' middleware for most things.
  if (!req.user) throw AppError('Not authenticated', 401);
  res.json({ user: req.user });
});

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw AppError('Email and password required', 400);

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    console.error(`[AUTH] Admin login failed: Email not found (${email})`);
    throw AppError('Invalid credentials', 401);
  }

  const isValid = await bcrypt.compare(password, admin.passwordHash);
  if (!isValid) {
    console.error(`[AUTH] Admin login failed: Password mismatch for ${email}`);
    throw AppError('Invalid credentials', 401);
  }

  const token = signToken(admin.id, 'ADMIN');
  console.log(`[AUTH] Admin login successful: ${email}`);
  res.json({
    token,
    user: { id: admin.id, name: admin.name, email: admin.email, role: 'ADMIN' }
  });
});

// ─── EMPLOYEE LOGIN ───────────────────────────────────────────────────────────
const loginEmployee = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw AppError('Email and password required', 400);

  const employee = await prisma.employee.findUnique({ where: { email } });
  if (!employee) throw AppError('Invalid credentials', 401);
  if (!employee.isEmailVerified) throw AppError('Please verify your email first', 403);
  if (employee.status === 'PENDING') throw AppError('Account pending admin approval', 403);
  if (employee.status === 'REJECTED') throw AppError('Account has been rejected', 403);
  if (employee.status === 'SUSPENDED') throw AppError('Account has been suspended', 403);

  const isValid = await bcrypt.compare(password, employee.passwordHash);
  if (!isValid) throw AppError('Invalid credentials', 401);

  const token = signToken(employee.id, 'EMPLOYEE');
  res.json({
    token,
    user: { id: employee.id, name: employee.name, email: employee.email, assignedService: employee.assignedService, role: 'EMPLOYEE' }
  });
});

// ─── SOCIAL LOGIN (GOOGLE/GITHUB) ─────────────────────────────────────────────
const socialLogin = asyncHandler(async (req, res) => {
  const { name, email, avatar, providerId, provider } = req.body;

  if (!email) throw AppError('Email is required', 400);

  // SECURITY LOCK: Prevent Admin email from using Social Login
  if (email === process.env.ADMIN_EMAIL || email === 'zanxatech@gmail.com') {
    throw AppError('Social login disabled for administrative accounts. Please use the Admin Portal.', 403);
  }

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Generate a random username and password for social users
    const username = email.split('@')[0] + Math.random().toString(36).slice(-4);
    const passwordHash = await bcrypt.hash(Math.random().toString(36), 12);
    
    user = await prisma.user.create({
      data: {
        name,
        email,
        username,
        passwordHash,
        avatar,
        isEmailVerified: true // Social providers already verify email
      }
    });
  } else {
    // Sync details if needed (optional)
    if (!user.isEmailVerified) {
      await prisma.user.update({ where: { id: user.id }, data: { isEmailVerified: true } });
    }
  }

  const token = signToken(user.id, user.role || 'USER');

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role || 'USER', avatar: user.avatar }
  });
});

// ─── FORGOT PASSWORD (LINK-BASED) ──────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw AppError('Email is required', 400);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw AppError('No account found with this email', 404);

  // Generate a short-lived reset token (15 mins)
  const resetToken = jwt.sign(
    { id: user.id, purpose: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

  // In production, we'd use a dedicated email template for links
  // For now, repurposing sendOTPEmail as sendSystemEmail or similar
  await sendOTPEmail(email, resetLink, 'forgot_password_link');

  res.json({ message: 'Password reset link sent to your email' });
});

// ─── RESET PASSWORD (SECURE JWT) ─────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw AppError('Token and new password required', 400);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'password_reset') throw new Error();

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: decoded.id },
      data: { passwordHash }
    });

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
  } catch (err) {
    throw AppError('Invalid or expired reset token', 401);
  }
});

// ─── OTP STUBS (Required by routes) ──────────────────────────────────────────
const verifyOTP = asyncHandler(async (req, res) => {
  res.status(501).json({ message: 'OTP verification handled via Firebase' });
});

const resendOTP = asyncHandler(async (req, res) => {
  res.status(501).json({ message: 'OTP resend handled via Firebase' });
});

// ─── GET ME ───────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { registerUser, verifyOTP, resendOTP, loginUser, loginAdmin, loginEmployee, socialLogin, forgotPassword, resetPassword, getMe };
