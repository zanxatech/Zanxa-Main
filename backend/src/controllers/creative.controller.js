const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../utils/helpers');
const { uploadMultipleToCloudinary } = require('../services/storage.service');

const prisma = new PrismaClient();

// ─── USER: GET ALL CATEGORIES & FOLDERS ──────────────────────────────────────
const getDesignGallery = asyncHandler(async (req, res) => {
  const categories = await prisma.templateCategory.findMany({
    include: {
      folders: {
        where: { isActive: true },
        select: { id: true, folderNumber: true, images: true, price: true }
      }
    },
    orderBy: { title: 'asc' }
  });
  res.json({ categories });
});

// ─── ADMIN: CREATE CATEGORY ──────────────────────────────────────────────────
const createCategory = asyncHandler(async (req, res) => {
  const { title } = req.body;
  if (!title) throw AppError('Title is required', 400);

  const category = await prisma.templateCategory.create({
    data: { title }
  });
  res.status(201).json({ category });
});

// ─── ADMIN: CREATE FOLDER IN CATEGORY ────────────────────────────────────────
const createFolder = asyncHandler(async (req, res) => {
  const { categoryId, folderNumber, description, images, price } = req.body; // images as base64 array
  if (!categoryId || !folderNumber || !images) throw AppError('Missing required fields', 400);

  // Upload to Cloudinary
  const imageUrls = await uploadMultipleToCloudinary(images, `templates/${folderNumber}`);

  const folder = await prisma.templateFolder.create({
    data: {
      categoryId,
      folderNumber,
      description: description || null,
      images: imageUrls,
      price: parseFloat(price) || 199
    }
  });
  res.status(201).json({ folder });
});

// ─── ADMIN: UPDATE FOLDER ────────────────────────────────────────────────────
const updateFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { folderNumber, description, images, price } = req.body; // images as array of URLs/Base64

  // Check if we need to do new uploads
  let finalImages = images;
  const newUploads = images.filter(img => img.startsWith('data:image'));
  const existingUrls = images.filter(img => !img.startsWith('data:image'));

  if (newUploads.length > 0) {
    const uploadedUrls = await uploadMultipleToCloudinary(newUploads, `templates/${folderNumber || 'update'}`);
    finalImages = [...existingUrls, ...uploadedUrls];
  }

  const folder = await prisma.templateFolder.update({
    where: { id },
    data: {
      folderNumber,
      description,
      images: finalImages,
      price: price ? parseFloat(price) : undefined
    }
  });

  res.json({ message: 'Folder updated successfully', folder });
});

// ─── USER: PLACE CREATIVE ORDER ──────────────────────────────────────────────
const placeOrder = asyncHandler(async (req, res) => {
  const { customerName, customerPhone, category, templateFolderId, description } = req.body;
  
  if (!customerName || !customerPhone) throw AppError('Name and phone are required', 400);

  let orderUserId = req.user.id;
  if (req.user.role !== 'USER') {
    const dummyEmail = `test_${req.user.email}`;
    let dummyUser = await prisma.user.findUnique({ where: { email: dummyEmail } });
    if (!dummyUser) {
      dummyUser = await prisma.user.create({
        data: { 
          name: `${req.user.name || 'Admin'} (Test)`, 
          email: dummyEmail, 
          username: `test_${Date.now()}`,
          isEmailVerified: true
        }
      });
    }
    orderUserId = dummyUser.id;
  }

  const order = await prisma.order.create({
    data: {
      userId: orderUserId,
      serviceType: 'CREATIVE_DESIGN',
      customerName,
      customerPhone,
      category, // Text category if needed
      description, // User's custom instruction
      templateFolderId: templateFolderId || null,
      status: 'PENDING_PAYMENT'
    }
  });
  
  res.status(201).json({ message: 'Order initialized', order });
});

// ─── ADMIN: GET ALL CATEGORIES & FOLDERS (VERBOSE) ──────────────────────────
const getAllCreativeContent = asyncHandler(async (req, res) => {
  const categories = await prisma.templateCategory.findMany({
    include: {
      folders: true
    },
    orderBy: { title: 'asc' }
  });
  res.json({ categories });
});

// ─── ADMIN: DELETE CATEGORY ──────────────────────────────────────────────────
const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.templateCategory.delete({ where: { id } });
  res.json({ message: 'Category deleted successfully' });
});

// ─── ADMIN: DELETE FOLDER ────────────────────────────────────────────────────
const deleteFolder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await prisma.templateFolder.delete({ where: { id } });
  res.json({ message: 'Folder deleted successfully' });
});

// ─── PUBLIC: GET FOLDER BY NUMBER ───────────────────────────────────────────
const getFolderByNumber = asyncHandler(async (req, res) => {
  const { number } = req.params;
  const folder = await prisma.templateFolder.findUnique({
    where: { folderNumber: number },
    include: { category: true }
  });
  if (!folder) throw AppError('Template not found', 404);
  res.json({ folder });
});

module.exports = { 
  getDesignGallery, 
  createCategory, 
  createFolder, 
  updateFolder,
  getAllCreativeContent,
  deleteCategory,
  deleteFolder,
  getFolderByNumber,
  placeOrder 
};
