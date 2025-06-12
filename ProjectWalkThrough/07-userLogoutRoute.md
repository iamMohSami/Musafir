# 07 - User Logout Route & Token Blacklisting

**Purpose:**
Implement a **logout** endpoint that invalidates a user’s JWT by storing it in a blacklist collection. Subsequent requests presenting a blacklisted token will be rejected. We use MongoDB’s **TTL index** to automatically remove expired tokens and prevent unbounded growth.

**Prerequisites:**

* Completed registration, login, profile routes (Docs 04, 05, 06).
* Mongoose connected to MongoDB.
* Installed `cookie-parser` and existing `authUser` middleware.

---

## 1. BlacklistToken Model

Create `models/blacklistToken.model.js`:

```js
// models/blacklistToken.model.js
const mongoose = require("mongoose");

/**
 * Schema for blacklisted tokens.
 * - `token`: the JWT string to invalidate.
 * - `createdAt`: timestamp when token was blacklisted.
 *   Expires automatically after 1 day (TTL index).
 */
const blacklistTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,           // Prevent duplicate entries
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '1d',          // MongoDB TTL: document removed 1 day after `createdAt`
  },
});

module.exports = mongoose.model("BlacklistToken", blacklistTokenSchema);
```

### Explanation:

* **`type: String, required: true`**: Each document stores exactly one JWT string.
* **`unique: true`**: Ensures a token is blacklisted only once.
* **`createdAt`** with **`default: Date.now`**: Automatically set when document is created.
* **`expires: '1d'`**: Creates a TTL index. MongoDB will auto-delete the document 24 hours after `createdAt`, matching the token’s lifespan.

---

## 2. Update Token Generation with Expiration

In **`models/user.model.js`**, modify `generateAuthToken`:

```diff
userSchema.methods.generateAuthToken = function() {
-  const token = jwt.sign({_id: this._id}, process.env.JWT_SECRET);
+  const token = jwt.sign(
+    { _id: this._id },
+    process.env.JWT_SECRET,
+    { expiresIn: '1d' }      // Token valid for 1 day
+  );
  return token;
};
```

**Why:**

* Clients automatically see tokens expire 24 hours after issuance.
* Aligns token lifespan with blacklist TTL, so blacklist entries expire roughly when the token itself becomes invalid.

---

## 3. Logout Route Registration

In **`routes/user.routes.js`**, add the logout endpoint:

```js
// Protected Logout Route
router.get(
  "/logout",
  authMiddleware.authUser,
  userController.logoutUser
);
```

* **URL:** `GET /users/logout`
* **Middleware:** `authUser` ensures only logged-in users can log out.

---

## 4. Logout Controller Logic

In **`controllers/user.controller.js`**, implement `logoutUser`:

```js
const BlacklistToken = require("../models/blacklistToken.model");

module.exports.logoutUser = async (req, res, next) => {
  // 1. Clear the client-side cookie
  res.clearCookie("token");

  // 2. Extract the token from cookie or header
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  // 3. Store token in blacklist
  if (token) {
    await BlacklistToken.create({ token });
  }

  // 4. Respond
  res.status(200).json({ message: "Logout successful" });
};
```

### Explanation:

1. **`res.clearCookie("token")`**: Instructs the client to remove the `token` cookie.
2. **Extract token**: Handles both cookie and header cases.
3. **`BlacklistToken.create({ token })`**: Saves the token so we know it should be rejected even if it hasn’t expired.
4. **HTTP 200**: Indicates logout succeeded.

---

## 5. Extend `authUser` Middleware to Check Blacklist

Modify **`middlewares/auth.middleware.js`**:

```diff
module.exports.authUser = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No Token Found | Unauthorized" });
  }

  try {
-    const decoded = jwt.verify(token, process.env.JWT_SECRET);
-    const user = await userModel.findById(decoded._id).select("-password");
+    // Verify token signature and expiration
+    const decoded = jwt.verify(token, process.env.JWT_SECRET);
+
+    // Check blacklist before fetching user
+    const isBlacklisted = await require("../models/blacklistToken.model").findOne({ token });
+    if (isBlacklisted) {
+      return res.status(401).json({ message: "Token is blacklisted | Unauthorized" });
+    }
+
+    // Fetch user data
+    const user = await userModel.findById(decoded._id).select("-password");
     if (!user) {
       return res.status(404).json({ message: "User Not Found" });
     }
     req.user = user;
     next();
```

**Why:**

* After verifying signature and before trusting the token, we ensure it isn’t in our blacklist.
* Blacklist lookup prevents reuse of tokens after logout, even if they haven’t technically expired.

---

## 6. Testing with Postman

1. **Login** via `POST /users/login` to receive a new token.
2. **Set token** in Postman:

   * **Header:** `Authorization: Bearer <token>`
   * or **Cookie:** `token=<token>`

### Test Logout:

* **Request:** `GET http://localhost:4000/users/logout`
* **Header** or **Cookie** must include valid token.

**Expected Response:**

```json
{ "message": "Logout successful" }
```

* Notice that Postman’s **Cookies** tab now shows no active `token` (client cleared it).
* Response sets no new cookie.

### Test Blacklisting:

1. **Immediately** after logout, try **GET /users/profile** with the same token again.
2. **Expected Response:**

```json
{ "message": "Token is blacklisted | Unauthorized" }
```

* Even though the token is still within its 1-day lifespan, it’s now invalid due to blacklisting.

---

## 7. Benefits of This Approach

* **Stateless Auth + Logout:** JWT remains stateless, but blacklisting simulates revocation.
* **TTL Cleanup:** MongoDB automatically deletes blacklist entries after token expiry (1 day), ensuring collection size stays manageable.
* **Security:** Prevents a logged-out token from being reused if stolen or accidentally shared.

*(End of 07-userLogoutRoute.md)*
