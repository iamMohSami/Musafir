const express = require("express");
const router = express.Router();
const {body} = require("express-validator");
const userController = require("../controllers/user.controller");


//routes code here
router.post("/register",[
    body("email").isEmail().withMessage("Invalid Email"),
    body("fullname.firstname").isLength({min:3}).withMessage("Firstname is required and must be at least 3 characters long"),
    body("password").isLength({min:6}).withMessage("Password is required and must be at least 6 characters long"),
    body("confirmPassword").notEmpty().withMessage("Confirm Password is required"),
    body("confirmPassword").custom((value, {req}) => {
        if (value !== req.body.password) {
            throw new Error("Password confirmation does not match!");
        }
        return true;
    }),
], userController.registerUser);


module.exports = router;