import { useEffect, useState } from "react";
import { api } from "../api";
import Message from "../components/Message";

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadAccounts() {
    try {
      setLoading(true);
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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAccounts();
  }, []);

  async function createNewAccount() {
    try {
      setCreating(true);
      setError("");
      setMessage("");
      await api.createAccount();
      setMessage("Account created successfully.");
      await loadAccounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <small>YOUR ACCOUNTS</small>
          <h2>Accounts</h2>
          <p>View balances and create new accounts.</p>
        </div>

        <button
          className="primary-button small-button"
          onClick={createNewAccount}
          disabled={creating}
          type="button"
        >
          {creating ? "Creating..." : "Create account"}
        </button>
      </div>

      <Message>{error}</Message>
      <Message type="success">{message}</Message>

      {loading ? (
        <div className="empty-state">Loading accounts...</div>
      ) : accounts.length === 0 ? (
        <div className="empty-state">
          <h3>No accounts yet</h3>
          <p>Create your first account to begin.</p>
        </div>
      ) : (
        <div className="accounts-grid">
          {accounts.map((account, index) => (
            <article className="account-card" key={account._id}>
              <div className="account-card-header">
                <span>Account {index + 1}</span>
                <em>{account.status}</em>
              </div>

              <p>Account ID</p>
              <code>{account._id}</code>

              <div className="account-card-balance">
                <span>Available balance</span>
                <strong>
                  {(balances[account._id] || 0).toLocaleString()}
                </strong>
                <small>{account.currency || "INR"}</small>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
