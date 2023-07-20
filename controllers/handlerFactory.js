const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');

// The FACTORY HANDLER is a simple functions that returns other functions
// Here,deleting any data(user, tour , review) will come here and factory handler will return appropriate function
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).json({
      status: `success`,
      data: null,
    });
  });

// THE ORIGINAL TOUR DELETE FUNCTION
// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);
//     if (!tour) {
//       return next(new AppError('No tour found with that ID', 404));
//     }
//     res.status(204).json({
//       status: `success`,
//       data: null,
//     });
//   });

// Factory function to update document:
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('No Document found with that ID', 404));
    }

    res.status(200).json({
      status: `success`,
      data: {
        doc,
      },
    });
  });

//   Factory function to create document:
exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newDoc = await Model.create(req.body);
    // console.log(newDoc);

    res.status(201).json({
      status: `success`,
      data: {
        doc: newDoc,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // req.params gives us the value of the variables in the url, here id is a variable
    // For optional parameters, use '?' instead of ':'
    // console.log(req.params);
    // const tour = tours.find((el) => el.id === req.params.id * 1);

    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError('No tour found with that ID', 404));
    }

    res.status(200).json({
      status: `success`,
      data: {
        doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    // Executing the query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const doc = await features.query;
    // console.log(tours);

    res.status(200).json({
      status: `success`,
      requestedAt: req.requestTime,
      results: doc.length,
      data: {
        doc,
      },
    });
  });
