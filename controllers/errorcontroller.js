/* eslint-disable no-lonely-if */
const AppError = require('../utils/appError');

const handleDuplicateFieldsDb = (err) => {
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);
  const message = `Duplicate Field value: ${value}`;
  return new AppError(message, 400);
};

const handleInvalidDB = (err) => {
  const msg = `Invalid ${err.path}: ${err.value}`;
  return new AppError(msg, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const msg = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(msg, 400);
};

const handleJWTError = () =>
  new AppError('Invalid Token. Please login again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Token Expired. Please login again.', 401);

const sendErrorDev = (res, req, err) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  return res.status(err.statusCode).render('error', {
    title: 'Something went very wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (res, req, err) => {
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // Log error
    console.error('ERROR', err);

    // Code error
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
  if (err.isOperational) {
    res.status(err.statusCode).render('error', {
      title: 'Something went very wrong!',
      msg: err.message,
    });
  } else {
    // Log error
    console.error('ERROR', err);

    // Code error
    res.status(500).json({
      status: 'error',
      message: 'Please try again later!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(res, req, err);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;
    console.log(error);
    if (error.name === 'CastError') error = handleInvalidDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDb(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorProd(res, req, error);
  }
};
