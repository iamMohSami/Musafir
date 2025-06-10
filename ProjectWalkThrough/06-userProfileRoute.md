# 06 - User Profile Route & Authentication Middleware

**Purpose:**
Expose a **protected** `/users/profile` endpoint that returns the current user’s profile. Only authenticated users with a valid JWT (via header or cookie) can access their own data. Unauthenticated or invalid-token requests must receive an **Unauthorized (401)** response.

**Prerequisites:**

* Completed user registration and login routes (`/users/register`, `/users/login`)
* Mongoose `User` model with `comparePassword()` and `generateAuthToken()` methods
* Installed: `express`, `mongoose`, `express-validator`, `bcrypt`, `jsonwebtoken`, `cookie-parser`

---

## 1. Create Authentication Middleware

### 1.1 Why Middleware?

* Middleware runs **before** route handlers.
* It can inspect requests for tokens, validate them, and attach user data to `req`.
* Keeps route handlers focused on business logic rather than authentication checks.

### 1.2 Setup `middlewares/auth.middleware.js`

**1.** Create a folder `middlewares` and file `auth.middleware.js`:

```bash
mkdir middlewares
cd middlewares
touch auth.middleware.js   # or use PowerShell: `type NUL > auth.middleware.js`
cd ..
```

**2.** Import dependencies and write the `authUser` function:

```js
// middlewares/auth.middleware.js
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

/**
 * authUser
 * - Checks for a JWT in cookies or Authorization header
 * - Verifies the token, fetches the user, and attaches it to req.user
 * - Returns 401 or 404 if unauthorized or user not found
 */
module.exports.authUser = async (req, res, next) => {
  // 1. Retrieve token
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token found | Unauthorized" });
  }

  try {
    // 2. Verify token signature
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 3. Find user by ID, exclude password field
    const user = await userModel.findById(decoded._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // 4. Attach user and proceed
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    return res.status(401).json({ message: "Invalid token | Unauthorized" });
  }
};
```

**Why:**

* Checks both **cookies** and **Authorization header** for flexibility.
* Uses `jwt.verify()` to ensure token integrity.
* `decoded._id` must match the user’s MongoDB `_id` in the token payload.
* `select("-password")` excludes the hash from returned data.

---

## 2. Enable Cookie Parsing in `app.js`

To read `req.cookies.token`, install and use `cookie-parser`.

```bash
npm install cookie-parser
```

In **`app.js`**, near the top:

```diff
 const express = require("express");
 const dotenv = require("dotenv");
+const cookieParser = require("cookie-parser");
 const cors = require("cors");
 const connectToDb = require("./db/db");
 const userRoutes = require("./routes/user.routes");

 dotenv.config();

 const app = express();
 connectToDb();
 app.use(cors());
+app.use(cookieParser());
 app.use(express.json());
 app.use(express.urlencoded({ extended: true }));

 app.get("/", (req, res) => res.send("Hello World"));

 app.use("/users", userRoutes);
```

**Why:**

* `cookie-parser` populates `req.cookies` from the `Cookie` header.
* We can now read `req.cookies.token` if the client stored the JWT in a cookie.

---

## 3. Add Protected `/profile` Route in `user.routes.js`

In **`routes/user.routes.js`**, import and apply the middleware:

```diff
 const express = require("express");
 const router = express.Router();
 const { body } = require("express-validator");
 const userController = require("../controllers/user.controller");
+const authMiddleware = require("../middlewares/auth.middleware");

 // Registration and login routes...

-// Profile route placeholder
-router.get("/profile", userController.getUserProfile);
+// Protected Profile Route
+router.get(
+  "/profile",
+  authMiddleware.authUser,       // ← only authenticated users
+  userController.getUserProfile  // ← returns req.user
+);

 module.exports = router;
```

**Why:**

* The `authUser` middleware ensures only requests with a valid token reach `getUserProfile`.
* Routes remain chained, so errors in middleware halt the request with appropriate status codes.

---

## 4. Implement `getUserProfile` in Controller

In **`controllers/user.controller.js`**, add:

```js
/**
 * getUserProfile
 * - Returns the current authenticated user (attached by authUser middleware)
 */
module.exports.getUserProfile = async (req, res, next) => {
  // req.user was set in authUser middleware
  return res.status(200).json(req.user);
};
```

**Why:**

* `req.user` is a sanitized user document (no password).
* Simple route handler because authentication logic is in middleware.

---

## 5. Testing (Postman)

1. **Sign In to Obtain Token:**

   * `POST http://localhost:4000/users/login` with valid credentials.
   * Extract the returned JWT from the response body (or cookie if you set it there).

2. **Test Unauthorized Access:**

   * `GET http://localhost:4000/users/profile` **without** any token.
   * Expected **401 Unauthorized**.

3. **Test Authorized Access via Header:**

   * Set header `Authorization: Bearer <token>`.
   * Send `GET /users/profile`.
   * Expected **200 OK** with your user object.

4. **Test via Cookie:**

   * After login, if you choose to set the token as a cookie using `res.cookie()`, Postman can send it automatically.
   * Ensure `Cookie: token=<jwt>` header is present.

*(Leave testing details blank until we debug any errors you encounter.)*

---

## 6. Next Steps

* **Error Handling:** Customize responses for token expiration or malformed tokens.
* **Role-Based Access:** If you introduce roles (e.g., driver vs. rider), extend the middleware to check `user.role`.
* **Logout Route:** Clear the token cookie or instruct the client to remove the stored JWT.

*(End of 06-userProfileRoute.md)*
