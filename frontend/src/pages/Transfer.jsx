import { useEffect, useState } from "react";
import { api } from "../api";
import Message from "../components/Message";

function createKey() {
  return globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID()
    : `transfer-${Date.now()}`;
}

export default function Transfer() {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    fromAccount: "",
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
            fromAccount: list[0]._id,
          }));
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  async function submit(event) {
    event.preventDefault();

    const amount = Number(form.amount);

    if (!form.fromAccount || !form.toAccount.trim()) {
      setError("Enter both sender and receiver account information.");
      return;
    }

    if (form.fromAccount === form.toAccount.trim()) {
      setError("Sender and receiver accounts must be different.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const data = await api.transfer({
        fromAccount: form.fromAccount,
        toAccount: form.toAccount.trim(),
        amount,
        idempotencyKey: form.idempotencyKey,
      });

      setMessage(data.message || "Transfer completed successfully.");
      setForm((current) => ({
        ...current,
        toAccount: "",
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
          <small>SEND MONEY</small>
          <h2>Transfer funds</h2>
          <p>Move money securely between active accounts.</p>
        </div>
      </div>

      <div className="form-card">
        <Message>{error}</Message>
        <Message type="success">{message}</Message>

        {accounts.length === 0 ? (
          <div className="empty-state">Create an account before transferring.</div>
        ) : (
          <form className="form-stack" onSubmit={submit}>
            <label className="field">
              <span>From account</span>
              <select
                value={form.fromAccount}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    fromAccount: e.target.value,
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
              <span>Receiver account ID</span>
              <input
                value={form.toAccount}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    toAccount: e.target.value,
                  }))
                }
                placeholder="Enter receiver account ID"
              />
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
                placeholder="5000"
              />
            </label>

            <button className="primary-button" disabled={loading} type="submit">
              {loading ? "Processing..." : "Send money"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
