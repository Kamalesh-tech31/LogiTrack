// Global error handler
module.exports = (err, req, res, next) => {
  console.error(err);
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const stack = process.env.NODE_ENV === 'production' ? undefined : err.stack;
  res.status(status).json({ success: false, message, stack });
};
