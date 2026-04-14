const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function check() {
  const prisma = new PrismaClient();
  try {
    const email = 'zanxatech@gmail.com';
    const password = 'Zanxatech@881935.#$*';
    
    console.log(`Checking admin for: ${email}`);
    const admin = await prisma.admin.findUnique({ where: { email } });
    
    if (!admin) {
      console.log('❌ ADMIN NOT FOUND IN DATABASE');
      return;
    }
    
    console.log('✅ Admin found in database.');
    const isValid = await bcrypt.compare(password, admin.passwordHash);
    
    if (isValid) {
      console.log('✅ PASSWORD COMPARISON: SUCCESS');
    } else {
      console.log('❌ PASSWORD COMPARISON: FAILED');
      console.log('Attempting to re-hash and save...');
      const newHash = await bcrypt.hash(password, 12);
      await prisma.admin.update({
        where: { email },
        data: { passwordHash: newHash }
      });
      console.log('✅ Password re-hashed and updated.');
    }
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
