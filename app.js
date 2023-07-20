const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorcontroller');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// MIDDLEWARES

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// SETTING SECURITY HTTP HEADERS
// Further HELMET configuration for Security Policy (CSP)
// const scriptSrcUrls = [
//   'https://unpkg.com/',
//   'https://tile.openstreetmap.org',
//   'https://cdnjs.cloudflare.com',
// ];
// const styleSrcUrls = [
//   'https://unpkg.com/',
//   'https://tile.openstreetmap.org',
//   'https://fonts.googleapis.com/',
//   'https://cdnjs.cloudflare.com',
// ];
// const connectSrcUrls = [
//   'https://unpkg.com',
//   'https://tile.openstreetmap.org',
//   'https://cdnjs.cloudflare.com',
// ];
// const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: [],
//       connectSrc: ["'self'", ...connectSrcUrls],
//       scriptSrc: ["'self'", ...scriptSrcUrls],
//       styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//       workerSrc: ["'self'", 'blob:'],
//       objectSrc: [],
//       imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
//       fontSrc: ["'self'", ...fontSrcUrls],
//     },
//   })
// );

app.use(helmet({ contentSecurityPolicy: false }));

// GLOBAL RATE LIMITING MIDDLEWARE
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'You have been rate limited',
});
app.use('/api', limiter);

// BODY PARSER
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// DATA SANTITZATION AGAINST NOSQL QUERY INJECTION
app.use(mongoSanitize());

// DATA SANTITZATION AGAINST CROSSS SITE SCRIPTING(XSS)
app.use(xss());

// PREVENTING PARAMETER POLLUTION
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'price',
      'difficulty',
      'maxGroupSize',
    ],
  })
);

// REQUEST LOGGER
// console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
// Creating custom middleware
// You need the next argument to let express know it's a middleware
// app.use((req, res, next) => {
//   // console.log('Hello from the middleware!');
//   next();
// });

app.use(compression());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// ROUTES:
// app.get('/api/v1/tours', getAllTours);
// app.get('/api/v1/tours/:id', getTour);
// app.post('/api/v1/tours', postNewTour);
// app.patch('/api/v1/tours/:id', patchTour);
// app.delete('/api/v1/tours/:id', deleteTour);

// An even better way of defining routes:

// Implementing multiple routers

app.use(`/`, viewRouter);
app.use(`/api/v1/tours`, tourRouter);
app.use(`/api/v1/users`, userRouter);
app.use(`/api/v1/reviews`, reviewRouter);

// HANDLING UNHANDLED ROUTES:
// If a route ends up here, it means that neither the tours nor the user router was able to catch it, in this case it is handled here:
app.all(`*`, (req, res, next) => {
  // If next() has a parameter, express assumes error happened and directly goes to global error handling middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// This catches ALL urls which didnt enter tours or users router

// userRouter.route('/')
// .get(getAllUsers)
// .post(createUser);

// userRouter.route('/:id')
// .get(getUser)
// .patch(updateUser)
// .delete(deleteUser);

// MAKING A GLOBAL ERROR HANDLING MIDDLEWARE:
// The parameters already tell express that it is an error handling middleware
app.use(globalErrorHandler);

module.exports = app;

// REST API Architecture:
// 1. Separate api into logical resources
// 2. Expose structure, resource-based urls
// 3. Use HTTP Methods(verbs)
// 4. Send data as JSON(usually)
// 5. Be stateless
