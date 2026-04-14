const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../utils/helpers');

const prisma = new PrismaClient();

/**
 * Get all pending approvals for Admin
 */
const getPendingApprovals = asyncHandler(async (req, res) => {
  const approvals = await prisma.approval.findMany({
    where: { status: 'PENDING' },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ approvals });
});

/**
 * Handle approval action (Approve/Reject)
 */
const handleApprovalAction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, remarks, pdfUrl } = req.body;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw AppError('Invalid status', 400);
  }

  const approval = await prisma.approval.findUnique({
    where: { id },
    include: { user: true }
  });

  if (!approval) throw AppError('Approval request not found', 404);

  const updatedApproval = await prisma.approval.update({
    where: { id },
    data: { 
      status,
      data: { ...(typeof approval.data === 'object' ? approval.data : {}), remarks, pdfUrl }
    }
  });

  // Business Logic based on Type
  if (status === 'APPROVED') {
    switch (approval.type) {
      case 'CERTIFICATE':
        // Update the certificate record
        const certId = approval.data?.certificateId;
        if (certId) {
          await prisma.certificate.update({
            where: { id: certId },
            data: { 
              status: 'APPROVED', 
              pdfUrl: pdfUrl || approval.data?.pdfUrl,
              issuedAt: new Date()
            }
          });
        }
        break;
      case 'EMPLOYEE_REGISTRATION':
        await prisma.employee.update({
          where: { email: approval.user.email },
          data: { status: 'APPROVED' }
        });
        break;
      case 'COURSE_PURCHASE':
        if (approval.data?.enrollmentId) {
          await prisma.courseEnrollment.update({
            where: { id: approval.data.enrollmentId },
            data: { status: 'APPROVED' }
          });
        }
        break;
      case 'ORDER':
        // Additional order logic if needed
        break;
    }
  }

  res.json({ message: `Request ${status.toLowerCase()} successfully`, approval: updatedApproval });
});

/**
 * Create a new approval request
 */
const createApprovalRequest = async ({ type, userId, data }) => {
  return await prisma.approval.create({
    data: { type, userId, data }
  });
};

module.exports = {
  getPendingApprovals,
  handleApprovalAction,
  createApprovalRequest
};
