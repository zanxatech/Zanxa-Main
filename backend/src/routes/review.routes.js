const express = require('express');
const { createReview, getCourseReviews, getFeaturedReviews } = require('../controllers/review.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Public: View feedback
router.get('/featured', getFeaturedReviews);
router.get('/:courseId', getCourseReviews);

// Authenticated: Register feedback
router.post('/', authenticate, createReview);

module.exports = router;
