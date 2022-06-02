const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse'); //custom error response
const asyncHandler = require('../middleware/async'); //DRY Handler of the try catch

// @desc Get all users
// @route Get /api/v1/auth/users
// @access PRIVATE/admin
exports.getUsers = asyncHandler(async (request, response, next) => {

  response.status(200).json(response.filteredResults)
});

// @desc Get single user
// @route Get /api/v1/auth/users/:id
// @access PRIVATE/admin
exports.getUser = asyncHandler(async (request, response, next) => {
  const user = await User.findById(request.params.id);

  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }

  response.status(200).json({
    success: true, 
    data: user
  })
});

// @desc create user
// @route POST /api/v1/auth/users
// @access PRIVATE/admin
exports.createUser = asyncHandler(async (request, response, next) => {
  const user = await(User.create(request.body));

  response.status(200).json({
    success: true, 
    data: user
  })
});

// @desc Update user
// @route PUT /api/v1/auth/users/:id
// @access PRIVATE/admin
exports.updateUser = asyncHandler(async (request, response, next) => {
  const user = await(User.findByIdAndUpdate(request.params.id, request.body, {
    new: true,
    runValidators: true,
  }));

  response.status(200).json({
    success: true, 
    data: user
  })
});

// @desc Delete user
// @route PUT /api/v1/auth/users/:id
// @access PRIVATE/admin
exports.deleteUser = asyncHandler(async (request, response, next) => {
  const user = await(User.findByIdAndDelete(request.params.id));

  response.status(200).json({
    success: true, 
    data: {}
  })
});