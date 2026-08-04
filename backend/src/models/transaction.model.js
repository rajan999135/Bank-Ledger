const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    /**
     * Required only for normal transfers.
     * Initial funding has no real sender account.
     */
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: function () {
        return this.transactionType === "Transfer";
      },
      index: true,
    },

    /**
     * Destination account.
     */
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [
        true,
        "Transaction must be associated with a to account",
      ],
      index: true,
    },

    /**
     * Distinguishes a regular transfer from demo initial funding.
     */
    transactionType: {
      type: String,
      enum: {
        values: ["Transfer", "InitialFunding"],
        message:
          "Transaction type can be either Transfer or InitialFunding",
      },
      default: "Transfer",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: {
        values: ["Pending", "Complete", "Failed", "Reversed"],
        message:
          "Status can be either Pending, Complete, Failed or Reversed",
      },
      default: "Pending",
      required: true,
    },

    amount: {
      type: Number,
      required: [
        true,
        "Amount is required for creating a transaction",
      ],
      min: [0.01, "Transaction amount must be greater than zero"],
    },

    idempotencykey: {
      type: String,
      required: [
        true,
        "Idempotency key is required for creating a transaction",
      ],
      trim: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Prevent more than one completed initial funding transaction
 * for the same destination account.
 */
transactionSchema.index(
  {
    toAccount: 1,
    transactionType: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      transactionType: "InitialFunding",
      status: "Complete",
    },
  }
);

const transactionModel = mongoose.model(
  "transaction",
  transactionSchema
);

module.exports = transactionModel;