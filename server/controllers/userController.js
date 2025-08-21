const User = require('../models/User');
const Organization = require('../models/Organization');

// @desc    Create a new user (Admin/SuperAdmin only)
// @route   POST /api/users
// @access  Private (Admin/SuperAdmin)
const createUser = async (req, res) => {
    try {
        const { fullName, email, password, role = 'employee', organizationId, isActive = true } = req.body;

        // Get the current user (who is creating the user) from the request
        const currentUserId = req.user?.id || req.user?._id;
        
        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Current user not found.'
            });
        }

        // Only Admin and SuperAdmin can create
        if (!['admin', 'superadmin','hr'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to create users'
            });
        }

         // HR users have restrictions on role assignment
         if (req.user.role === 'hr') {
            // HR can only create employees and other HR users
            const allowedRoles = ['employee', 'hr'];
            if (role && !allowedRoles.includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: 'HR users can only create Employee and HR roles'
                });
            }
        }

        // Validate required fields
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Determine organization
        let orgToAssign = null;
        if (req.user.role === 'admin' || req.user.role === 'hr') {
            // Admin and HR can only create within their own org
            orgToAssign = req.user.organization;
        } else if (req.user.role === 'superadmin' && organizationId) {
            // Superadmin can assign to any org
            const org = await Organization.findById(organizationId);
            if (!org) {
                return res.status(404).json({
                    success: false,
                    message: 'Organization not found'
                });
            }
            orgToAssign = org._id;
        }

        // Create user with audit fields
        const user = new User({
            fullName,
            email,
            password,
            role,
            status: isActive ? 'active' : 'inactive',
            organization: orgToAssign,
            created_by: currentUserId, // ADDED: Track who created this user
            updated_by: currentUserId, // ADDED: Track who last updated this user
            isActive: isActive,
            isDeleted: false // Explicitly set default values
        });

        await user.save();

        // If user is assigned to an organization, add them to the organization's members
        if (orgToAssign) {
            try {
                const organization = await Organization.findById(orgToAssign);
                if (organization) {
                    // Check if user is not already a member
                    const existingMember = organization.members.find(
                        member => member.user.toString() === user._id.toString()
                    );
                    
                    if (!existingMember) {
                        organization.members.push({
                            user: user._id,
                            role: role, // Use the role assigned to the user
                            joinedAt: new Date(),
                            isActive: true
                        });
                        
                        // Update organization audit fields
                        organization.updated_by = currentUserId;
                        await organization.save();
                    }
                }
            } catch (orgError) {
                console.error('Error adding user to organization members:', orgError);
                // Don't fail the user creation, just log the error
            }
        }

        // Populate the created_by and updated_by fields for response
        await user.populate([
            { path: 'organization', select: 'name' },
            { path: 'created_by', select: 'fullName email' },
            { path: 'updated_by', select: 'fullName email' }
        ]);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                status: user.status,
                isActive: user.isActive,
                organization: user.organization,
                created_by: user.created_by,
                updated_by: user.updated_by,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        
        // Enhanced error handling for validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get all users (Admin/SuperAdmin)
