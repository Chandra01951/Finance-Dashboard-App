import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import "./LoginPage.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err) {
      const msg = err.response?.data?.message || "Login failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin:   { email: "admin@finance.com",   password: "admin123" },
      analyst: { email: "analyst@finance.com", password: "analyst123" },
      viewer:  { email: "viewer@finance.com",  password: "viewer123" },
    };
    setForm(creds[role]);
    setError("");
  };

  return (
    <div className="login-page">
      {/* Background grid */}
      <div className="login-bg" aria-hidden="true">
        <div className="login-bg__grid" />
        <div className="login-bg__glow" />
      </div>

      <div className="login-card fade-up">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo">F</div>
          <h1 className="login-brand-name">Finance<span className="text-accent">OS</span></h1>
        </div>
        <p className="login-tagline">Financial intelligence for your organisation</p>

        {/* Demo quick-login */}
        <div className="login-demo">
          <span className="login-demo__label">Quick demo login</span>
          <div className="login-demo__btns">
            {["admin", "analyst", "viewer"].map((r) => (
              <button key={r} className={`login-demo__btn login-demo__btn--${r}`} onClick={() => fillDemo(r)}>
                {r}
              </button>
            ))}
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? <><span className="spinner" /> Signing in…</> : "Sign in →"}
          </button>
        </form>

        <p className="login-footer">
          New here? <Link to="/register">Create account</Link> • FinanceOS © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
