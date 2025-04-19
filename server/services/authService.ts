/*
 * Auth Service Functions:
 * - createPasswordResetToken
 * - validatePasswordResetToken
 * - markPasswordResetTokenAsUsed
 * - updateUserPassword
 * - createRestaurantPasswordResetToken
 * - validateRestaurantPasswordResetToken
 * - markRestaurantPasswordResetTokenAsUsed
 * - updateRestaurantPassword
 */

import { db } from "@server/db/db";
import { eq, and, gt } from "drizzle-orm";
import { userPasswordResetTokens, users, restaurantPasswordResetTokens, restaurantUsers, User, RestaurantUser } from "@server/db/schema"; 
import * as crypto from 'crypto';  // For generating secure tokens
import { EmailResponse } from "@server/services/emailService";  
import { sendPasswordResetEmail as sendEmail } from "@server/services/emailService";
import * as bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';  // JSON Web Token library for token generation and verification

// ==================== Auth Service ====================

//--create password reset token--

export const createPasswordResetToken = async (userId: number): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

  await db.insert(userPasswordResetTokens).values({
    userId,
    token,
    expiresAt,
    used: false,
  });

  return token;
};

//--validate password reset token--

export const validatePasswordResetToken = async (token: string): Promise<number | null> => {
  const [resetToken] = await db
    .select()
    .from(userPasswordResetTokens)
    .where(
      and(
        eq(userPasswordResetTokens.token, token),
        eq(userPasswordResetTokens.used, false),
        gt(userPasswordResetTokens.expiresAt, new Date())
      )
    );

  return resetToken?.userId ?? null;
};

//--mark password reset token as used--

export const markPasswordResetTokenAsUsed = async (token: string): Promise<void> => {
  await db
    .update(userPasswordResetTokens)
    .set({ used: true })
    .where(eq(userPasswordResetTokens.token, token));
};

//--update user password--

export const updateUserPassword = async (userId: number, hashedPassword: string): Promise<void> => {
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, userId));
};

//--create restaurant password reset token--

export const createRestaurantPasswordResetToken = async (restaurantId: number): Promise<string> => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

  await db.insert(restaurantPasswordResetTokens).values({
    restaurantId,
    token,
    expiresAt,
    used: false,
  });

  return token;
};

//--validate restaurant password reset token--

export const validateRestaurantPasswordResetToken = async (token: string): Promise<number | null> => {
  const [resetToken] = await db
    .select()
    .from(restaurantPasswordResetTokens)
    .where(
      and(
        eq(restaurantPasswordResetTokens.token, token),
        eq(restaurantPasswordResetTokens.used, false),
        gt(restaurantPasswordResetTokens.expiresAt, new Date())
      )
    );

  return resetToken?.restaurantId ?? null;
};

//--mark restaurant password reset token as used--

export const markRestaurantPasswordResetTokenAsUsed = async (token: string): Promise<void> => {
  await db
    .update(restaurantPasswordResetTokens)
    .set({ used: true })
    .where(eq(restaurantPasswordResetTokens.token, token));
};

//--update restaurant password--

export const updateRestaurantPassword = async (restaurantId: number, hashedPassword: string): Promise<void> => {
  await db
    .update(restaurantUsers)
    .set({ password: hashedPassword })
    .where(eq(restaurantUsers.id, restaurantId));
};

//--Send Password Reset Email--

export const sendPasswordResetEmail = async (email: string, token: string, isRestaurant: boolean = false): Promise<EmailResponse> => {
  return await sendEmail(email, token, isRestaurant);
};

//--verify user login--
export const verifyUserLogin = async (email: string, password: string): Promise<User | null> => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email));
  if (!user[0]) return null;
  const isPasswordValid = await comparePasswords(password, user[0].password);
  if (!isPasswordValid) return null;
  return user[0];
};

//--verify restaurant login--
export const verifyRestaurantLogin = async (email: string, password: string): Promise<RestaurantUser | null> => {
    const restaurant = await db
      .select()
      .from(restaurantUsers)
      .where(eq(restaurantUsers.email, email));
    if (!restaurant[0]) return null;
    const isPasswordValid = comparePasswords(password, restaurant[0].password);
    if (!isPasswordValid) return null;
    return restaurant[0];
  };

function comparePasswords(password: string, password1: string) {
  return bcrypt.compareSync(password, password1);   
}

//--hash password--
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

//--generate token--
export function generateToken(user: User | RestaurantUser, type: 'user' | 'restaurant'): string {
    const payload = {
      id: user.id,
      type
    };
    return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  }

//--verify token--
export const verifyToken = (token: string): Promise<{ id: number; type: 'user' | 'restaurant' }> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
      if (err) {
        reject(new Error('Invalid token'));
      } else {
        resolve(decoded as { id: number; type: 'user' | 'restaurant' });
      }
    });
  });
};






