import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Message from "../components/Message";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      setError("Enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-visual-inner">
          <div className="brand light-brand">
            <div className="brand-mark light">BL</div>
            <strong>Bank Ledger</strong>
          </div>

          <h1>Manage accounts and transfers with confidence.</h1>
          <p>
            A clean full-stack ledger experience powered by React, Node.js,
            Express and MongoDB.
          </p>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-card">
          <div className="mobile-brand">
            <div className="brand-mark">BL</div>
            <strong>Bank Ledger</strong>
          </div>

          <small>WELCOME</small>
          <h2>Sign in to your account</h2>
          <p>Access your accounts, deposits and transfers.</p>

          <Message>{error}</Message>

          <form className="form-stack" onSubmit={submit}>
            <label className="field">
              <span>Email address</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((current) => ({ ...current, email: e.target.value }))
                }
                placeholder="name@example.com"
              />
            </label>

            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((current) => ({ ...current, password: e.target.value }))
                }
                placeholder="Enter your password"
              />
            </label>

            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="switch-link">
            New to Bank Ledger? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
