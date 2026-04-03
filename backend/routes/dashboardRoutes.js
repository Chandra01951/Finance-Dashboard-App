const express = require("express");
const router = express.Router();
const {
  getDashboard, getSummary, getCategoryBreakdown,
  getMonthlyTrends, getWeeklyTrends, getRecentActivity,
} = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect);

// Available to all roles
router.get("/",               getDashboard);
router.get("/summary",        getSummary);
router.get("/recent",         getRecentActivity);

// Analyst + Admin only (deeper insights)
router.get("/categories",     authorize("analyst", "admin"), getCategoryBreakdown);
router.get("/trends/monthly", authorize("analyst", "admin"), getMonthlyTrends);
router.get("/trends/weekly",  authorize("analyst", "admin"), getWeeklyTrends);

module.exports = router;
