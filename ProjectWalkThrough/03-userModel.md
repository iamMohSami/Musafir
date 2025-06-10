# 03 - Creating User Model & Authentication Helpers

**Purpose:**
Define the `User` schema and model with Mongoose, add instance and static methods for password hashing and JWT token generation, and set up a controller file to import and use the model. This document explains:

1. Why we use a `models/` folder and a separate `controllers/` folder.
2. How we design the `User` schema with field constraints and validation.
3. Installing and using `bcrypt` and `jsonwebtoken`.
4. Adding methods to the schema: `generateAuthToken()`, `comparePassword()`, and `hashPassword()`.
5. Why and how we import the `User` model in a controller.

**Prerequisites:**

* A connected MongoDB instance (see [02-DB Connection & Mongoose Models](02-DBconnect.md)).
* `mongoose`, `bcrypt`, and `jsonwebtoken` installed in the `Backend/` project.
* Familiarity with Express and Mongoose basics.

---

## 1. Folder Structure & Separation of Concerns

### 1.1 Why a `models/` Folder?

* **Purpose of Models:** In an MVC-inspired (Model-View-Controller) structure, a “model” represents the data layer. A Mongoose model encapsulates both the schema (structure and validation of data) and the methods that operate on that data.
* **Maintainability:** Placing all Mongoose schemas (e.g., `User`, `Ride`, `Driver`) in a dedicated `models/` folder keeps the codebase organized. If we need to update or review data definitions, we know exactly where to look.
* **Reusability:** Models can be required and used in multiple places (e.g., in route handlers, controllers, or background jobs) without duplicating schema definitions.

### 1.2 Why a `controllers/` Folder?

* **Separation of Concerns:** Controllers contain the business logic for handling requests—reading request data, invoking model methods, performing operations, and sending responses. Separating controller code from model code prevents “fat controllers” or “fat models.”
* **Testability:** With controller functions in separate files, we can more easily write unit tests for routes without entangling schema logic.
* **Scalability:** As the project grows, we might have `user.controller.js`, `ride.controller.js`, `payment.controller.js`, etc. Grouping them under `controllers/` reduces clutter in the project root.

### 1.3 Resulting Structure

```
Backend/
├── controllers/
│   └── user.controller.js  <-- Business logic for user-related routes
├── db/
│   └── db.js               <-- Database connection logic
├── models/
│   └── user.model.js       <-- Mongoose schema & model for User
├── node_modules/
├── app.js
├── server.js
├── package.json
├── .env
└── ...other files
```

---

## 2. Defining the `User` Schema in `models/user.model.js`

### 2.1 Create `models/` Folder & File

**How**

1. From the `Backend/` root directory, create a new folder:

   ```bash
   mkdir models
   ```
2. Inside `models/`, create `user.model.js`:

   ```bash
   cd models
   type NUL > user.model.js    # on Windows, or `touch user.model.js` on Mac/Linux
   cd ..
   ```

### 2.2 Import Mongoose, Bcrypt, and JWT

At the top of `user.model.js`, import necessary packages:

```js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
```

* **`mongoose`**: Provides schema creation, model instantiation, and built-in validation.
* **`bcrypt`**: Securely hashes passwords before storing them in the database.
* **`jsonwebtoken`**: Generates JSON Web Tokens for stateless authentication (signing payloads so clients can prove identity on subsequent requests).

### 2.3 Define the Schema Object

```js
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
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,  // Regex for basic email format
      "Please enter a valid email address",
    ],
  },
  password: {
    type: String,
    required: true,
    select: false,       // By default, exclude `password` when querying a user
  },
  socketId: {
    type: String,       // Will store the Socket.io ID for real-time communication
  },
},
{ timestamps: true }     // Adds `createdAt` and `updatedAt` fields automatically
);
```

#### Field-by-Field Explanation

1. **`fullname` (Embedded Object)**

   * **`firstname`**

     * `type: String`: Ensures the value is a string.
     * `required: true`: A first name must be provided when creating a user.
     * `minlength: [3, "..."]`: Validates a minimum of 3 characters, otherwise throws the provided error message.
     * `maxlength: [15, "..."]`: Validates a maximum of 15 characters.
   * **`lastname`**

     * Optional by design (no `required` flag).
     * Still enforces `minlength` and `maxlength` constraints if provided.

   **Why use an embedded `fullname` object?**

   * Many ride-hailing apps want to display a user’s first and last name separately (e.g., “Welcome, John Smith!”).
   * Embedding as an object allows us to add constraints to each subfield.

