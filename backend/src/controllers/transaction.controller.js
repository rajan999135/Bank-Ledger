const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

/**
 * =========================================================
 * CREATE NORMAL ACCOUNT-TO-ACCOUNT TRANSACTION
 * =========================================================
 *
 * Flow:
 * 1. Validate request data
 * 2. Validate amount
 * 3. Prevent transfer to the same account
 * 4. Confirm sender owns the account
 * 5. Confirm receiver account exists
 * 6. Check idempotency key
 * 7. Check account status
 * 8. Check sender balance
 * 9. Start MongoDB transaction
 * 10. Create transaction record
 * 11. Create debit ledger entry
 * 12. Create credit ledger entry
 * 13. Mark transaction complete
 * 14. Commit MongoDB transaction
 * 15. Send email notification
 */
async function createTransaction(req, res) {
    const {
        fromAccount,
        toAccount,
        amount,
        idempotencyKey
    } = req.body;

    /**
     * 1. Validate required request fields
     */
    if (
        !fromAccount ||
        !toAccount ||
        amount === undefined ||
        !idempotencyKey
    ) {
        return res.status(400).json({
            message:
                "fromAccount, toAccount, amount and idempotencyKey are required"
        });
    }

    /**
     * 2. Convert and validate amount
     *
     * Request values can sometimes arrive as strings,
     * so we convert the amount into a real number.
     */
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
            message: "Amount must be a positive number"
        });
    }

    /**
     * 3. Prevent sending money to the same account
     */
    if (fromAccount === toAccount) {
        return res.status(400).json({
            message: "Sender and receiver accounts cannot be the same"
        });
    }

    /**
     * 4. Find sender account
     *
     * We also check that the logged-in user owns the account.
     * This prevents one user from transferring money from another user's account.
     */
    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
        user: req.user._id
    });

    if (!fromUserAccount) {
        return res.status(403).json({
            message: "Sender account not found or you do not own it"
        });
    }

    /**
     * 5. Find receiver account
     *
     * The receiver does not have to belong to the logged-in user.
     */
    const toUserAccount = await accountModel.findById(toAccount);

    if (!toUserAccount) {
        return res.status(404).json({
            message: "Receiver account not found"
        });
    }

    /**
     * 6. Check idempotency key
     *
     * The same idempotency key must not process the same request twice.
     */
    const existingTransaction = await transactionModel.findOne({
        idempotencykey: idempotencyKey
    });

    if (existingTransaction) {
        if (existingTransaction.status === "Complete") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: existingTransaction
            });
        }

        if (existingTransaction.status === "Pending") {
            return res.status(202).json({
                message: "Transaction is still processing",
                transaction: existingTransaction
            });
        }

        return res.status(409).json({
            message:
                `Transaction already exists with status ` +
                `${existingTransaction.status}`,
            transaction: existingTransaction
        });
    }

    /**
     * 7. Check account status
     *
     * Both accounts must be active before processing a transfer.
     */
    if (
        fromUserAccount.status !== "Active" ||
        toUserAccount.status !== "Active"
    ) {
        return res.status(400).json({
            message: "Both sender and receiver accounts must be active"
        });
    }

    /**
     * 8. Calculate sender balance from ledger entries
     */
    const balance = await fromUserAccount.getBalance();

    if (balance < numericAmount) {
        return res.status(400).json({
            message:
                `Insufficient balance. Current balance is ${balance}. ` +
                `Requested amount is ${numericAmount}`
        });
    }

    /**
     * 9. Start MongoDB session
     *
     * MongoDB transactions ensure that:
     * - transaction record
     * - debit ledger entry
     * - credit ledger entry
     *
     * are either all saved or all rolled back.
     */
    const session = await mongoose.startSession();

    let transaction;

    try {
        session.startTransaction();

        /**
         * 10. Create pending transaction
         */
        transaction = (
            await transactionModel.create(
                [
                    {
                        fromAccount,
                        toAccount,
                        amount: numericAmount,
                        idempotencykey: idempotencyKey,
                        transactionType: "Transfer",
                        status: "Pending"
                    }
                ],
                { session }
            )
        )[0];

        /**
         * 11. Create debit ledger entry for sender
         */
        await ledgerModel.create(
            [
                {
                    account: fromAccount,
                    amount: numericAmount,
                    transaction: transaction._id,
                    type: "Debit"
                }
            ],
            { session }
        );

        /**
         * 12. Create credit ledger entry for receiver
         */
        await ledgerModel.create(
            [
                {
                    account: toAccount,
                    amount: numericAmount,
                    transaction: transaction._id,
                    type: "Credit"
                }
            ],
            { session }
        );

        /**
         * 13. Mark transaction as complete
         */
        transaction.status = "Complete";

        await transaction.save({
            session
        });

        /**
         * 14. Commit MongoDB transaction
         */
        await session.commitTransaction();
    } catch (error) {
        /**
         * Roll back all database changes if anything fails
         */
        await session.abortTransaction();

        console.error("Transaction error:", error);

        return res.status(500).json({
            message: "Transaction could not be completed"
        });
    } finally {
        /**
         * Always close the MongoDB session
         */
        await session.endSession();
    }

    /**
     * 15. Send email notification
     *
     * Email failure should not reverse a completed transaction.
     */
    try {
        await emailService.sendTransactionEmail(
            req.user.email,
            req.user.name,
            numericAmount,
            toAccount
        );
    } catch (error) {
        console.error("Transaction email failed:", error);
    }

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction
    });
}

