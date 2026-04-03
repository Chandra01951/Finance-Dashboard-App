const express = require("express");
const router = express.Router();
const {
  getRecords, getRecord, createRecord,
  updateRecord, deleteRecord, getCategories,
} = require("../controllers/recordController");
const { protect, authorize } = require("../middleware/auth");
const {
  createRecordValidator, updateRecordValidator,
  recordQueryValidator, mongoIdValidator, validate,
} = require("../middleware/validators");

// All routes require login
router.use(protect);

// Available to all authenticated roles
router.get("/categories", getCategories);
router.get("/",           recordQueryValidator, validate, getRecords);
router.get("/:id",        mongoIdValidator, validate, getRecord);

// Admin only — write operations
router.post("/",          authorize("admin"), createRecordValidator, validate, createRecord);
router.put("/:id",        authorize("admin"), mongoIdValidator, updateRecordValidator, validate, updateRecord);
router.delete("/:id",     authorize("admin"), mongoIdValidator, validate, deleteRecord);

module.exports = router;
