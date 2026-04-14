require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Zanxa Tech database...');

  // Create Admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@zanxatech.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ZanxaAdmin@2024';

  const existing = await prisma.admin.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.admin.create({
      data: {
        name: 'Zanxa Admin',
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 12)
      }
    });
    console.log(`✅ Admin created: ${adminEmail}`);
  } else {
    console.log(`ℹ️  Admin already exists: ${adminEmail}`);
  }

  // Seed sample courses
  const courseCount = await prisma.course.count();
  if (courseCount === 0) {
    const courses = [
      { title: 'Full Stack Web Development', description: 'Master React, Node.js, and PostgreSQL from scratch.', price: 4999, thumbnail: null },
      { title: 'UI/UX Design Mastery', description: 'Learn Figma, design systems, and product thinking.', price: 2999, thumbnail: null },
      { title: 'Digital Marketing Growth', description: 'SEO, social media, ads, and analytics strategies.', price: 1999, thumbnail: null },
    ];
    for (const c of courses) {
      await prisma.course.create({ data: c });
    }
    console.log('✅ Sample courses created');
  }

  // Seed sample templates
  const templateCount = await prisma.template.count();
  if (templateCount === 0) {
    const templates = [
      { category: 'Logo Design', serialNumber: 'LGO-001', imageUrl: 'https://placehold.co/400x300/4b2e2e/d4af37?text=Logo+Template+1', description: 'Minimal luxury logo template' },
      { category: 'Logo Design', serialNumber: 'LGO-002', imageUrl: 'https://placehold.co/400x300/4b2e2e/d4af37?text=Logo+Template+2', description: 'Modern lettermark logo design' },
      { category: 'Social Media', serialNumber: 'SM-001', imageUrl: 'https://placehold.co/400x300/7a4a2e/f8f5f0?text=Social+Media+1', description: 'Instagram post template pack' },
      { category: 'Social Media', serialNumber: 'SM-002', imageUrl: 'https://placehold.co/400x300/7a4a2e/f8f5f0?text=Social+Media+2', description: 'Story highlight covers set' },
      { category: 'Business Card', serialNumber: 'BC-001', imageUrl: 'https://placehold.co/400x300/4b2e2e/d4af37?text=Business+Card+1', description: 'Premium business card design' },
      { category: 'Brochure', serialNumber: 'BR-001', imageUrl: 'https://placehold.co/400x300/7a4a2e/d4af37?text=Brochure+1', description: 'Tri-fold corporate brochure' },
    ];
    for (const t of templates) {
      await prisma.template.create({ data: t });
    }
    console.log('✅ Sample templates created');
  }

  // Seed sample website projects
  const projectCount = await prisma.websiteProject.count();
  if (projectCount === 0) {
    const projects = [
      {
        title: 'E-Commerce Fashion Store',
        description: 'Full-featured online fashion store with cart, payments, and admin panel.',
        images: [
          'https://placehold.co/800x500/4b2e2e/d4af37?text=Fashion+Store+Home',
          'https://placehold.co/800x500/4b2e2e/f8f5f0?text=Fashion+Store+Products',
          'https://placehold.co/800x500/7a4a2e/d4af37?text=Fashion+Store+Cart'
        ]
      },
      {
        title: 'Restaurant Booking Platform',
        description: 'Online restaurant with menu, table reservations and delivery system.',
        images: [
          'https://placehold.co/800x500/4b2e2e/d4af37?text=Restaurant+Home',
          'https://placehold.co/800x500/7a4a2e/f8f5f0?text=Restaurant+Menu'
        ]
      },
      {
        title: 'Real Estate Portal',
        description: 'Property listing site with advanced search, maps, and agent portal.',
        images: [
          'https://placehold.co/800x500/4b2e2e/d4af37?text=Real+Estate+Home',
          'https://placehold.co/800x500/4b2e2e/f8f5f0?text=Property+Listings'
        ]
      }
    ];
    for (const p of projects) {
      await prisma.websiteProject.create({ data: p });
    }
    console.log('✅ Sample website projects created');
  }

  console.log('✅ Seeding complete!');
  console.log(`\n📧 Admin Login: ${adminEmail}`);
  console.log(`🔑 Admin Password: ${adminPassword}`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
