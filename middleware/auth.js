const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse'); //custom error response
const asyncHandler = require('../middleware/async'); //DRY Handler of the try catch
const jwt = require('jsonwebtoken');

exports.protect = asyncHandler(async(request, response, next) => {
  let token;

  if (request.headers.authorization && request.headers.authorization.startsWith('Bearer')) {
    token = request.headers.authorization.split(' ')[1];
  } 
  // else if (request.cookies.token) {
  //   token = request.cookies.token;
  // }

  if (!token) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    request.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

exports.authorize = (...roles) => {
  return (request, response, next) => {
    if (!roles.includes(request.user.role)) {
      return next(new ErrorResponse(`User role ${request.user.role} is not authorized to access this route`, 403))
    }
    next();
  }
}