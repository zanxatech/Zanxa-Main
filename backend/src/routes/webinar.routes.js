const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { createMeeting, joinMeeting, endMeeting, getMeetingHistory, getMeeting, getAllMeetings } = require('../controllers/webinar.controller');
const { requireAdmin } = require('../middleware/auth.middleware');

router.post('/create', authenticate, createMeeting);
router.post('/join', authenticate, joinMeeting);
router.patch('/:code/end', authenticate, endMeeting);
router.get('/history/me', authenticate, getMeetingHistory);
router.get('/admin/all', authenticate, requireAdmin, getAllMeetings);
router.get('/:code', getMeeting);

module.exports = router;
