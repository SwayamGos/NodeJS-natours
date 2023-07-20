// All auth functions will be handled here
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const signToken = (id) =>
  jwt.sign(
    {
      id, //paylaod
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    }
  );

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // Send JWT using a cookie so hacker cannot forge the token
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // Remove password from json
  user.password = undefined;

  res.status(statusCode).json({
    status: `success`,
    token, //giving the jwt back to the user
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  // Send the jwt to user after they signup
  // This takes in the id as input for payload, the secret as input and the jwt expires after the guven expiresIn time so the user has to login again
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  // First get email and password from user
  const { email, password } = req.body;

  // Check if email and password actually exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // console.log(email, password);

  // Check if user exists && password is correct
  // Password selected explicitly since it is not originally in the output
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Please provide valid email and password!', 401));
  }

  // If all okay, send jwt back to client
  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// middleware to give access of certain routes to only logged in users
exports.protect = catchAsync(async (req, res, next) => {
  // GET THE TOKEN AND CHECK IF IT EXISTS
  let token;
  // check first if token is present in content header of request
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) return next(new AppError('Please login to get access!', 401));

  // VERIFY THE TOKEN
  // this verify func doesn't return a promise so it is promisified
  // decoded stores the decoded jwt
  // This verifies the token since the id will change if token has been manipulated
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Check if user still exists
  const currUser = await User.findById(decoded.id);
  if (!currUser) return next(new AppError('User no longer exists!', 401));

  // Check if user changed password after jwt was issued
  // console.log(currUser.changedPasswordAfter(decoded.iat));
  if (currUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please login again!', 401)
    );
  }

  // GRANT ACCESS IF ALL OKAY
  req.user = currUser;
  res.locals.user = currUser;
  next();
});

// Only for rendered pages, no errros
exports.isLoggedIn = async (req, res, next) => {
  // GET THE TOKEN AND CHECK IF IT EXISTS
  if (req.cookies.jwt) {
    try {
      const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRET);

      // Check if user still exists
      const currUser = await User.findById(decoded.id);
      if (!currUser) return next();

      // Check if user changed password after jwt was issued
      // console.log(currUser.changedPasswordAfter(decoded.iat));
      if (currUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      // THERE IS A LOGGED IN USER
      // All pug templates get req.locals
      res.locals.user = currUser;
      // console.log(res.locals.user);
      return next();
    } catch (err) {
      return next();
    }
  }
  next();
};

// We need to pass the roles but middleware doesnt get params so we will make a closure
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // a user gets acces if his role is passed in roles array
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // GET USER FROM EMAIL
  const user = await User.findOne({ email: req.body.email });
  if (!user) return next(new AppError('No user with that email exists.', 404));

  // GENERATE A RANDOM RESET TOKEN
  const resetToken = user.createPasswordResetToken();
  // This is to disable all validators
  await user.save({ validateBeforeSave: false });

  // SEND IT TO THE USER'S EMAIL
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  try {
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Your password reset token (valid for 10mins).',
    //   message: message,
    // });
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('Error sending email. Please try again later!', 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // GET USER BASED ON TOKEN
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // SET NEW PWORD ONLY IF TOKEN IS NOT EXPIRED AND USER EXISTS
  if (!user) return next(new AppError('Token is invalid or has expired!', 400));

  // UPDATE CHANGED PASSWORD FOR USER
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // UPDATE passwordChangedAt PROPERTY FOR THE USER (Done in middleware)
  // LOG THE USER IN, SEND JWT TO CLIENT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // GET USER FROM COLLECTION
  const user = await User.findById(req.user.id).select('+password');

  // CHECK IF POSTED CURRENT PASSWORD IS CORRECT
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('Current password is Wrong.', 401));

  // IF YES UPDATE PASSWORD
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // LOG USER IN, SEND NEW TOKEN
  createSendToken(user, 200, res);
});
