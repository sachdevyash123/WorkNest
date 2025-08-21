const express=require('express')
const router=express.Router();
const {protect,requireAdmin,requireAdminOrHR}=require('../middlewares/auth');
const {
    getUserOrganization,
    getUserOrganizationMembers,
    updateOrganization,
    inviteMember,
    getPendingInvites
} = require('../controllers/organizationController');
const upload = require('../middlewares/upload');

// ============================================
// ORGANIZATION SETTINGS ROUTES
// These routes are for users to manage their own organization
// ============================================

/**
 * @desc    Get user's organization details
 * @route   GET /api/organization-settings
 * @access  Private (Admin, HR, Employee)
 */
router.get('/', protect,requireAdminOrHR, getUserOrganization);

/**
 * @desc    Get user's organization members
 * @route   GET /api/organization-settings/members
 * @access  Private (Admin, HR, Employee)
 */
router.get('/members', protect,requireAdminOrHR, getUserOrganizationMembers);

/**
 * @desc    Update user's organization
 * @route   PATCH /api/organization-settings
 * @access  Private (Admin only)
 */
router.patch('/', protect, requireAdmin, upload.single('logo'), updateOrganization);

/**
 * @desc    Invite member to user's organization
 * @route   POST /api/organization-settings/invite
 * @access  Private (Admin only)
 */
router.post('/invite', protect, requireAdminOrHR, inviteMember);

/**
 * @desc    Get pending invites for user's organization
 * @route   GET /api/organization-settings/invites
 * @access  Private (Admin only)
 */
router.get('/invites', protect, requireAdminOrHR, getPendingInvites);

module.exports = router;