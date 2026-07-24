import * as userService from "../services/userService.js";
import {
  signupUser,
  loginUser,
  forgotPassword,
  resetPassword,
  logoutUser,
  refreshAccessToken
} from "../services/userService.js";// SIGNUP
export const signup = async (req, res) => {
  try {
  const user = await signupUser(req.body);  res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
   const data = await loginUser(req.body);   res.json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// forgot
export const forgot = async (req, res) => {
  try {
    const token = await forgotPassword(req.body.email);
    res.json({ token });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// reset
export const reset = async (req, res) => {
  try {
    const result = await resetPassword(req.body.token, req.body.password);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {

  const result = await logoutUser(req.user);

    res.json(result);

  } catch(error){

    res.status(500).json({
      message:error.message
    });

  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const data = await refreshAccessToken(refreshToken);

    res.json({
      success: true,
      accessToken: data.accessToken,
    });

  } catch (err) {
    res.status(401).json({
      message: err.message,
    });
  }
};