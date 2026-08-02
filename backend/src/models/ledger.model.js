const mongoose = require('mongoose')
// const transactionModel = require('./transaction.model')

const ledgerSchema= new mongoose.Schema({

    account:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Ledger must be associated with an account"],
        index: true,
        immutable: true
    },

    amount: {
        type: Number,
        required: [true, "Amount is required for creating a ledger entry"],
        index: true,
        immutable: true

    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "transaction",
        required: [true, "Amount is required for creating a ledger entry"],
        index: true,
        immutable: true
    },
    type:{
        type: String,
        enum:{
            values: ["Credit", "Debit"],
            message: "Type can be either Credit or Debit",
        },
        required: [true, "Ledger type is required"],
        immutable: true
    }

})

// print a Message which shows  modificaiton of Ledger(transaction details) will not be allowed. 

function preventLedgerModification(){
    throw new Error("Ledger entries are immutable and cannot be modified or deleted. ");

}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification);

ledgerSchema.pre('updateOne', preventLedgerModification);

ledgerSchema.pre('deleteOne', preventLedgerModification);

ledgerSchema.pre('remove', preventLedgerModification);

ledgerSchema.pre('deleteMany', preventLedgerModification);


ledgerSchema.pre('updateMany', preventLedgerModification);


ledgerSchema.pre('findOneAndDelete', preventLedgerModification);


ledgerSchema.pre('findOneAndReplace', preventLedgerModification);

const ledgerModel = mongoose.model("ledger", ledgerSchema);

module.exports = ledgerModel;