2. **`email`**

   * `type: String`: The email is text.
   * `required: true`: We need a unique identifier for each user.
   * `unique: true`: Mongoose will create a unique index on this field, preventing duplicate emails at the database level.
   * `match: [regex, "..."]`: Validates that the email fits a standard pattern. This is a minimal check—not fully RFC-compliant, but sufficient for basic validation.

3. **`password`**

   * `type: String`: The password will be stored as a hash (never in plaintext).
   * `required: true`: Cannot create a user without a password.
   * `select: false`: **Important**—when we query a user (e.g., `User.findOne({ email })`), Mongoose will omit the `password` field by default. To include it explicitly, we must use `.select("+password")`. This reduces the risk of accidentally leaking password hashes in API responses.
   * We’re not specifying `minlength` here since password strength and complexity can be handled elsewhere (e.g., front-end or middleware). Since we’ll be hashing and comparing passwords rather than storing plaintext, enforcing a schema-level minimum is less critical.

4. **`socketId`**

   * `type: String`: Will store a Socket.io connection ID.
   * This field is used to map a logged-in user to their real-time connection for features like broadcasting location, sending ride status updates, etc.
   * It’s optional (no `required`), because not every user might be connected via Socket.io all the time.

5. **Schema Options `{ timestamps: true }`**

   * Automatically adds two fields to every document:

     * **`createdAt`**: The timestamp (ISO Date) when the document was first inserted.
     * **`updatedAt`**: The timestamp (ISO Date) whenever the document is modified.
   * **Why `timestamps: true`?**

     * Tracking when a user account was created (`createdAt`) is essential for analytics (e.g., monthly active users) and debugging.
     * Tracking when a record was last updated (`updatedAt`) helps in caching strategies, auditing changes, and invalidating stale data.

### 2.4 Attach Methods to the Schema

#### 2.4.1 `generateAuthToken()` - Instance Method

**Purpose:** Generate a signed JWT (JSON Web Token) that encodes the user’s `_id`. This token will be sent to clients after they log in. Clients include this token in `Authorization` headers for subsequent protected requests.

```js
// Inside user.model.js, after `userSchema` definition:

/**
 * generateAuthToken()
 * - Creates a JWT with the user’s ObjectId as payload
 * - Signs using a secret from `process.env.JWT_SECRET`
 * - Returns the token string
 */
userSchema.methods.generateAuthToken = function() {
  // `this` refers to the current document (a user instance)
  const token = jwt.sign(
    { _id: this._id },             // payload: minimal, only user ID
    process.env.JWT_SECRET,        // secret key (should be long/random in .env)
    { expiresIn: '7d' }            // optional: token validity (e.g., 7 days)
  );
  return token;
};
```

* **Why store only `_id` in the token?**

  * Minimizes token size.
  * Sensitive user data (like email) should not be embedded directly.
  * On protected routes, the server can “verify” the token and then fetch the user data by `_id` from the database.
* **Why use `process.env.JWT_SECRET`?**

  * Never hardcode secrets in code.
  * In production, set `JWT_SECRET` to a strong, random value (e.g., `openssl rand -hex 64`).
  * If someone steals code, they still cannot guess the secret without access to `.env` or environment variables.
* **Optional `expiresIn`:**

  * Tokens that never expire are a security risk.
  * Setting an expiration (e.g., 1 hour, 24 hours, or 7 days) balances user convenience and security.

#### 2.4.2 `comparePassword(password)` - Instance Method

**Purpose:** Compare a plaintext candidate password (from login form) with the hashed password stored in the database. Returns a boolean indicating a match.

```js
/**
 * comparePassword()
 * - Takes a plaintext password string as input
 * - Uses bcrypt.compare() to check it against the stored hash (`this.password`)
 * - Returns a Promise that resolves to `true` if they match, `false` otherwise
 */
userSchema.methods.comparePassword = async function(password) {
  // `this.password` contains the hashed password. Note: Because we set `select: false`,
  // we must call User.findOne(...).select('+password') to get `this.password`.
  return await bcrypt.compare(password, this.password);
};
```

