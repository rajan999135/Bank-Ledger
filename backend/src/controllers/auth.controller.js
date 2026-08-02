const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlackListModel = require("../models/blackList.model");
/**
 * User Register Controller
 * POST /api/auth/register
 */
async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body;

        const isExists = await userModel.findOne({ email });

        if (isExists) {
            return res.status(422).json({
                status: "failed",
                message: "User already exists with this email."
            });
        }

        const user = await userModel.create({
            email,
            password,
            name
        });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            {
                expiresIn: "5d"
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 5 * 24 * 60 * 60 * 1000
        });

        emailService
            .sendRegistrationEmail(user.email, user.name)
            .catch((error) => {
                console.error("Registration email failed:", error.message);
            });

        return res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            status: "failed",
            message: error.message
        });
    }
}

/**
 * User Login Controller
 * POST /api/auth/login
 */
async function userLoginController(req, res) {
    try {
        const { email, password } = req.body;

        const user = await userModel
            .findOne({ email })
            .select("+password");

        if (!user) {
            return res.status(401).json({
                status: "failed",
                message: "Email or Password is Invalid"
            });
        }

        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                status: "failed",
                message: "Email or Password is Invalid"
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            {
                expiresIn: "5d"
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "strict",
            maxAge: 5 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            status: "failed",
            message: error.message
        });
    }
}

/**
 * POST/api/auth/logout
 */

async function userLogoutController(req,res){
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
    if(!token){
        res.status(200).json({
            message: "User logged out successfully."
        })

    }

    res.cookie("token","")

    await tokenBlackListModel.create({
        token:token
    })
    res.clearCookie("token") 

    res.status(200).json({
        message: "User loggout successfully."
    })

}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
};