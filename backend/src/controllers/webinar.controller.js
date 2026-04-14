const { PrismaClient } = require('@prisma/client');
const { asyncHandler, AppError, generateMeetingCode } = require('../utils/helpers');

const prisma = new PrismaClient();

// ─── CREATE MEETING ───────────────────────────────────────────────────────────
const createMeeting = asyncHandler(async (req, res) => {
  const { title, password } = req.body;
  const meetingCode = generateMeetingCode();

  const meeting = await prisma.meeting.create({
    data: {
      meetingCode,
      title: title || 'Zanxa Tech Meeting',
      password: password || null,
      hostId: req.user.id,
      isActive: true
    },
    include: { host: { select: { id: true, name: true, email: true } } }
  });

  const meetingLink = `${process.env.FRONTEND_URL}/services/webinars/room/${meetingCode}`;
  res.status(201).json({ message: 'Meeting created', meeting, meetingLink });
});

// ─── JOIN MEETING ─────────────────────────────────────────────────────────────
const joinMeeting = asyncHandler(async (req, res) => {
  const { meetingCode, password } = req.body;
  if (!meetingCode) throw AppError('Meeting code required', 400);

  const meeting = await prisma.meeting.findUnique({
    where: { meetingCode },
    include: { host: { select: { id: true, name: true } } }
  });

  if (!meeting) throw AppError('Meeting not found', 404);
  if (!meeting.isActive) throw AppError('Meeting has ended', 400);
  if (meeting.password && meeting.password !== password)
    throw AppError('Invalid meeting password', 401);

  // Record attendee
  const existing = await prisma.meetingAttendee.findFirst({
    where: { meetingId: meeting.id, userId: req.user.id, leftAt: null }
  });

  if (!existing) {
    await prisma.meetingAttendee.create({
      data: { meetingId: meeting.id, userId: req.user.id }
    });
  }

  res.json({ message: 'Joined meeting', meeting });
});

// ─── END MEETING (host only) ──────────────────────────────────────────────────
const endMeeting = asyncHandler(async (req, res) => {
  const meeting = await prisma.meeting.findUnique({ where: { meetingCode: req.params.code } });
  if (!meeting) throw AppError('Meeting not found', 404);
  if (meeting.hostId !== req.user.id && req.user.role !== 'ADMIN')
    throw AppError('Only the host can end this meeting', 403);

  await prisma.meeting.update({
    where: { id: meeting.id },
    data: { isActive: false, endedAt: new Date() }
  });

  // Mark all attendees as left
  await prisma.meetingAttendee.updateMany({
    where: { meetingId: meeting.id, leftAt: null },
    data: { leftAt: new Date() }
  });

  res.json({ message: 'Meeting ended' });
});

// ─── GET MEETING HISTORY ──────────────────────────────────────────────────────
const getMeetingHistory = asyncHandler(async (req, res) => {
  const meetings = await prisma.meeting.findMany({
    where: { hostId: req.user.id },
    include: {
      host: { select: { id: true, name: true } },
      _count: { select: { attendees: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ meetings });
});

// ─── GET MEETING INFO ─────────────────────────────────────────────────────────
const getMeeting = asyncHandler(async (req, res) => {
  const meeting = await prisma.meeting.findUnique({
    where: { meetingCode: req.params.code },
    include: {
      host: { select: { id: true, name: true } },
      attendees: { include: { user: { select: { id: true, name: true } } } }
    }
  });
  if (!meeting) throw AppError('Meeting not found', 404);
  res.json({ meeting });
});

// ─── GET ALL MEETINGS (Admin) ─────────────────────────────────────────────────
const getAllMeetings = asyncHandler(async (req, res) => {
  const meetings = await prisma.meeting.findMany({
    include: {
      host: { select: { id: true, name: true, email: true } },
      _count: { select: { attendees: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json({ meetings });
});

module.exports = { createMeeting, joinMeeting, endMeeting, getMeetingHistory, getMeeting, getAllMeetings };
