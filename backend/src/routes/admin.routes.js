const router = require('express').Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  getDashboardStats,
  getRevenueChart,
  getAllUsers,
  getAllEmployees,
  getAllOrders,
  assignOrder
} = require('../controllers/admin.controller');

const {
  createCategory, createFolder
} = require('../controllers/creative.controller');

const {
  createProject
} = require('../controllers/webdev.controller');

// Admin ONLY middleware
router.use(authenticate, requireAdmin);

// Dashboard & Analytics
router.get('/dashboard', getDashboardStats);
router.get('/revenue-chart', getRevenueChart);

// User & Staff Management
router.get('/users', getAllUsers);
router.get('/employees', getAllEmployees);

// Order Management
router.get('/orders', getAllOrders);
router.post('/orders/assign', assignOrder);

// Content Management - Templates (Creative)
router.post('/templates/categories', createCategory);
router.post('/templates/folders', createFolder);

// Content Management - Web Projects
router.post('/projects', createProject);

// Note: Course management (create/update/delete/modules/quiz/certificates)
// is handled by /api/services/courses routes in course.routes.js

module.exports = router;

