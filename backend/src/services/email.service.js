const { Resend } = require("resend");

/**
 * Create the Resend client.
 *
 * RESEND_API_KEY must exist in:
 * - backend/.env for local development
 * - Render environment variables for production
 */
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Escape special HTML characters.
 *
 * This prevents user-controlled values such as names or account IDs
 * from being inserted into the email as unsafe HTML.
 */
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/**
 * Format an amount as Canadian currency.
 */
function formatCurrency(amount) {
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
        return "$0.00";
    }

    return new Intl.NumberFormat("en-CA", {
        style: "currency",
        currency: "CAD"
    }).format(numericAmount);
}

/**
 * Format the date and time for Regina, Saskatchewan.
 */
function formatDate(date = new Date()) {
    return new Intl.DateTimeFormat("en-CA", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Regina"
    }).format(date);
}

/**
 * Send an email through Resend.
 *
 * This is a common helper used by all email functions.
 */
async function sendEmail({ to, subject, text, html }) {
    if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY is not configured");
    }

    if (!process.env.EMAIL_FROM) {
        throw new Error("EMAIL_FROM is not configured");
    }

    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html
    });

    if (error) {
        throw new Error(error.message || "Email could not be sent");
    }

    console.log("Email sent successfully", {
        emailId: data?.id,
        emailType: subject
    });

    return data;
}

/**
 * Send a welcome email after a user registers.
 */
async function sendRegistrationEmail(userEmail, name) {
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(userEmail);

    const subject = "Welcome to Bank Ledger";

    const text = [
        `Hello ${name},`,
        "",
        "Your Bank Ledger account has been created successfully.",
        "",
        `Account email: ${userEmail}`,
        "",
        "If you did not create this account, please contact support immediately.",
        "",
        "Bank Ledger",
        "Secure financial ledger platform"
    ].join("\n");

    const html = `
        <div style="
            max-width:600px;
            margin:0 auto;
            font-family:Arial,Helvetica,sans-serif;
            background:#ffffff;
            border:1px solid #e5e7eb;
            border-radius:12px;
            overflow:hidden;
        ">
            <div style="
                background:#0f172a;
                padding:24px;
                text-align:center;
            ">
                <h1 style="
                    margin:0;
                    color:#ffffff;
                    font-size:24px;
                    font-weight:700;
                ">
                    Bank Ledger
                </h1>

                <p style="
                    margin:8px 0 0;
                    color:#cbd5e1;
                    font-size:14px;
                ">
                    Secure financial ledger platform
                </p>
            </div>

            <div style="padding:32px;">
                <h2 style="
                    margin:0 0 16px;
                    color:#111827;
                    font-size:22px;
                ">
                    Welcome, ${safeName}
                </h2>

                <p style="
                    margin:0 0 16px;
                    color:#4b5563;
                    font-size:16px;
                    line-height:1.6;
                ">
                    Your account has been created successfully.
                </p>

                <p style="
                    margin:0 0 24px;
                    color:#4b5563;
                    font-size:16px;
                    line-height:1.6;
                ">
                    You can now securely access your account, view balances,
                    create accounts and complete transactions.
                </p>

                <div style="
                    background:#f3f4f6;
                    border-radius:8px;
                    padding:18px;
                    margin-bottom:24px;
                ">
                    <p style="
                        margin:0 0 6px;
                        color:#6b7280;
                        font-size:13px;
                        font-weight:600;
                        text-transform:uppercase;
                    ">
                        Account email
                    </p>

                    <p style="
                        margin:0;
                        color:#111827;
                        font-size:16px;
                        word-break:break-word;
                    ">
                        ${safeEmail}
                    </p>
                </div>

                <div style="
                    border-left:4px solid #f59e0b;
                    background:#fffbeb;
                    padding:16px;
                    border-radius:6px;
                ">
                    <p style="
                        margin:0;
                        color:#92400e;
                        font-size:14px;
                        line-height:1.5;
                    ">
                        If you did not create this account, please contact
                        support immediately and secure your email account.
                    </p>
                </div>
            </div>

            <div style="
                background:#f9fafb;
                border-top:1px solid #e5e7eb;
                padding:18px;
                text-align:center;
            ">
                <p style="
                    margin:0;
                    color:#6b7280;
                    font-size:13px;
                    line-height:1.5;
                ">
                    This is an automated notification from Bank Ledger.
                    Please do not reply to this email.
                </p>
            </div>
        </div>
    `;

    return sendEmail({
        to: userEmail,
        subject,
        text,
        html
    });
}

