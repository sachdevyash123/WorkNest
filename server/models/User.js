const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true,
        maxlength: [50, 'Full name cannot exceed 50 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false // Don't include password in queries by default
    },
    role: {
        type: String,
        enum: ['employee', 'hr', 'admin', 'superadmin'],
        default: 'employee'
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: false // Allow null during signup, will be set later
    },
    isActive: {
        type: Boolean,
        default: true
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: {
        type: Date,
        default: null
    },
    // Soft delete fields
    isDeleted: {
        type: Boolean,
        default: false
    },
    deleted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    deleted_at: {
        type: Date,
        default: null
    },
    // Audit fields
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Can be null for self-registration
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Will be set on updates
    }
}, {
    timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ organization: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ created_by: 1 });
userSchema.index({ updated_by: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    try {
        // Hash password with cost of 12
        const hashedPassword = await bcrypt.hash(this.password, 12);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

// Pre-find middleware to exclude deleted documents by default
userSchema.pre(/^find/, function(next) {
    // Only add the filter if it's not already specified
    if (!this.getQuery().hasOwnProperty('isDeleted')) {
        this.where({ isDeleted: { $ne: true } });
    }
    next();
});

// Pre-aggregate middleware to exclude deleted documents
userSchema.pre('aggregate', function(next) {
    // Add match stage at the beginning to filter out deleted documents
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
    next();
});

// Instance method to check if password matches
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get user data without sensitive information
userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.resetPasswordToken;
    delete userObject.resetPasswordExpires;
    return userObject;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email, includeDeleted = false) {
    const query = { email: email.toLowerCase() };
    if (!includeDeleted) {
        query.isDeleted = { $ne: true };
    }
    return this.findOne(query);
};

// Static method to check if email exists
userSchema.statics.emailExists = async function (email, includeDeleted = false) {
    const query = { email: email.toLowerCase() };
    if (!includeDeleted) {
        query.isDeleted = { $ne: true };
    }
    const user = await this.findOne(query);
    return !!user;
};

// Static method to find deleted users
userSchema.statics.findDeleted = function () {
    return this.find({ isDeleted: true }).populate([
        { path: 'organization', select: 'name' },
        { path: 'deleted_by', select: 'fullName email' },
        { path: 'created_by', select: 'fullName email' },
        { path: 'updated_by', select: 'fullName email' }
    ]);
};

// Static method to find with deleted
userSchema.statics.findWithDeleted = function () {
    return this.find({}).populate([
        { path: 'organization', select: 'name' },
        { path: 'deleted_by', select: 'fullName email' },
        { path: 'created_by', select: 'fullName email' },
        { path: 'updated_by', select: 'fullName email' }
    ]);
};

// Static method to find active users by organization
userSchema.statics.findByOrganization = function (organizationId, includeDeleted = false) {
    const query = { organization: organizationId };
    if (!includeDeleted) {
        query.isDeleted = { $ne: true };
        query.isActive = true;
    }
    return this.find(query);
};

// Instance method to assign user to organization
userSchema.methods.assignToOrganization = async function (organizationId, role = 'employee') {
    this.organization = organizationId;
    if (role !== 'superadmin') {
        this.role = role;
    }
    return await this.save();
};

// Instance method to check if user can access organization
userSchema.methods.canAccessOrganization = function (organizationId) {
    if (this.role === 'superadmin') return true;
    return this.organization && this.organization.toString() === organizationId.toString();
};

// Instance method for soft delete
userSchema.methods.softDelete = function (deletedBy) {
    this.isDeleted = true;
    this.deleted_by = deletedBy;
    this.deleted_at = new Date();
    return this.save();
};

// Instance method to restore
userSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deleted_by = null;
    this.deleted_at = null;
    return this.save();
};

// Instance method to check if deleted
userSchema.methods.isDeletedDocument = function () {
    return this.isDeleted === true;
};

module.exports = mongoose.model('User', userSchema);