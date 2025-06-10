const userModel = require("../models/user.model");
const userService = require("../services/user.service");
const {validationResult} = require("express-validator");

// creating user | register user
module.exports.registerUser = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    const {fullname, email, password} = req.body;

    const hashedPassword = await userModel.hashPassword(password);
    try {
        const user = await userService.createUser( 
            {firstname: fullname.firstname, lastname: fullname.lastname, email, password: hashedPassword}
        );
        const token = user.generateAuthToken();
        res.status(201).json({message: "User created successfully", user, token});
    } catch (error) {
        console.error("Error in registerUser:", error);
        res.status(500).json({message: "Internal server error"});
    }    


}

// login user
module.exports.loginUser = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({errors: errors.array()});
    }

    const {email, password} = req.body;

    try {
        const user = await userModel.findOne({email}).select("+password");
        if(!user) {
            return res.status(404).json({message: "User not found"});
        }

        const isPasswordValid = await user.comparePassword(password);
        if(!isPasswordValid) {
            return res.status(401).json({message: "Invalid credentials"});
        }

        const token = user.generateAuthToken();
        res.cookie("token" , token); 
        res.status(200).json({message: "Login successful", user, token});
    } catch (error) {
        console.error("Error in loginUser:", error);
        res.status(500).json({message: "Internal server error"});
    }
}

// user profile
module.exports.getUserProfile = async (req,res,next) => {
    res.status(200).json(req.user);
}