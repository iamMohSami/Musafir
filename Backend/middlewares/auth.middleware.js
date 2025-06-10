const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

module.exports.authUser = async (req, res, next) => {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "No Token Found | Unatuhorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(decoded._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }
        req.user = user; // Attach user to request object
        return next(); // Proceed to the next middleware or route handler
    } catch(error) {
        console.error("Authentication Error:", error);
        return res.status(401).json({ message: "Invalid Token | Unauthorized" });
    }

}