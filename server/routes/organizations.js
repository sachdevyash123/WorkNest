const express = require('express');
const router = express.Router();
const { protect, requireSuperAdmin, requireAdmin,requireHR } = require('../middlewares/auth');
const {
    createOrganization,
    getAllOrganizations,
    getOrganizationById,
    updateOrganization,
    deleteOrganization,
    getOrganizationMembers,
    updateMemberRole,
    inviteMember,
    getPendingInvites
} = require('../controllers/organizationController');
const upload = require('../middlewares/upload');

// Superadmin routes
router.post('/', protect, requireSuperAdmin,upload.single('logo'), createOrganization);
router.get('/', protect, requireSuperAdmin, getAllOrganizations);
router.delete('/:id', protect, requireSuperAdmin, deleteOrganization);

// Organization management routes (admin/superadmin)
router.get('/:id', protect, getOrganizationById);
router.patch('/:id', protect, requireAdmin,upload.single('logo'), updateOrganization);
router.get('/:id/members', protect, getOrganizationMembers);
router.patch('/:id/member/:userId/role', protect, requireAdmin, updateMemberRole);

// Invite management routes (admin/superadmin)
router.post('/:id/invite', protect, requireAdmin, inviteMember);
router.get('/:id/invites', protect, requireAdmin, getPendingInvites);

module.exports = router;
