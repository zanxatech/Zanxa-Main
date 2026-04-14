const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../utils/helpers');
const { uploadToCloudinary } = require('../services/storage.service');

const prisma = new PrismaClient();

// ─── PUBLIC: GET ALL PUBLISHED COURSES ────────────────────────────────────────
const getCourses = asyncHandler(async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { isActive: true, isPublished: true },
    select: {
      id: true, title: true, description: true, price: true,
      thumbnail: true, createdAt: true,
      _count: { select: { modules: true, enrollments: true, reviews: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ courses });
});

// ─── ADMIN: GET ALL COURSES (including drafts) ────────────────────────────────
const getAdminCourses = asyncHandler(async (req, res) => {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { modules: true, enrollments: true, reviews: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ courses });
});

// ─── PUBLIC/USER: GET SINGLE COURSE DETAILS ──────────────────────────────────
const getCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        select: { id: true, title: true, description: true, order: true, videoType: true }
      },
      reviews: {
        take: 10,
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' }
      },
      _count: { select: { modules: true, enrollments: true, reviews: true } }
    }
  });

  if (!course || !course.isActive) throw AppError('Course not found', 404);

  let isPurchased = false;
  let enrollmentStatus = null;
  let progress = [];

  if (req.user) {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: id } }
    });
    isPurchased = enrollment?.status === 'APPROVED';
    enrollmentStatus = enrollment?.status || null;

    if (isPurchased) {
      progress = await prisma.moduleProgress.findMany({
        where: { userId: req.user.id, courseId: id }
      });
    }
  }

  res.json({ course, isPurchased, enrollmentStatus, progress });
});

// ─── USER: GET FULL COURSE WITH VIDEO URLS (Enrolled only) ───────────────────
const getFullCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // If user is admin, skip enrollment check
  if (req.user.role !== 'ADMIN') {
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: id } }
    });
    if (!enrollment || enrollment.status !== 'APPROVED') {
      throw AppError('You must have an approved enrollment to access this course', 403);
    }
  }

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          progress: req.user.role !== 'ADMIN' ? {
            where: { userId: req.user.id }
          } : false
        }
      }
    }
  });

  if (!course) throw AppError('Course not found', 404);

  // Compute overall progress %
  const totalModules = course.modules.length;
  const completedModules = req.user.role !== 'ADMIN'
    ? course.modules.filter(m => m.progress?.some(p => p.completed)).length
    : 0;
  const progressPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  res.json({ course, progressPct, completedModules, totalModules });
});

// ─── ADMIN: CREATE COURSE ─────────────────────────────────────────────────────
const createCourse = asyncHandler(async (req, res) => {
  const { title, description, price, thumbnail } = req.body;
  if (!title || !price) throw AppError('Title and price are required', 400);

  // If thumbnail is base64, upload it to Cloudinary
  let thumbnailUrl = thumbnail;
  if (thumbnail && thumbnail.startsWith('data:')) {
    thumbnailUrl = await uploadToCloudinary(thumbnail, 'course_thumbnails');
  }

  const course = await prisma.course.create({
    data: { title, description, price: parseFloat(price), thumbnail: thumbnailUrl }
  });

  // Auto-create an empty quiz pool for the course
  await prisma.quiz.create({ data: { courseId: course.id } });

  res.status(201).json({ message: 'Course created', course });
});

// ─── ADMIN: UPDATE COURSE ─────────────────────────────────────────────────────
const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, price, thumbnail, isPublished } = req.body;

  let thumbnailUrl = thumbnail;
  if (thumbnail && thumbnail.startsWith('data:')) {
    thumbnailUrl = await uploadToCloudinary(thumbnail, 'course_thumbnails');
  }

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(price && { price: parseFloat(price) }),
      ...(thumbnailUrl && { thumbnail: thumbnailUrl }),
      ...(isPublished !== undefined && { isPublished: Boolean(isPublished) })
    }
  });
  res.json({ message: 'Course updated', course });
});

// ─── ADMIN: DELETE / DEACTIVATE COURSE ───────────────────────────────────────
const deleteCourse = asyncHandler(async (req, res) => {
  await prisma.course.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Course deactivated' });
});

