const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { 
  getProjects, 
  getProject, 
  placeOrder, 
  getUserOrders,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/webdev.controller');
const { requireAdmin } = require('../middleware/auth.middleware');

router.get('/', getProjects);
router.get('/orders/me', authenticate, getUserOrders);
router.get('/:id', authenticate, getProject);
router.post('/orders', authenticate, placeOrder);

// Admin routes
router.post('/', authenticate, requireAdmin, createProject);
router.patch('/:id', authenticate, requireAdmin, updateProject);
router.delete('/:id', authenticate, requireAdmin, deleteProject);

module.exports = router;
