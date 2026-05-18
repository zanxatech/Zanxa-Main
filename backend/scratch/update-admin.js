require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  console.log(`Updating/Creating admin with email: ${email}`);

  const passwordHash = await bcrypt.hash(password, 12);

  // We'll update the first admin found, or create a new one if none exist.
  // Or better, just Upsert based on the new email.
  const admin = await prisma.admin.upsert({
    where: { email: email },
    update: {
      passwordHash: passwordHash,
      name: 'Zanxa Admin'
    },
    create: {
      email: email,
      passwordHash: passwordHash,
      name: 'Zanxa Admin'
    }
  });

  console.log('Admin updated successfully:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
