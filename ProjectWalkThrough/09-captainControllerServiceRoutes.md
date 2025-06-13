# 09 - Captain Registration: Routes, Controllers & Services

**Purpose:**
Build the **Captain Registration** workflow, mirroring user authentication but tailored to “captains” (drivers). We will:

1. Register routes under `/captains`.
2. Use **express-validator** for input validation.
3. Implement a **service layer** (`captain.service.js`) to handle database logic.
4. Create a **controller** (`captain.controller.js`) that orchestrates validation, business checks, service calls, and response.

**Prerequisites:**

* **08-captainModel.md**: Captain schema with hashing and token methods.
* Installed: `express`, `express-validator`, `bcryptjs`, `jsonwebtoken`, `mongoose`.

---

## 1. Mounting the Captain Routes in `app.js`

**What**: Add the captain routes under the base path `/captains`.

**How**:

```js
// app.js
const captainRoutes = require("./routes/captain.routes");
// ... existing middleware
app.use("/captains", captainRoutes);
```

**Why**:

* Segregates captain endpoints from user endpoints.
* Clear URL namespace: `POST /captains/register`.

---

## 2. Define the Routes: `routes/captain.routes.js`

**What**: Create Express router and validation rules for `POST /register`.

**How**:

```js
// routes/captain.routes.js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const captainController = require('../controllers/captain.controller');

// Captain Registration
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('fullname.firstname')
      .isLength({ min: 3 })
      .withMessage('First name is required and must be at least 3 characters long'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('vehicle.color')
      .notEmpty()
      .withMessage('Vehicle color is required')
      .isLength({ min: 3 }),
    body('vehicle.plate')
      .notEmpty()
      .withMessage('Vehicle plate is required'),
    body('vehicle.capacity')
      .notEmpty()
      .isInt({ min: 1 })
      .withMessage('Vehicle capacity is required and must be a number'),
    body('vehicle.vehicleType')
      .isIn(['car', 'motorcycle', 'auto'])
      .withMessage('Vehicle type is invalid'),
  ],
  captainController.registerCaptain
);

module.exports = router;
```

**Why**:

* **`express-validator`**: declaratively enforces input constraints before controller logic runs.
* Ensures `fullname`, `email`, `password`, and `vehicle` fields are present and valid.

---

## 3. Service Layer: `services/captain.service.js`

**What**: Encapsulate direct database interactions away from the controller.

**How**:

```js
// services/captain.service.js
const captainModel = require('../models/captain.model');

module.exports.createCaptain = async ({
  firstname,
  lastname,
  email,
  password,
  color,
  plate,
  capacity,
  vehicleType,
}) => {
  // 1. Ensure all required fields are provided
  if (!firstname || !lastname || !email || !password || !color || !plate || !capacity || !vehicleType) {
    throw new Error('All fields are required');
  }

  // 2. Create the captain document (returns a Promise)
  const captain = await captainModel.create({
    fullname: { firstname, lastname },
    email,
    password,
    vehicle: { color, plate, capacity, vehicleType },
  });

  return captain;
};
```

**Why**:

* Centralizes DB logic for easier maintenance and testing.
* Validates presence of fields at service level as a safety net.
* Returns the newly created document for the controller to use.

---

## 4. Controller: `controllers/captain.controller.js`

**What**: Handle request validation, email uniqueness check, password hashing, call service, and respond.

**How**:

```js
// controllers/captain.controller.js
const captainModel = require('../models/captain.model');
const captainService = require('../services/captain.service');
const { validationResult } = require('express-validator');

module.exports.registerCaptain = async (req, res, next) => {
  // 1. Handle validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullname, email, password, vehicle } = req.body;

  try {
    // 2. Prevent duplicate email
    const exists = await captainModel.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Captain with this email already exists' });
    }

    // 3. Hash password using schema static method
    const hashedPassword = await captainModel.hashPassword(password);

    // 4. Create captain via service layer
    const captain = await captainService.createCaptain({
      firstname: fullname.firstname,
      lastname: fullname.lastname,
      email,
      password: hashedPassword,
      color: vehicle.color,
      plate: vehicle.plate,
      capacity: vehicle.capacity,
      vehicleType: vehicle.vehicleType,
    });

    // 5. Generate JWT for the new captain
    const token = captain.generateAuthToken();

    // 6. Respond with 201 Created
    res.status(201).json({
      message: 'Captain registered successfully',
      token,
      captain,
    });
  } catch (err) {
    console.error('Error in registerCaptain:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

**Why**:

1. **Validation**: Early exit on invalid input.
2. **Uniqueness**: Avoids duplicate accounts.
3. **Hashing**: Secures password using bcrypt.
4. **Service Call**: Delegates creation to `captainService`.
5. **Token Generation**: Immediately authenticate the captain upon signup.
6. **Error Handling**: Catch and log unexpected errors.

---

## 5. Workflow Summary

1. **Client** sends `POST /captains/register` with JSON body containing `fullname`, `email`, `password`, and `vehicle` data.
2. **Route** applies validation rules; invalid requests get **400 Bad Request**.
3. **Controller** checks for existing email, hashes password, and invokes **Service**.
4. **Service** creates the document in MongoDB via **Mongoose**.
5. **Controller** generates a JWT using schema `.generateAuthToken()`.
6. **Response**: **201 Created** with:

   ```json
   {
     "message": "Captain registered successfully",
     "token": "<jwt_token>",
     "captain": { /* captain object with fullname, email, hashed password, status, vehicle, _id, __v */ }
   }
   ```

---

## 6. Postman Testing

### 6.1 Request Setup

* **Method:** POST
* **URL:** `http://localhost:4000/captains/register`
* **Headers:** `Content-Type: application/json`
* **Body (raw JSON):**

  ```json
  {
    "fullname": { "firstname": "TestCaptain", "lastname": "TestCap" },
    "email": "testcaptain@musafir.com",
    "password": "test123",
    "vehicle": {
      "color": "red",
      "plate": "MH 02 CB 4763",
      "capacity": 5,
      "vehicleType": "car"
    }
  }
  ```

### 6.2 Expected Response

* **Status:** `201 Created`
* **Body:**

  ```json
  {
    "message": "Captain registered successfully",
    "token": "eyJh...<rest_of_jwt>",
    "captain": {
      "fullname": {"firstname":"TestCaptain","lastname":"TestCap"},
      "email":"testcaptain@musafir.com",
      "password":"$2b$10$...",            
      "status":"inactive",
      "vehicle":{"color":"red","plate":"MH 02 CB 4763","capacity":5,"vehicleType":"car"},
      "_id":"<mongo_id>",
      "__v":0
    }
  }
  ```

**Explanation:**

* **`message`** confirms successful registration.
* **`token`** is a JWT signed for the new captain (1d expiration).
* **`captain`** object reflects saved data—with the hashed password (bcrypt string), default `status`, and the vehicle details.

*(End of 09-captainControllerServiceRoutes.md)*
