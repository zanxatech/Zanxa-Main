require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const enrollments = await prisma.courseEnrollment.findMany({
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { title: true, price: true } },
      payment: true
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  console.log(`\n📋 All recent enrollments (${enrollments.length}):\n`);
  enrollments.forEach(e => {
    console.log(`  User:    ${e.user.name} (${e.user.email})`);
    console.log(`  Course:  ${e.course.title} (₹${e.course.price})`);
    console.log(`  Status:  ${e.status}`);
    console.log(`  Payment: ${e.payment ? `Status=${e.payment.status}, Amount=₹${e.payment.amount}, RZP=${e.payment.razorpayPaymentId || 'none'}` : 'NO PAYMENT RECORD'}`);
    console.log(`  ID:      ${e.id}\n`);
  });

  // Also fix: approve any enrollment where payment.razorpayPaymentId is set (means payment actually went through even if status not PAID in DB)
  const toFix = enrollments.filter(e => 
    e.payment?.razorpayPaymentId && 
    e.status !== 'APPROVED'
  );

  if (toFix.length > 0) {
    console.log(`\n🔧 Found ${toFix.length} enrollment(s) with confirmed Razorpay payment but not APPROVED. Fixing...\n`);
    for (const e of toFix) {
      await prisma.courseEnrollment.update({
        where: { id: e.id },
        data: { status: 'APPROVED', approvedAt: new Date() }
      });
      await prisma.payment.update({
        where: { id: e.payment.id },
        data: { status: 'PAID' }
      });
      console.log(`  ✅ Fixed: ${e.user.name} → ${e.course.title}`);
    }
  } else {
    console.log('ℹ️  No fixable enrolled-but-locked states detected via payment ID check.');
    console.log('→ If payment was taken by Razorpay but nothing shows above, check Razorpay dashboard for the payment ID and run: node scripts/manual-approve.js <enrollmentId>');
  }

  await prisma.$disconnect();
}

run().catch(e => { console.error('❌', e.message); prisma.$disconnect(); });
