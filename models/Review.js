const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add title'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters'],
  },
  text: {
    type: String,
    required: [true, 'Please add text'],
    maxlength: [500, 'Name cannot be more than 500 characters'],
  },
  rating: {
    type: Number,
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot be more than 5"]
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: [true, 'Please add a course Id']
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  }
});

ReviewSchema.index({ course: 1, user: 1}, { unique: true })

module.exports = mongoose.model('Review', ReviewSchema);