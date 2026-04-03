const User = require("../models/User");
const { AppError } = require("../utils/helpers");

exports.getAllUsers = async (queryParams) => {
  const { role, status, page = 1, limit = 10 } = queryParams;
  const filter = {};

  if (role) filter.role = role;
  if (status) filter.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(filter),
  ]);

  return { users, total, page: parseInt(page), limit: parseInt(limit) };
};

exports.getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new AppError("User not found", 404);
  return user;
};

exports.createUser = async (userData, creatorId) => {
  const exists = await User.findOne({ email: userData.email });
  if (exists) throw new AppError("Email already registered", 409);

  return await User.create({ ...userData, createdBy: creatorId });
};

exports.updateUser = async (id, updates, requestingUser) => {
  // Non-admins can only update their own profile; cannot change their role
  if (requestingUser.role !== "admin") {
    if (id !== requestingUser._id.toString()) {
      throw new AppError("Not authorized to update this user", 403);
    }
    delete updates.role;
    delete updates.status;
  }

  const user = await User.findById(id);
  if (!user) throw new AppError("User not found", 404);

  // Admins cannot downgrade themselves accidentally
  if (requestingUser._id.toString() === id && updates.role && updates.role !== "admin") {
    throw new AppError("Admins cannot change their own role", 400);
  }

  const updated = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  return updated;
};

exports.deleteUser = async (id, requestingUserId) => {
  if (id === requestingUserId.toString()) {
    throw new AppError("You cannot delete your own account", 400);
  }

  const user = await User.findById(id);
  if (!user) throw new AppError("User not found", 404);

  // Soft-delete via status change rather than hard delete
  await User.findByIdAndUpdate(id, { status: "inactive" });
  return true;
};

exports.getProfile = async (userId) => {
  return await User.findById(userId);
};

exports.updateProfile = async (userId, updates) => {
  // Strip sensitive fields users shouldn't self-modify
  const { role, status, createdBy, ...safeUpdates } = updates;

  if (safeUpdates.password) {
    const user = await User.findById(userId);
    user.password = safeUpdates.password;
    await user.save();
    delete safeUpdates.password;
  }

  return await User.findByIdAndUpdate(userId, safeUpdates, { new: true, runValidators: true });
};
