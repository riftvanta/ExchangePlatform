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
        from: process.env.FROM_EMAIL || 'no-reply@example.com',
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
 * Sends an email verification link to a user
 * @param email - The recipient's email address
 * @param verificationToken - The email verification token
 * @param name - Optional name of the recipient
 */
export async function sendVerificationEmail(
    email: string,
    verificationToken: string,
    name?: string
) {
    const greeting = name ? `Hello ${name}` : 'Hello';
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;

    const msg = {
        to: email,
        from: process.env.FROM_EMAIL || 'no-reply@example.com',
        subject: 'Verify Your Email Address',
        text: `${greeting},\n\nThank you for registering with USDT-JOD Exchange Platform. Please verify your email address by clicking on the following link: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nBest regards,\nThe USDT-JOD Exchange Team`,
        html: `
            <p>${greeting},</p>
            <p>Thank you for registering with USDT-JOD Exchange Platform.</p>
            <p>Please verify your email address by clicking on the button below:</p>
            <p>
                <a href="${verificationUrl}" style="background-color: #4CAF50; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 12px;">
                    Verify Email
                </a>
            </p>
            <p>Or copy and paste this link in your browser: ${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>Best regards,<br>The USDT-JOD Exchange Team</p>
        `,
    };

    try {
        await sgMail.send(msg);
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw new Error('Failed to send verification email');
    }
}

/**
 * Sends a confirmation email after email verification
 * @param email - The recipient's email address
 * @param name - Optional name of the recipient
 */
export async function sendVerificationConfirmationEmail(
    email: string,
    name?: string
) {
    const greeting = name ? `Hello ${name}` : 'Hello';

    const msg = {
        to: email,
        from: process.env.FROM_EMAIL || 'no-reply@example.com',
        subject: 'Email Successfully Verified',
        text: `${greeting},\n\nYour email address has been successfully verified. You now have full access to our platform features.\n\nBest regards,\nThe USDT-JOD Exchange Team`,
        html: `
            <p>${greeting},</p>
            <p>Your email address has been successfully verified.</p>
            <p>You now have full access to our platform features.</p>
            <p>Best regards,<br>The USDT-JOD Exchange Team</p>
        `,
    };

    try {
        await sgMail.send(msg);
    } catch (error) {
        console.error('Error sending verification confirmation email:', error);
        throw new Error('Failed to send verification confirmation email');
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
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    const msg = {
        to: email,
        from: process.env.FROM_EMAIL || 'no-reply@example.com',
        subject: 'Password Reset Request',
        text: `You requested a password reset. Please click the following link to reset your password: ${resetUrl}. This link will expire in 1 hour.`,
        html: `
            <p>You requested a password reset.</p>
            <p>Please click the button below to reset your password:</p>
            <p>
                <a href="${resetUrl}" style="background-color: #4CAF50; border: none; color: white; padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; border-radius: 12px;">
                    Reset Password
                </a>
            </p>
            <p>Or copy and paste this link in your browser: ${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
        `,
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
        from: process.env.FROM_EMAIL || 'no-reply@example.com',
        subject: 'Password Reset Successfully',
        text: 'Your password has been reset successfully. If you did not request this change, please contact our support team immediately.',
        html: `
            <p>Your password has been reset successfully.</p>
            <p>If you did not request this change, please contact our support team immediately.</p>
        `,
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

/**
 * Sends a transaction notification email
 * @param email - The recipient's email address
 * @param transactionType - The type of transaction (deposit/withdrawal)
 * @param status - The status of the transaction
 * @param amount - The transaction amount
 * @param currency - The transaction currency
 */
export async function sendTransactionNotificationEmail(
    email: string,
    transactionType: 'deposit' | 'withdrawal',
    status: 'pending' | 'approved' | 'rejected',
    amount: string,
    currency: string,
    rejectionReason?: string
) {
    let subject, textContent, htmlContent;

    if (status === 'pending') {
        subject = `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} Request Received`;
        textContent = `Your ${transactionType} request for ${amount} ${currency} has been received and is being processed. We'll notify you once it's been reviewed.`;
        htmlContent = `
            <p>Your ${transactionType} request for <strong>${amount} ${currency}</strong> has been received and is being processed.</p>
            <p>We'll notify you once it's been reviewed.</p>
        `;
    } else if (status === 'approved') {
        subject = `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} Request Approved`;
        textContent = `Great news! Your ${transactionType} request for ${amount} ${currency} has been approved and processed.`;
        htmlContent = `
            <p>Great news!</p>
            <p>Your ${transactionType} request for <strong>${amount} ${currency}</strong> has been approved and processed.</p>
        `;
    } else if (status === 'rejected') {
        subject = `${transactionType === 'withdrawal' ? 'Withdrawal Not Processed' : `${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} Request Rejected`}`;
        const reasonText = rejectionReason ? `Reason: ${rejectionReason}` : 'Please contact support for more information.';
        
        if (transactionType === 'withdrawal') {
            textContent = `Your withdrawal request for ${amount} ${currency} was not processed. No funds have been deducted from your account. ${reasonText}`;
            htmlContent = `
                <p>Your withdrawal request for <strong>${amount} ${currency}</strong> was not processed.</p>
                <p><strong>Important:</strong> No funds have been deducted from your account. Your balance remains unchanged.</p>
                <p>${rejectionReason ? `<strong>Reason for rejection:</strong> ${rejectionReason}` : 'Please contact support for more information.'}</p>
                <p>You can submit a new withdrawal request at any time from your dashboard.</p>
            `;
        } else {
            textContent = `We're sorry, but your ${transactionType} request for ${amount} ${currency} has been rejected. ${reasonText}`;
            htmlContent = `
                <p>We're sorry, but your ${transactionType} request for <strong>${amount} ${currency}</strong> has been rejected.</p>
                <p>${rejectionReason ? `<strong>Reason:</strong> ${rejectionReason}` : 'Please contact support for more information.'}</p>
            `;
        }
    }

    const msg = {
        to: email,
        from: process.env.FROM_EMAIL || 'no-reply@example.com',
        subject,
        text: `${textContent}\n\nBest regards,\nThe USDT-JOD Exchange Team`,
        html: `
            ${htmlContent}
            <p>Best regards,<br>The USDT-JOD Exchange Team</p>
        `,
    };

    try {
        await sgMail.send(msg);
    } catch (error) {
        console.error('Error sending transaction notification email:', error);
        throw new Error('Failed to send transaction notification email');
    }
}
