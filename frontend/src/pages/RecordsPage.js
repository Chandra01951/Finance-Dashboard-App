import React, { useState, useEffect, useCallback } from "react";
import { recordsAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { format } from "date-fns";
import "./RecordsPage.css";

const CATEGORIES = [
  "salary","freelance","investment","business",
  "food","transport","utilities","rent","healthcare",
  "entertainment","education","shopping","travel","other",
];

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const EMPTY_FORM = { amount: "", type: "expense", category: "food", date: format(new Date(), "yyyy-MM-dd"), note: "" };

// ── Modal ─────────────────────────────────────────────────────────────────────
function RecordModal({ record, onClose, onSave }) {
  const [form, setForm] = useState(record ? {
    amount:   record.amount,
    type:     record.type,
    category: record.category,
    date:     format(new Date(record.date), "yyyy-MM-dd"),
    note:     record.note || "",
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = "Valid positive amount required";
    if (!form.type) e.type = "Type is required";
    if (!form.category) e.category = "Category is required";
    if (!form.date) e.date = "Date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (record) {
        await recordsAPI.update(record._id, payload);
        toast.success("Record updated");
      } else {
        await recordsAPI.create(payload);
        toast.success("Record created");
      }
      onSave();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{record ? "Edit Record" : "New Record"}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number" min="0.01" step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
              />
              {errors.amount && <span className="form-error">{errors.amount}</span>}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
              {errors.category && <span className="form-error">{errors.category}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              {errors.date && <span className="form-error">{errors.date}</span>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Note</label>
            <input type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional description…" maxLength={500} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : (record ? "Save Changes" : "Create Record")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RecordsPage() {
  const { isAdmin } = useAuth();
  const [records, setRecords]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null); // null | "create" | record object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters]     = useState({ type: "", category: "", startDate: "", endDate: "", page: 1, limit: 10, sortBy: "date", order: "desc" });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
      const { data } = await recordsAPI.getAll(params);
      setRecords(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages, total: data.total });
    } catch {
      toast.error("Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await recordsAPI.delete(deleteTarget._id);
      toast.success("Record deleted");
      setDeleteTarget(null);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const setFilter = (key, val) => setFilters((p) => ({ ...p, [key]: val, page: 1 }));

  return (
    <div className="records-page fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Records</h1>
          <p className="page-subtitle">{pagination.total} total transactions</p>
        </div>
        <div className="page-actions">
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setModal("create")}>
              + New Record
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card records-filters">
        <div className="records-filters__grid">
          <select value={filters.type} onChange={(e) => setFilter("type", e.target.value)}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={filters.category} onChange={(e) => setFilter("category", e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <input type="date" value={filters.startDate} onChange={(e) => setFilter("startDate", e.target.value)} placeholder="From date" />
          <input type="date" value={filters.endDate}   onChange={(e) => setFilter("endDate",   e.target.value)} placeholder="To date" />
          <select value={filters.sortBy} onChange={(e) => setFilter("sortBy", e.target.value)}>
            <option value="date">Sort: Date</option>
            <option value="amount">Sort: Amount</option>
            <option value="category">Sort: Category</option>
          </select>
          <select value={filters.order} onChange={(e) => setFilter("order", e.target.value)}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>
        {(filters.type || filters.category || filters.startDate || filters.endDate) && (
          <button className="btn btn-ghost btn-sm records-filters__clear"
            onClick={() => setFilters({ type:"", category:"", startDate:"", endDate:"", page:1, limit:10, sortBy:"date", order:"desc" })}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card records-table-card">
        {loading ? (
          <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">◈</div>
            <p className="empty-state-text">No records found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Note</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  {isAdmin && <th style={{ textAlign: "center" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id}>
                    <td className="mono" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {format(new Date(r.date), "dd MMM yyyy")}
                    </td>
                    <td><span className={`badge badge-${r.type}`}>{r.type}</span></td>
                    <td><span className="dash__category">{r.category}</span></td>
                    <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text-secondary)" }}>
                      {r.note || <span className="text-muted">—</span>}
                    </td>
                    <td className="mono" style={{ textAlign: "right", color: r.type === "income" ? "var(--green)" : "var(--red)", fontWeight: 600 }}>
                      {r.type === "income" ? "+" : "−"}{fmt(r.amount)}
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: "center" }}>
                        <div className="records-actions">
                          <button className="btn btn-ghost btn-sm" onClick={() => setModal(r)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(r)}>Del</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="records-pagination">
            <button className="btn btn-ghost btn-sm"
              disabled={filters.page <= 1}
              onClick={() => setFilters((p) => ({ ...p, page: p.page - 1 }))}>
              ← Prev
            </button>
            <span className="records-pagination__info mono">
              Page {filters.page} of {pagination.totalPages}
            </span>
            <button className="btn btn-ghost btn-sm"
              disabled={filters.page >= pagination.totalPages}
              onClick={() => setFilters((p) => ({ ...p, page: p.page + 1 }))}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <RecordModal
          record={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchRecords(); }}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: "var(--red)" }}>Delete Record?</span>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <p style={{ color: "var(--text-secondary)", marginBottom: 20, fontSize: "0.9rem" }}>
              This will soft-delete the <strong style={{ color: "var(--text-primary)" }}>{deleteTarget.category}</strong> record
              of <strong style={{ color: deleteTarget.type === "income" ? "var(--green)" : "var(--red)" }}>{fmt(deleteTarget.amount)}</strong>.
              This action can be reversed from the database.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
