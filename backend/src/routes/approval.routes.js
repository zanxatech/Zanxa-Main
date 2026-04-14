const express = require('express');
const { getPendingApprovals, handleApprovalAction } = require('../controllers/approval.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Admin only routes
router.use(authenticate, requireAdmin);

router.get('/pending', getPendingApprovals);
router.patch('/:id/status', handleApprovalAction);

module.exports = router;
