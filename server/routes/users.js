const express = require('express');
const router = express.Router();
const {
    createUser,
    getAllUsers,
    getUser,
    updateUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
    getProfile,
    updateProfile,
    joinOrganization
} = require('../controllers/userController');
const { protect, requireAdmin, requireSuperAdmin,requireHR } = require('../middlewares/auth');

// All routes are protected
router.use(protect);

// User profile routes (any authenticated user)
router.get('/profile/me', getProfile);
router.patch('/profile/me', updateProfile);
router.post('/profile/join-organization', joinOrganization);

// Admin/SuperAdmin/HR routes
router.post('/', requireHR, createUser);
router.get('/', requireAdmin, getAllUsers);
router.get('/:id', requireHR, getUser);
router.put('/:id', requireHR, updateUser);
router.patch('/:id/role', requireAdmin, updateUserRole);
router.patch('/:id/status', requireHR, updateUserStatus);

// SuperAdmin,admin and HR can delete  routes
router.delete('/:id', requireHR, deleteUser);

module.exports = router;
