const router = require('express').Router();
const { authenticate, requireEmployee } = require('../middleware/auth.middleware');
const { registerEmployee, getEmployeeProfile, getAssignedOrders, deliverOrder } = require('../controllers/employee.controller');

router.post('/register', registerEmployee);
router.get('/me', authenticate, requireEmployee, getEmployeeProfile);
router.get('/assigned-orders', authenticate, requireEmployee, getAssignedOrders);
router.patch('/orders/:orderId/deliver', authenticate, requireEmployee, deliverOrder);

module.exports = router;