/**
 * Send a confirmation email after a successful transfer.
 */
async function sendTransactionEmail(
    userEmail,
    name,
    amount,
    toAccount
) {
    const safeName = escapeHtml(name);
    const safeAccount = escapeHtml(toAccount);
    const formattedAmount = formatCurrency(amount);
    const transactionDate = formatDate();

    const subject = "Transaction Completed Successfully";

    const text = [
        `Hello ${name},`,
        "",
        "Your transaction was completed successfully.",
        "",
        `Amount: ${formattedAmount}`,
        `Recipient account: ${toAccount}`,
        "Status: Complete",
        `Date: ${transactionDate}`,
        "",
        "If you do not recognize this transaction, secure your account immediately.",
        "",
        "Bank Ledger"
    ].join("\n");

    const html = `
        <div style="
            max-width:600px;
            margin:0 auto;
            font-family:Arial,Helvetica,sans-serif;
            background:#ffffff;
            border:1px solid #e5e7eb;
            border-radius:12px;
            overflow:hidden;
        ">
            <div style="
                background:#166534;
                padding:24px;
                text-align:center;
            ">
                <h1 style="
                    margin:0;
                    color:#ffffff;
                    font-size:24px;
                    font-weight:700;
                ">
                    Transaction Successful
                </h1>

                <p style="
                    margin:8px 0 0;
                    color:#dcfce7;
                    font-size:14px;
                ">
                    Your transfer has been completed
                </p>
            </div>

            <div style="padding:32px;">
                <p style="
                    margin:0 0 18px;
                    color:#374151;
                    font-size:16px;
                    line-height:1.6;
                ">
                    Hello <strong>${safeName}</strong>,
                </p>

                <p style="
                    margin:0 0 24px;
                    color:#4b5563;
                    font-size:16px;
                    line-height:1.6;
                ">
                    Your transaction has been completed successfully.
                    The transaction details are shown below.
                </p>

                <table style="
                    width:100%;
                    border-collapse:collapse;
                    margin-bottom:24px;
                ">
                    <tr>
                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            background:#f9fafb;
                            color:#374151;
                            font-weight:600;
                            width:40%;
                        ">
                            Amount
                        </td>

                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            color:#111827;
                            font-weight:700;
                        ">
                            ${formattedAmount}
                        </td>
                    </tr>

                    <tr>
                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            background:#f9fafb;
                            color:#374151;
                            font-weight:600;
                        ">
                            Recipient account
                        </td>

                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            color:#111827;
                            word-break:break-all;
                        ">
                            ${safeAccount}
                        </td>
                    </tr>

                    <tr>
                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            background:#f9fafb;
                            color:#374151;
                            font-weight:600;
                        ">
                            Status
                        </td>

                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            color:#166534;
                            font-weight:700;
                        ">
                            Complete
                        </td>
                    </tr>

                    <tr>
                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            background:#f9fafb;
                            color:#374151;
                            font-weight:600;
                        ">
                            Date
                        </td>

                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            color:#111827;
                        ">
                            ${transactionDate}
                        </td>
                    </tr>
                </table>

                <div style="
                    border-left:4px solid #dc2626;
                    background:#fef2f2;
                    padding:16px;
                    border-radius:6px;
                ">
                    <p style="
                        margin:0;
                        color:#991b1b;
                        font-size:14px;
                        line-height:1.5;
                    ">
                        If you do not recognize this transaction, secure your
                        account immediately and contact support.
                    </p>
                </div>
            </div>

            <div style="
                background:#f9fafb;
                border-top:1px solid #e5e7eb;
                padding:18px;
                text-align:center;
            ">
                <p style="
                    margin:0;
                    color:#6b7280;
                    font-size:13px;
                ">
                    Bank Ledger · Automated transaction notification
                </p>
            </div>
        </div>
    `;

    return sendEmail({
        to: userEmail,
        subject,
        text,
        html
    });
}

