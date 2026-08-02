import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const items = [
  { to: "/dashboard", label: "Overview", icon: "⌂" },
  { to: "/accounts", label: "Accounts", icon: "▣" },
  { to: "/deposit", label: "Deposit", icon: "+" },
  { to: "/transfer", label: "Transfer", icon: "⇄" },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">BL</div>
          <div>
            <strong>Bank Ledger</strong>
            <span>Personal finance</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
              to={item.to}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button className="signout-button" onClick={handleLogout} type="button">
          Sign out
        </button>
      </aside>

      <div className="content-column">
        <header className="topbar">
          <div>
            <small>WELCOME BACK</small>
            <h1>Financial workspace</h1>
          </div>

          <div className="profile-chip">
            <div className="avatar">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{user?.name || "User"}</strong>
              <span>{user?.email}</span>
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
