const path = require('path'); // module for paths
const Review = require('../models/Review');
const Course = require('../models/Course');
const ErrorResponse = require('../utils/errorResponse'); //custom error response
const asyncHandler = require('../middleware/async'); //DRY Handler of the try catch


// @desc Get all Reviews
// @route GET /api/v1/reviews
// @route GET /api/v1/courses/:id/reviews
// @access PUBLIC
exports.getReviews = asyncHandler(async (request, response, next) => {
  if (request.params.id) {
    const reviews = await Review.find({ course: request.params.id });
    response.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    })
  } else {
    response.status(200).json(response.filteredResults);
  }
});

// @desc Get single Review
// @route GET /api/v1/reviews/:id
// @access PUBLIC
exports.getReview = asyncHandler(async (request, response, next) => {
  const review = await Review.find({ course: request.params.id }).populate({
    path: 'course',
    select: 'name description'
  });

  if (!review) {
    return next(new ErrorResponse(`No review found with id of ${request.params.id}`, 404));
  }

  response.status(200).json({
    success: true,
    data: review
  });
});

// @desc Add Review
// @route POST /api/v1/course/:id/reviews
// @access PRIVATE
exports.addReview = asyncHandler(async (request, response, next) => {
  request.body.course = request.params.id;
  request.body.user = request.user.id;

  const course = await Course.findById(request.params.id);

  if (!course) {
    return next(new ErrorResponse(`No course found with id of ${request.params.id}`, 404));
  }

  const review = await Review.create(request.body);

  response.status(200).json({
    success: true,
    data: review
  });
});

// @desc Update Review
// @route PUT /api/v1/reviews/:id
// @access PRIVATE
exports.updateReview = asyncHandler(async (request, response, next) => {
  let review = await Review.findById(request.params.id);

  if (!review) {
    return next(new ErrorResponse(`No review found with id of ${request.params.id}`, 404));
  }

  if (review.user.toString() !== request.user.id && request.user.role !== 'admin') {
    return next(new ErrorResponse(`Not authorized to update review`, 401));
  }

  review = await Review.findByIdAndUpdate(request.params.id, request.body, {
    new: true, 
    runValidators: true
  }); 

  response.status(200).json({
    success: true,
    data: review
  });
});

// @desc Delete Review
// @route DELETE /api/v1/reviews/:id
// @access PRIVATE
exports.deleteReview = asyncHandler(async (request, response, next) => {
  const review = await Review.findById(request.params.id);

  if (!review) {
    return next(new ErrorResponse(`No review found with id of ${request.params.id}`, 404));
  }

  if (review.user.toString() !== request.user.id && request.user.role !== 'admin') {
    return next(new ErrorResponse(`Not authorized to update review`, 401));
  }

  await review.remove();

  response.status(200).json({
    success: true,
    data: {}
  });
});