const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


const userSchema = new mongoose.Schema({
fullname: {
    firstname: {
        type: String,
        required: true,
        minlength: [3, "First name must be at least 3 characters long"],
        maxlength: [15, "First name must be less than 15 characters long"],
    },
    lastname: {
        type: String,
        minlength: [3, "Last name must be at least 3 characters long"],
        maxlength: [15, "Last name must be less than 15 characters long"],
    },
},
email: {
    type: String,
    required: true,
    unique: true,
    match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Please enter a valid email address",
    ],
},
password: {
    type: String,
    required: true,
    select: false,
},

socketId: {
    type: String,
},
}, {timestamps: true});


userSchema.methods.generateAuthToken = function() {
    const token = jwt.sign({_id: this._id}, process.env.JWT_SECRET, {expiresIn: "1d"});
    return token;
}

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.statics.hashPassword = async function(password) {
    return await bcrypt.hash(password, 10);
}


const userModel = mongoose.model("User", userSchema);

module.exports = userModel;