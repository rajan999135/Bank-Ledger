const accountModel = require("../models/account.model");

/**
 * Create a new account for the logged-in user.
 */
async function createAccountController(req, res) {
    try {
        const account = await accountModel.create({
            user: req.user._id
        });

        return res.status(201).json({
            message: "Account created successfully",
            account
        });
    } catch (error) {
        console.error("Create account error:", error.message);

        return res.status(500).json({
            message: "Unable to create account"
        });
    }
}

/**
 * Return all accounts owned by the logged-in user.
 */
async function getUserAccountsController(req, res) {
    try {
        const accounts = await accountModel.find({
            user: req.user._id
        });

        return res.status(200).json({
            accounts
        });
    } catch (error) {
        console.error("Get accounts error:", error.message);

        return res.status(500).json({
            message: "Unable to load accounts"
        });
    }
}

/**
 * Return the balance of one account owned by the logged-in user.
 */
async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params;

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        const balance = await account.getBalance();

        return res.status(200).json({
            accountId: account._id,
            balance
        });
    } catch (error) {
        console.error("Get balance error:", error.message);

        return res.status(500).json({
            message: "Unable to load account balance"
        });
    }
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
};