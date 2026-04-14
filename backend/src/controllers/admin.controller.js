const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError } = require('../utils/helpers');

const prisma = new PrismaClient();

// ─── DASHBOARD STATS (Real-time) ──────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    totalUsers, totalEmployees, totalOrders, 
    pendingApprovals, totalMeetings,
    dailyRevenue, monthlyRevenue, yearlyRevenue,
    recentOrders
  ] = await Promise.all([
    prisma.user.count(),
    prisma.employee.count(),
    prisma.order.count(),
    prisma.approval.count({ where: { status: 'PENDING' } }),
    prisma.meeting.count(),

    prisma.payment.aggregate({ where: { status: 'PAID', createdAt: { gte: startOfDay } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'PAID', createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'PAID', createdAt: { gte: startOfYear } }, _sum: { amount: true } }),

    prisma.order.findMany({
      take: 10,
      include: { user: { select: { name: true, email: true } }, payment: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  res.json({
    stats: {
      totalUsers, 
      totalEmployees, 
      totalOrders, 
      pendingApprovals, 
      totalMeetings,
      revenue: {
        daily: dailyRevenue._sum.amount || 0,
        monthly: monthlyRevenue._sum.amount || 0,
        yearly: yearlyRevenue._sum.amount || 0
      }
    },
    recentOrders
  });
});

// ─── REVENUE CHART DATA ───────────────────────────────────────────────────────
const getRevenueChart = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const payments = await prisma.payment.findMany({
    where: {
      status: 'PAID',
      createdAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) }
    },
    select: { amount: true, createdAt: true }
  });

  const months = Array.from({ length: 12 }, (_, i) => ({
    month: new Date(year, i, 1).toLocaleString('en', { month: 'short' }),
    revenue: 0
  }));

  payments.forEach(p => {
    const m = new Date(p.createdAt).getMonth();
    months[m].revenue += p.amount;
  });

  res.json({ chart: months });
});

// ─── ORDER MANAGEMENT ─────────────────────────────────────────────────────────
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      user: { select: { name: true, email: true } },
      employee: { select: { name: true, email: true } },
      payment: true,
      templateFolder: { include: { category: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ orders });
});

// ─── ASSIGN EMPLOYEE TO ORDER ─────────────────────────────────────────────────
const assignOrder = asyncHandler(async (req, res) => {
  const { orderId, employeeId } = req.body;
  if (!orderId || !employeeId) throw AppError('orderId and employeeId required', 400);

  const order = await prisma.order.update({
    where: { id: orderId },
    data: { 
      employeeId,
      status: 'PROCESSING'
    }
  });

  res.json({ message: 'Order assigned to employee', order });
});

// ─── USER & EMPLOYEE VIEWS ────────────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ users });
});

const getAllEmployees = asyncHandler(async (req, res) => {
  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.json({ employees });
});

module.exports = {
  getDashboardStats,
  getRevenueChart,
  getAllOrders,
  assignOrder,
  getAllUsers,
  getAllEmployees
};
