
import { connectToDatabase } from '@/lib/mongodb';
import type { PasswordResetTokenDoc, DbUser } from '@/types';
import { ObjectId } from 'mongodb';
import crypto from 'crypto';
import { sendEmail } from '@/lib/emailService'; // Import the email service

const PASSWORD_RESET_TOKENS_COLLECTION = 'password_reset_tokens';
const TOKEN_EXPIRY_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Internal function to create and store a password reset token.
 */
async function generateAndStoreResetToken(userId: string): Promise<{ token: string; expiresAt: Date } | null> {
  console.log(`[passwordResetService] generateAndStoreResetToken called for userId: ${userId}`);
  if (!ObjectId.isValid(userId)) {
    console.error('[passwordResetService] Invalid user ID format for creating reset token.');
    throw new Error('Invalid user ID format.');
  }

  try {
    const { db } = await connectToDatabase();
    const tokensCollection = db.collection<PasswordResetTokenDoc>(PASSWORD_RESET_TOKENS_COLLECTION);
    
    await tokensCollection.deleteMany({ userId: new ObjectId(userId) });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_DURATION_MS);
    const createdAt = new Date();

    const newTokenDocument: Omit<PasswordResetTokenDoc, '_id'> = {
      userId: new ObjectId(userId),
      token,
      expiresAt,
      createdAt,
    };

    const result = await tokensCollection.insertOne(newTokenDocument as PasswordResetTokenDoc);
    if (!result.insertedId) {
      throw new Error('Failed to store password reset token.');
    }

    console.log(`[passwordResetService] Password reset token generated and stored for userId: ${userId}`);
    return { token, expiresAt };

  } catch (error: any) {
    console.error(`[passwordResetService] Error generating/storing reset token for userId ${userId}:`, error.message);
    throw error; // Re-throw to be caught by calling function
  }
}


/**
 * Main function to handle a password reset request.
 * Finds user, generates token, and sends reset email.
 * @param email - The email address of the user requesting the reset.
 * @returns True if the process to send an email was initiated (email found), false otherwise.
 */
export async function requestPasswordReset(email: string): Promise<boolean> {
  console.log(`[passwordResetService] requestPasswordReset called for email: ${email}`);
  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<DbUser>('users');
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log(`[passwordResetService] User with email ${email} not found. No email will be sent.`);
      return false; // User not found, but don't reveal this to client for security
    }

    const tokenData = await generateAndStoreResetToken(user._id.toString());
    if (!tokenData) {
      // Error already logged by generateAndStoreResetToken
      return false; // Failed to generate token
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/reset-password?token=${tokenData.token}`;
    
    const emailSubject = 'Password Reset Request - CAN Fashion';
    const emailHtmlBody = `
      <p>Hello ${user.name || 'User'},</p>
      <p>You requested a password reset for your CAN Fashion account.</p>
      <p>Please click the link below to set a new password. This link will expire in 1 hour:</p>
      <p><a href="${resetUrl}" target="_blank" style="color: #243b68; text-decoration: none; font-weight: bold;">Reset Your Password</a></p>
      <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
      <p>Thank you,<br/>The CAN Fashion Team</p>
    `;
    const emailTextBody = `
      Hello ${user.name || 'User'},
      You requested a password reset for your CAN Fashion account.
      Please visit the following link to set a new password. This link will expire in 1 hour:
      ${resetUrl}
      If you did not request a password reset, please ignore this email or contact support if you have concerns.
      Thank you,
      The CAN Fashion Team
    `;

    await sendEmail({
      to: user.email,
      subject: emailSubject,
      html: emailHtmlBody,
      text: emailTextBody,
    });

    console.log(`[passwordResetService] Password reset email successfully dispatched to: ${user.email}`);
    return true; // Email sending process initiated

  } catch (error: any) {
    console.error(`[passwordResetService] Error in requestPasswordReset for email ${email}:`, error.message);
    // If the error is from sendEmail itself, it will be logged by emailService.
    // We return false here to indicate the overall process might have failed to the API route.
    return false; 
  }
}


/**
 * Verifies a password reset token.
 * @param token - The token string to verify.
 * @returns The token document if valid and not expired, otherwise null.
 */
export async function verifyPasswordResetToken(token: string): Promise<PasswordResetTokenDoc | null> {
  console.log(`[passwordResetService] verifyPasswordResetToken called for token: ${token ? token.substring(0,10) + '...' : 'null'}`);
  if (!token || typeof token !== 'string') {
    console.warn('[passwordResetService] Invalid or missing token for verification.');
    return null;
  }

  try {
    const { db } = await connectToDatabase();
    const tokensCollection = db.collection<PasswordResetTokenDoc>(PASSWORD_RESET_TOKENS_COLLECTION);
    const tokenDoc = await tokensCollection.findOne({ token: token });

    if (!tokenDoc) {
      console.warn(`[passwordResetService] Token not found: ${token.substring(0,10)}...`);
      return null;
    }

    if (tokenDoc.expiresAt < new Date()) {
      console.warn(`[passwordResetService] Token expired for ${token.substring(0,10)}...`);
      await tokensCollection.deleteOne({ _id: tokenDoc._id });
      return null;
    }

    console.log(`[passwordResetService] Token verified successfully for userId: ${tokenDoc.userId}`);
    return tokenDoc;

  } catch (error: any) {
    console.error(`[passwordResetService] Error verifying password reset token:`, error.message);
    throw error;
  }
}

/**
 * Deletes a password reset token, typically after it's been used.
 * @param tokenId - The ObjectId of the token to delete.
 */
export async function deletePasswordResetToken(tokenId: string | ObjectId): Promise<boolean> {
  console.log(`[passwordResetService] deletePasswordResetToken called for tokenId: ${tokenId.toString()}`);
  const objectIdToDelete = typeof tokenId === 'string' ? new ObjectId(tokenId) : tokenId;
  if (!ObjectId.isValid(objectIdToDelete)) {
    console.error('[passwordResetService] Invalid token ID format for deletion.');
    return false;
  }

  try {
    const { db } = await connectToDatabase();
    const tokensCollection = db.collection<PasswordResetTokenDoc>(PASSWORD_RESET_TOKENS_COLLECTION);
    const result = await tokensCollection.deleteOne({ _id: objectIdToDelete });
    
    return result.deletedCount === 1;
  } catch (error: any) {
    console.error(`[passwordResetService] Error deleting password reset token ${tokenId.toString()}:`, error.message);
    throw error;
  }
}