/**
 * Send a notification when a transaction fails.
 */
async function sendTransactionFailureEmail(
    userEmail,
    name,
    amount,
    toAccount
) {
    const safeName = escapeHtml(name);
    const safeAccount = escapeHtml(toAccount);
    const formattedAmount = formatCurrency(amount);
    const transactionDate = formatDate();

    const subject = "Transaction Could Not Be Completed";

    const text = [
        `Hello ${name},`,
        "",
        "Your transaction could not be completed.",
        "",
        `Amount: ${formattedAmount}`,
        `Recipient account: ${toAccount}`,
        "Status: Failed",
        `Date: ${transactionDate}`,
        "",
        "Please try again later. If the issue continues, contact support.",
        "",
        "Bank Ledger"
    ].join("\n");

    const html = `
        <div style="
            max-width:600px;
            margin:0 auto;
            font-family:Arial,Helvetica,sans-serif;
            background:#ffffff;
            border:1px solid #e5e7eb;
            border-radius:12px;
            overflow:hidden;
        ">
            <div style="
                background:#b91c1c;
                padding:24px;
                text-align:center;
            ">
                <h1 style="
                    margin:0;
                    color:#ffffff;
                    font-size:24px;
                    font-weight:700;
                ">
                    Transaction Failed
                </h1>

                <p style="
                    margin:8px 0 0;
                    color:#fee2e2;
                    font-size:14px;
                ">
                    Your transfer was not completed
                </p>
            </div>

            <div style="padding:32px;">
                <p style="
                    margin:0 0 18px;
                    color:#374151;
                    font-size:16px;
                    line-height:1.6;
                ">
                    Hello <strong>${safeName}</strong>,
                </p>

                <p style="
                    margin:0 0 24px;
                    color:#4b5563;
                    font-size:16px;
                    line-height:1.6;
                ">
                    Unfortunately, your transaction could not be completed.
                    No successful transfer was recorded.
                </p>

                <table style="
                    width:100%;
                    border-collapse:collapse;
                    margin-bottom:24px;
                ">
                    <tr>
                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            background:#f9fafb;
                            color:#374151;
                            font-weight:600;
                            width:40%;
                        ">
                            Amount
                        </td>

                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            color:#111827;
                            font-weight:700;
                        ">
                            ${formattedAmount}
                        </td>
                    </tr>

                    <tr>
                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            background:#f9fafb;
                            color:#374151;
                            font-weight:600;
                        ">
                            Recipient account
                        </td>

                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            color:#111827;
                            word-break:break-all;
                        ">
                            ${safeAccount}
                        </td>
                    </tr>

                    <tr>
                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            background:#f9fafb;
                            color:#374151;
                            font-weight:600;
                        ">
                            Status
                        </td>

                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            color:#b91c1c;
                            font-weight:700;
                        ">
                            Failed
                        </td>
                    </tr>

                    <tr>
                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            background:#f9fafb;
                            color:#374151;
                            font-weight:600;
                        ">
                            Date
                        </td>

                        <td style="
                            padding:14px;
                            border:1px solid #e5e7eb;
                            color:#111827;
                        ">
                            ${transactionDate}
                        </td>
                    </tr>
                </table>

                <div style="
                    background:#f3f4f6;
                    padding:16px;
                    border-radius:8px;
                ">
                    <p style="
                        margin:0;
                        color:#4b5563;
                        font-size:14px;
                        line-height:1.5;
                    ">
                        Please try again later. If the issue continues,
                        review your account balance and recipient details,
                        or contact support.
                    </p>
                </div>
            </div>

            <div style="
                background:#f9fafb;
                border-top:1px solid #e5e7eb;
                padding:18px;
                text-align:center;
            ">
                <p style="
                    margin:0;
                    color:#6b7280;
                    font-size:13px;
                ">
                    Bank Ledger · Automated transaction notification
                </p>
            </div>
        </div>
    `;

    return sendEmail({
        to: userEmail,
        subject,
        text,
        html
    });
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};