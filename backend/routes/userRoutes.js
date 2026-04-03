const express = require("express");
const router = express.Router();
const {
  getAllUsers, getUserById, createUser,
  updateUser, deleteUser, getProfile, updateProfile,
} = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");
const {
  updateUserValidator, registerValidator, mongoIdValidator, validate,
} = require("../middleware/validators");

// All routes require login
router.use(protect);

// Self-service profile routes (any authenticated user)
router.get("/profile",  getProfile);
router.put("/profile",  updateUserValidator, validate, updateProfile);

// Admin-only user management
router.get("/",         authorize("admin"), getAllUsers);
router.post("/",        authorize("admin"), registerValidator, validate, createUser);
router.get("/:id",      authorize("admin"), mongoIdValidator, validate, getUserById);
router.put("/:id",      authorize("admin"), mongoIdValidator, updateUserValidator, validate, updateUser);
router.delete("/:id",   authorize("admin"), mongoIdValidator, validate, deleteUser);

module.exports = router;
