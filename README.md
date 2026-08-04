# 💳 Bank Ledger

> **A secure full-stack ledger simulation built with React, Node.js, Express.js, and MongoDB to demonstrate modern backend engineering, transaction processing, authentication, and REST API development.**

Bank Ledger is a portfolio project designed to explore how financial applications manage user accounts, process transactions, and maintain data consistency using a ledger-based architecture. The project focuses on secure API development, transactional integrity, and scalable backend design rather than traditional CRUD operations.

> **Disclaimer:** This application is built for educational and portfolio purposes only. It simulates financial workflows and does not process real banking transactions or integrate with financial institutions.

---

# 📚 Table of Contents

- Project Overview
- Key Features
- Technology Stack
- System Architecture
- Project Structure
- Transaction Workflow
- API Reference
- Security
- Installation
- Environment Variables
- Future Improvements
- Learning Outcomes
- Author

---

# 📖 Project Overview

The goal of this project was to build a secure ledger-based application that demonstrates how financial systems can record and process transactions while maintaining consistency, traceability, and security.

Unlike many applications that store an account's current balance directly in the database, this project calculates balances dynamically using immutable **Credit** and **Debit** ledger entries. This approach provides a complete transaction history and reflects accounting concepts commonly used in financial software.

The application supports secure authentication, account management, deposits, and fund transfers through a RESTful API backed by MongoDB transactions.

---

# ✨ Key Features

## Authentication & User Management

- Secure user registration and login
- Password hashing using **bcrypt**
- JWT-based authentication
- HTTP-only cookie sessions
- Protected API routes
- Secure logout with token invalidation

---

## Account Management

Users can:

- Create personal ledger accounts
- View only their own accounts
- Retrieve account balances
- Access protected resources through account ownership verification

---

## Ledger-Based Accounting

Instead of storing balances directly, every financial operation creates immutable ledger entries.

```text
Available Balance
=
Total Credits − Total Debits
```

This design improves consistency, traceability, and auditability while preventing balance manipulation.

---

## Transaction Processing

Transfers are processed through a controlled workflow that includes:

- Request validation
- Account verification
- Ownership validation
- Balance verification
- Debit ledger creation
- Credit ledger creation
- MongoDB transaction commit
- Email notification

Each transaction is recorded with a lifecycle status:

- Pending
- Complete
- Failed
- Reversed

---

## Deposit System

The application includes a demo deposit endpoint that allows authenticated users to add funds to their own account before initiating transfers.

---

## Modern Frontend

The React frontend provides:

- Professional authentication screens
- Dashboard
- Account management
- Deposit interface
- Transfer interface
- Responsive layout for desktop and mobile devices

The interface is designed to resemble a production application by removing development-only information such as raw JSON responses and debug output.

---

# 🛠 Technology Stack

## Frontend

- React
- Vite
- React Router
- HTML5
- CSS3
- JavaScript (ES6)

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

## Authentication

- JWT
- bcrypt
- Cookie Parser

## Security

- Helmet
- CORS
- Express Rate Limit
- Express Mongo Sanitize
- HPP Protection
- Compression
- Server-side validation

## Deployment

- GitHub
- Render
- MongoDB Atlas

---

# 🏗 System Architecture

```text
                 React Frontend
                        │
                        ▼
               Express REST API
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
 Authentication                 Business Logic
 Middleware                     Controllers
        │                               │
        └───────────────┬───────────────┘
                        ▼
                 MongoDB Database
```

---

# 📁 Project Structure

```text
bank-ledger/

├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── config/
│   ├── app.js
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
│
├── README.md
└── .gitignore
```

---

# 🔄 Transaction Workflow

```text
Client Request
      │
      ▼
Validate Input
      │
      ▼
Verify Accounts
      │
      ▼
Verify Ownership
      │
      ▼
Calculate Balance
      │
      ▼
Verify Available Funds
      │
      ▼
Create Pending Transaction
      │
      ▼
Create Debit Ledger Entry
      │
      ▼
Create Credit Ledger Entry
      │
      ▼
Commit MongoDB Transaction
      │
      ▼
Send Notification
      │
      ▼
Return Response
```

---

# 🌐 API Reference

### Authentication

```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### Accounts

```
POST /api/accounts
GET /api/accounts
GET /api/accounts/balance/:accountId
```

### Transactions

```
POST /api/transactions
POST /api/transactions/system/initial-funds
```

---

# 🔒 Security

Security was a primary focus throughout the development of this project.

Implemented protections include:

- Password hashing with bcrypt
- JWT authentication
- HTTP-only cookie sessions
- Route authorization
- Account ownership validation
- MongoDB transactions
- Idempotent transaction processing
- Helmet security headers
- MongoDB injection prevention
- HTTP parameter pollution protection
- Rate limiting
- Secure server-side validation

---

# 🚀 Installation

Clone the repository

```bash
git clone https://github.com/rajan999135/bank-ledger.git

cd bank-ledger
```

Backend

```bash
cd backend

npm install

npm run dev
```

Frontend

```bash
cd frontend

npm install

npm run dev
```

---

# ⚙ Environment Variables

### Backend

```env
PORT=
MONGO_URI=
JWT_SECRET=
FRONTEND_URL=

EMAIL_USER=
CLIENT_ID=
CLIENT_SECRET=
REFRESH_TOKEN=
```

### Frontend

```env
VITE_API_URL=http://localhost:3000
```

---

# 🚀 Future Improvements

Planned enhancements include:

- Multi-factor authentication
- Refresh token support
- Transaction history
- PDF account statements
- Audit logging
- Redis caching
- Docker containerization
- Automated testing
- GitHub Actions CI/CD
- Kubernetes deployment

---

# 📚 Learning Outcomes

Developing this project strengthened my understanding of:

- REST API architecture
- Secure authentication and authorization
- JWT-based session management
- MongoDB transactions
- Mongoose sessions
- Ledger-based accounting
- Idempotent APIs
- Backend security best practices
- React frontend integration
- Full-stack application architecture
- Deployment using Render
- Version control with Git and GitHub

---

# 👨‍💻 Author

**Rajan Nanda**

Full Stack Developer

- GitHub: https://github.com/rajan999135
- LinkedIn: https://linkedin.com/in/rajan-nanda-1512a7284

---

## ⭐ Support

If you found this project interesting or helpful, consider giving it a ⭐ on GitHub.
