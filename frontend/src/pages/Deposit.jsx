import { useEffect, useState } from "react";
import { api } from "../api";
import Message from "../components/Message";

function createKey() {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `deposit-${Date.now()}`;
}

export default function Deposit() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    toAccount: "",
    amount: "",
    idempotencyKey: createKey(),
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getAccounts()
      .then((data) => {
        const list = data.accounts || [];
        setAccounts(list);
        if (list.length) {
          setForm((current) => ({
            ...current,
            toAccount: list[0]._id,
          }));
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  async function submit(event) {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!form.toAccount || !Number.isFinite(amount) || amount <= 0) {
      setError("Choose an account and enter a valid amount.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const data = await api.deposit({
        toAccount: form.toAccount,
        amount,
        idempotencyKey: form.idempotencyKey,
      });

      setMessage(data.message || "Deposit completed successfully.");
      setForm((current) => ({
        ...current,
        amount: "",
        idempotencyKey: createKey(),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="narrow-page">
      <div className="page-heading">
        <div>
          <small>ADD FUNDS</small>
          <h2>Deposit money</h2>
          <p>Add funds to one of your active accounts.</p>
        </div>
      </div>

      <div className="form-card">
        <Message>{error}</Message>
        <Message type="success">{message}</Message>

        {accounts.length === 0 ? (
          <div className="empty-state">Create an account before depositing.</div>
        ) : (
          <form className="form-stack" onSubmit={submit}>
            <label className="field">
              <span>Deposit into</span>
              <select
                value={form.toAccount}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    toAccount: e.target.value,
                  }))
                }
              >
                {accounts.map((account, index) => (
                  <option key={account._id} value={account._id}>
                    Account {index + 1} • {account._id.slice(-6)}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Amount</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    amount: e.target.value,
                  }))
                }
                placeholder="10000"
              />
            </label>

            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Processing..." : "Deposit funds"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
