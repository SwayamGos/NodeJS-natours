module.exports = (fn) => (req, res, next) => {
  fn(req, res, next).catch((err) => next(err));
};
// This returns fn with the catch block when catchasync is called in the create tour so there is no need for try/catch
