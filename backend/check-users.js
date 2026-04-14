const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({ take: 5 });
  console.log('Users:', users.map(u => ({ id: u.id, email: u.email, verified: u.isEmailVerified })));
  
  const admins = await prisma.admin.findMany();
  console.log('Admins:', admins.map(a => ({ id: a.id, email: a.email })));

  const employees = await prisma.employee.findMany();
  console.log('Employees:', employees.map(e => ({ id: e.id, email: e.email, status: e.status })));
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
