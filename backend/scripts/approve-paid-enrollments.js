/**
 * One-time fix: Approve all enrollments that have been paid but stuck in WAITING_APPROVAL
 * Run: node scripts/approve-paid-enrollments.js
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('🔍 Finding paid enrollments stuck in WAITING_APPROVAL...');

  // Find all enrollments that have a paid payment but are still WAITING_APPROVAL
  const stuckEnrollments = await prisma.courseEnrollment.findMany({
    where: {
      status: { in: ['WAITING_APPROVAL', 'PAYMENT_SUBMITTED', 'PENDING_PAYMENT'] },
      payment: { status: 'PAID' }
    },
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { title: true } },
      payment: { select: { amount: true, razorpayPaymentId: true } }
    }
  });

  if (stuckEnrollments.length === 0) {
    console.log('✅ No stuck enrollments found.');
    await prisma.$disconnect();
    return;
  }

  console.log(`\n⚠️  Found ${stuckEnrollments.length} stuck enrollment(s):\n`);
  stuckEnrollments.forEach(e => {
    console.log(`  - ${e.user.name} (${e.user.email}) → ${e.course.title}`);
    console.log(`    Payment: ₹${e.payment.amount} | RZP ID: ${e.payment.razorpayPaymentId || 'N/A'}`);
    console.log(`    Status: ${e.status} → will become APPROVED\n`);
  });

  // Auto-approve all of them
  const ids = stuckEnrollments.map(e => e.id);
  const result = await prisma.courseEnrollment.updateMany({
    where: { id: { in: ids } },
    data: { status: 'APPROVED', approvedAt: new Date() }
  });

  console.log(`✅ Approved ${result.count} enrollment(s). Users now have full course access.`);
  await prisma.$disconnect();
}

run().catch(e => {
  console.error('❌ Error:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
