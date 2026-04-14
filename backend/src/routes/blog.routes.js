const router = require('express').Router();
const { 
  getBlogPosts, 
  getBlogPostBySlug, 
  createBlogPost, 
  updateBlogPost, 
  deleteBlogPost,
  getAllAdminBlogPosts 
} = require('../controllers/blog.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

// Public routes
router.get('/', getBlogPosts);
router.get('/:slug', getBlogPostBySlug);

// Admin routes
router.get('/admin/all', authenticate, requireAdmin, getAllAdminBlogPosts);
router.post('/', authenticate, requireAdmin, createBlogPost);
router.patch('/:id', authenticate, requireAdmin, updateBlogPost);
router.delete('/:id', authenticate, requireAdmin, deleteBlogPost);

module.exports = router;
