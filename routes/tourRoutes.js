const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

// For this route, tourRoutes sends it to reviewRouter
router.use('/:tourId/reviews', reviewRouter);

// Param middleware- Middleware that only gets called for certain parameters in the URL
// Also this will only work for tour routes
// router.param('id', tourController.checkId);

// ALIASING: A common route for a very popular page:
// Use a middleware to manipulate the query object first before passing it to the get func
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

// Router for aggregation pipeline:
router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );
// the authcontroller.protect func only allows authorised users to access that route

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    tourController.deleteTour
  );

// Nested routes: We will make a nested route for the review with the tour id in the URL
// POST: /tour/2627365762/reviews
// GET: /tour/2627365762/reviews
// GET: /tour/2627365762/reviews/72163726

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );

module.exports = router;
