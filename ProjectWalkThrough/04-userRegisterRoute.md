# 04 - User Registration Route and Authentication Setup

In this step, we implement the **User Registration Route** using Express, Mongoose, Express-Validator, and JWT-based authentication.

---

## 🔧 Step 1: Setup Routes Folder and Base File

Create a folder named `routes` and inside it create a file named `user.routes.js`

```js
const express = require("express");
const router = express.Router();

// routes will be added here

module.exports = router;
```

---

## 📦 Step 2: Install express-validator

To validate user input before registering them, we need `express-validator`.

```bash
npm i express-validator
```

This helps in validating form fields like email, password, confirmPassword, etc.

---

## ✏️ Step 3: Add Registration Route Logic to `user.routes.js`

```js
const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const userController = require("../controllers/user.controller");

// Register Route
router.post("/register", [
    body("email").isEmail().withMessage("Invalid Email"),
    body("fullname.firstname").isLength({ min: 3 }).withMessage("Firstname is required and must be at least 3 characters long"),
    body("password").isLength({ min: 6 }).withMessage("Password is required and must be at least 6 characters long"),
    body("confirmPassword").notEmpty().withMessage("Confirm Password is required"),
    body("confirmPassword").custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error("Password confirmation does not match!");
        }
        return true;
    }),
], userController.registerUser);

module.exports = router;
```

---

## 🧠 Step 4: Setup Service for Creating User in DB

Create a folder `services` and inside it, `user.service.js`:

```js
const userModel = require("../models/user.model");

module.exports.createUser = async ({ firstname, lastname, email, password }) => {
    if (!firstname || !email || !password) {
        throw new Error("All fields are required");
    }

    const user = await userModel.create({
        fullname: { firstname, lastname },
        email,
        password,
    });

    if (!user) {
        throw new Error("Failed to create user");
    }

    return user;
};
```

This modularizes the logic of interacting with the database.

---

## 🧩 Step 5: Create Logic for `registerUser` Controller

Inside `controllers/user.controller.js`:

```js
const userModel = require("../models/user.model");
const userService = require("../services/user.service");
const { validationResult } = require("express-validator");

module.exports.registerUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password } = req.body;

    const hashedPassword = await userModel.hashPassword(password);

    try {
        const user = await userService.createUser({
            firstname: fullname.firstname,
            lastname: fullname.lastname,
            email,
            password: hashedPassword,
        });

        const token = user.generateAuthToken();
        res.status(201).json({ message: "User created successfully", user, token });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};
```

### 🔐 Explanation:

* **validationResult** ensures only valid data is processed.
* **hashPassword** uses bcrypt to hash passwords securely.
* **generateAuthToken** generates a JWT token for authentication.

---

## 🛠 Step 6: Update `app.js` to Use User Routes

```js
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const app = express();

const cors = require("cors");
const connectToDb = require("./db/db");
const userRoutes = require("./routes/user.routes");

connectToDb();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.use("/users", userRoutes);

module.exports = app;
```

This will map the route `/users/register` for user registration.

---

## 📬 Step 7: Test via Postman

### Endpoint:

```
POST http://localhost:4000/users/register
```

### Sample Request Body:

```json
{
  "fullname": {
    "firstname": "Mohammad",
    "lastname": "Sami"
  },
  "email": "sami@example.com",
  "password": "mypassword",
  "confirmPassword": "mypassword"
}
```

### Expected Response:

```json
{
  "message": "User created successfully",
  "user": { ... },
  "token": "...jwt_token..."
}
```

i.e.

```json
{
    "message": "User created successfully",
    "user": {
        "fullname": {
            "firstname": "Mohammad",
            "lastname": "Sami"
        },
        "email": "sami@example.com",
        "password": "$2b$10$/E.XF2i9w3beBxjHseXjeuK60U/NN6Oi3WRGJhWwXiWhDK15Ath/2",
        "_id": "68483fff5c5481581c9fe666",
        "createdAt": "2025-06-10T14:23:59.263Z",
        "updatedAt": "2025-06-10T14:23:59.263Z",
        "__v": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODQ4M2ZmZjVjNTQ4MTU4MWM5ZmU2NjYiLCJpYXQiOjE3NDk1NjU0Mzl9.sQl9a63TcQGA4l4HnJF6SYH76_jaYq4h37SDoYgsTEE"
}
```

---

## ✅ Summary:

* We created a route `/users/register` for registering users.
* Used `express-validator` for input validation.
* Used bcrypt to hash passwords securely.
* Generated JWT tokens using `jsonwebtoken`.
* Used MVC architecture with `routes`, `controllers`, `services`, and `models` for clean separation.

You're now ready to move to login, middleware, and protected routes!
