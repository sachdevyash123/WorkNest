const User = require('../models/User');

// @desc    Get all users (for admin/superadmin)
// @route   GET /api/users
// @access  Private (Admin/SuperAdmin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password -resetPasswordToken -resetPasswordExpires');

        res.json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin/SuperAdmin)
const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpires');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);

        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error fetching user'
        });
    }
};

// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  Private (SuperAdmin/Admin)
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const { id } = req.params;

        // Validate role
        const validRoles = ['employee', 'hr', 'admin', 'superadmin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be one of: employee, hr, admin, superadmin'
            });
        }

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is trying to update their own role
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot update your own role'
            });
        }

        // Check permissions
        // Only superadmin can promote to superadmin
        if (role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can promote users to superadmin role'
            });
        }

        // Admin can promote to admin, but superadmin can promote to any role
        if (role === 'admin' && req.user.role === 'admin' && user.role === 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Admin cannot modify superadmin roles'
            });
        }

        // Update role
        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: 'User role updated successfully',
            data: user.toJSON()
        });
    } catch (error) {
        console.error('Update user role error:', error);

        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating user role'
        });
    }
};

// @desc    Deactivate/Activate user
// @route   PATCH /api/users/:id/status
// @access  Private (SuperAdmin/Admin)
const updateUserStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        const { id } = req.params;

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is trying to deactivate themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot deactivate your own account'
            });
        }

        // Check permissions for superadmin
        if (user.role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can modify superadmin accounts'
            });
        }

        // Update status
        user.isActive = isActive;
        await user.save();

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: user.toJSON()
        });
    } catch (error) {
        console.error('Update user status error:', error);

        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating user status'
        });
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (SuperAdmin)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Find user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is trying to delete themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Only superadmin can delete users
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can delete users'
            });
        }

        // Delete user
        await User.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);

        if (error.kind === 'ObjectId') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
};

module.exports = {
    getAllUsers,
    getUser,
    updateUserRole,
    updateUserStatus,
    deleteUser
};
