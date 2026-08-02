import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Message from "../components/Message";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError("Complete all required fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await register({
        name: form.name.trim(),
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
          <h1>Create your secure ledger profile.</h1>
          <p>
            Register once, then manage accounts and transactions from a clean,
            responsive dashboard.
          </p>
        </div>
      </section>

      <section className="auth-form-section">
        <div className="auth-card">
          <div className="mobile-brand">
            <div className="brand-mark">BL</div>
            <strong>Bank Ledger</strong>
          </div>

          <small>GET STARTED</small>
          <h2>Create your profile</h2>
          <p>Enter your information to continue.</p>

          <Message>{error}</Message>

          <form className="form-stack" onSubmit={submit}>
            <label className="field">
              <span>Full name</span>
              <input
                value={form.name}
                onChange={(e) =>
                  setForm((current) => ({ ...current, name: e.target.value }))
                }
                placeholder="Your full name"
              />
            </label>

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
                placeholder="Create a password"
              />
            </label>

            <label className="field">
              <span>Confirm password</span>
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    confirmPassword: e.target.value,
                  }))
                }
                placeholder="Enter password again"
              />
            </label>

            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Creating..." : "Create profile"}
            </button>
          </form>

          <p className="switch-link">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