* **Why use `bcrypt.compare()`?**

  * Bcrypt salts and hashes passwords in a one-way function.
  * `compare()` applies the same salt to the candidate password and compares hashes.
* **Why is it `async`?**

  * Bcrypt operations can be CPU-intensive. Using async/await prevents blocking the event loop.

#### 2.4.3 `hashPassword(password)` - Static Method

**Purpose:** Provide a helper at the model level to hash a plaintext password before creating or updating a user. This ensures the logic is centralized and consistent.

```js
/**
 * hashPassword()
 * - Takes a plaintext password string
 * - Uses bcrypt.hash() with a salt round of 10
 * - Returns a Promise that resolves to the hashed password string
 */
userSchema.statics.hashPassword = async function(password) {
  return await bcrypt.hash(password, 10); // 10 rounds of salting (standard)
};
```

* **Why a static method?**

  * We don’t need an actual user instance (`this`) to hash a password. We simply pass a string and get a hash back.
  * We can call it directly as `User.hashPassword('plaintext')` when creating a new user or resetting a password.
* **Why 10 salt rounds?**

  * Provides a balance between security and performance. Each additional round roughly doubles hashing time.
  * 10 is a common default in many Node.js projects.

### 2.5 Compile & Export the Model

```js
// At the bottom of user.model.js
const User = mongoose.model("User", userSchema);
module.exports = User;
```

* **`mongoose.model("User", userSchema)`** registers the schema under the `"User"` collection (Mongoose will pluralize to `"users"` in MongoDB).
* `module.exports = User;` makes it importable elsewhere (e.g., in controllers).

---

## 3. Installing `bcrypt` & `jsonwebtoken`

**What**
We need:

* **`bcrypt`**: For securely hashing user passwords so that we never store plaintext.
* **`jsonwebtoken`**: For creating signed tokens that authorize users to access protected endpoints.

**How**

1. In the `Backend/` root, run:

   ```bash
   npm install bcrypt jsonwebtoken
   ```
2. Terminal output (example):

   ```
   PS D:\Btech IIIT Surat 2022-2026\Web Dev\..Web Dev Projects\Carvaan\Backend> npm i bcrypt jsonwebtoken

   added 16 packages, and audited 103 packages in 3s

   16 packages are looking for funding
     run `npm fund` for details

   found 0 vulnerabilities
   ```
3. Confirm that `package.json` lists both under `dependencies`, and that `node_modules/` has `bcrypt/` and `jsonwebtoken/` subfolders.

**Why**

* We never store passwords in plaintext—`bcrypt` ensures one-way hashing with a salt, so if the database is compromised, raw passwords cannot be easily retrieved.
* `jsonwebtoken` allows us to implement stateless authentication: clients hold a token instead of session cookies, and the server can verify each request by validating the token signature.

---

## 4. Creating `controllers/user.controller.js`

### 4.1 Create `controllers/` Folder & File

**How**

1. From `Backend/`, run:

   ```bash
   mkdir controllers
   ```
2. Inside `controllers/`, create `user.controller.js`:

   ```bash
   cd controllers
   type NUL > user.controller.js    # or `touch user.controller.js`
   cd ..
   ```

### 4.2 Import `User` Model

In `controllers/user.controller.js`, start with:

```js
// controllers/user.controller.js
const User = require("../models/user.model");
```

* **Why**: Controllers need access to the data layer (models). By requiring the `User` model here, our route handlers can perform operations like creating users or validating login.

### 4.3 (Example) Export a Placeholder Signup Function

Although we will flesh out actual route logic later, a simple placeholder shows structure:

```js
// controllers/user.controller.js
const User = require("../models/user.model");

/**
 * registerUser(req, res)
 * - Example function showing how to create a new user in the database.
 */
async function registerUser(req, res) {
  try {
    const { firstname, lastname, email, password } = req.body;

    // 1. Hash the plaintext password
    const hashedPassword = await User.hashPassword(password);

    // 2. Create the new user document
    const newUser = new User({
      fullname: { firstname, lastname },
      email,
      password: hashedPassword,  // store the hash
    });

    await newUser.save();

    // 3. Generate a JWT for the new user
    const token = newUser.generateAuthToken();

    // 4. Return success with token (omit password in response)
    res.status(201).json({
      user: { _id: newUser._id, email: newUser.email, fullname: newUser.fullname },
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while registering user." });
  }
}

module.exports = { registerUser };
```

