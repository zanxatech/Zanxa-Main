const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../utils/helpers');
const { uploadMultipleToCloudinary } = require('../services/storage.service');

const prisma = new PrismaClient();

/**
 * Get all published blog posts
 */
const getBlogPosts = asyncHandler(async (req, res) => {
  const posts = await prisma.blogPost.findMany({
    where: { isPublished: true },
    include: { author: { select: { name: true } } },
    orderBy: { publishedAt: 'desc' }
  });
  res.json({ posts });
});

/**
 * Get a single blog post by slug
 */
const getBlogPostBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } }
  });

  if (!post || (!post.isPublished && !req.user)) {
    throw AppError('Blog post not found', 404);
  }

  res.json({ post });
});

/**
 * Admin: Create a new blog post
 */
const createBlogPost = asyncHandler(async (req, res) => {
  const { title, content, excerpt, thumbnail, tags, isPublished } = req.body;

  if (!title || !content) throw AppError('Title and content are required', 400);

  const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

  const post = await prisma.blogPost.create({
    data: {
      title,
      slug,
      content,
      excerpt,
      thumbnail,
      tags: tags || [],
      isPublished: !!isPublished,
      publishedAt: isPublished ? new Date() : null,
      authorId: req.user.id
    }
  });

  res.status(201).json({ message: 'Blog post created', post });
});

/**
 * Admin: Update a blog post
 */
const updateBlogPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, thumbnail, tags, isPublished } = req.body;

  const data = { title, content, excerpt, thumbnail, tags };
  
  if (isPublished !== undefined) {
    data.isPublished = isPublished;
    if (isPublished) data.publishedAt = new Date();
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data
  });

  res.json({ message: 'Blog post updated', post });
});

/**
 * Admin: Delete a blog post
 */
const deleteBlogPost = asyncHandler(async (req, res) => {
  await prisma.blogPost.delete({ where: { id: req.params.id } });
  res.json({ message: 'Blog post deleted' });
});

/**
 * Admin: Get all blog posts (including unpublished)
 */
const getAllAdminBlogPosts = asyncHandler(async (req, res) => {
  const posts = await prisma.blogPost.findMany({
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ posts });
});

module.exports = {
  getBlogPosts,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  getAllAdminBlogPosts
};
