import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});

  useEffect(() => {
    async function load() {
      const data = await api.getAccounts();
      const list = data.accounts || [];
      setAccounts(list);

      const entries = await Promise.all(
        list.map(async (account) => {
          try {
            const result = await api.getBalance(account._id);
            return [account._id, Number(result.balance || 0)];
          } catch {
            return [account._id, 0];
          }
        })
      );

      setBalances(Object.fromEntries(entries));
    }

    load();
  }, []);

  const total = useMemo(
    () => Object.values(balances).reduce((sum, value) => sum + value, 0),
    [balances]
  );

  return (
    <section>
      <div className="hero">
        <div>
          <small>ACCOUNT OVERVIEW</small>
          <h2>Hello, {user?.name || "there"}</h2>
          <p>Manage your money from one secure workspace.</p>
        </div>

        <div className="hero-balance">
          <span>Total balance</span>
          <strong>{total.toLocaleString()}</strong>
          <small>{accounts[0]?.currency || "INR"}</small>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>Accounts</span>
          <strong>{accounts.length}</strong>
          <p>Active accounts linked to your profile</p>
        </div>

        <div className="summary-card">
          <span>Security</span>
          <strong>Protected</strong>
          <p>Account ownership verified on every request</p>
        </div>
      </div>

      <div className="action-grid">
        <Link className="action-card" to="/accounts">
          <div className="action-icon">▣</div>
          <h3>Accounts</h3>
          <p>View balances or create a new account.</p>
        </Link>

        <Link className="action-card" to="/deposit">
          <div className="action-icon">+</div>
          <h3>Deposit</h3>
          <p>Add funds to one of your active accounts.</p>
        </Link>

        <Link className="action-card" to="/transfer">
          <div className="action-icon">⇄</div>
          <h3>Transfer</h3>
          <p>Send funds to another active account.</p>
        </Link>
      </div>
    </section>
  );
}
