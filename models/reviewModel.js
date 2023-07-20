const mongoose = require('mongoose');
const Tour = require('./tourModel');

const { Schema } = mongoose;
const reviewSchema = new Schema(
  {
    review: {
      type: String,
      required: [true, 'Please enter a review'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1'],
      max: [5, 'Rating must be below 5'],
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must have an author'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Calculating new avg rating whenever a review is posted
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  console.log(tourId);
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRatings: { $avg: '$rating' },
      },
    },
  ]);

  console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRatings,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

// Make each combination of tour and user unique, so 1 user can only post 1 review
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Calculating new avg rating whenever rating is updated or deleted
// We cannot get doc on query middleware so we run a post query here to get the doc and calc rating
// docs parameter gives the updated document
// this keyword points to curr query
reviewSchema.post(/^findOneAnd/, async (docs) => {
  await docs.constructor.calcAverageRatings(docs.tour);
});

// POST MIDDLEWARE DOES NOT GET NEXT
reviewSchema.post('save', function () {
  // Use this.constructor to refer to model(Review) since model is not defined yet
  this.constructor.calcAverageRatings(this.tour);
});

// eslint-disable-next-line prefer-arrow-callback
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
