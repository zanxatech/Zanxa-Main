const express = require('express');
const {
  getCourses, getAdminCourses, getCourse, getFullCourse,
  createCourse, updateCourse, deleteCourse,
  createModule, updateModule, deleteModule,
  markModuleComplete,
  enrollCourse, updateEnrollmentStatus, getPendingEnrollments, getMyEnrollments,
  addQuizQuestion, deleteQuizQuestion, getQuizQuestions, getCourseQuiz, submitQuizAttempt,
  getPendingCertificates, approveCertificate, getMyCertificate,
  addReview
} = require('../controllers/course.controller');
const { authenticate, optionalAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// ─── STATIC ROUTES FIRST (must come before /:id to avoid conflicts) ──────────

// Public: only published courses
router.get('/', getCourses);

// Admin: all courses incl. drafts
router.get('/admin/all', authenticate, requireAdmin, getAdminCourses);

// User: my enrollments
router.get('/enrollments/me', authenticate, getMyEnrollments);

// Admin: pending enrollments queue
router.get('/enrollments/pending', authenticate, requireAdmin, getPendingEnrollments);

// Admin: update enrollment status  
router.patch('/enrollments/:enrollmentId', authenticate, requireAdmin, updateEnrollmentStatus);

// Admin: pending certificate queue
router.get('/certificates/pending', authenticate, requireAdmin, getPendingCertificates);

// Admin: approve / reject certificate
router.patch('/certificates/:certId', authenticate, requireAdmin, approveCertificate);

// Admin: create module (static path to avoid /modules being matched as /:id)
router.post('/modules/create', authenticate, requireAdmin, createModule);
router.patch('/modules/:id', authenticate, requireAdmin, updateModule);
router.delete('/modules/:id', authenticate, requireAdmin, deleteModule);

// User: mark module complete
router.post('/modules/:moduleId/complete', authenticate, markModuleComplete);

// Admin: create course
router.post('/', authenticate, requireAdmin, createCourse);

// ─── DYNAMIC ROUTES (/:id must be AFTER all static routes) ───────────────────

// Public / Auth optional: course detail (enriched with progress if logged in)
router.get('/:id', optionalAuth, getCourse);

// Auth: update course
router.patch('/:id', authenticate, requireAdmin, updateCourse);

// Auth: deactivate course
router.delete('/:id', authenticate, requireAdmin, deleteCourse);

// Enrolled users + Admin: full course with video URLs
router.get('/:id/full', authenticate, getFullCourse);

// User: Enroll in course
router.post('/:id/enroll', authenticate, enrollCourse);

// Admin: get quiz bank (with correct answers)
router.get('/:courseId/quiz/questions', authenticate, requireAdmin, getQuizQuestions);

// Admin: add quiz question
router.post('/:courseId/quiz/questions', authenticate, requireAdmin, addQuizQuestion);

// Admin: delete quiz question
router.delete('/:courseId/quiz/questions/:questionId', authenticate, requireAdmin, deleteQuizQuestion);

// User: get 10-question randomized quiz (no answers)
router.get('/:courseId/quiz', authenticate, getCourseQuiz);

// User: submit quiz answers (server-side scored)
router.post('/:courseId/quiz/submit', authenticate, submitQuizAttempt);

// User: get my certificate for a course
router.get('/:courseId/certificate', authenticate, getMyCertificate);

// User: submit a review (enrolled only)
router.post('/:courseId/reviews', authenticate, addReview);

module.exports = router;
