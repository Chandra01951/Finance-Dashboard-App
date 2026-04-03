// Custom error class with HTTP status code
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguishes from unexpected crashes
    Error.captureStackTrace(this, this.constructor);
  }
}

// Wraps async route handlers — eliminates try/catch boilerplate
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Build filter + pagination + sort object from query params
const buildQueryOptions = (queryParams) => {
  const {
    type, category, startDate, endDate,
    page = 1, limit = 10, sortBy = "date", order = "desc",
    search,
  } = queryParams;

  const filter = { isDeleted: false };

  if (type) filter.type = type;
  if (category) filter.category = category;
  if (search) filter.note = { $regex: search, $options: "i" };

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;
  const sort = { [sortBy]: order === "asc" ? 1 : -1 };

  return { filter, pagination: { page: pageNum, limit: limitNum, skip }, sort };
};

// Build standardized paginated response
const paginatedResponse = (res, data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return res.json({
    success: true,
    count: data.length,
    total,
    pagination: {
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    data,
  });
};

module.exports = { AppError, asyncHandler, buildQueryOptions, paginatedResponse };
