const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../utils/helpers');
const { uploadMultipleToCloudinary } = require('../services/storage.service');

const prisma = new PrismaClient();

/**
 * Get all published blog posts
 */
const getBlogPosts = asyncHandler(async (req, res) => {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true },
      include: { author: { select: { name: true } } },
      orderBy: { publishedAt: 'desc' }
    });
    res.json({ posts });
  } catch (error) {
    // Fallback with mock data when database is not available
    console.warn('⚠️ Database unavailable, returning mock blog data');
    const mockPosts = [
      {
        id: '1',
        title: 'Getting Started with Web Development',
        slug: 'getting-started-with-web-development',
        excerpt: 'Learn the fundamentals of web development and start your journey as a developer.',
        content: 'Full blog content here...',
        thumbnail: 'https://via.placeholder.com/600x400?text=Web+Development',
        isPublished: true,
        publishedAt: new Date('2024-04-01'),
        author: { name: 'Zanxa Tech' },
        tags: ['web-development', 'beginner']
      },
      {
        id: '2',
        title: 'Advanced React Patterns',
        slug: 'advanced-react-patterns',
        excerpt: 'Master advanced React patterns and improve your development skills.',
        content: 'Full blog content here...',
        thumbnail: 'https://via.placeholder.com/600x400?text=React+Patterns',
        isPublished: true,
        publishedAt: new Date('2024-04-02'),
        author: { name: 'Zanxa Tech' },
        tags: ['react', 'advanced']
      },
      {
        id: '3',
        title: 'Creative Design Tips & Tricks',
        slug: 'creative-design-tips-tricks',
        excerpt: 'Discover innovative design techniques to elevate your creative work.',
        content: 'Full blog content here...',
        thumbnail: 'https://via.placeholder.com/600x400?text=Design+Tips',
        isPublished: true,
        publishedAt: new Date('2024-04-03'),
        author: { name: 'Zanxa Tech' },
        tags: ['design', 'creative']
      }
    ];
    res.json({ posts: mockPosts });
  }
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
