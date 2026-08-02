const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, ""); 
  const API_BASE_URL =
    import.meta.env.VITE_API_URL?.replace(/\/$/, "");

if (!API_BASE_URL) {
    throw new Error("VITE_API_URL is not configured.");
}
  ;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

export const api = {
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request("/api/auth/logout", {
      method: "POST",
    }),

  getAccounts: () =>
    request("/api/accounts", {
      method: "GET",
    }),

  createAccount: () =>
    request("/api/accounts", {
      method: "POST",
      body: JSON.stringify({}),
    }),

  getBalance: (accountId) =>
    request(`/api/accounts/balance/${accountId}`, {
      method: "GET",
    }),

  deposit: (payload) =>
    request("/api/transactions/system/initial-funds", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  transfer: (payload) =>
    request("/api/transactions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
