const express = require("express");
const router = express.Router();
const { register, login, getMe, logout } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { registerValidator, loginValidator, validate } = require("../middleware/validators");

router.post("/register", registerValidator, validate, register);
router.post("/login",    loginValidator,    validate, login);
router.get("/me",        protect,                     getMe);
router.post("/logout",   protect,                     logout);

module.exports = router;
