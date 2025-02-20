import crypto from "crypto";
import jwt from "jsonwebtoken";
import HttpException from "../exceptions/http.exception";
import Token from "../protocols/token.protocol";
import userModel from "../resources/user/user.model";
import { User } from "../resources/user/user.protocol";

export const generateSessionId = (): string => crypto.randomBytes(16).toString("hex");

export const createToken = (user: User, sessionId: string): string => {
  return jwt.sign(
    { id: user._id, sessionId: sessionId },
    process.env.JWT_SECRET as jwt.Secret,
    { expiresIn: '1d' }
  );
};

export const createRefreshToken = (user: User, sessionId: string): string => {

  return jwt.sign(
    { id: user._id, sessionId: sessionId },
    process.env.REFRESH_TOKEN_SECRET as jwt.Secret,
    { expiresIn: '7d' }
  );
};

export const verifyToken = async (token: string): Promise<jwt.VerifyErrors | Token> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_SECRET as jwt.Secret, (error, payload) => {
      if (error) return reject(error);
      return resolve(payload as Token);
    });
  });
};

export const verifyRefreshToken = async (token: string): Promise<jwt.VerifyErrors | Token> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as jwt.Secret, (error, payload) => {
      if (error) return reject(error);
      return resolve(payload as Token);
    });
  });
};

export const refreshTokens = async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const decoded = (await verifyRefreshToken(refreshToken)) as Token;
    const user = await userModel.findById(decoded.id);
    if (!user) throw new Error("User not found");

    const tokenSession = generateSessionId();
    const refreshSession = generateSessionId();

    const newAccessToken = await createToken(user, tokenSession);
    const newRefreshToken = await createRefreshToken(user, refreshSession);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (error) {
    throw new HttpException(403, 'failed', 'Refresh token invalid or expired');
  }
};

export default { createToken, createRefreshToken, verifyToken, verifyRefreshToken, refreshTokens, generateSessionId };
