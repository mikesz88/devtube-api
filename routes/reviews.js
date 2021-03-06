const express = require('express');
const filteredResults = require('../middleware/filteredResults');
const Review = require('../models/Review');

const router = express.Router({ mergeParams: true });
const { protect, authorize } = require('../middleware/auth');

const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview
} = require('../controllers/reviews');

// const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(filteredResults(Review), getReviews)
  .post(protect, authorize('user', 'admin'), addReview);

router.route('/:id')
  .get(getReview)
  .put(protect, authorize('user', 'admin'), updateReview)
  .delete(protect, authorize('user', 'admin'), deleteReview);

  module.exports = router;