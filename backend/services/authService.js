const User = require("../models/User");
const { AppError } = require("../utils/helpers");

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  // Update last login
  User.findByIdAndUpdate(user._id, { lastLogin: new Date() }).exec();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
};

exports.register = async (userData) => {
  const { name, email, password, role } = userData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("Email already registered", 409);
  }

  const user = await User.create({ name, email, password, role });
  return user;
};

exports.login = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.status === "inactive") {
    throw new AppError("Account is deactivated. Contact administrator.", 403);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  return user;
};

exports.sendTokenResponse = sendTokenResponse;
