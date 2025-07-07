const User = require("../models/User");
const AppError = require("../utils/AppError");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const catchAsync = require("../utils/catchAsync");
const util = require('util');

// 🔐 Compare entered password with hashed password in DB
const verifyPassword = async (candidatePassword, userPassword) => {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// 🔑 Sign JWT token
const signToken = async (id, role, name, email, admissionStatus = null) => {
  return jwt.sign(
    { id, role, name, email, admissionStatus },
    process.env.JWT_KEY,
    { expiresIn: '900d' }
  );
};

exports.signToken = signToken;

// ✅ Login Controller
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  const isPasswordValid = await verifyPassword(password, user.password);

  if (!isPasswordValid) {
    console.log(`Login failed for ${email}: Incorrect password`);
    return next(new AppError('Incorrect password', 401));
  }

  const token = await signToken(user._id, user.roles, user.name, user.email, user.admissionStatus);

  res.status(200).json({
    status: 'SUCCESS',
    message: "Login successful",
    data: { user },
    token
  });
});

// ✅ Password Update Controller
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { password, newPassword, newPasswordConfirm } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError("User not found", 404));
  }

  const isCurrentPasswordCorrect = await verifyPassword(password, user.password);
  if (!isCurrentPasswordCorrect) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  user.password = hashedPassword;
  await user.save();

  res.status(200).json({
    status: "SUCCESS",
    message: "Password changed successfully"
  });
});

// ✅ Token Verification Middleware
exports.verifyToken = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in', 401));
  }

  const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_KEY);

  req.user = decoded; // Attach user info to request
  next();
});
