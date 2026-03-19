const AppError = require("../utils/AppError");

const notFoundHandler = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (err, _req, res, _next) => {
  if (err.name === "CastError") {
    err.statusCode = 400;
    err.message = `Invalid identifier: ${err.path}`;
  }
  if (err.code === 11000) {
    err.statusCode = 409;
    err.message = "Duplicated resource";
  }

  const statusCode = err.statusCode || 500;
  const payload = {
    message: err.message || "Internal server error",
  };

  if (err.details) payload.details = err.details;
  if (process.env.NODE_ENV !== "production" && err.stack) payload.stack = err.stack;

  res.status(statusCode).json(payload);
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