/**
 * =========================================================
 * CREATE INITIAL DEMO FUNDS TRANSACTION
 * =========================================================
 *
 * This is for adding demo money to an account.
 *
 * Rules:
 * - User must own the account
 * - Account must be active
 * - Amount must be positive
 * - Maximum initial funding is 10,000
 * - Initial funding can only be applied once
 * - Only a credit ledger entry is created
 */
async function createInitialFundsTransaction(req, res) {
    const {
        toAccount,
        amount,
        idempotencyKey
    } = req.body;

    /**
     * 1. Validate required fields
     */
    if (
        !toAccount ||
        amount === undefined ||
        !idempotencyKey
    ) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        });
    }

    /**
     * 2. Convert and validate amount
     */
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
            message: "Amount must be a positive number"
        });
    }

    /**
     * 3. Limit demo funding amount
     */
    if (numericAmount > 10000) {
        return res.status(400).json({
            message: "Initial funding cannot exceed 10,000"
        });
    }

    /**
     * 4. Confirm user owns the target account
     */
    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
        user: req.user._id
    });

    if (!toUserAccount) {
        return res.status(404).json({
            message: "Account not found or you do not own this account"
        });
    }

    /**
     * 5. Confirm account is active
     */
    if (toUserAccount.status !== "Active") {
        return res.status(400).json({
            message: "Account must be active"
        });
    }

    /**
     * 6. Check idempotency key
     */
    const existingIdempotencyTransaction =
        await transactionModel.findOne({
            idempotencykey: idempotencyKey
        });

    if (existingIdempotencyTransaction) {
        return res.status(409).json({
            message: "This request has already been processed",
            transaction: existingIdempotencyTransaction
        });
    }

    /**
     * 7. Prevent more than one initial funding transaction
     */
    const existingDeposit = await transactionModel.findOne({
        toAccount,
        transactionType: "InitialFunding",
        status: "Complete"
    });

    if (existingDeposit) {
        return res.status(409).json({
            message:
                "Initial funding has already been applied to this account"
        });
    }

    /**
     * 8. Start MongoDB session
     */
    const session = await mongoose.startSession();

    let transaction;

    try {
        session.startTransaction();

        /**
         * 9. Create pending initial funding transaction
         *
         * No fromAccount is needed because this represents
         * system-generated demo funds.
         */
        transaction = (
            await transactionModel.create(
                [
                    {
                        toAccount,
                        amount: numericAmount,
                        idempotencykey: idempotencyKey,
                        transactionType: "InitialFunding",
                        status: "Pending"
                    }
                ],
                { session }
            )
        )[0];

        /**
         * 10. Create credit ledger entry
         *
         * Initial funding adds money to the account,
         * so only a Credit entry is required.
         */
        await ledgerModel.create(
            [
                {
                    account: toAccount,
                    amount: numericAmount,
                    transaction: transaction._id,
                    type: "Credit"
                }
            ],
            { session }
        );

        /**
         * 11. Mark initial funding transaction complete
         */
        transaction.status = "Complete";

        await transaction.save({
            session
        });

        /**
         * 12. Commit changes
         */
        await session.commitTransaction();
    } catch (error) {
        /**
         * Roll back all changes if anything fails
         */
        await session.abortTransaction();

        console.error("Initial funding error:", error);

        return res.status(500).json({
            message: "Unable to add initial funds"
        });
    } finally {
        /**
         * Always close the session
         */
        await session.endSession();
    }

    return res.status(201).json({
        message: "Initial funds added successfully",
        transaction
    });
}

/**
 * Export controller functions
 */
module.exports = {
    createTransaction,
    createInitialFundsTransaction
};