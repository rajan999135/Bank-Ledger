const mongoose = require("mongoose")
const { applyTimestamps } = require("./user.model")
const ledgerModel = require("./ledger.model")

const accountSchema = new mongoose.Schema({


    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "user",
        require: [true, "Account must be associated with a user"],
        index: true  //creating the index of the user for better optimization. 

    },
    status:{
        type: String,
        enum: {
            values:["Active", "Frozen", "Closed"],
            message: "Status can be either Active, Frozen or Closed",
        },
        default: "Active"
    },
    currency:{
        type: String,
        require: [true, "Currency is required for creating an account"],
        default: "INR"
    },
    

},
{
    timestamps: true
})

accountSchema.index({user: 1, status: 1}) //creating a compund index for a one user

accountSchema.methods.getBalance = async function () {

    const balanceData = await ledgerModel.aggregate([   //here we use aggregate pipeline used to run the queries directly in mongodb by using array.
        {$match: {account: this._id}},
        {
            $group:{
                _id: null,
                totalDebit:{
                    $sum:{
                        $cond: [
                            {$eq: ["$type", "Debit"]},
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit:{
                    $sum:{
                        $cond:[
                            {$eq: ["$type", "Credit"]},
                            "$amount",
                            0
                        ]
                    }
                }

            }
            },
            {
                $project:{
                    _id:0,
                    balance: {$subtract: ["$totalCredit","$totalDebit"]}
                }

        }

])

if(balanceData.length ===0 ){
    return 0
}

return balanceData[0].balance
    
}

const accountModel = mongoose.model("account", accountSchema)

module.exports = accountModel