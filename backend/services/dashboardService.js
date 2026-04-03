const Record = require("../models/Record");

// ─── Core Summary ─────────────────────────────────────────────────────────────
exports.getSummary = async () => {
  const result = await Record.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: "$type",
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const income = result.find((r) => r._id === "income") || { total: 0, count: 0 };
  const expense = result.find((r) => r._id === "expense") || { total: 0, count: 0 };

  return {
    totalIncome: income.total,
    totalExpense: expense.total,
    netBalance: income.total - expense.total,
    totalRecords: income.count + expense.count,
    incomeCount: income.count,
    expenseCount: expense.count,
  };
};

// ─── Category-wise Breakdown ──────────────────────────────────────────────────
exports.getCategoryBreakdown = async () => {
  const results = await Record.aggregate([
    { $match: { isDeleted: false } },
    {
      $group: {
        _id: { category: "$category", type: "$type" },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.category",
        breakdown: {
          $push: {
            type: "$_id.type",
            total: "$total",
            count: "$count",
          },
        },
        categoryTotal: { $sum: "$total" },
      },
    },
    { $sort: { categoryTotal: -1 } },
  ]);

  // Format into a clean structure
  return results.map((r) => ({
    category: r._id,
    total: r.categoryTotal,
    income: r.breakdown.find((b) => b.type === "income")?.total || 0,
    expense: r.breakdown.find((b) => b.type === "expense")?.total || 0,
    transactionCount: r.breakdown.reduce((sum, b) => sum + b.count, 0),
  }));
};

// ─── Monthly Trends (last 12 months) ─────────────────────────────────────────
exports.getMonthlyTrends = async () => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const results = await Record.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: { year: "$_id.year", month: "$_id.month" },
        data: {
          $push: {
            type: "$_id.type",
            total: "$total",
            count: "$count",
          },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return results.map((r) => ({
    year: r._id.year,
    month: r._id.month,
    monthName: monthNames[r._id.month - 1],
    label: `${monthNames[r._id.month - 1]} ${r._id.year}`,
    income: r.data.find((d) => d.type === "income")?.total || 0,
    expense: r.data.find((d) => d.type === "expense")?.total || 0,
    net: (r.data.find((d) => d.type === "income")?.total || 0) -
         (r.data.find((d) => d.type === "expense")?.total || 0),
    transactionCount: r.data.reduce((sum, d) => sum + d.count, 0),
  }));
};

// ─── Weekly Trends (last 7 weeks) ────────────────────────────────────────────
exports.getWeeklyTrends = async () => {
  const sevenWeeksAgo = new Date();
  sevenWeeksAgo.setDate(sevenWeeksAgo.getDate() - 49);

  const results = await Record.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: sevenWeeksAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: "$date" },
          week: { $isoWeek: "$date" },
          type: "$type",
        },
        total: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: { year: "$_id.year", week: "$_id.week" },
        data: {
          $push: { type: "$_id.type", total: "$total", count: "$count" },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.week": 1 } },
  ]);

  return results.map((r) => ({
    year: r._id.year,
    week: r._id.week,
    label: `Week ${r._id.week}, ${r._id.year}`,
    income: r.data.find((d) => d.type === "income")?.total || 0,
    expense: r.data.find((d) => d.type === "expense")?.total || 0,
    net: (r.data.find((d) => d.type === "income")?.total || 0) -
         (r.data.find((d) => d.type === "expense")?.total || 0),
  }));
};

// ─── Recent Transactions ──────────────────────────────────────────────────────
exports.getRecentActivity = async (limit = 10) => {
  return await Record.find({ isDeleted: false })
    .populate("createdBy", "name")
    .sort({ date: -1 })
    .limit(limit)
    .select("amount type category date note createdBy createdAt");
};

// ─── Full Dashboard (single call) ─────────────────────────────────────────────
exports.getFullDashboard = async () => {
  const [summary, categoryBreakdown, monthlyTrends, weeklyTrends, recentActivity] =
    await Promise.all([
      exports.getSummary(),
      exports.getCategoryBreakdown(),
      exports.getMonthlyTrends(),
      exports.getWeeklyTrends(),
      exports.getRecentActivity(10),
    ]);

  return { summary, categoryBreakdown, monthlyTrends, weeklyTrends, recentActivity };
};
