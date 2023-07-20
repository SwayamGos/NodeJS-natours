const mongoose = require('mongoose');
const slugify = require('slugify');
// eslint-disable-next-line no-unused-vars
const validator = require('validator');

const { Schema } = mongoose;
const tourSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour must have under 40 characters'],
      minLength: [10, 'A tour must have atleast 10 characters'],
    },
    slug: {
      type: String,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a Group Size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulty is either easy, medium or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1'],
      max: [5, 'Rating must be below 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      // Use this to write custom validator.
      // This returns true/fale and val is the pricediscount user entered
      // This wont work when updating since this keyword only has access to newly created docs
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, //always hides this field from client
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    // Will use geospatial data for locations. Mongo has a format for geospatial data called geoJSON
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // Using child referencing so all guide references are here
    guides: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  // Schema option which gives virtuals as a part of the o/p each time the data is returned as an object or JSON
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Use indexes to make searches faster
// tourSchema.index({ price: 1 });
// Sorts the db in ascending order and stores it as an index

// Compound Index: Index with multiple fields
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
// Need this for geospatial query to work
tourSchema.index({ startLocation: '2dsphere' });

// Virtual Properties: Properties of the Schema that aren't stored in the db to save space. Useful when they can easily be derived from some other property
// You can NOT use virtual properties in a query
tourSchema.virtual('durationweeks').get(function () {
  return this.duration / 7;
});
// Don't use arrow func because you need 'this' keyword
// VIRTUAL POPULATION:
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour', //field in the review db where tour is referenced
  localField: '_id', //the value of 'tour' in Review db is stored in '_id' here
});

// Mongoose has middleware too which works on the document before or after a certain event

// this executes BEFORE the save() and create() commands, hence it is pre middleware
// This is a document middleware, so the this keyword here would return the document
tourSchema.pre('save', function (next) {
  // creating a slug for each tour
  this.slug = slugify(this.name, { lower: true });
  next();
});

// this executes AFTER the save() and create() commands, hence it is post middleware
// Post middleware also has access to doc parameter, which is the document that was just saved
// Only executes after all pre middleware is done executing

// eslint-disable-next-line prefer-arrow-callback
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// You can have multiple pre or post middlewares for the same hook, i.e. 'save' hook here

// QUERY MIDDLEWARE: Middleware running before or after a query
// This will hide any secret tours before giving the query result
// This will run for any func with find in it's name, findOne etc.
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  // this keyword points to the current query
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt -passwordResetExpires -passwordResetToken',
  });

  next();
});

// post query middleware:
// eslint-disable-next-line prefer-arrow-callback
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseconds`);
  // console.log(docs);
  next();
});

// AGGREGATION MIDDLEWARE: Middleware running before or after a aggregation
// This will filter out the secret tours from stat calculations
// tourSchema.pre('aggregate', function (next) {
//   // this points to aggregation object
//   // adds a match stage to all aggregation pipelines to remove secret tours
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
