import React, { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "./Layout.css";

const NAV = [
  { to: "/",        label: "Dashboard",  icon: "⬡",  exact: true },
  { to: "/records", label: "Records",    icon: "◈" },
  { to: "/users",   label: "Users",      icon: "◉",  adminOnly: true },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    logout();
    toast.success("Logged out");
    navigate("/login");
  };

  const roleColor = { admin: "var(--purple)", analyst: "var(--blue)", viewer: "var(--text-muted)" };

  return (
    <div className={`layout ${collapsed ? "layout--collapsed" : ""}`}>
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <span className="sidebar__logo-mark">F</span>
          </div>
          {!collapsed && (
            <div className="sidebar__brand-text">
              <span className="sidebar__brand-name">Finance<span className="text-accent">OS</span></span>
            </div>
          )}
          <button className="sidebar__toggle" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? "›" : "‹"}
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `sidebar__link ${isActive ? "sidebar__link--active" : ""}`}
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar__link-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__user">
          <div className="sidebar__avatar" style={{ borderColor: roleColor[user?.role] }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          {!collapsed && (
            <div className="sidebar__user-info">
              <span className="sidebar__user-name">{user?.name}</span>
              <span className="sidebar__user-role" style={{ color: roleColor[user?.role] }}>
                {user?.role}
              </span>
            </div>
          )}
          <button className="sidebar__logout" onClick={handleLogout} title="Logout">⎋</button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
