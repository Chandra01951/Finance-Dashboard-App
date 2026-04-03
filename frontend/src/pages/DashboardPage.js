import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { dashboardAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import "./DashboardPage.css";

const fmt = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
const fmtShort = (n) => n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : n >= 1e3 ? `₹${(n/1e3).toFixed(1)}K` : `₹${n}`;

const PIE_COLORS = ["#f5a623","#22d3a0","#4f8ef7","#a78bfa","#f0566a","#38bdf8","#fb923c","#34d399","#e879f9"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="chart-tooltip__item" style={{ color: p.color }}>
          {p.name}: {fmtShort(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const { isAnalyst } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await dashboardAPI.getFull();
        setData(res.data.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="loading-screen" style={{ minHeight: "60vh" }}>
      <div className="spinner spinner-lg" />
      <span>Loading dashboard…</span>
    </div>
  );

  if (!data) return <div className="empty-state"><p>Failed to load dashboard data.</p></div>;

  const { summary, categoryBreakdown, monthlyTrends, recentActivity } = data;
  const balance = summary.netBalance;

  const summaryCards = [
    { label: "Total Income",   value: fmt(summary.totalIncome),   sub: `${summary.incomeCount} transactions`,  color: "var(--green)",  icon: "↑" },
    { label: "Total Expenses", value: fmt(summary.totalExpense),   sub: `${summary.expenseCount} transactions`, color: "var(--red)",    icon: "↓" },
    { label: "Net Balance",    value: fmt(Math.abs(balance)),      sub: balance >= 0 ? "Surplus" : "Deficit",   color: balance >= 0 ? "var(--green)" : "var(--red)", icon: "◈" },
    { label: "Total Records",  value: summary.totalRecords,        sub: "All transactions",                     color: "var(--accent)", icon: "⬡" },
  ];

  const expenseByCategory = (categoryBreakdown || [])
    .filter((c) => c.expense > 0)
    .sort((a, b) => b.expense - a.expense)
    .slice(0, 8);

  return (
    <div className="dash fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Financial overview — {format(new Date(), "MMMM yyyy")}</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="dash__cards">
        {summaryCards.map((card) => (
          <div className="dash__card" key={card.label} style={{ "--card-accent": card.color }}>
            <div className="dash__card-icon" style={{ color: card.color }}>{card.icon}</div>
            <div className="dash__card-body">
              <span className="dash__card-label">{card.label}</span>
              <span className="dash__card-value mono" style={{ color: card.color }}>{card.value}</span>
              <span className="dash__card-sub">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {isAnalyst && monthlyTrends?.length > 0 && (
        <div className="dash__charts">
          {/* Monthly trends */}
          <div className="card dash__chart-card">
            <h3 className="dash__chart-title">Monthly Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22d3a0" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22d3a0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f0566a" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f0566a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="monthName" tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#8ba0c0" }} />
                <Area type="monotone" dataKey="income"  name="Income"  stroke="#22d3a0" fill="url(#incomeGrad)"  strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#f0566a" fill="url(#expenseGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Expense by category pie */}
          <div className="card dash__chart-card dash__chart-card--sm">
            <h3 className="dash__chart-title">Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={expenseByCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  dataKey="expense"
                  nameKey="category"
                  paddingAngle={3}
                >
                  {expenseByCategory.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmtShort(v)} />
                <Legend
                  formatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                  wrapperStyle={{ fontSize: "11px", color: "#8ba0c0" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Net balance bar */}
          <div className="card dash__chart-card">
            <h3 className="dash__chart-title">Monthly Net Balance</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="monthName" tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtShort} tick={{ fill: "#4a6080", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="net" name="Net" radius={[4,4,0,0]}>
                  {monthlyTrends.map((entry, i) => (
                    <Cell key={i} fill={entry.net >= 0 ? "#22d3a0" : "#f0566a"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="card dash__recent">
        <h3 className="dash__chart-title">Recent Transactions</h3>
        {recentActivity?.length === 0 ? (
          <div className="empty-state"><p className="empty-state-text">No recent transactions</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th>Note</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity?.map((r) => (
                  <tr key={r._id}>
                    <td className="mono" style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {format(new Date(r.date), "dd MMM yyyy")}
                    </td>
                    <td>
                      <span className="dash__category">{r.category}</span>
                    </td>
                    <td>
                      <span className={`badge badge-${r.type}`}>{r.type}</span>
                    </td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.note || "—"}
                    </td>
                    <td className="mono" style={{ textAlign: "right", color: r.type === "income" ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                      {r.type === "income" ? "+" : "−"}{fmt(r.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
