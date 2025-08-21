const Organization = require('../models/Organization');
const User = require('../models/User');
const Invite = require('../models/Invite');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose')
const { sendOrganizationInviteEmail } = require('../utils/email');

/**
 * Utility: Check if user has organization access
 */
const hasOrgAccess = (org, user) => {
  console.log('=== Checking Organization Access ===');
  console.log('User ID:', user._id.toString());
  console.log('User Role:', user.role);
  console.log('User Organization:', user.organization);
  console.log('Organization ID:', org._id.toString());
  console.log('Organization Owner:', org.owner?.toString());
  console.log('Organization Members:', org.members?.map(m => ({
    userId: m.user?.toString(),
    role: m.role
  })));

  // Check if superadmin
  if (user.role === 'superadmin') {
    console.log('✅ Access granted: User is superadmin');
    return true;
  }

  // Check if organization owner
  if (org.owner && org.owner.toString() === user._id.toString()) {
    console.log('✅ Access granted: User is organization owner');
    return true;
  }

  // Check if user is a member of the organization
  if (org.members && org.members.some(m => m.user && m.user.toString() === user._id.toString())) {
    console.log('✅ Access granted: User is organization member');
    return true;
  }

  // Additional check: If user.organization matches the org ID
  if (user.organization && user.organization.toString() === org._id.toString()) {
    console.log('✅ Access granted: User belongs to this organization (via user.organization field)');
    return true;
  }

  console.log('❌ Access denied: User has no access to this organization');
  return false;
};
// const hasOrgAccess = (org, user) => {
//   console.log("User access:",user)

//   return (
//     user.role === 'superadmin' ||
//     org.owner.toString() === user._id.toString() ||
//     org.members.some(m => m.user.toString() === user._id.toString())
//   );
// };

/**
 * Utility: Check if user can manage org
 */
const canManageOrg = (org, user) => {
  return user.role === 'superadmin' || org.owner.toString() === user._id.toString();
};

/**
 * @desc    Create new organization
 * @route   POST /api/organizations
 * @access  Private (SuperAdmin)
 */
const createOrganization = async (req, res) => {
  try {   
    const { name, description, email, phone, address, website, industry, size, status = 'active', owner } = req.body;

    // Get the current user (who is creating the organization) from the request
    // This should be set by your authentication middleware
    const currentUserId = req.user?.id || req.user?._id;

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Current user not found.'
      });
    }

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Organization name is required',
        debug: { receivedName: name, nameType: typeof name }
      });
    }

    if (!owner) {
      return res.status(400).json({
        success: false,
        message: 'Owner ID is required'
      });
    }

    // Validate email is provided (required in schema)
    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Organization email is required'
      });
    }

    // Verify owner exists and is valid
    const ownerUser = await User.findById(owner);
    if (!ownerUser) {
      return res.status(404).json({
        success: false,
        message: 'Owner user not found'
      });
    }

    // Check if owner is already part of another organization (optional business rule)
    if (ownerUser.organization) {
      return res.status(400).json({
        success: false,
        message: 'User already belongs to an organization'
      });
    }

    // Handle logo file if uploaded
    let logo = null;
    if (req.file) {
      // Construct the logo URL based on your file storage setup
      if (req.file.path) {
        // If using local storage with path
        logo = req.file.path.replace(/\\/g, '/'); // Replace backslashes with forward slashes
      } else if (req.file.filename) {
        // If using local storage with filename
        logo = `/uploads/${req.file.filename}`;
      } else if (req.file.location) {
        // If using cloud storage like AWS S3
        logo = req.file.location;
      }
     
    }

    // Create organization data with required audit fields
    const organizationData = {
      name,
      email, // Required field
      owner: owner,
      created_by: currentUserId, // FIXED: Added required field
      updated_by: currentUserId, // FIXED: Added required field
      ...(description && { description }),
      ...(phone && { phone }),
      ...(address && { address }),
      ...(website && { website }),
      ...(industry && { industry }),
      ...(size && { size: parseInt(size) }),
      ...(status && { status }),
      ...(logo && { logo })
    };

    const organization = await Organization.create(organizationData);
    // Update owner user with organization reference and ensure admin role
    ownerUser.organization = organization._id;
    ownerUser.role = 'admin'; // Ensure owner has admin role
    await ownerUser.save();

    // Populate owner details for response
    await organization.populate([
      { path: 'owner', select: 'fullName email role' },
      { path: 'created_by', select: 'fullName email' },
      { path: 'updated_by', select: 'fullName email' }
    ]);

    res.status(201).json({
      success: true,
      data: organization,
      message: 'Organization created successfully'
    });
  } catch (error) {
    console.error('Create organization error:', error);

    // Enhanced error logging
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors,
        details: error.errors // Include detailed error info
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create organization',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * @desc    Get all organizations (Superadmin only)
 * @route   GET /api/organizations
 * @access  Private
 */
const getAllOrganizations = async (req, res) => {
  try {
    //Only superadmin can access all organizations
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only superadmin can view all organizations.'
      });
    }
    // Only get organizations that are not deleted (isDeleted: false)
    const organizations = await Organization.find({ isDeleted: false })
      .populate('owner', 'fullName email')
      .populate('members.user', 'fullName email role')
      .populate('created_by', 'fullName email')
      .populate('updated_by', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: organizations.length,
      data: organizations
    });
  } catch (error) {
    console.error('Get all organizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations'
    });
  }
};
//New 
/**
 * @desc    Get user's organization (for admin, hr, employee)
 * @route   GET /api/organization-settings
 * @access  Private (Admin, HR, Employee)
 */
