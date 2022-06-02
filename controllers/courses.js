const path = require('path'); // module for paths
const Course = require('../models/Course');
const ErrorResponse = require('../utils/errorResponse'); //custom error response
const asyncHandler = require('../middleware/async'); //DRY Handler of the try catch

// @desc Get all courses
// @route GET /api/v1/courses
// @access PUBLIC
exports.getCourses = asyncHandler(async (request, response, next) => {

  response.status(200).json(response.filteredResults);
});

// @desc Get single course
// @route GET /api/v1/courses/:id
// @access PUBLIC
exports.getCourse = asyncHandler(async (request, response, next) => {
    const course = await Course.findById(request.params.id);
    
    if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${request.params.id}`, 404));
    }

    response.status(200).json({ success: true, data: course });
});

// @desc Create new course
// @route POST /api/v1/courses
// @access PRIVATE
exports.createCourse = asyncHandler(async (request, response, next) => {

  request.body.user = request.user.id;
  const course = await Course.create(request.body);
  response.status(201).json({ success: true, data: course })

});

// @desc Update  single course
// @route PUT /api/v1/courses/:id
// @access PRIVATE
exports.updateCourse = asyncHandler(async (request, response, next) => {
    let course = await Course.findById(request.params.id);

    if (!course) {
      return next(new ErrorResponse(`Course not found with id of ${request.params.id}`, 404));
    }

    if (course.user.toString() !== request.user.id && request.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${request.params.id} is not authorized to update this course.`, 401));
    }

    course = await Course.findByIdAndUpdate(request.params.id, request.body, {
      new: true,
      runValidators: true,
    });

    response.status(200).json({ success: true, data: course });
});

// @desc Delete single course
// @route DELETE /api/v1/courses/:id
// @access PRIVATE
exports.deleteCourse = asyncHandler(async (request, response, next) => {
    const course = await Course.findById(request.params.id);
    
    if (!course) {
      return next(new ErrorResponse(`Course not found with id of ${request.params.id}`, 404));
    }

    if (course.user.toString() !== request.user.id && request.user.role !== 'admin') {
      return next(new ErrorResponse(`User ${request.params.id} is not authorized to delete this course.`, 401));
    }

    course.remove();

    response.status(200).json({ success: true, data: {} });
});

// @desc Upload Course Photo
// @route PUT /api/v1/courses/:id/photo
// @access PRIVATE
exports.courseUploadPhoto = asyncHandler(async (request, response, next) => {
  const course = await Course.findById(request.params.id);
  
  if (!course) {
    return next(new ErrorResponse(`Course not found with id of ${request.params.id}`, 404));
  }

  if (course.user.toString() !== request.user.id && request.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${request.params.id} is not authorized to upload a photo to this course.`, 401));
  }

  if (!request.files) {
    return next(new ErrorResponse(`Please upload a file`, 400));
  }

  const file = request.files.file;
  
  if (!file.mimetype.startsWith('image')) {
    return next(new ErrorResponse(`Please upload an image file`, 400));
  }

  if (file.size > process.env.MAX_FILE_SIZE) {
    return next(new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_SIZE} bytes`, 400));
  }

  file.name = `photo_${course._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async err => {
    if (err) {
    return next(new ErrorResponse(`Problem with the file upload`, 500));
    }
    await Course.findByIdAndUpdate(request.params.id, { photo: file.name})
    response.status(200).json({ success: true, data: file.name });
  })
});