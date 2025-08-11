const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUser,
    updateUserRole,
    updateUserStatus,
    deleteUser
} = require('../controllers/userController');
const { protect, requireAdmin, requireSuperAdmin } = require('../middlewares/auth');

// All routes are protected
router.use(protect);

// Admin/SuperAdmin routes
router.get('/', requireAdmin, getAllUsers);
router.get('/:id', requireAdmin, getUser);
router.patch('/:id/role', requireAdmin, updateUserRole);
router.patch('/:id/status', requireAdmin, updateUserStatus);

// SuperAdmin only routes
router.delete('/:id', requireSuperAdmin, deleteUser);

module.exports = router;
