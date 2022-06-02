const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse'); //custom error response
const asyncHandler = require('../middleware/async'); //DRY Handler of the try catch
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc Register User
// @route POST /api/v1/auth/register
// @access PUBLIC
exports.register = asyncHandler(async (request, response, next) => {
  const { name, email, password, role } = request.body;
  
  const user = await User.create({
    name, 
    email,
    password,
    role
  });

  sendTokenResponse(user, 200, response);
});

// @desc Login User
// @route POST /api/v1/auth/login
// @access PUBLIC
exports.login = asyncHandler(async (request, response, next) => {
  const { email, password } = request.body;
  
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password'));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  };

  sendTokenResponse(user, 200, response);
});

// @desc Logout User
// @route GET /api/v1/auth/logout
// @access PUBLIC
exports.logout = asyncHandler(async(request, response, next) => {
  console.log(response);
  response.cookie('token', 'none', {
    expires: new Date(Date.now() + 1 * 1000),
    httpOnly: true,
  })
  response.status(200).json({
    success: true,
    data: {}
  });
});

// @desc Get Logged in User
// @route GET /api/v1/auth/me
// @access PRIVATE
exports.getLoggedInUser = asyncHandler(async(request, response, next) => {
  const user = await User.findById(request.user.id);
  response.status(200).json({
    success: true,
    data: user
  });
});

// @desc Update User Details
// @route PUT /api/v1/auth/updatedetails
// @access PRIVATE
exports.updateDetails = asyncHandler(async(request, response, next) => {

  const fieldsToUpdated = {
    name: request.body.name,
    email: request.body.email,
  }

  const user = await User.findByIdAndUpdate(request.user.id, fieldsToUpdated, {
    new: true,
    runValidators: true,
  });

  response.status(200).json({
    success: true,
    data: user
  });
});

// @desc Update User Password
// @route PUT /api/v1/auth/updatepassword
// @access PRIVATE
exports.updatePassword = asyncHandler(async(request, response, next) => {

  const user = await User.findById(request.user.id).select('+password');

  if (!(await user.matchPassword(request.body.currentPassword))) {
    return next(new ErrorResponse('Password is incorrect', 401));
  }

  user.password = request.body.newPassword;
  await user.save();
  
  sendTokenResponse(user, 200, response);
});

// @desc Forgot Password
// @route POST /api/v1/auth/forgotPassword
// @access PRIVATE
exports.forgotPassword = asyncHandler(async(request, response, next) => {
  const user = await User.findOne({ email: request.body.email });

  if (!user) {
    return next(new ErrorResponse('There is no user with that email', 404));
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${request.protocol}://${request.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

  const message = `
    You are receiving this email because you (or someone else) has
    requested a password reset. Please a make [PUT] request to: 
    ${resetUrl}
  `;

  const options = {
    email: user.email,
    subject: 'Password Reset',
    message
  };

  try {
    await sendEmail(options);
    response.status(200).json({ success: true, data: 'Email sent'});
  } catch (error) {
    console.log(error);

    user.getResetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;

    await user.save({ validateBeforeSave: false });
    return next(new ErrorResponse('Email could not be sent', 500));
  }

  response.status(200).json({
    success: true,
    data: user
  });
});

// @desc Reset Password
// @route Put /api/v1/auth/resetpassword/:resettoken
// @access PUBLIC
exports.resetPassword = asyncHandler(async(request, response, next) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(request.params.resettoken)
    .digest('hex');


  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTokenExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid token', 400))
  }

  user.password = request.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, response);
})

const sendTokenResponse = (user, statusCode, response) => {
  const token = user.getSignedJwt();

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  response
    .status(statusCode)
    .cookie('token', token, options)
    .json({ success: true, token });
}