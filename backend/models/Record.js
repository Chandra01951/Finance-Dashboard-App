const mongoose = require("mongoose");

const CATEGORIES = [
  "salary", "freelance", "investment", "business",
  "food", "transport", "utilities", "rent", "healthcare",
  "entertainment", "education", "shopping", "travel", "other",
];

const RecordSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    type: {
      type: String,
      required: [true, "Type is required"],
      enum: {
        values: ["income", "expense"],
        message: "Type must be income or expense",
      },
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: CATEGORIES,
        message: `Category must be one of: ${CATEGORIES.join(", ")}`,
      },
      lowercase: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, "Note cannot exceed 500 characters"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Soft delete support
    isDeleted: {
      type: Boolean,
      default: false,
      select: false, // Hidden by default from queries
    },
    deletedAt: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Compound index for efficient filtering by type + date
RecordSchema.index({ type: 1, date: -1 });
RecordSchema.index({ category: 1 });
RecordSchema.index({ createdBy: 1 });
RecordSchema.index({ date: -1 });

// ─── Query Middleware ─────────────────────────────────────────────────────────
// Automatically exclude soft-deleted records from all find queries
RecordSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

// ─── Statics ─────────────────────────────────────────────────────────────────
RecordSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model("Record", RecordSchema);
