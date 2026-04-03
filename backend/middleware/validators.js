const { body, query, param, validationResult } = require("express-validator");
const Record = require("../models/Record");

// ─── Helper: run validation and respond with errors ───────────────────────────
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth Validators ─────────────────────────────────────────────────────────
exports.registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 50 }).withMessage("Name max 50 chars"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["viewer", "analyst", "admin"]).withMessage("Invalid role"),
];

exports.loginValidator = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

// ─── Record Validators ────────────────────────────────────────────────────────
exports.createRecordValidator = [
  body("amount")
    .notEmpty().withMessage("Amount is required")
    .isFloat({ min: 0.01 }).withMessage("Amount must be a positive number"),
  body("type")
    .notEmpty().withMessage("Type is required")
    .isIn(["income", "expense"]).withMessage("Type must be income or expense"),
  body("category")
    .notEmpty().withMessage("Category is required")
    .isIn(Record.schema.path("category").enumValues).withMessage("Invalid category"),
  body("date")
    .optional()
    .isISO8601().withMessage("Date must be a valid ISO date"),
  body("note")
    .optional()
    .isLength({ max: 500 }).withMessage("Note cannot exceed 500 characters"),
];

exports.updateRecordValidator = [
  body("amount").optional().isFloat({ min: 0.01 }).withMessage("Amount must be positive"),
  body("type").optional().isIn(["income", "expense"]).withMessage("Invalid type"),
  body("category").optional().isIn(Record.schema.path("category").enumValues).withMessage("Invalid category"),
  body("date").optional().isISO8601().withMessage("Invalid date"),
  body("note").optional().isLength({ max: 500 }).withMessage("Note max 500 chars"),
];

exports.recordQueryValidator = [
  query("type").optional().isIn(["income", "expense"]).withMessage("Invalid type filter"),
  query("category").optional().isIn(Record.schema.path("category").enumValues).withMessage("Invalid category filter"),
  query("startDate").optional().isISO8601().withMessage("startDate must be a valid date"),
  query("endDate").optional().isISO8601().withMessage("endDate must be a valid date"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be >= 1"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be 1–100"),
  query("sortBy").optional().isIn(["date", "amount", "category", "type"]).withMessage("Invalid sortBy"),
  query("order").optional().isIn(["asc", "desc"]).withMessage("Order must be asc or desc"),
];

// ─── User Validators ─────────────────────────────────────────────────────────
exports.updateUserValidator = [
  body("name").optional().trim().isLength({ max: 50 }).withMessage("Name max 50 chars"),
  body("role").optional().isIn(["viewer", "analyst", "admin"]).withMessage("Invalid role"),
  body("status").optional().isIn(["active", "inactive"]).withMessage("Invalid status"),
];

exports.mongoIdValidator = [
  param("id").isMongoId().withMessage("Invalid ID format"),
];
