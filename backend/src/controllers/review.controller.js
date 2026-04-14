const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../utils/helpers');

const prisma = new PrismaClient();

/**
 * Post a new review for a course
 */
const createReview = asyncHandler(async (req, res) => {
  const { courseId, rating, comment } = req.body;
  const userId = req.user.id;

  if (!courseId || !rating || !comment) {
    throw AppError('Missing required fields for review', 400);
  }

  // Gated: Check if user has purchased the course (Enrollment status APPROVED)
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } }
  });

  if (!enrollment || enrollment.status !== 'APPROVED') {
    throw AppError('Authentication required: You must purchase this course before submitting a review.', 403);
  }

  // Prevent double reviews
  const existingReview = await prisma.courseReview.findUnique({
    where: { userId_courseId: { userId, courseId } }
  });

  if (existingReview) {
    throw AppError('Review conflict: You have already submitted a review for this course.', 400);
  }

  const review = await prisma.courseReview.create({
    data: { 
      courseId, 
      userId, 
      rating: parseInt(rating), 
      comment 
    },
    include: {
      user: { select: { name: true, avatar: true } }
    }
  });

  res.status(201).json({ message: 'Feedback submitted successfully', review });
});

/**
 * Get all reviews for a specific course
 */
const getCourseReviews = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  const reviews = await prisma.courseReview.findMany({
    where: { courseId },
    include: {
      user: { select: { name: true, avatar: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ reviews });
});

/**
 * Get featured reviews for landing page
 */
const getFeaturedReviews = asyncHandler(async (req, res) => {
  const reviews = await prisma.courseReview.findMany({
    take: 5,
    where: { rating: { gte: 4 } },
    include: {
      user: { select: { name: true, avatar: true } },
      course: { select: { title: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({ reviews });
});

module.exports = { createReview, getCourseReviews, getFeaturedReviews };
