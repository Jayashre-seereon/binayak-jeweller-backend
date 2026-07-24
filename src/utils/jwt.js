import jwt from "jsonwebtoken";

export const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role   
    },
    process.env.ACCESS_SECRET,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,   // ✅ ADD THIS
      role: user.role   
    },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};