// ─── ADMIN: CREATE MODULE ─────────────────────────────────────────────────────
const createModule = asyncHandler(async (req, res) => {
  const { courseId, title, description, videoUrl, videoType, order } = req.body;
  if (!courseId || !title) throw AppError('Course ID and title are required', 400);
  if (videoUrl && !videoType) throw AppError('videoType (CLOUDINARY or YOUTUBE) is required when providing a URL', 400);

  let finalVideoUrl = videoUrl;
  // Handle Cloudinary upload if base64 video
  if (videoType === 'CLOUDINARY' && videoUrl && videoUrl.startsWith('data:')) {
    finalVideoUrl = await uploadToCloudinary(videoUrl, 'course_videos');
  }
  // Handle YouTube embed conversion
  if (videoType === 'YOUTUBE' && videoUrl) {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^& \n]+)/;
    const match = videoUrl.match(youtubeRegex);
    if (match && match[1]) {
      finalVideoUrl = `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
    }
  }

  const module = await prisma.courseModule.create({
    data: {
      courseId,
      title,
      description,
      videoUrl: finalVideoUrl || null,
      videoType: finalVideoUrl ? videoType : null,
      order: parseInt(order) || 0
    }
  });
  res.status(201).json({ message: 'Module created', module });
});

// ─── ADMIN: UPDATE MODULE ─────────────────────────────────────────────────────
const updateModule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, videoUrl, videoType, order } = req.body;

  let finalVideoUrl = videoUrl;
  if (videoType === 'CLOUDINARY' && videoUrl && videoUrl.startsWith('data:')) {
    finalVideoUrl = await uploadToCloudinary(videoUrl, 'course_videos');
  }
  if (videoType === 'YOUTUBE' && videoUrl) {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^& \n]+)/;
    const match = videoUrl.match(youtubeRegex);
    if (match && match[1]) {
      finalVideoUrl = `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1`;
    }
  }

  const module = await prisma.courseModule.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(finalVideoUrl !== undefined && { videoUrl: finalVideoUrl }),
      ...(videoType && { videoType }),
      ...(order !== undefined && { order: parseInt(order) })
    }
  });
  res.json({ message: 'Module updated', module });
});

// ─── ADMIN: DELETE MODULE ─────────────────────────────────────────────────────
const deleteModule = asyncHandler(async (req, res) => {
  await prisma.courseModule.delete({ where: { id: req.params.id } });
  res.json({ message: 'Module deleted' });
});

// ─── USER: MARK MODULE AS COMPLETE ───────────────────────────────────────────
const markModuleComplete = asyncHandler(async (req, res) => {
  const { moduleId } = req.params;

  // Ensure user is enrolled and approved
  const module = await prisma.courseModule.findUnique({ where: { id: moduleId } });
  if (!module) throw AppError('Module not found', 404);

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId: req.user.id, courseId: module.courseId } }
  });
  if (!enrollment || enrollment.status !== 'APPROVED') {
    throw AppError('Access denied. Valid enrollment required.', 403);
  }

  const progress = await prisma.moduleProgress.upsert({
    where: { userId_moduleId: { userId: req.user.id, moduleId } },
    update: { completed: true },
    create: { userId: req.user.id, courseId: module.courseId, moduleId, completed: true }
  });

  // Calculate overall completion
  const totalModules = await prisma.courseModule.count({ where: { courseId: module.courseId } });
  const completedModules = await prisma.moduleProgress.count({
    where: { userId: req.user.id, courseId: module.courseId, completed: true }
  });
  const progressPct = Math.round((completedModules / totalModules) * 100);
  const allCompleted = completedModules === totalModules;

  res.json({ progress, progressPct, allCompleted, completedModules, totalModules });
});

// ─── USER: ENROLL IN COURSE ───────────────────────────────────────────────────
const enrollCourse = asyncHandler(async (req, res) => {
  const { id: courseId } = req.params;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || !course.isPublished) throw AppError('Course not available', 404);

  const existing = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId: req.user.id, courseId } }
  });
  if (existing && existing.status !== 'REJECTED') {
    return res.json({ message: 'Already enrolled', enrollment: existing });
  }

  const enrollment = await prisma.courseEnrollment.upsert({
    where: { userId_courseId: { userId: req.user.id, courseId } },
    update: { status: 'PENDING_PAYMENT' },
    create: { userId: req.user.id, courseId, status: 'PENDING_PAYMENT' }
  });

  res.status(201).json({ message: 'Enrollment initialized', enrollment });
});

// ─── ADMIN: APPROVE / REJECT ENROLLMENT ──────────────────────────────────────
const updateEnrollmentStatus = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.params;
  const { status, rejectionReason } = req.body; // APPROVED or REJECTED

  if (!['APPROVED', 'REJECTED'].includes(status)) throw AppError('Invalid status', 400);

  const enrollment = await prisma.courseEnrollment.update({
    where: { id: enrollmentId },
    data: {
      status,
      ...(status === 'APPROVED' && { approvedAt: new Date() }),
      ...(status === 'REJECTED' && { rejectedAt: new Date(), rejectionReason })
    },
    include: { user: { select: { name: true, email: true } }, course: { select: { title: true } } }
  });
  res.json({ message: `Enrollment ${status.toLowerCase()}`, enrollment });
});

// ─── ADMIN: GET ALL PENDING ENROLLMENTS ──────────────────────────────────────
const getPendingEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { status: { in: ['WAITING_APPROVAL', 'PAYMENT_SUBMITTED'] } },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      course: { select: { id: true, title: true, price: true } },
      payment: { select: { amount: true, razorpayPaymentId: true, status: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ enrollments });
});

// ─── USER: GET MY ENROLLMENTS ─────────────────────────────────────────────────
const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { userId: req.user.id },
    include: {
      course: {
        include: {
          _count: { select: { modules: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Add progress data for each enrollment
  const enriched = await Promise.all(enrollments.map(async (e) => {
    const completedModules = await prisma.moduleProgress.count({
      where: { userId: req.user.id, courseId: e.courseId, completed: true }
    });
    const totalModules = e.course._count.modules;
    const progressPct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

    // Get certificate if any
    const certificate = await prisma.certificate.findUnique({
      where: { userId_courseId: { userId: req.user.id, courseId: e.courseId } }
    });

    // Get best quiz attempt
    const bestAttempt = await prisma.quizAttempt.findFirst({
      where: { userId: req.user.id, courseId: e.courseId, passed: true },
      orderBy: { score: 'desc' }
    });

    return { ...e, progressPct, completedModules, totalModules, certificate, quizPassed: !!bestAttempt };
  }));

  res.json({ enrollments: enriched });
});

// ─── QUIZ SYSTEM ──────────────────────────────────────────────────────────────
const addQuizQuestion = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { question, options, correctOption } = req.body;
  if (!question || !options || correctOption === undefined) throw AppError('All fields required', 400);
  if (!Array.isArray(options) || options.length !== 4) throw AppError('Must provide exactly 4 options', 400);

  let quiz = await prisma.quiz.findUnique({ where: { courseId } });
  if (!quiz) quiz = await prisma.quiz.create({ data: { courseId } });

  // Max 20 questions
  const count = await prisma.quizQuestion.count({ where: { quizId: quiz.id } });
  if (count >= 20) throw AppError('Maximum 20 questions per quiz reached', 400);

  const q = await prisma.quizQuestion.create({
    data: { quizId: quiz.id, question, options, correctOption: parseInt(correctOption) }
  });
  res.status(201).json({ message: 'Question added', question: q });
});

const deleteQuizQuestion = asyncHandler(async (req, res) => {
  await prisma.quizQuestion.delete({ where: { id: req.params.questionId } });
  res.json({ message: 'Question deleted' });
});

const getQuizQuestions = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const quiz = await prisma.quiz.findUnique({
    where: { courseId },
    include: { questions: { orderBy: { createdAt: 'asc' } } }
  });
  res.json({ quiz: quiz || { questions: [] } });
});

const getCourseQuiz = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  // Verify approved enrollment
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId: req.user.id, courseId } }
  });
  if (!enrollment || enrollment.status !== 'APPROVED') throw AppError('Access denied', 403);

  // Verify all modules completed
  const totalModules = await prisma.courseModule.count({ where: { courseId } });
  const completedModules = await prisma.moduleProgress.count({
    where: { userId: req.user.id, courseId, completed: true }
  });
  if (totalModules > 0 && completedModules < totalModules) {
    throw AppError('Complete all modules before attempting the quiz', 400);
  }

  const quiz = await prisma.quiz.findUnique({
    where: { courseId },
    include: { questions: true }
  });

  if (!quiz || quiz.questions.length === 0) throw AppError('No quiz available for this course', 404);

  // Randomly pick 10 from question bank
  const shuffled = quiz.questions.sort(() => 0.5 - Math.random()).slice(0, 10);

  // Return questions WITHOUT correct answers (security)
  const safeQuestions = shuffled.map(({ correctOption, ...q }) => q);

  res.json({ questions: safeQuestions, totalQuestions: shuffled.length });
});

const submitQuizAttempt = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { answers } = req.body; // { [questionId]: selectedOptionIndex }

  if (!answers || typeof answers !== 'object') throw AppError('Answers required', 400);

  // Enrollment check
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId: req.user.id, courseId } }
  });
  if (!enrollment || enrollment.status !== 'APPROVED') throw AppError('Access denied', 403);

  // Fetch the questions and check answers server-side
  const questionIds = Object.keys(answers);
  const questions = await prisma.quizQuestion.findMany({
    where: { id: { in: questionIds } }
  });

  let score = 0;
  for (const q of questions) {
    if (parseInt(answers[q.id]) === q.correctOption) score++;
  }

  const passed = score >= 7; // 70% of 10

  const attempt = await prisma.quizAttempt.create({
    data: { userId: req.user.id, courseId, score, passed }
  });

  // If passed, create or update certificate record to WAITING_APPROVAL
  if (passed) {
    await prisma.certificate.upsert({
      where: { userId_courseId: { userId: req.user.id, courseId } },
      update: { status: 'WAITING_APPROVAL' },
      create: { userId: req.user.id, courseId, status: 'WAITING_APPROVAL' }
    });
  }

  res.json({
    attempt,
    score,
    passed,
    message: passed
      ? 'Congratulations! Your certificate request has been submitted to Admin.'
      : `You scored ${score}/10. You need 7/10 to pass. Please retry.`
  });
});

// ─── CERTIFICATE SYSTEM ───────────────────────────────────────────────────────
const getPendingCertificates = asyncHandler(async (req, res) => {
  const certs = await prisma.certificate.findMany({
    where: { status: 'WAITING_APPROVAL' },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      course: { select: { id: true, title: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ certificates: certs });
});

const approveCertificate = asyncHandler(async (req, res) => {
  const { certId } = req.params;
  const { pdfUrl, status } = req.body; // status: APPROVED or REJECTED, pdfUrl optional Cloudinary

  if (!['APPROVED', 'REJECTED'].includes(status)) throw AppError('Invalid status', 400);

  let finalPdfUrl = pdfUrl;
  if (pdfUrl && pdfUrl.startsWith('data:')) {
    finalPdfUrl = await uploadToCloudinary(pdfUrl, 'certificates');
  }

  const cert = await prisma.certificate.update({
    where: { id: certId },
    data: {
      status,
      ...(status === 'APPROVED' && {
        issuedAt: new Date(),
        ...(finalPdfUrl && { pdfUrl: finalPdfUrl })
      })
    }
  });
  res.json({ message: `Certificate ${status.toLowerCase()}`, certificate: cert });
});

const getMyCertificate = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const cert = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId: req.user.id, courseId } }
  });
  res.json({ certificate: cert });
});

// ─── REVIEWS ──────────────────────────────────────────────────────────────────
const addReview = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { rating, comment } = req.body;

  if (!rating || !comment) throw AppError('Rating and comment required', 400);

  // Must be enrolled and approved
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId: req.user.id, courseId } }
  });
  if (!enrollment || enrollment.status !== 'APPROVED') {
    throw AppError('Must be an enrolled student to review', 403);
  }

  const review = await prisma.courseReview.upsert({
    where: { userId_courseId: { userId: req.user.id, courseId } },
    update: { rating: parseInt(rating), comment },
    create: { userId: req.user.id, courseId, rating: parseInt(rating), comment }
  });
  res.status(201).json({ message: 'Review submitted', review });
});

module.exports = {
  getCourses, getAdminCourses, getCourse, getFullCourse,
  createCourse, updateCourse, deleteCourse,
  createModule, updateModule, deleteModule,
  markModuleComplete,
  enrollCourse, updateEnrollmentStatus, getPendingEnrollments, getMyEnrollments,
  addQuizQuestion, deleteQuizQuestion, getQuizQuestions, getCourseQuiz, submitQuizAttempt,
  getPendingCertificates, approveCertificate, getMyCertificate,
  addReview
};
