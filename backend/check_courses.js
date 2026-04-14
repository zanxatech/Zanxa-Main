const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const courses = await prisma.course.findMany();
  console.log('Courses in DB:', JSON.stringify(courses, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
