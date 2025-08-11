const express = require('express');
const router = express.Router();
const {
    register,
    login,
    getMe,
    logout,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
// Make logout public so it can clear cookie even when token is invalid/expired
router.post('/logout', logout);

module.exports = router;
