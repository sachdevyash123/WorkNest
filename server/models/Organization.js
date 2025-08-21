const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Organization name is required'],
        trim: true,
        maxlength: [100, 'Organization name cannot exceed 100 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    logo: {
        type: String, // URL to logo image
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Organization email is required'],
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    phone: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    industry: {
        type: String,
        trim: true
    },
    size: {
        type: Number,
        min: [1, 'Size must be at least 1']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Organization owner is required']
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            enum: ['employee', 'hr', 'admin'],
            default: 'employee'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
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
        required: [true, 'Created by is required']
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Updated by is required']
    }
}, {
    timestamps: true
});

// Indexes for better query performance
organizationSchema.index({ name: 1 });
organizationSchema.index({ owner: 1 });
organizationSchema.index({ 'members.user': 1 });
organizationSchema.index({ isDeleted: 1 });
organizationSchema.index({ created_by: 1 });
organizationSchema.index({ updated_by: 1 });

// Virtual for member count (only active members)
organizationSchema.virtual('memberCount').get(function () {

    // Add null/undefined check before filtering
    if (!this.members || !Array.isArray(this.members)) {
        return 0;
    }
    return this.members.filter(member => member && member.isActive).length;
});

// Additional virtual for active members
organizationSchema.virtual('activeMembers').get(function () {
    if (!this.members || !Array.isArray(this.members)) {
        return [];
    }
    return this.members.filter(member => member && member.isActive);
});
// Ensure virtuals are serialized
organizationSchema.set('toJSON', { virtuals: true });
organizationSchema.set('toObject', { virtuals: true });

// Pre-save middleware to ensure owner is added as admin member
organizationSchema.pre('save', function (next) {
     // Ensure members array exists
     if (!this.members) {
        this.members = [];
    }
    if (this.isNew) {
        const ownerMember = {
            user: this.owner,
            role: 'admin',
            joinedAt: new Date()
        };

        const ownerExists = this.members.some(member =>
            member && member.user && member.user.toString() === this.owner.toString()
        );

        if (!ownerExists) {
            this.members.push(ownerMember);
        }
    }
    next();
});

// Pre-find middleware to exclude deleted documents by default
organizationSchema.pre(/^find/, function(next) {
    // Only add the filter if it's not already specified
    if (!this.getQuery().hasOwnProperty('isDeleted')) {
        this.where({ isDeleted: { $ne: true } });
    }
    next();
});

// Pre-aggregate middleware to exclude deleted documents
organizationSchema.pre('aggregate', function(next) {
    // Add match stage at the beginning to filter out deleted documents
    this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
    next();
});

// Static method to find organizations by user (including soft delete filter)
organizationSchema.statics.findByUser = function (userId, includeDeleted = false) {
    const query = {
        $or: [
            { owner: userId },
            { 'members.user': userId }
        ]
    };
    
    if (!includeDeleted) {
        query.isDeleted = { $ne: true };
    }
    
    return this.find(query).populate('owner', 'fullName email');
};

// Static method to find organization by user with role
organizationSchema.statics.findByUserWithRole = function (userId, includeDeleted = false) {
    const query = {
        $or: [
            { owner: userId },
            { 'members.user': userId }
        ]
    };
    
    if (!includeDeleted) {
        query.isDeleted = { $ne: true };
    }
    
    return this.findOne(query).populate('owner', 'fullName email');
};

// Static method to find deleted organizations
organizationSchema.statics.findDeleted = function () {
    return this.find({ isDeleted: true }).populate([
        { path: 'owner', select: 'fullName email' },
        { path: 'deleted_by', select: 'fullName email' },
        { path: 'created_by', select: 'fullName email' },
        { path: 'updated_by', select: 'fullName email' }
    ]);
};

// Static method to find with deleted
organizationSchema.statics.findWithDeleted = function () {
    return this.find({}).populate([
        { path: 'owner', select: 'fullName email' },
        { path: 'deleted_by', select: 'fullName email' },
        { path: 'created_by', select: 'fullName email' },
        { path: 'updated_by', select: 'fullName email' }
    ]);
};

// Instance method for soft delete
organizationSchema.methods.softDelete = function (deletedBy) {
    this.isDeleted = true;
    this.deleted_by = deletedBy;
    this.deleted_at = new Date();
    return this.save();
};

// Instance method to restore
organizationSchema.methods.restore = function () {
    this.isDeleted = false;
    this.deleted_by = null;
    this.deleted_at = null;
    return this.save();
};

// Instance method to check if deleted
organizationSchema.methods.isDeletedDocument = function () {
    return this.isDeleted === true;
};

module.exports = mongoose.model('Organization', organizationSchema);