const getUserOrganization = async (req, res) => {
  try {
    // Only non-superadmin users should access this endpoint
    if (req.user.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Superadmin should use /organizations endpoint'
      });
    }

    // Get user's organization
    if (!req.user.organization) {
      return res.status(404).json({
        success: false,
        message: 'No organization found for this user'
      });
    }

    const organization = await Organization.findOne({
      _id: req.user.organization,
      isDeleted: false
    })
      .populate('owner', 'fullName email')
      .populate('members.user', 'fullName email role')
      .populate('created_by', 'fullName email')
      .populate('updated_by', 'fullName email');

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Get user organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization'
    });
  }
};
//New
/**
 * @desc    Get user's organization members (for admin, hr, employee)
 * @route   GET /api/organization-settings/members
 * @access  Private (Admin, HR, Employee)
 */
const getUserOrganizationMembers = async (req, res) => {
  try {
    // Only non-superadmin users should access this endpoint
    if (req.user.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Superadmin should use /organizations endpoint'
      });
    }

    if (!req.user.organization) {
      return res.status(404).json({
        success: false,
        message: 'No organization found for this user'
      });
    }

    const organization = await Organization.findById(req.user.organization)
      .populate('owner', 'fullName email role')
      .populate('members.user', 'fullName email role isActive');

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.json({
      success: true,
      data: { owner: organization.owner, members: organization.members }
    });
  } catch (error) {
    console.error('Get user organization members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization members'
    });
  }
};
/**
 * @desc    Get organization by ID
 * @route   GET /api/organizations/:id
 * @access  Private
 */
const getOrganizationById = async (req, res) => {
  try {
    // Only get organization if it's not deleted (isDeleted: false)
    const organization = await Organization.findOne({
      _id: req.params.id,
      isDeleted: false
    })
      .populate('owner', 'fullName email')
      .populate('members.user', 'fullName email role')
      .populate('created_by', 'fullName email')
      .populate('updated_by', 'fullName email');

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    if (!hasOrgAccess(organization, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this organization'
      });
    }

    res.json({
      success: true,
      data: organization
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization'
    });
  }
};

/**
 * @desc    Update organization
 * @route   PATCH /api/organizations/:id OR PATCH /api/organization-settings
 * @access  Private
 */
