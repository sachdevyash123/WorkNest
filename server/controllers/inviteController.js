const Invite = require('../models/Invite');
const User = require('../models/User');
const Organization = require('../models/Organization');

// @desc    Validate invite token
// @route   GET /api/invites/validate/:token
// @access  Public
const validateInvite = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Invite token is required'
            });
        }

        // Find valid invite by token
        const invite = await Invite.findValidByToken(token);

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired invitation'
            });
        }

        // Check if user already exists with this email
        const existingUser = await User.findOne({ email: invite.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        res.json({
            success: true,
            data: {
                email: invite.email,
                role: invite.role,
                organization: invite.organization
            }
        });
    } catch (error) {
        console.error('Validate invite error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate invitation'
        });
    }
};

// @desc    Accept invite and create user account
// @route   POST /api/invites/accept/:token
// @access  Public
const acceptInvite = async (req, res) => {
    try {
        const { token } = req.params;
        const { fullName, password } = req.body;

        if (!fullName || !password) {
            return res.status(400).json({
                success: false,
                message: 'Full name and password are required'
            });
        }

        // Find valid invite by token
        const invite = await Invite.findValidByToken(token);

        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired invitation'
            });
        }

        // Check if user already exists with this email
        const existingUser = await User.findOne({ email: invite.email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const user = new User({
            fullName,
            email: invite.email,
            password,
            role: invite.role || 'Employee',
            organization: invite.organization._id
        });

        await user.save();

        // Mark invite as accepted
        invite.markAccepted(user._id);
        await invite.save();

        // Add user to organization members
        const organization = await Organization.findById(invite.organization._id);
        if (organization) {
            const memberExists = organization.members.some(
                member => member.user.toString() === user._id.toString()
            );

            if (!memberExists) {
                organization.members.push({
                    user: user._id,
                    role: invite.role || 'Employee',
                    joinedAt: new Date()
                });
                await organization.save();
            }
        }

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                user: {
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        console.error('Accept invite error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to accept invitation'
        });
    }
};

// @desc    Get pending invites for an organization
// @route   GET /api/invites/organization/:organizationId
// @access  Private (Organization admin or superadmin)
const getOrganizationInvites = async (req, res) => {
    try {
        const { organizationId } = req.params;

        const invites = await Invite.findPendingByOrganization(organizationId);

        res.json({
            success: true,
            count: invites.length,
            data: invites
        });
    } catch (error) {
        console.error('Get organization invites error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch organization invites'
        });
    }
};

// @desc    Cancel/delete an invite
// @route   DELETE /api/invites/:inviteId
// @access  Private (Organization admin or superadmin)
const cancelInvite = async (req, res) => {
    try {
        const { inviteId } = req.params;

        const invite = await Invite.findById(inviteId);
        if (!invite) {
            return res.status(404).json({
                success: false,
                message: 'Invite not found'
            });
        }

        // TODO: Add role-based permission check before allowing cancellation

        await Invite.findByIdAndDelete(inviteId);

        res.json({
            success: true,
            message: 'Invite cancelled successfully'
        });
    } catch (error) {
        console.error('Cancel invite error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel invite'
        });
    }
};

module.exports = {
    validateInvite,
    acceptInvite,
    getOrganizationInvites,
    cancelInvite
};
