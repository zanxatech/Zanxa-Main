const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const categories = await prisma.templateCategory.findMany({
      include: { _count: { select: { folders: true } } }
    });
    console.log('Categories in DB:', JSON.stringify(categories, null, 2));
    
    const folders = await prisma.templateFolder.findMany();
    console.log('Folders in DB:', folders.length);
  } catch (e) {
    console.error('DB Check failed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
