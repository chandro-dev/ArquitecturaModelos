const AppError = require("../utils/AppError");

const validate = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!parsed.success) {
    return next(
      new AppError("Validation error", 400, parsed.error.issues.map((issue) => issue.message))
    );
  }

  req.validated = parsed.data;
  return next();
};

module.exports = validate;