// @route   GET /api/users
// @access  Private
const getAllUsers = async (req, res) => {
    try {
        // Only get users that are not deleted
        const users = await User.find({ isDeleted: false })
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .populate('organization', 'name email logo');

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
// @access  Private
const getUser = async (req, res) => {
    try {
        // Only get user if not deleted
        const user = await User.findOne({ 
            _id: req.params.id, 
            isDeleted: false 
        })
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .populate('organization', 'name email logo');

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
        res.status(500).json({
            success: false,
            message: 'Error fetching user'
        });
    }
};

// @desc    Update user (Admin/SuperAdmin only)
// @route   PUT /api/users/:id
// @access  Private (Admin/SuperAdmin)
const updateUser = async (req, res) => {
    try {
        const { fullName, email, password, role, isActive } = req.body;
        const userId = req.params.id;

        // Get the current user (who is updating) from the request
        const currentUserId = req.user?.id || req.user?._id;
        
        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. Current user not found.'
            });
        }

        // Only HR,Admin,SuperAdmin can update users
        if (!['admin', 'superadmin','hr'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update users'
            });
        }

        // Find the user to update
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if admin is trying to update user from different organization
        if (req.user.role === 'admin' || req.user.role==='hr') {
            if (user.organization?.toString() !== req.user.organization?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Admin can only update users within their own organization'
                });
            }
        }

        // Validate role change permissions
        if (role && role !== user.role) {
            const validRoles = ['employee', 'hr', 'admin', 'superadmin'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role specified'
                });
            }
             // HR users have restrictions on role assignment
             if (req.user.role === 'hr') {
                const allowedRoles = ['employee', 'hr'];
                if (!allowedRoles.includes(role)) {
                    return res.status(403).json({
                        success: false,
                        message: 'HR users can only assign Employee and HR roles'
                    });
                }
            }

            // Only superadmin can promote to superadmin
            if (role === 'superadmin' && req.user.role !== 'superadmin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only superadmin can promote users to superadmin role'
                });
            }
           // Only admin and superadmin can promote to admin
           if (role === 'admin' && !['admin', 'superadmin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Only admin and superadmin can promote users to admin role'
            });
        } 
    }

        // Validate status
        if (isActive && ![true, false].includes(isActive)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be either active or inactive'
            });
        }

        // Check if email already exists (if email is being changed)
        if (email && email !== user.email) {
            const existingUser = await User.findOne({ 
                email, 
                _id: { $ne: userId } 
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        // Update user fields
        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (password) user.password = password; // This will be hashed by the pre-save middleware
        if (role) user.role = role;
        if (isActive===true || isActive===false) {
            user.isActive = isActive};

        // Update audit fields
        user.updated_by = currentUserId;

        // Save the updated user
        await user.save();

        // Update organization member role if role changed
        if (role && role !== user.role && user.organization) {
            try {
                const organization = await Organization.findById(user.organization);
                if (organization) {
                    const memberIndex = organization.members.findIndex(
                        member => member.user.toString() === userId.toString()
                    );
                    
                    if (memberIndex !== -1) {
                        organization.members[memberIndex].role = role;
                        organization.updated_by = currentUserId;
                        await organization.save();
                    }
                }
            } catch (orgError) {
                console.error('Error updating organization member role:', orgError);
                // Don't fail the user update, just log the error
            }
        }

        // Populate the response data
        await user.populate([
            { path: 'organization', select: 'name' },
            { path: 'created_by', select: 'fullName email' },
            { path: 'updated_by', select: 'fullName email' }
        ]);
        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                organization: user.organization,
                created_by: user.created_by,
                updated_by: user.updated_by,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
        
    } catch (error) {
        console.error('Update user error:', error);
        
        // Enhanced error handling for validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: validationErrors
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error updating user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Update user role
// @route   PATCH /api/users/:id/role
// @access  Private (Admin/SuperAdmin)
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['employee', 'hr', 'admin', 'superadmin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role'
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (role === 'superadmin' && req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Only superadmin can promote to superadmin'
            });
        }

        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: 'User role updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating role'
        });
    }
};

// @desc    Update profile
// @route   PATCH /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const { fullName, avatarUrl } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (fullName) user.fullName = fullName;
        if (avatarUrl) user.avatarUrl = avatarUrl;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated',
            data: user
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
};

// @desc    Join organization
// @route   POST /api/users/join-organization
// @access  Private
const joinOrganization = async (req, res) => {
    try {
        const { organizationId, role = 'employee' } = req.body;

        if (!organizationId) {
            return res.status(400).json({
                success: false,
                message: 'Organization ID is required'
            });
        }

        const organization = await Organization.findById(organizationId);
        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        const user = await User.findById(req.user._id);
        if (user.organization) {
            return res.status(400).json({
                success: false,
                message: 'User already belongs to an organization'
            });
        }

        user.organization = organizationId;
        user.role = role;
        await user.save();

        res.json({
            success: true,
            message: 'Joined organization successfully',
            data: user
        });
    } catch (error) {
        console.error('Join organization error:', error);
        res.status(500).json({
            success: false,
            message: 'Error joining organization'
        });
    }
};
// @desc    Get logged-in user profile
// @route   GET /api/users/profile/me
// @access  Private
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password -resetPasswordToken -resetPasswordExpires')
            .populate('organization', 'name email logo');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Error fetching profile' });
    }
};

