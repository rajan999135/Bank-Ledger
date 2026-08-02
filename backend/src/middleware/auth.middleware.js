const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const tokenBlackListModel = require("../models/blackList.model");

function getTokenFromRequest(req) {
    const cookieToken = req.cookies?.token;
    const authorizationHeader = req.headers.authorization;

    let bearerToken = null;

    if (
        authorizationHeader &&
        authorizationHeader.startsWith("Bearer ")
    ) {
        bearerToken = authorizationHeader.split(" ")[1];
    }

    return cookieToken || bearerToken;
}

async function authMiddleware(req, res, next) {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized access, token is missing"
            });
        }

        const isBlacklisted = await tokenBlackListModel.findOne({ token });

        if (isBlacklisted) {
            return res.status(401).json({
                message: "Unauthorized access, token has been logged out"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user does not exist"
            });
        }

        req.user = user;
        req.token = token;

        return next();
    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        });
    }
}

async function authSystemUserMiddleware(req, res, next) {
    try {
        const token = getTokenFromRequest(req);

        if (!token) {
            return res.status(401).json({
                message: "Unauthorized access, token is missing"
            });
        }

        const isBlacklisted = await tokenBlackListModel.findOne({ token });

        if (isBlacklisted) {
            return res.status(401).json({
                message: "Unauthorized access, token has been logged out"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await userModel
            .findById(decoded.userId)
            .select("+systemUser");

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user does not exist"
            });
        }

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            });
        }

        req.user = user;
        req.token = token;

        return next();
    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid"
        });
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
};

