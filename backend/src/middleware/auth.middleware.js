const firebaseAdmin = require('../config/firebase'); 
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let user = null;
    let role = null;
    let uid = null;

    // 1. Try Backend JWT (Admin)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.id) {
        user = await prisma.admin.findUnique({ where: { id: decoded.id } });
        if (user) {
          role = 'ADMIN';
          uid = 'backend_jwt_' + user.id;
        }
      }
    } catch (err) {
      // Not a valid backend JWT, proceed to Firebase check
    }

    // 2. Try Firebase ID Token (User/Employee)
    if (!user) {
      try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
        const { email, uid: firebaseUid } = decodedToken;
        uid = firebaseUid;

        // Try Admin table first (in case of Firebase admin migration)
        user = await prisma.admin.findUnique({ where: { email } });
        if (user) {
          role = 'ADMIN';
        } else {
          // Check Regular User
          user = await prisma.user.findUnique({ where: { email } });
          role = 'USER';
          
          if (!user) {
            // Check Employee
            user = await prisma.employee.findUnique({ where: { email } });
            if (user) role = 'EMPLOYEE';
          }
        }
      } catch (err) {
        // Both verification methods failed
        return res.status(401).json({ error: 'Authentication failed: Invalid or expired token' });
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'User account not found' });
    }

    req.user = { ...user, role, firebaseUid: uid };
    next();
  } catch (err) {
    console.error('Auth Error:', err.message);
    return res.status(401).json({ error: 'Internal Auth Error' });
  }
};

// Optional auth — sets req.user if token exists, continues without it
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    let user = null;
    let role = null;
    let uid = null;

    // 1. Try Backend JWT (Admin login)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded && decoded.id) {
        user = await prisma.admin.findUnique({ where: { id: decoded.id } });
        if (user) {
          role = 'ADMIN';
          uid = 'backend_jwt_' + user.id;
        }
      }
    } catch {
      // Not a valid backend JWT, proceed to Firebase check
    }

    // 2. Try Firebase ID Token (regular users) — was broken: used undefined `admin` variable
    if (!user) {
      try {
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(token); // FIX: was `admin.auth()`
        const { email, uid: firebaseUid } = decodedToken;
        uid = firebaseUid;

        user = await prisma.user.findUnique({ where: { email } });
        role = 'USER';

        if (!user) {
          user = await prisma.admin.findUnique({ where: { email } });
          if (user) role = 'ADMIN';
          else {
            user = await prisma.employee.findUnique({ where: { email } });
            if (user) role = 'EMPLOYEE';
          }
        }
      } catch {
        // Token invalid — proceed as unauthenticated
      }
    }

    req.user = user ? { ...user, role, firebaseUid: uid } : null;
    next();
  } catch {
    req.user = null;
    next();
  }
};


const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireEmployee = (req, res, next) => {
  if (req.user?.role !== 'EMPLOYEE' && req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Employee access required' });
  }
  next();
};

const requireApprovedEmployee = (req, res, next) => {
  if (req.user?.role === 'ADMIN') return next();
  if (req.user?.role === 'EMPLOYEE') {
    if (req.user.status !== 'APPROVED') {
      return res.status(403).json({ error: 'Employee account pending approval' });
    }
    return next();
  }
  return res.status(403).json({ error: 'Access denied' });
};

module.exports = { authenticate, optionalAuth, requireAdmin, requireEmployee, requireApprovedEmployee };
