const recordService = require("../services/recordService");
const { asyncHandler } = require("../utils/helpers");

// @desc    Get all records (with filters, pagination)
// @route   GET /api/records
// @access  Viewer, Analyst, Admin
exports.getRecords = asyncHandler(async (req, res) => {
  await recordService.getRecords(req.query, res);
});

// @desc    Get single record by ID
// @route   GET /api/records/:id
// @access  Viewer, Analyst, Admin
exports.getRecord = asyncHandler(async (req, res) => {
  const record = await recordService.getRecordById(req.params.id);
  res.json({ success: true, data: record });
});

// @desc    Create financial record
// @route   POST /api/records
// @access  Admin only
exports.createRecord = asyncHandler(async (req, res) => {
  const record = await recordService.createRecord(req.body, req.user._id);
  res.status(201).json({
    success: true,
    message: "Record created successfully",
    data: record,
  });
});

// @desc    Update financial record
// @route   PUT /api/records/:id
// @access  Admin only
exports.updateRecord = asyncHandler(async (req, res) => {
  const record = await recordService.updateRecord(
    req.params.id,
    req.body,
    req.user._id,
    req.user.role
  );
  res.json({ success: true, message: "Record updated", data: record });
});

// @desc    Soft delete financial record
// @route   DELETE /api/records/:id
// @access  Admin only
exports.deleteRecord = asyncHandler(async (req, res) => {
  await recordService.deleteRecord(req.params.id, req.user._id, req.user.role);
  res.json({ success: true, message: "Record deleted successfully" });
});

// @desc    Get available categories
// @route   GET /api/records/categories
// @access  All authenticated
exports.getCategories = asyncHandler(async (req, res) => {
  const Record = require("../models/Record");
  res.json({ success: true, data: Record.schema.path("category").enumValues });
});
