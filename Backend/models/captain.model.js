const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const captainSchema = new mongoose.Schema({
    fullname : {
        firstname : {
            type: String,
            required: true,
            minlength : [3 , 'First name must be at least 3 characters long'],
            maxlength : [20 , 'First name must be at most 20 characters long']
        },
        lastname : {
            type: String,
            minlength : [3 , 'Last name must be at least 3 characters long'],
            maxlength : [20 , 'Last name must be at most 20 characters long']
        }
    },


    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },

    password: {
        type: String,
        required: true,
        select : false,
        minlength: [8, 'Password must be at least 8 characters long'],
    },

    socketId: {
        type: String,
    },

    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    },

    vehicle: {
        color: {
            type: String,
            required: true,
            minlength: [3, 'Color must be at least 3 characters long'],
        },
        plate: {
            type: String,
            required: true,
            unique: true,
        },
        capacity: {
            type: Number,
            required: true,
            min: [1, 'Capacity must be at least 1'],
        },
        vehicleType: {
            type: String,
            required: true,
            enum: ['car', 'motorcycle', 'auto'],
        }
    },

    location: {
        lat : {
            type: Number,
        },
        lng:{
            type: Number,
        }
    }
})

// methods

captainSchema.methods.generateAuthToken =  function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, {expiresIn: '1d' })
    return token;
}

captainSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

captainSchema.statics.hashPassword = async function (password) {
    return await bcrypt.hash(password, 10);
}

const captainModel = mongoose.model('Captain', captainSchema);
module.exports = captainModel;


