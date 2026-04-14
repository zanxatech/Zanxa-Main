const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
  const prisma = new PrismaClient();
  try {
    const email = 'zanxatech@gmail.com';
    const pass = 'Zanxatech@881935.#$*';
    const hash = await bcrypt.hash(pass, 12);
    
    const admin = await prisma.admin.upsert({
      where: { email },
      update: {
        passwordHash: hash,
        name: 'Super Admin'
      },
      create: {
        email,
        passwordHash: hash,
        name: 'Super Admin'
      }
    });
    
    console.log('--- ADMIN SYNCHRONIZATION SUCCESSFUL ---');
    console.log(`Email: ${admin.email}`);
    console.log('Role: ADMIN');
    console.log('----------------------------------------');
  } catch (err) {
    console.error('Error synchronizing admin:', err);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();
