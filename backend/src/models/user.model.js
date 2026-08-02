const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
{
    email: {
        type: String,
        required: [true, "Email is required for creating a user"],
        trim: true,
        lowercase: true,
        match: [
            /^(?!\.)(?!.*\.\.)[a-zA-Z0-9._%+-]+(?<!\.)@gmail\.com$/,
            "Invalid Email Address"
        ],
        unique: true
    },

    name: {
        type: String,
        required: [true, "Name is required for creating an account"]
    },

    password: {
        type: String,
        required: [true, "Password is required for creating an account"],
        minlength: [6, "Password should contain more than 6 characters"],
        select: false
    }
},
{
    timestamps: true
}
);

UserSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};

const userModel = mongoose.model("user", UserSchema);

module.exports = userModel;