const updateOrganization = async (req, res) => {
  try {
    const {
      name,
      description,
      email,
      phone,
      address,
      website,
      industry,
      size,
      status
    } = req.body;

    let organizationId;

    // Determine which organization to update based on the route and user role
    if (req.params.id) {
      // Route: /api/organizations/:id (for superadmin)
      organizationId = req.params.id;
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({
          success: false,
          message: 'Only superadmin can update organizations by ID'
        });
      }
    } else {
      // Route: /api/organization-settings (for admin/hr/employee)
      if (req.user.role === 'superadmin') {
        return res.status(400).json({
          success: false,
          message: 'Superadmin should use /organizations/:id endpoint'
        });
      }

      if (!req.user.organization) {
        return res.status(404).json({
          success: false,
          message: 'No organization found for this user'
        });
      }

      organizationId = req.user.organization;
    }

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      // Clean up uploaded file if organization not found
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check permissions
    let canUpdate = false;

    if (req.user.role === 'superadmin') {
      canUpdate = true;
    } else if (req.user.role === 'admin' && organization.owner.toString() === req.user._id.toString()) {
      canUpdate = true;
    } else if (req.user.role === 'admin' && req.user.organization && req.user.organization.toString() === organizationId.toString()) {
      canUpdate = true;
    }

    if (!canUpdate) {
      // Clean up uploaded file if no permission
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Only organization admin or superadmin can update organization'
      });
    }

    // Update fields if provided (only update if value is not empty string)
    if (name !== undefined && name.trim() !== '') organization.name = name;
    if (description !== undefined) organization.description = description;
    if (email !== undefined) organization.email = email;
    if (phone !== undefined) organization.phone = phone;
    if (address !== undefined) organization.address = address;
    if (website !== undefined) organization.website = website;
    if (industry !== undefined) organization.industry = industry;
    if (size !== undefined && size !== '') {
      organization.size = parseInt(size) || undefined;
    }
    if (status !== undefined) organization.status = status;

    // Handle logo upload
    if (req.file) {
      // Delete old logo file if exists
      if (organization.logo) {
        const oldLogoPath = path.join(__dirname, '../../', organization.logo);
        fs.unlink(oldLogoPath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Error deleting old logo:', err);
          }
        });
      }

      // Set new logo path (relative path for storage)
      organization.logo = req.file.path.replace(/\\/g, '/'); // Ensure forward slashes for URLs
    }

    organization.updated_by = req.user._id;
    await organization.save();

    res.json({
      success: true,
      data: organization,
      message: 'Organization updated successfully'
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }

    console.error('Update organization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update organization'
    });
  }
};

/**
 * @desc    Soft delete organization and all its users (Superadmin/Owner only)
 * @route   DELETE /api/organizations/:id
 * @access  Private
 */
const deleteOrganization = async (req, res) => {
  try {
    // Find organization that is not already deleted
    const organization = await Organization.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Check if user can manage this organization
    if (!canManageOrg(organization, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only owner or superadmin can delete organization'
      });
    }

    // Get current timestamp for consistent deletion time
    const deletionTime = new Date();
    const deleterId = req.user._id;

    try {
      // 1. First, soft delete all users belonging to this organization
      const userUpdateResult = await User.updateMany(
        {
          organization: organization._id,
          isDeleted: false
        },
        {
          $set: {
            isDeleted: true,
            deleted_by: deleterId,
            deleted_at: deletionTime,
            updated_by: deleterId
          }
        }
      );

      console.log(`Soft deleted ${userUpdateResult.modifiedCount} users`);

      // 2. Then, soft delete the organization
      organization.isDeleted = true;
      organization.deleted_by = deleterId;
      organization.deleted_at = deletionTime;
      organization.updated_by = deleterId;

      await organization.save();

      // 3. Get final count of deleted users for confirmation
      const deletedUsersCount = await User.countDocuments({
        organization: organization._id,
        isDeleted: true,
        deleted_at: deletionTime
      });

      res.json({
        success: true,
        message: `Organization and ${deletedUsersCount} associated users deleted successfully`,
        data: {
          organizationId: organization._id,
          organizationName: organization.name,
          usersDeleted: deletedUsersCount,
          deletedAt: deletionTime,
          deletedBy: {
            _id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email
          }
        }
      });

    } catch (updateError) {
      // If user update fails, we need to decide whether to proceed with org deletion
      console.error('Error updating users:', updateError);

      // You might want to still delete the organization even if user updates fail
      // or you might want to fail the entire operation
      throw new Error('Failed to delete organization users: ' + updateError.message);
    }

  } catch (error) {
    console.error('Delete organization error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete organization',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get organization members
 * @route   GET /api/organizations/:id/members
 * @access  Private
 */
const getOrganizationMembers = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id)
      .populate('owner', 'fullName email role')
      .populate('members.user', 'fullName email role isActive');

    if (!organization) return res.status(404).json({ success: false, message: 'Organization not found' });
    if (!hasOrgAccess(organization, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied to this organization' });
    }

    res.json({ success: true, data: { owner: organization.owner, members: organization.members } });
  } catch (error) {
    console.error('Get organization members error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch organization members' });
  }
};

/**
 * @desc    Update member role
 * @route   PATCH /api/organizations/:id/member/:userId/role
 * @access  Private
 */
