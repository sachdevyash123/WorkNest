const mongoose = require('mongoose');
const crypto = require('crypto');

const inviteSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization is required']
    },
    role: {
        type: String,
        enum: ['employee', 'hr', 'admin'],
        default: 'employee'
    },
    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Inviter is required']
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    isAccepted: {
        type: Boolean,
        default: false
    },
    acceptedAt: Date,
    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for better query performance
inviteSchema.index({ email: 1, organization: 1 });
inviteSchema.index({ token: 1 });
inviteSchema.index({ expiresAt: 1 });

// Pre-save middleware to generate token and set expiry
inviteSchema.pre('validate', function (next) {
    if (this.isNew) {
        // Generate secure random token
        this.token = crypto.randomBytes(32).toString('hex');

        // Set expiry to 7 days from now
        this.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    next();
});

// Instance method to check if invite is expired
inviteSchema.methods.isExpired = function () {
    return Date.now() > this.expiresAt.getTime();
};

// Instance method to mark invite as accepted
inviteSchema.methods.markAccepted = function (userId) {
    this.isAccepted = true;
    this.acceptedAt = new Date();
    this.acceptedBy = userId;
};

// Static method to find valid invite by token
inviteSchema.statics.findValidByToken = function (token) {
    return this.findOne({
        token,
        isAccepted: false,
        expiresAt: { $gt: new Date() }
    }).populate('organization', 'name description');
};

// Static method to find pending invites by organization
inviteSchema.statics.findPendingByOrganization = function (organizationId) {
    return this.find({
        organization: organizationId,
        isAccepted: false,
        expiresAt: { $gt: new Date() }
    }).populate('invitedBy', 'fullName email');
};

// Static method to clean up expired invites
inviteSchema.statics.cleanupExpired = async function () {
    return this.deleteMany({
        expiresAt: { $lt: new Date() },
        isAccepted: false
    });
};

module.exports = mongoose.model('Invite', inviteSchema);