* **Why hash before saving?**

  * Never store raw passwords.
  * `User.hashPassword()` uses the static method we defined on the schema.
* **Why generate a token?**

  * Immediately after sign-up, it’s convenient to log the user in automatically.
  * The token can be stored client-side and used to authenticate further API requests.
* **Why select only certain fields in response?**

  * We exclude the password (hash) because `userSchema` had `select: false`. Even if we inadvertently used `User.findOne()`, password would be omitted unless explicitly selected.

---

## 5. Why Each Step Matters

1. **`models/user.model.js` vs. `controllers/user.controller.js` Separation**

   * The model handles **data structure**, **validation**, and **data-related methods** (hashing, token generation).
   * The controller handles **request logic**, **reading `req.body`/`req.params`**, and **returning responses**.
   * This separation keeps the codebase modular and easier to maintain.

2. **Field Constraints & Validation**

   * `firstname.required`: Ensures we always have at least a first name.
   * `email.unique` + `match`: Enforces basic email formatting and prevents duplicate accounts.
   * `password.select: false`: By default, queries will not return the password hash unless we explicitly request it. This reduces the risk of accidental leaks.

3. **`timestamps: true` Option**

   * Automatically tracks when each user document was created and last updated.
   * Useful for auditing, analytics, and determining session expiration if needed.

4. **Authentication Helpers**

   * `hashPassword()`: A centralized, reusable way to generate a salted hash of a plaintext password.
   * `comparePassword()`: Abstracts away the complexity of comparing a plaintext input against the stored hash.
   * `generateAuthToken()`: Creates a signed JWT with a minimal payload.
   * By attaching these helpers directly to the schema, we keep related functionality with the data definition, enabling intuitive `User.hashPassword(...)` calls.

5. **Installing & Using External Libraries**

   * **`bcrypt`**: Industry standard for password hashing.
   * **`jsonwebtoken`**: Widely used for stateless, token-based authentication.
   * Installing them via `npm i bcrypt jsonwebtoken` ensures version consistency and easy updates.

6. **Importing the Model in Controllers**

   * Controllers need to query or modify user data. By `require`-ing the `User` model, controllers gain access to all schema definitions, methods, and validation logic.
   * For example, in `registerUser()`, we call `User.hashPassword()` (static) and `newUser.generateAuthToken()` (instance) directly, courtesy of how Mongoose links schema methods to model instances.

---

## 6. Next Steps

1. **Create Route Handlers & Routes**

   * In a new file (e.g., `routes/user.routes.js`), define endpoints such as `POST /api/users/register`, `POST /api/users/login`, etc., and map them to controller functions (like `registerUser`, `loginUser`).
   * Use Express Router to cleanly separate route definitions from `app.js`.

2. **Protect Routes Using JWT Middleware**

   * Write a middleware function that reads the `Authorization` header, verifies the token with `jwt.verify()`, and attaches the decoded user ID to `req.userId`.
   * Apply this middleware to routes that require authentication (e.g., `GET /api/ride/status`).

3. **Implement Login Logic**

   * Create a `loginUser(req, res)` function in `user.controller.js`:

     1. Read `email` and `password` from `req.body`.
     2. Use `User.findOne({ email }).select('+password')` to get the hashed password.
     3. Call `comparePassword(candidatePassword)` to check if it matches.
     4. If valid, generate a new token with `generateAuthToken()` and return it.
     5. Otherwise, respond with an error (e.g., 401 Unauthorized).

4. **Store Socket ID on Login**

   * After verifying login, capture the user’s current Socket.io connection ID (e.g., from `req.body.socketId`) and update the user document:

     ```js
     await User.findByIdAndUpdate(user._id, { socketId: req.body.socketId });
     ```
   * This ensures we can push real-time events (ride status, driver location) to the correct client.

5. **Refine Validation & Error Handling**

   * Add try/catch around any Mongoose operations.
   * Customize error messages for unique-email violations or schema validation errors.

Once you complete and commit `user.model.js` and `user.controller.js` with the code above, our user data layer and authentication infrastructure will be in place. The next walkthrough will cover **routes**, **middleware for JWT verification**, and **implementing the login endpoint**.

---

*(End of 03-CreatingUserModel.md)*
