const router = require('express').Router();
const multer = require('multer');
const { authenticate, requireAdmin, requireApprovedEmployee } = require('../middleware/auth.middleware');
const { uploadToCloudinary } = require('../utils/cloudinary');
const { asyncHandler, AppError } = require('../utils/helpers');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Configure multer to save to temp OS directory for Cloudinary to pick up
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for Cloudinary
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed for Cloudinary storage'), false);
  }
});

// Upload template image
router.post('/template-image', authenticate, requireApprovedEmployee, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) throw AppError('No file uploaded', 400);
  const url = await uploadToCloudinary(req.file.path, 'templates');
  res.json({ url });
}));

// Upload multiple project images
router.post('/project-images', authenticate, requireApprovedEmployee, upload.array('images', 10), asyncHandler(async (req, res) => {
  if (!req.files?.length) throw AppError('No files uploaded', 400);
  const urls = await Promise.all(
    req.files.map(async (file) => {
      return await uploadToCloudinary(file.path, 'projects');
    })
  );
  res.json({ urls });
}));

// Upload course thumbnail
router.post('/thumbnail', authenticate, requireAdmin, upload.single('thumbnail'), asyncHandler(async (req, res) => {
  if (!req.file) throw AppError('No file uploaded', 400);
  const url = await uploadToCloudinary(req.file.path, 'courses');
  res.json({ url });
}));

module.exports = router;
