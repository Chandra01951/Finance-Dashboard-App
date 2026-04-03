const authService = require("../services/authService");
const { asyncHandler } = require("../utils/helpers");

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  authService.sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.login(email, password);
  authService.sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  const User = require("../models/User");
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});

// @desc    Logout (client-side token removal; this endpoint is for clarity)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});
