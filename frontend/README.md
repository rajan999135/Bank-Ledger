# Bank Ledger Professional Frontend

A polished React frontend for the existing Node.js, Express and MongoDB backend.

## No `/api/auth/me`

This version does not call a current-user endpoint.

The login and registration responses are used to populate the frontend user session. The displayed user is stored in `sessionStorage`, while the backend authentication token remains in the HTTP-only cookie.

## Existing backend routes used

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout

GET  /api/accounts
POST /api/accounts
GET  /api/accounts/balance/:accountId

POST /api/transactions
POST /api/transactions/system/initial-funds
```

## Customer-facing interface

The interface does not display:

- Raw backend JSON
- API endpoint names
- Debug response panels
- Developer notes
- Unsupported account-type fields
- Manual balance-check forms

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

The frontend `.env` should contain:

```env
VITE_API_URL=http://localhost:3000
```

If Vite starts on port `5174`, allow that exact origin in backend CORS:

```js
app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);
```

## Required login response

The recommended login response is:

```js
return res.status(200).json({
  message: "Login successful",
  user: {
    _id: user._id,
    name: user.name,
    email: user.email,
  },
});
```

The JWT can still be stored in an HTTP-only cookie. It does not need to be returned to React.

## Important browser behavior

Normal tabs in the same browser share the authentication cookie. Use different browsers or an incognito window when testing two users simultaneously.
