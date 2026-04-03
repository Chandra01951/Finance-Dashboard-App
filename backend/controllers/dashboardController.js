const dashboardService = require("../services/dashboardService");
const { asyncHandler } = require("../utils/helpers");

// @desc    Get full dashboard data in one call
// @route   GET /api/dashboard
// @access  All roles
exports.getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getFullDashboard();
  res.json({ success: true, data });
});

// @desc    Get summary totals
// @route   GET /api/dashboard/summary
// @access  All roles
exports.getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary();
  res.json({ success: true, data });
});

// @desc    Get category breakdown
// @route   GET /api/dashboard/categories
// @access  Analyst, Admin
exports.getCategoryBreakdown = asyncHandler(async (req, res) => {
  const data = await dashboardService.getCategoryBreakdown();
  res.json({ success: true, data });
});

// @desc    Get monthly trends
// @route   GET /api/dashboard/trends/monthly
// @access  Analyst, Admin
exports.getMonthlyTrends = asyncHandler(async (req, res) => {
  const data = await dashboardService.getMonthlyTrends();
  res.json({ success: true, data });
});

// @desc    Get weekly trends
// @route   GET /api/dashboard/trends/weekly
// @access  Analyst, Admin
exports.getWeeklyTrends = asyncHandler(async (req, res) => {
  const data = await dashboardService.getWeeklyTrends();
  res.json({ success: true, data });
});

// @desc    Get recent transactions
// @route   GET /api/dashboard/recent
// @access  All roles
exports.getRecentActivity = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const data = await dashboardService.getRecentActivity(limit);
  res.json({ success: true, count: data.length, data });
});
