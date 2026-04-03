import React, { useState, useEffect, useCallback } from "react";
import { usersAPI } from "../api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { format } from "date-fns";
import "./UsersPage.css";

const EMPTY_FORM = { name: "", email: "", password: "", role: "viewer", status: "active" };

// ── User Modal ────────────────────────────────────────────────────────────────
function UserModal({ user, onClose, onSave }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState(
    isEdit
      ? { name: user.name, email: user.email, role: user.role, status: user.status, password: "" }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!isEdit && !form.email) e.email = "Email is required";
    if (!isEdit && !form.password) e.password = "Password is required";
    if (!isEdit && form.password && form.password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      if (isEdit) {
        await usersAPI.update(user._id, payload);
        toast.success("User updated");
      } else {
        await usersAPI.create(payload);
        toast.success("User created");
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? "Edit User" : "Create User"}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Jane Smith"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="jane@company.com"
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{isEdit ? "New Password (leave blank to keep)" : "Password"}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={isEdit ? "••••••••" : "Min 6 characters"}
              minLength={isEdit ? undefined : 6}
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {isEdit && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>

          {/* Role info hint */}
          <div className="user-modal__role-hint">
            {form.role === "viewer"  && "👀 Viewer — can only view records and dashboard summary"}
            {form.role === "analyst" && "📊 Analyst — can view records + access insights and trends"}
            {form.role === "admin"   && "⚙️ Admin — full access: create, edit, delete records and manage users"}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving…</> : (isEdit ? "Save Changes" : "Create User")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Permissions info panel ────────────────────────────────────────────────────
const PERM_TABLE = [
  { action: "View records & dashboard",   viewer: true,  analyst: true,  admin: true  },
  { action: "View insights & trends",     viewer: false, analyst: true,  admin: true  },
  { action: "Create financial records",   viewer: false, analyst: false, admin: true  },
  { action: "Edit financial records",     viewer: false, analyst: false, admin: true  },
  { action: "Delete financial records",   viewer: false, analyst: false, admin: true  },
  { action: "Manage users",              viewer: false, analyst: false, admin: true  },
];

function PermissionsPanel() {
  return (
    <div className="card users-perms">
      <h3 className="users-perms__title">Role Permissions</h3>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th style={{ textAlign: "center" }}>Viewer</th>
              <th style={{ textAlign: "center" }}>Analyst</th>
              <th style={{ textAlign: "center" }}>Admin</th>
            </tr>
          </thead>
          <tbody>
            {PERM_TABLE.map((row) => (
              <tr key={row.action}>
                <td style={{ color: "var(--text-secondary)" }}>{row.action}</td>
                {["viewer", "analyst", "admin"].map((role) => (
                  <td key={role} style={{ textAlign: "center" }}>
                    <span style={{ color: row[role] ? "var(--green)" : "var(--red)", fontSize: "1rem" }}>
                      {row[role] ? "✓" : "✗"}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]         = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters]     = useState({ role: "", status: "", page: 1, limit: 10 });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ""));
      const { data } = await usersAPI.getAll(params);
      setUsers(data.data);
      setPagination({ page: data.pagination.page, totalPages: data.pagination.totalPages, total: data.total });
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDeactivate = async () => {
    if (!deleteTarget) return;
    try {
      await usersAPI.delete(deleteTarget._id);
      toast.success("User deactivated");
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to deactivate");
    }
  };

  const setFilter = (key, val) => setFilters((p) => ({ ...p, [key]: val, page: 1 }));

  return (
    <div className="users-page fade-up">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">{pagination.total} registered users</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setModal("create")}>
            + New User
          </button>
        </div>
      </div>

      <div className="users-layout">
        <div className="users-main">
          {/* Filters */}
          <div className="card users-filters">
            <div className="users-filters__row">
              <select value={filters.role} onChange={(e) => setFilter("role", e.target.value)}>
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="analyst">Analyst</option>
                <option value="viewer">Viewer</option>
              </select>
              <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {(filters.role || filters.status) && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setFilters({ role: "", status: "", page: 1, limit: 10 })}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* User cards */}
          {loading ? (
            <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">◉</div>
              <p className="empty-state-text">No users found.</p>
            </div>
          ) : (
            <div className="users-grid">
              {users.map((u) => (
                <div className="user-card" key={u._id}>
                  <div className="user-card__header">
                    <div className="user-card__avatar" data-role={u.role}>
                      {u.name[0].toUpperCase()}
                    </div>
                    <div className="user-card__info">
                      <span className="user-card__name">
                        {u.name}
                        {u._id === currentUser?._id && (
                          <span className="user-card__you">you</span>
                        )}
                      </span>
                      <span className="user-card__email">{u.email}</span>
                    </div>
                  </div>

                  <div className="user-card__meta">
                    <span className={`badge badge-${u.role}`}>{u.role}</span>
                    <span className={`badge badge-${u.status}`}>{u.status}</span>
                  </div>

                  <div className="user-card__footer">
                    <span className="user-card__date mono">
                      Joined {format(new Date(u.createdAt), "dd MMM yyyy")}
                    </span>
                    <div className="user-card__actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)}>Edit</button>
                      {u._id !== currentUser?._id && u.status === "active" && (
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(u)}>
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
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

        {/* Permissions sidebar */}
        <div className="users-sidebar">
          <PermissionsPanel />
        </div>
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <UserModal
          user={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchUsers(); }}
        />
      )}

      {/* Deactivate confirm */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <span className="modal-title" style={{ color: "var(--red)" }}>Deactivate User?</span>
              <button className="modal-close" onClick={() => setDeleteTarget(null)}>✕</button>
            </div>
            <p style={{ color: "var(--text-secondary)", marginBottom: 20, fontSize: "0.9rem" }}>
              <strong style={{ color: "var(--text-primary)" }}>{deleteTarget.name}</strong> will lose access
              to the system. You can reactivate them later by editing the user.
            </p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeactivate}>Yes, deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
