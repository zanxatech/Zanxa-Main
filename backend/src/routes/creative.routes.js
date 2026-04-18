const express = require('express');
const { 
  getDesignGallery, 
  createCategory, 
  createFolder, 
  placeOrder,
  getAllCreativeContent,
  deleteCategory,
  deleteFolder,
  updateFolder,
  getFolderByNumber
} = require('../controllers/creative.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

// Public / User routes
router.get('/gallery', getDesignGallery);
router.get('/folders/:number', getFolderByNumber);
router.post('/order', authenticate, placeOrder);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, getAllCreativeContent);
router.post('/categories', authenticate, requireAdmin, createCategory);
router.post('/folders', authenticate, requireAdmin, createFolder);
router.patch('/folders/:id', authenticate, requireAdmin, updateFolder);
router.delete('/categories/:id', authenticate, requireAdmin, deleteCategory);
router.delete('/folders/:id', authenticate, requireAdmin, deleteFolder);

module.exports = router;
