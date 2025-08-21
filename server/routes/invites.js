const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middlewares/auth');
const {
    validateInvite,
    acceptInvite,
    getOrganizationInvites,
    cancelInvite
} = require('../controllers/inviteController');

// Public routes (no authentication required)
router.get('/validate/:token', validateInvite);
router.post('/accept/:token', acceptInvite);

// Protected routes (require authentication)
router.get('/organization/:organizationId', protect, requireAdmin, getOrganizationInvites);
router.delete('/:inviteId', protect, requireAdmin, cancelInvite);

module.exports = router;
