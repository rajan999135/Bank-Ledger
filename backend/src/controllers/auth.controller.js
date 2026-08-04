const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlackListModel = require("../models/blackList.model");

/**
 * Return cookie settings for development and production.
 *
 * Development:
 * frontend: http://localhost:5173
 * backend:  http://localhost:3000
 *
 * Production:
 * frontend and backend are on separate HTTPS Render domains.
 */
function getCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,

        // Required for HTTPS production cookies.
        secure: isProduction,

        // Cross-site production requests require SameSite=None.
        // Local development works with SameSite=Lax.
        sameSite: isProduction ? "none" : "lax",

        // Cookie is available to the entire backend application.
        path: "/",

        // Five days.
        maxAge: 5 * 24 * 60 * 60 * 1000
    };
}

/**
 * Return the same identifying cookie attributes when clearing it.
 */
function getClearCookieOptions() {
    const isProduction = process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/"
    };
}

/**
 * Create a signed JWT for a user.
 */
function createToken(userId) {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured");
    }

    return jwt.sign(
        {
            userId
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "5d"
        }
    );
}

/**
 * User Register Controller
 * POST /api/auth/register
 */
async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({
                status: "failed",
                message: "Name, email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedName = name.trim();

        const existingUser = await userModel.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                status: "failed",
                message: "User already exists with this email."
            });
        }

        const user = await userModel.create({
            email: normalizedEmail,
            password,
            name: normalizedName
        });

        const token = createToken(user._id);

        res.cookie(
            "token",
            token,
            getCookieOptions()
        );

        /*
         * Email sending is intentionally not awaited.
         * Registration still succeeds if the email provider is temporarily
         * unavailable.
         */
        emailService
            .sendRegistrationEmail(user.email, user.name)
            .catch((error) => {
                console.error(
                    "Registration email failed:",
                    error.message
                );
            });

        return res.status(201).json({
            status: "success",
            message: "Registration successful.",
            token, // Fallback for browsers that block the cross-site cookie.
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error(
            "Registration error:",
            error.message
        );

        return res.status(500).json({
            status: "failed",
            message:
                process.env.NODE_ENV === "production"
                    ? "Unable to register user."
                    : error.message
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

        if (!email || !password) {
            return res.status(400).json({
                status: "failed",
                message: "Email and password are required."
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await userModel
            .findOne({
                email: normalizedEmail
            })
            .select("+password");

        /*
         * Use the same message for unknown email and incorrect password.
         * This avoids revealing whether an email is registered.
         */
        if (!user) {
            return res.status(401).json({
                status: "failed",
                message: "Email or password is invalid."
            });
        }

        const isValidPassword =
            await user.comparePassword(password);

        if (!isValidPassword) {
            return res.status(401).json({
                status: "failed",
                message: "Email or password is invalid."
            });
        }

        const token = createToken(user._id);

        res.cookie(
            "token",
            token,
            getCookieOptions()
        );

        return res.status(200).json({
            status: "success",
            message: "Login successful.",
            token,
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        console.error(
            "Login error:",
            error.message
        );

        return res.status(500).json({
            status: "failed",
            message:
                process.env.NODE_ENV === "production"
                    ? "Unable to log in."
                    : error.message
        });
    }
}

/**
 * User Logout Controller
 * POST /api/auth/logout
 */
async function userLogoutController(req, res) {
    try {
        const cookieToken = req.cookies?.token;

        const authorizationHeader =
            req.headers.authorization;

        const bearerToken =
            authorizationHeader?.startsWith("Bearer ")
                ? authorizationHeader.substring(7)
                : null;

        const token = cookieToken || bearerToken;

        /*
         * Clear the browser cookie whether or not a token exists.
         */
        res.clearCookie(
            "token",
            getClearCookieOptions()
        );

        /*
         * If no token exists, the user is already logged out.
         * The return prevents the function from continuing and sending
         * a second response.
         */
        if (!token) {
            return res.status(200).json({
                status: "success",
                message: "User logged out successfully."
            });
        }

        /*
         * Avoid creating duplicate blacklist records.
         */
        const alreadyBlacklisted =
            await tokenBlackListModel.findOne({
                token
            });

        if (!alreadyBlacklisted) {
            await tokenBlackListModel.create({
                token
            });
        }

        return res.status(200).json({
            status: "success",
            message: "User logged out successfully."
        });
    } catch (error) {
        console.error(
            "Logout error:",
            error.message
        );

        return res.status(500).json({
            status: "failed",
            message:
                process.env.NODE_ENV === "production"
                    ? "Unable to log out."
                    : error.message
        });
    }
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
};