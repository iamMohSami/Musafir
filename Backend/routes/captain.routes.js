const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const captainController = require('../controllers/captain.controller');


router.post('/register', [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('fullname.firstname').isLength({ min: 3 }).withMessage('First name is required and must be at least 3 characters long'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('vehicle.color').notEmpty().isLength({min:3}).withMessage('Vehicle color is required'),
    body('vehicle.plate').notEmpty().isLength({min:3}).withMessage('Vehicle plate is required'),
    body('vehicle.capacity').notEmpty().isInt({min:1}).withMessage('Vehicle capacity is required and must be a number'),
    body('vehicle.vehicleType').isIn(['car', 'motorcycle', 'auto']).withMessage('Vehicle type is Invalid'),
] , 
captainController.registerCaptain
);



module.exports = router;