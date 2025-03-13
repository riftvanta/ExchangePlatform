import sgMail from '@sendgrid/mail';

// Configure SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

/**
 * Sends a welcome email to a newly registered user
 * @param email - The recipient's email address
 * @param name - Optional name of the recipient
 */
export async function sendWelcomeEmail(email: string, name?: string) {
    const greeting = name ? `Hello ${name}` : 'Hello';

    const msg = {
        to: email,
        from: process.env.EMAIL_FROM || 'no-reply@example.com',
        subject: 'Welcome to USDT-JOD Exchange Platform',
        text: `${greeting},\n\nWelcome to our exchange platform! Your account has been successfully created.\n\nBest regards,\nThe USDT-JOD Exchange Team`,
        html: `<p>${greeting},</p><p>Welcome to our exchange platform! Your account has been successfully created.</p><p>Best regards,<br>The USDT-JOD Exchange Team</p>`,
    };

    try {
        await sgMail.send(msg);
    } catch (error) {
        console.error('Error sending welcome email:', error);
        throw new Error('Failed to send welcome email');
    }
}

/**
 * Sends a password reset email with a reset link
 * @param email - The recipient's email address
 * @param resetToken - The password reset token
 */
export async function sendPasswordResetEmail(
    email: string,
    resetToken: string
) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const msg = {
        to: email,
        from: process.env.EMAIL_FROM || 'no-reply@example.com',
        subject: 'Password Reset Request',
        text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}. This link will expire in 1 hour.`,
        html: `<p>You requested a password reset.</p><p>Please click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link will expire in 1 hour.</p>`,
    };

    try {
        await sgMail.send(msg);
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
}

/**
 * Sends a confirmation email after a password has been reset
 * @param email - The recipient's email address
 */
export async function sendPasswordResetConfirmationEmail(email: string) {
    const msg = {
        to: email,
        from: process.env.EMAIL_FROM || 'no-reply@example.com',
        subject: 'Password Reset Successfully',
        text: 'Your password has been reset successfully. If you did not request this change, please contact our support team immediately.',
        html: '<p>Your password has been reset successfully.</p><p>If you did not request this change, please contact our support team immediately.</p>',
    };

    try {
        await sgMail.send(msg);
    } catch (error) {
        console.error(
            'Error sending password reset confirmation email:',
            error
        );
        throw new Error('Failed to send password reset confirmation email');
    }
}
