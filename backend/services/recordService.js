const Record = require("../models/Record");
const { AppError, buildQueryOptions, paginatedResponse } = require("../utils/helpers");

exports.getRecords = async (queryParams, res) => {
  const { filter, pagination, sort } = buildQueryOptions(queryParams);
  const { page, limit, skip } = pagination;

  const [records, total] = await Promise.all([
    Record.find(filter)
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Record.countDocuments(filter),
  ]);

  return paginatedResponse(res, records, total, page, limit);
};

exports.getRecordById = async (id) => {
  const record = await Record.findById(id).populate("createdBy", "name email");
  if (!record) {
    throw new AppError("Record not found", 404);
  }
  return record;
};

exports.createRecord = async (data, userId) => {
  const record = await Record.create({ ...data, createdBy: userId });
  return record;
};

exports.updateRecord = async (id, data, userId, userRole) => {
  const record = await Record.findById(id);
  if (!record) {
    throw new AppError("Record not found", 404);
  }

  // Admin can edit any record; others can only edit their own
  if (userRole !== "admin" && record.createdBy.toString() !== userId.toString()) {
    throw new AppError("Not authorized to update this record", 403);
  }

  // Prevent updating createdBy or system fields
  const { createdBy, isDeleted, deletedAt, ...safeData } = data;

  const updated = await Record.findByIdAndUpdate(id, safeData, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "name email");

  return updated;
};

exports.deleteRecord = async (id, userId, userRole) => {
  const record = await Record.findById(id);
  if (!record) {
    throw new AppError("Record not found", 404);
  }

  if (userRole !== "admin" && record.createdBy.toString() !== userId.toString()) {
    throw new AppError("Not authorized to delete this record", 403);
  }

  // Soft delete — sets isDeleted flag instead of removing from DB
  await Record.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: new Date(),
  });

  return true;
};
