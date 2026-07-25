import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  findUserByEmail,
  createUser,
  updateUser,
} from "../repositories/userRepository.js";

import {
  findStoreByEmail,
  updateStoreRepo,
} from "../repositories/storeRepository.js";

import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

const RESET_SECRET =
  process.env.RESET_PASSWORD_SECRET || process.env.RESET_TOKEN_SECRET || process.env.JWT_SECRET;

// ================= SIGNUP =================
export const signupUser = async (data) => {
  const { name, email, password } = data;

  const existing = await findUserByEmail(email);
  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  return await createUser({
    name,
    email,
    password: hashedPassword,
    role: "ADMIN",
  });
};

// ================= LOGIN =================
export const loginUser = async (data) => {
  const { email, password } = data;

  let account = await findUserByEmail(email);

  if (!account) {
    account = await findStoreByEmail(email);
  }

  if (!account) {
    throw new Error("Account not found");
  }

  const isMatch = await bcrypt.compare(password, account.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(account);
  const refreshToken = generateRefreshToken(account);

  if (account.role === "STORE") {
    await updateStoreRepo(account.id, { refreshToken });
  } else {
    await updateUser(account.id, { refreshToken });
  }

  return {
    user: {
      id: account.id,
      email: account.email,
      role: account.role,
    },
    accessToken,
    refreshToken,
  };
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (email) => {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("Account not found");

  const token = jwt.sign({ id: user.id }, RESET_SECRET, {
    expiresIn: "15m",
  });

  // TODO: send `token` via email instead of returning it directly
  return token;
};

// ================= RESET PASSWORD =================
export const resetPassword = async (token, newPassword) => {
  let payload;
  try {
    payload = jwt.verify(token, RESET_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await updateUser(payload.id, { password: hashedPassword });

  return { message: "Password reset successful" };
};

// ================= LOGOUT =================
export const logoutUser = async (user) => {
  if (user.role === "STORE") {
    await updateStoreRepo(user.id, { refreshToken: null });
  } else {
    await updateUser(user.id, { refreshToken: null });
  }

  return { message: "Logout successful" };
};

//refresh token
export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new Error("Refresh token required");
  }

  let decoded;

  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);
  } catch (err) {
    throw new Error("Invalid or expired refresh token");
  }

  let account;

  // check user or store
  if (decoded.role === "STORE") {
    account = await findStoreByEmail(decoded.email);
  } else {
    account = await findUserByEmail(decoded.email);
  }

  if (!account || account.refreshToken !== refreshToken) {
    throw new Error("Unauthorized");
  }

  // generate new access token
  const newAccessToken = generateAccessToken(account);

  return {
    accessToken: newAccessToken,
  };
};