// @desc    Update user status
// @route   PATCH /api/users/:id/status
// @access  Private (Admin/SuperAdmin)
const updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['active', 'inactive'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.status = status;
        await user.save();

        res.json({ success: true, message: 'User status updated successfully', data: user });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({ success: false, message: 'Error updating status' });
    }
};
// @desc    Delete user (Soft Delete)
// @route   DELETE /api/users/:id
// @access  Private (SuperAdmin)
const deleteUser = async (req, res) => {
    try {
        // Allow Admin, HR, and SuperAdmin to delete users
        if (!['admin', 'hr', 'superadmin'].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete users'
            });
        }
        // Check if user exists and is not already deleted
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if user is already soft deleted
        if (user.isDeleted) {
            return res.status(400).json({ 
                success: false, 
                message: 'User is already deleted' 
            });
        }
        // Prevent users from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }
        // Admin and HR can only delete users from their own organization
        if (req.user.role === 'admin' || req.user.role === 'hr') {
            if (user.organization?.toString() !== req.user.organization?.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete users within your own organization'
                });
            }
        }
         // HR users cannot delete admin users
         if (req.user.role === 'hr' && ['admin', 'superadmin'].includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'HR users cannot delete Admin or SuperAdmin users'
            });
        }

        // Perform soft delete
        const deletedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
                isDeleted: true,
                deleted_at: new Date(),
                deleted_by: req.user._id, // Assuming req.user contains authenticated user info
                isActive: false // Also set user as inactive
            },
            { 
                new: true,
                runValidators: true 
            }
        );
         // 2. Remove user from all organizations where they are a member
         const memberUpdateResult = await Organization.updateMany(
            { 'members.user': req.params.id },
            { $pull: { members: { user: req.params.id } } }
        );
         // 3. Handle organizations where this user is the owner
         const ownedOrganizations = await Organization.find({ 
            owner: req.params.id 
        });

        let ownershipTransfers = 0;
        let organizationsDeactivated = 0;

        for (const org of ownedOrganizations) {
            // Try to find another admin to transfer ownership to
            const potentialNewOwner = await Organization.findById(org._id)
                .populate({
                    path: 'members.user',
                    match: { 
                        isDeleted: { $ne: true },
                        isActive: true 
                    }
                });

            // Find an admin member to transfer ownership to
            const adminMember = potentialNewOwner.members.find(member => 
                member.user && 
                member.user.role === 'admin' &&
                member.user._id.toString() !== req.params.id
            );

            if (adminMember) {
                // Transfer ownership to the admin
                await Organization.findByIdAndUpdate(
                    org._id,
                    { owner: adminMember.user._id }
                );
                ownershipTransfers++;
            } else {
                // No admin available, mark organization as inactive
                await Organization.findByIdAndUpdate(
                    org._id,
                    { 
                        status: 'Inactive',
                        owner: null
                    }
                );
                organizationsDeactivated++;
            }
        }

        // Optional: Remove sensitive data from response
        const { password, ...userResponse } = deletedUser.toObject();
        
        // Create response message
        let message = 'User deleted successfully';
        if (memberUpdateResult.modifiedCount > 0) {
            message += `. Removed from ${memberUpdateResult.modifiedCount} organizations`;
        }
        if (ownershipTransfers > 0) {
            message += `. Transferred ownership of ${ownershipTransfers} organizations`;
        }
        if (organizationsDeactivated > 0) {
            message += `. Deactivated ${organizationsDeactivated} organizations (no admin available)`;
        }

        res.json({ 
            success: true, 
            message: message,
            data: userResponse,
            affected:{
                organizationsRemoved: memberUpdateResult.modifiedCount,
                ownershipTransfers,
                organizationsDeactivated
            }
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error deleting user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
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
};
