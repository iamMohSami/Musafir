# 10 - Captain Authentication: Login, Profile & Logout Routes

**Purpose:**
Implement **Login**, **Profile** (protected), and **Logout** endpoints for captains. This mirrors the user authentication flow but uses a specialized `authCaptain` middleware and controller functions tailored to captain-specific logic.

**Prerequisites:**

* Captain model with `hashPassword`, `comparePassword`, and `generateAuthToken` methods (see [08-captainModel.md](08-captainModel.md)).
* BlacklistToken model for logout-based blacklisting.
* `cookie-parser` configured in `app.js`.
* Imported `captain.routes.js` under `/captains` in `app.js`.

---

## 1. Define Routes: `routes/captain.routes.js`

Open `routes/captain.routes.js` and add:

```js
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const captainController = require('../controllers/captain.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// 1. Login Route
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
  ],
  captainController.loginCaptain
);

// 2. Protected Profile Route
router.get(
  '/profile',
  authMiddleware.authCaptain,
  captainController.getCaptainProfile
);

// 3. Logout Route
router.get(
  '/logout',
  authMiddleware.authCaptain,
  captainController.logoutCaptain
);

module.exports = router;
```

**Why:**

* **`/login`**: Allows captains to authenticate and receive a JWT (and cookie).
* **`/profile`**: Protected route returning the authenticated captain’s data.
* **`/logout`**: Invalidates the token via blacklist and clears the cookie.

---

## 2. Login Controller: `controllers/captain.controller.js`

Add the `loginCaptain` function:

```js
const captainModel = require('../models/captain.model');
const { validationResult } = require('express-validator');

module.exports.loginCaptain = async (req, res, next) => {
  // 1. Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // 2. Find captain by email, include password hash
    const captain = await captainModel.findOne({ email }).select('+password');
    if (!captain) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 3. Compare passwords
    const isMatch = await captain.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 4. Generate JWT and set as cookie
    const token = captain.generateAuthToken();
    res.cookie('token', token, { httpOnly: true });

    // 5. Send response
    res.status(200).json({
      message: 'Captain logged in successfully',
      token,
      captain,
    });
  } catch (err) {
    console.error('Error in loginCaptain:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
```

**Explanation:**

1. **Validation:** Returns **400** on invalid email/password format.
2. **Lookup:** Uses `select('+password')` because `password` is excluded by default.
3. **Password check:** `comparePassword` uses bcrypt.
4. **JWT + Cookie:** Stores token in an HTTP-only cookie for secure subsequent requests, and returns it in JSON.
5. **Response:** Includes the captain object (without hash unless `select('+password')` was removed before returning).

---

## 3. Auth Middleware for Captains: `middlewares/auth.middleware.js`

Add `authCaptain` to the existing file:

```js
const jwt = require('jsonwebtoken');
const blackListTokenModel = require('../models/blacklistToken.model');
const captainModel = require('../models/captain.model');

module.exports.authCaptain = async (req, res, next) => {
  // 1. Extract token from cookie or header
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No Token Found | Unauthorized' });
  }

  // 2. Check blacklist
  const isBlacklisted = await blackListTokenModel.findOne({ token });
  if (isBlacklisted) {
    return res.status(401).json({ message: 'Token is Blacklisted | Unauthorized' });
  }

  try {
    // 3. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 4. Fetch captain and attach to request
    const captain = await captainModel.findById(decoded._id).select('-password');
    if (!captain) {
      return res.status(404).json({ message: 'Captain Not Found' });
    }
    req.captain = captain;
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    return res.status(401).json({ message: 'Invalid Token | Unauthorized' });
  }
};
```

**Why:**

* Ensures token is present and not blacklisted.
* Verifies signature & expiration.
* Fetches the captain document, excluding the password field.
* Saves the captain on `req` for downstream handlers.

---

## 4. Profile Controller: `controllers/captain.controller.js`

Implement `getCaptainProfile`:

```js
module.exports.getCaptainProfile = async (req, res, next) => {
  const captain = req.captain; // Provided by authCaptain middleware
  if (!captain) {
    return res.status(404).json({ message: 'Captain not found' });
  }

  res.status(200).json({
    message: 'Captain profile retrieved successfully',
    captain,
  });
};
```

**Why:**

* Simple handler: relies on the middleware to authenticate and attach the captain.

---

## 5. Logout Controller: `controllers/captain.controller.js`

Add `logoutCaptain`:

```js
const blackListTokenModel = require('../models/blacklistToken.model');

module.exports.logoutCaptain = async (req, res, next) => {
  // 1. Extract token
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(400).json({ message: 'No token found' });
  }

  // 2. Blacklist the token
  await blackListTokenModel.create({ token });

  // 3. Clear the cookie
  res.clearCookie('token');

  // 4. Send confirmation
  res.status(200).json({ message: 'Captain logged out successfully' });
};
```

**Why:**

* Blacklisting prevents further use of the token even if still unexpired.
* Clearing the cookie on the client side stops automatic inclusion in future requests.

---

## 6. Workflow & Testing with Postman

### 6.1 Login Test

* **Request:** `POST http://localhost:4000/captains/login`

* **Headers:** `Content-Type: application/json`

* **Body:**

  ```json
  {
    "email": "rakesh@musafir.com",
    "password": "rakesh123"
  }
  ```

* **Expected Response:** `200 OK`

  ```json
  {
    "message": "Captain logged in successfully",
    "token": "<jwt_token>",
    "captain": { /* full captain object (no password) */ }
  }
  ```

* **Cookies Tab:** shows `token=<jwt_token>` saved automatically.

### 6.2 Profile Test

* **Request:** `GET http://localhost:4000/captains/profile`

* **Authorization:** use the cookie or set header `Authorization: Bearer <jwt_token>`

* **Expected Response:** `200 OK`

  ```json
  {
    "message": "Captain profile retrieved successfully",
    "captain": { /* same object as login, without password */ }
  }
  ```

### 6.3 Logout Test

* **Request:** `GET http://localhost:4000/captains/logout`

* **Authorization:** same token (cookie or header)

* **Expected Response:** `200 OK`

  ```json
  { "message": "Captain logged out successfully" }
  ```

* **After Logout:** cookie `token` is cleared, and trying `/captains/profile` again returns **401 Unauthorized** `{ "message": "Token is Blacklisted | Unauthorized" }`.

---

## 7. Summary

* **Login:** authenticate and receive `token` in response & cookie.
* **Profile:** protected route that returns captain data.
* **Logout:** blacklists token, clears cookie, prevents reuse.

*(End of 10-captainRoutes.md)*
