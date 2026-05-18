
const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances during hot-reloading in development
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      errorFormat: 'minimal',
      log: ['error', 'warn'],
    });
  }
  prisma = global.prisma;
}

// Connection check
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err.message);
    console.log('💡 Tip: Make sure your PostgreSQL server is running at localhost:5432');
  });

module.exports = prisma;
