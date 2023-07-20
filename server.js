const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err, '\n Shutting down:');
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => {
  console.log('DB Connection successful');
});

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message, '\n Shutting down:');
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('shutting down.');
  });
});
