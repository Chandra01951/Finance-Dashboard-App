const userService = require("../services/userService");
const { asyncHandler, paginatedResponse } = require("../utils/helpers");

// @desc    Get all users
// @route   GET /api/users
// @access  Admin only
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { users, total, page, limit } = await userService.getAllUsers(req.query);
  paginatedResponse(res, users, total, page, limit);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Admin only
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.json({ success: true, data: user });
});

// @desc    Create user (admin-initiated)
// @route   POST /api/users
// @access  Admin only
exports.createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body, req.user._id);
  res.status(201).json({ success: true, message: "User created successfully", data: user });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin only (role/status) | Self (name, email)
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body, req.user);
  res.json({ success: true, message: "User updated successfully", data: user });
});

// @desc    Deactivate user (soft delete)
// @route   DELETE /api/users/:id
// @access  Admin only
exports.deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user._id);
  res.json({ success: true, message: "User deactivated successfully" });
});

// @desc    Get logged-in user's own profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  res.json({ success: true, data: user });
});

// @desc    Update logged-in user's own profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.json({ success: true, message: "Profile updated", data: user });
});
