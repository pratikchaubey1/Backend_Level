const express = require('express');
const { adminLogin } = require('../Controllers/AdminLogin');

const router = express.Router();

// POST /api/admin/login
router.post('/login', adminLogin);

module.exports = router;
