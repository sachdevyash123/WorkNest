const sgMail = require('@sendgrid/mail');

// Configure SendGrid
console.log(process.env.SENDGRID_API_KEY);
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - Password reset URL
 */
const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
    try {
        const msg = {
            to: email,
            from: process.env.FROM_EMAIL || 'noreply@worknest.com', // Verified sender
            subject: 'WorkNest - Password Reset Request',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">WorkNest</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Password Reset Request</p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                You requested a password reset for your WorkNest account. Click the button below to reset your password:
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: #2563eb; font-size: 14px; word-break: break-all; margin: 10px 0;">
                ${resetUrl}
              </p>
            </div>
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                <strong>Important:</strong> This link will expire in 15 minutes for security reasons. 
                If you didn't request this password reset, please ignore this email.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 WorkNest. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
        };

        await sgMail.send(msg);
        console.log(`Password reset email sent to ${email}`);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};

/**
 * Send welcome email to new users
 * @param {string} email - User's email address
 * @param {string} fullName - User's full name
 */
const sendWelcomeEmail = async (email, fullName) => {
    try {
        console.log(process.env.FROM_EMAIL);

        const msg = {
            to: email,
            from: process.env.FROM_EMAIL || 'noreply@worknest.com', // Verified sender
            subject: 'Welcome to WorkNest!',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0; font-size: 28px;">WorkNest</h1>
              <p style="color: #6b7280; margin: 10px 0 0 0;">Welcome to the team!</p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
                Hi ${fullName},
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 15px 0 0 0;">
                Welcome to WorkNest! Your account has been successfully created. You can now log in to access your dashboard and start collaborating with your team.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/login" 
                 style="background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block; font-size: 16px;">
                Login to WorkNest
              </a>
            </div>
            
            <div style="margin-bottom: 25px;">
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 0;">
                If you have any questions or need assistance, please don't hesitate to contact our support team.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 WorkNest. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
        };

        await sgMail.send(msg);
        console.log(`Welcome email sent to ${email}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
        // Don't throw error for welcome email as it's not critical
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendWelcomeEmail,
};
