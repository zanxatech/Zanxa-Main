const router = require('express').Router();
const { socialLogin } = require('../controllers/auth.controller');

router.post('/login', socialLogin);

module.exports = router;
