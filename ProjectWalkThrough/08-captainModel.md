# 08 - Captain Model & Authentication Helpers

**Purpose:**
Define a separate **Captain** schema and model for drivers (or “captains”) in our ride-hailing app. This includes personal details, vehicle info, real-time location, and authentication methods (password hashing and JWT creation). All code explanations are detailed.

**Prerequisites:**

* Existing Express, Mongoose, and user authentication setup.
* Installed packages: `mongoose`, `bcryptjs`, `jsonwebtoken`.

---

## 1. Create `captain.model.js` File

In the `models/` folder, create `captain.model.js`:

```bash
cd models
touch captain.model.js    # Or `type NUL > captain.model.js`
```

Open and populate with the following code:

```js
// models/captain.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Captain Schema
 * - fullname: embedded first & last name with validation
 * - email: unique login identifier
 * - password: hashed, non-selectable by default
 * - socketId: for real-time communication
 * - status: active/inactive for availability
 * - vehicle: nested object capturing vehicle details
 * - location: current GPS coordinates
 */
const captainSchema = new mongoose.Schema({
  fullname: {
    firstname: {
      type: String,
      required: true,
      minlength: [3, 'First name must be at least 3 characters long'],
      maxlength: [20, 'First name must be at most 20 characters long'],
    },
    lastname: {
      type: String,
      minlength: [3, 'Last name must be at least 3 characters long'],
      maxlength: [20, 'Last name must be at most 20 characters long'],
    }
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please fill a valid email address'
    ],
  },

  password: {
    type: String,
    required: true,
    select: false,  // Exclude from query results unless explicitly selected
    minlength: [8, 'Password must be at least 8 characters long'],
    maxlength: [20, 'Password must be at most 20 characters long'],
  },

  socketId: {
    type: String,
    default: null,  // Will be set when captain connects via Socket.io
  },

  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'inactive',  // Captains start as unavailable by default
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
      unique: true,  // Each vehicle plate must be unique
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
    lat: { type: Number },  // Latitude coordinate
    lng: { type: Number },  // Longitude coordinate
  }
});

/**
 * Instance Method: generateAuthToken
 * - Creates a JWT for the captain using their _id
 * - Token expires in 1 day (aligns with user tokens)
 */
captainSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { _id: this._id },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

/**
 * Instance Method: comparePassword
 * - Compares a plaintext password with the stored hash
 * - Returns a Promise that resolves to true if match
 */
captainSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

/**
 * Static Method: hashPassword
 * - Hashes a plaintext password with bcrypt (10 salt rounds)
 * - Returns a Promise resolving to the hashed string
 */
captainSchema.statics.hashPassword = async function(password) {
  return await bcrypt.hash(password, 10);
};

// Compile and export the model
const Captain = mongoose.model('Captain', captainSchema);
module.exports = Captain;
```

---

## 2. Detailed Explanation

### 2.1 Field Definitions

* **`fullname`**: An embedded object with two fields:

  * **`firstname`** (String): Required, 3–20 characters. Cannot be omitted.
  * **`lastname`** (String): Optional, 3–20 characters if provided.
  * **Why embedded?** Separates first/last for display and validation.

* **`email`** (String):

  * Required, must be unique across captains.
  * Lowercased on save to ensure case-insensitive uniqueness.
  * Validated against a regex for basic email format.

* **`password`** (String):

  * Required, at least 8 characters, max 20.
  * `select: false` ensures queries like `Captain.find()` do not return this field unless explicitly requested with `.select('+password')`.

* **`socketId`** (String):

  * Populated when the captain’s client connects via WebSocket (e.g., Socket.io) for real-time updates.

* **`status`** (String):

  * Either `'active'` or `'inactive'`.
  * Defaults to `'inactive'` until the captain toggles availability in the app.

* **`vehicle`** (Embedded Object):

  * **`color`**: Required string, 3+ chars.
  * **`plate`**: Required unique string, ensures each vehicle plate is registered only once.
  * **`capacity`**: Number, at least 1 (min passengers).
  * **`vehicleType`**: Enum restricted to known types (`car`, `motorcycle`, `auto`).

* **`location`**:

  * **`lat`** and **`lng`**: Numbers representing the captain’s current GPS coordinates.
  * Updated in real time as the captain moves on the map.

### 2.2 Authentication Helpers

* **`generateAuthToken()`** (instance method):

  * Signs a JWT with payload `{ _id: this._id }` and secret from environment.
  * `expiresIn: '1d'` ensures token validity for 24 hours.
  * Captains will include this token in `Authorization` headers or cookies.

* **`comparePassword(password)`** (instance method):

  * Uses `bcrypt.compare()` to check the plaintext candidate password against the stored hash (`this.password`).
  * Returns `true` if they match, otherwise `false`.

* **`hashPassword(password)`** (static method):

  * Generates a bcrypt hash with 10 salt rounds.
  * Used before saving a new captain or updating their password.

### 2.3 Model Compilation

```js
const Captain = mongoose.model('Captain', captainSchema);
module.exports = Captain;
```

* Registers the schema under the `"captains"` collection (Mongoose pluralizes automatically).
* Exporting `Captain` allows us to `require('../models/captain.model')` in controllers and routes.

---

## 3. Next Steps

1. **Create Captain Registration & Login Routes** (`routes/captain.routes.js`)
2. **Controllers** (`controllers/captain.controller.js`) to handle signup, login, profile, location updates.
3. **Reuse `authUser` Middleware** or create a new `authCaptain` middleware to protect captain-only routes.
4. **Real-Time Features**: Use `socketId` to broadcast ride requests to nearby captains.
5. **Status & Location Updates**: Endpoints to toggle `status` and update `location` fields as the captain accepts rides.

*(End of 08-captainModel.md)*