const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id: orgId, userId } = req.params;

    if (!role || !['employee', 'hr', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Valid role is required (employee, hr, admin)' });
    }

    const organization = await Organization.findById(orgId);
    if (!organization) return res.status(404).json({ success: false, message: 'Organization not found' });
    if (!canManageOrg(organization, req.user)) {
      return res.status(403).json({ success: false, message: 'Only owner or superadmin can update roles' });
    }

    const member = organization.members.find(m => m.user.toString() === userId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found in organization' });
    if (organization.owner.toString() === userId) {
      return res.status(400).json({ success: false, message: 'Cannot change owner role' });
    }

    member.role = role;
    await organization.save();
    await User.findByIdAndUpdate(userId, { role });

    res.json({ success: true, message: 'Member role updated successfully', data: member });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ success: false, message: 'Failed to update member role' });
  }
};

/**
 * @desc    Invite member to organization
 * @route   POST /api/organizations/:id/invite
 * @access  Private
 */
const inviteMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    let orgId;

    // Determine organization ID based on route
    if (req.params.id) {
      // Route: /api/organizations/:id/invite (for superadmin)
      orgId = req.params.id;
    } else {
      // Route: /api/organization-settings/invite (for admin/hr)
      if (!req.user.organization) {
        return res.status(404).json({
          success: false,
          message: 'No organization found for this user'
        });
      }
      orgId = req.user.organization;
    }


    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email and role are required' });
    }
    if (!['employee', 'hr', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Valid role is required (employee, hr, admin)' });
    }

    const organization = await Organization.findById(orgId);
    if (!organization) return res.status(404).json({ success: false, message: 'Organization not found' });
    // Check permissions: superadmin, owner, admin, or hr (restricted)
    const isSuperadmin = req.user.role === 'superadmin';
    const isOwner = organization.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' && req.user.organization?.toString() === orgId.toString();
    const isHr = req.user.role === 'hr' && req.user.organization?.toString() === orgId.toString();

    if (!(isSuperadmin || isOwner || isAdmin || isHr)) {
      return res.status(403).json({
        success: false,
        message: 'Only organization admin, hr, or superadmin can invite members'
      });
    }

    // If HR, restrict them to only invite employees
    if (isHr && role !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'HR can only invite employees'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.organization?.toString() === orgId) {
      return res.status(400).json({ success: false, message: 'User already a member of this organization' });
    }

    const existingInvite = await Invite.findOne({ email, organization: orgId, isAccepted: false });
    if (existingInvite) {
      return res.status(400).json({ success: false, message: 'Invite already sent to this email' });
    }

    const invite = await Invite.create({
      email,
      organization: orgId,
      role,
      invitedBy: req.user._id
    });

    const inviteUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/invite/${invite.token}`;
    await sendOrganizationInviteEmail(email, organization.name, inviteUrl, role);

    res.status(201).json({ success: true, message: 'Invite sent successfully', data: invite });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ success: false, message: 'Failed to send invite' });
  }
};

/**
 * @desc    Get pending invites
 * @route   GET /api/organizations/:id/invites
 * @access  Private
 */
const getPendingInvites = async (req, res) => {
  try {
    let orgId;

    // Determine organization ID based on route
    if (req.params.id) {
      // Route: /api/organizations/:id/invites (for superadmin)
      orgId = req.params.id;
    } else {
      // Route: /api/organization-settings/invites (for admin/hr)
      if (!req.user.organization) {
        return res.status(404).json({
          success: false,
          message: 'No organization found for this user'
        });
      }
      orgId = req.user.organization;
    }
    const organization = await Organization.findById(orgId);

    if (!organization) return res.status(404).json({ success: false, message: 'Organization not found' });
    // Check permissions: superadmin, owner, admin, or hr
    const canViewInvites = 
      req.user.role === 'superadmin' || 
      organization.owner.toString() === req.user._id.toString() ||
      (
        ['admin', 'hr'].includes(req.user.role) && 
        req.user.organization?.toString() === orgId.toString()
      );
      if (!canViewInvites) {
        return res.status(403).json({
          success: false,
          message: 'Only organization admin, hr, or superadmin can view invites'
        });
      }  

    const invites = await Invite.findPendingByOrganization(orgId);
    res.json({ success: true, count: invites.length, data: invites });
  } catch (error) {
    console.error('Get pending invites error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending invites' });
  }
};

module.exports = {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  updateOrganization,
  deleteOrganization,
  getUserOrganization,
  getUserOrganizationMembers,
  getOrganizationMembers,
  updateMemberRole,
  inviteMember,
  getPendingInvites
};
