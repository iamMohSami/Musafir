# 05 - User Login Route and Authentication

**Purpose:**
Implement the **User Login** endpoint to authenticate existing users. This involves validating credentials, comparing passwords, generating JWT tokens, and returning user data securely.

**Prerequisites:**

* Completed **04 - User Registration Route** ([04-userRegisterRoute](04-userRegisterRoute.md))
* `models/user.model.js` with `comparePassword()` and `generateAuthToken()` methods
* Express, Mongoose, `express-validator`, `bcrypt`, and `jsonwebtoken` installed

---

## 1. Update `user.routes.js` to Include Login Route

**1.1** In `routes/user.routes.js`, add the `/login` route below `/register`:

```diff
 const express = require("express");
 const router = express.Router();
 const { body } = require("express-validator");
 const userController = require("../controllers/user.controller");

 // Register Route
 router.post(
   "/register",
   [ /* validation for register */ ],
   userController.registerUser
 );

+// Login Route
+router.post(
+  "/login",
+  [
+    body("email").isEmail().withMessage("Invalid Email"),
+    body("password")
+      .isLength({ min: 8 })
+      .withMessage("Password is required and must be at least 8 characters long"),
+  ],
+  userController.loginUser
+);

 module.exports = router;
```

**Why:**

* We reuse `express-validator` to ensure incoming login requests include a valid email and sufficiently long password.
* Routes remain grouped under `/users`, so the full endpoint is `POST /users/login`.

---

## 2. Add `loginUser` Logic in Controller

**2.1** In `controllers/user.controller.js`, add the `loginUser` function:

```js
const userModel = require("../models/user.model");
const { validationResult } = require("express-validator");

module.exports.loginUser = async (req, res, next) => {
  // 1. Validate request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // 2. Extract credentials
  const { email, password } = req.body;

  try {
    // 3. Find user by email, include password hash explicitly
    const user = await userModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 4. Compare plaintext password to hashed password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 5. Generate JWT token
    const token = user.generateAuthToken();

    // 6. Send success response with user data and token
    res.status(200).json({
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
```

### Explanation of Each Step

1. **`validationResult(req)`**

   * Pulls validation errors from the `express-validator` middleware. If any rules fail, respond with **400 Bad Request** and a list of errors.

2. **`findOne({ email }).select('+password')`**

   * By default, our schema set `password.select = false`. We explicitly include it so we can verify the user’s password.

3. **User not found**

   * If no user document matches that email, respond with **404 Not Found**.

4. **`user.comparePassword(password)`**

   * Uses bcrypt to compare the plaintext `password` against the stored hash. Returns `true` or `false`.
   * If invalid, respond with **401 Unauthorized**.

5. **`user.generateAuthToken()`**

   * Creates a signed JWT containing only the user’s `_id`.
   * The client will include this token in the `Authorization` header for subsequent requests.

6. **Response**

   * **200 OK**: Returns `{ message, user, token }`. The `user` object excludes the password field by default (because `select: false`) unless explicitly included.

---

## 3. Integrate Login Route in `app.js`

Ensure your main application file mounts the router before starting the server:

```js
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectToDb = require("./db/db");
const userRoutes = require("./routes/user.routes");

dotenv.config();

const app = express();
connectToDb();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => res.send("Hello World"));

// User routes (register & login)
app.use("/users", userRoutes);

module.exports = app;
```

---

## 4. Test the Login Endpoint with Postman

1. **URL:** `POST http://localhost:4000/users/login`
2. **Headers:** `Content-Type: application/json`
3. **Body (raw JSON):**

   ```json
   {
     "email": "sami@example.com",
     "password": "mypassword"
   }
   ```
4. **Expected Successful Response (200):**

   ```json
   {
     "message": "Login successful",
     "user": {
       "fullname": { "firstname": "Mohammad", "lastname": "Sami" },
       "_id": "...",
       "email": "sami@example.com",
       "createdAt": "2025-06-10T14:23:59.263Z",
       "updatedAt": "2025-06-10T14:23:59.263Z",
       "__v": 0
     },
     "token": "<jwt_token_here>"
   }
   ```
5. **Error Cases:**

   * **400 Bad Request** if validation fails (invalid email format or password too short).
   * **404 Not Found** if the email isn’t registered.
   * **401 Unauthorized** if the password doesn’t match.
   * **500 Internal Server Error** for unexpected errors.

---

## 5. Next Steps

* **Create JWT Verification Middleware:** Protect future routes (e.g., `POST /rides/request`) by verifying the `Authorization: Bearer <token>` header.
* **Implement Logout Flow:** Optionally blacklist tokens or clear client storage.
* **Add Profile & Update User Routes:** Allow users to fetch and update their own data securely.

*(End of 05-userLoginRoute.md)*
