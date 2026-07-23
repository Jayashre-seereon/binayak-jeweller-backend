import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import jwt from "jsonwebtoken";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";

// ================= SIGNUP =================
export const signupUser = async (data) => {
  const { name, email, password } = data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword,  role: "ADMIN" },
  });

  return user;
};

// ================= LOGIN =================
export const loginUser = async (data) => {
  const { email, password } = data;

  let account = null;

  // 1️⃣ check USER table
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    account = user;
  } else {
    // 2️⃣ check STORE table
    let store = await prisma.store.findUnique({ where: { email } });

    if (store) {
      account = store;
    }
  }

  // ❌ not found anywhere
  if (!account) {
    throw new Error("Account not found");
  }

  // 3️⃣ password check
  const isMatch = await bcrypt.compare(password, account.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // 4️⃣ tokens
  const accessToken = generateAccessToken(account);
  const refreshToken = generateRefreshToken(account);

  // 5️⃣ save refresh token (IMPORTANT ⚠️)
  if (account.role === "STORE") {
    await prisma.store.update({
      where: { id: account.id },
      data: { refreshToken },
    });
  } else {
    await prisma.user.update({
      where: { id: account.id },
      data: { refreshToken },
    });
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

// ================= REFRESH TOKEN =================
export const refreshTokenService = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

    const accessToken = generateAccessToken(decoded);

    return { accessToken };
  } catch (err) {
    throw new Error("Invalid refresh token");
  }
};

// ================= FORGOT PASSWORD =================
export const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("User not found");

  // create reset token
  const resetToken = jwt.sign(
    { id: user.id },
    process.env.RESET_PASSWORD_SECRET,
    { expiresIn: "15m" }
  );

  // 👉 save token in DB (optional but recommended)
  await prisma.user.update({
    where: { email },
    data: { resetToken },
  });

  // 👉 For now just return token (later send email)
  return resetToken;
};

// ================= RESET PASSWORD =================
export const resetPassword = async (token, newPassword) => {
  try {
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: decoded.id },
      data: {
        password: hashedPassword,
        resetToken: null, // clear token
      },
    });

    return { message: "Password reset successful" };
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
};

export const logoutUser = async (userId) => {

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      refreshToken: null,
    },
  });

  return {
    message: "Logout successful",
  };
};