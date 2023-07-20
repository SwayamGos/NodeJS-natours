const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// );

// Now since the server is built on app, app needs to accept tourRouter as a router
// For this just make tourRouter a middleware

// We can filter data using a query string. Example:
// 127.0.0.1:3000/api/v1/tours?duration=5&difficulty=easy
// This will filter with duration 5 and difficulty easy
// req.query gives all the query strings in the url

// Aliasing Middleware:
exports.aliasTopTours = async (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour, 'reviews');
exports.getTour = factory.getOne(Tour, 'reviews');

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   if (!tour) {
//     return next(new AppError('No tour found with that ID', 404));
//   }

//   res.status(204).json({
//     status: `success`,
//     data: null,
//   });
// });

// Aggregation pipeline for calculating some stats:
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      // Only gives the tours w/ rating greater than equal 4.5
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    // This group gives no.of tours, avg ratings,no. of rating, avg price, min price, max price of all tours
    // id: difficulty makes 3 groups of easy, medium, difficult, with all stats defined separately for each grp
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        averageRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      // sorts the groups by avg price
      $sort: { avgPrice: 1 },
    },
  ]);

  res.status(200).json({
    status: `success`,
    data: {
      stats,
    },
  });
});

// Counting the no. of tours in each month of a given year
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  // console.log(req.params);

  // Unwind separates the start dates, so each tour will have only one start date and tours with multiple start dates will be broken into multiple tours
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    // Only display tours that are in 2021
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    // Group the tours of 2021 by month
    {
      $group: {
        // Extract the month from the dates and then groups with the month
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      // Adds new field
      $addFields: { month: '$_id' },
    },
    {
      // Hides the id
      $project: { _id: 0 },
    },
    {
      // sorts the months by most tours
      $sort: { numTourStarts: -1 },
    },
    {
      // Limits no. of outputs
      $limit: 12,
    },
  ]);

  res.status(200).json({
    status: `success`,
    data: {
      plan,
    },
  });
});

// SAMPLE URL: /tours-within/233/center/-40,45/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng)
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );

  // console.log(distance, lat, lng, unit);

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng)
    return next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      distances,
    },
  });
});
