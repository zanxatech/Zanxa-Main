const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../utils/helpers');
const { uploadMultipleToCloudinary } = require('../services/storage.service');

const prisma = new PrismaClient();

// ─── GET ALL WEBSITE PROJECTS ───────────────────────────────────────────────
const getProjects = asyncHandler(async (req, res) => {
  const projects = await prisma.websiteProject.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ projects });
});

// ─── ADMIN: CREATE PROJECT ───────────────────────────────────────────────────
const createProject = asyncHandler(async (req, res) => {
  const { title, description, images, htmlCode, cssCode } = req.body;
  if (!title || !description) throw AppError('Title and description required', 400);

  let imageUrls = [];
  if (images && images.length > 0) {
    imageUrls = await uploadMultipleToCloudinary(images, 'webdev/projects');
  }

  const project = await prisma.websiteProject.create({
    data: { title, description, images: imageUrls, htmlCode, cssCode }
  });
  res.status(201).json({ project });
});

// ─── USER/ADMIN: GET PROJECT DETAILS ─────────────────────────────────────────
const getProject = asyncHandler(async (req, res) => {
  const project = await prisma.websiteProject.findUnique({
    where: { id: req.params.id }
  });
  if (!project) throw AppError('Project not found', 404);
  res.json({ project });
});

// ─── USER: PLACE WEBDEV ORDER ────────────────────────────────────────────────
const placeOrder = asyncHandler(async (req, res) => {
  const { customerName, customerPhone, websiteProjectId, description } = req.body;
  if (!customerName || !customerPhone) throw AppError('Name and phone required', 400);

  const order = await prisma.order.create({
    data: {
      userId: req.user.id,
      serviceType: 'WEB_DEVELOPMENT',
      customerName,
      customerPhone,
      description,
      websiteProjectId: websiteProjectId || null,
      status: 'PENDING_PAYMENT'
    }
  });
  res.status(201).json({ message: 'Order created', order });
});

// ─── USER: GET MY WEBDEV ORDERS ──────────────────────────────────────────────
const getUserOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id, serviceType: 'WEB_DEVELOPMENT' },
    include: { websiteProject: true, payment: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ orders });
});

// ─── ADMIN: UPDATE PROJECT ───────────────────────────────────────────────────
const updateProject = asyncHandler(async (req, res) => {
  const { title, description, images, htmlCode, cssCode, isActive } = req.body;
  const { id } = req.params;

  let updateData = { title, description, htmlCode, cssCode, isActive };
  
  if (images && images.length > 0) {
    // If new images provided, upload them
    const imageUrls = await uploadMultipleToCloudinary(images, 'webdev/projects');
    updateData.images = imageUrls;
  }

  const project = await prisma.websiteProject.update({
    where: { id },
    data: updateData
  });

  res.json({ project });
});

// ─── ADMIN: DELETE PROJECT ───────────────────────────────────────────────────
const deleteProject = asyncHandler(async (req, res) => {
  await prisma.websiteProject.delete({ where: { id: req.params.id } });
  res.json({ message: 'Project deleted successfully' });
});

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  placeOrder,
  getUserOrders
};
