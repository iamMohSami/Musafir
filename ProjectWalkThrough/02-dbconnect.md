# 02-DB Connection & Mongoose Models

**Purpose:**
Set up a connection to MongoDB using Mongoose, store the connection logic in a separate module, and verify the connection. This file covers installing Mongoose, creating a `db/` folder with `db.js`, configuring environment variables, modifying `app.js` to use the connection, and testing with `nodemon`.

**Prerequisites:**

* Completion of [01-Setup](01-Setup.md), including a working Express server (with `app.js`, `server.js`, and `.env`).
* A running MongoDB instance (we will point to a local MongoDB URL for now).
* `mongoose` package installed (instructions below).

---

## 1. Install Mongoose

**What**
Mongoose is an Object Data Modeling (ODM) library for MongoDB and Node.js. It provides a straightforward, schema-based solution to model application data, enforces schema validation, and simplifies CRUD operations.

**How**

1. Open a terminal in the `Backend/` directory.
2. Run:

   ```bash
   npm install mongoose
   ```
3. You should see output similar to:

   ```
   PS D:\Btech IIIT Surat 2022-2026\Web Dev\..Web Dev Projects\Carvaan\Backend> npm i mongoose

   added 17 packages, and audited 87 packages in 4s

   16 packages are looking for funding
     run `npm fund` for details

   found 0 vulnerabilities
   ```
4. Confirm that `package.json` now lists `mongoose` under dependencies, and that a new `package-lock.json` and `node_modules/mongoose` folder exist.

**Why**

* **Mongoose** abstracts away low-level MongoDB driver operations into simple functions and schema declarations.
* We can define models with strict schemas, add middleware (hooks), and handle validation automatically.
* Installing it now ensures our project can connect to and interact with MongoDB.

---

## 2. Create `db/` Folder and `db.js` Connection Module

### 2.1 Create `db/` Folder

**What**
We will isolate database connection logic in its own folder so that `app.js` remains concise. This follows a modular design pattern.

**How**

1. In `Backend/`, create a new folder named `db`:

   ```bash
   mkdir db
   ```
2. Create an empty file named `db.js` inside `db/`:

   ```bash
   cd db
   type NUL > db.js   # (Windows) or `touch db.js` on macOS/Linux
   cd ..
   ```
3. Confirm folder structure:

   ```bash
   Backend/
   ├── db/
   │   └── db.js
   ├── node_modules/
   ├── package.json
   ├── app.js
   ├── server.js
   └── .env
   ```

**Why**

* Segregating database connection code improves maintainability and clarity.
* `db.js` becomes the single source of truth for establishing and exporting the connection logic.
* If we later want to add more models or utilities related to the database, they can also live under `db/`.

### 2.2 Write `db.js` Connection Logic

**What**
In `db.js`, we will import Mongoose, define a function to connect using a connection string from `.env`, and export that function.

**How**

1. Open `Backend/db/db.js` and add:

   ```js
   // db/db.js
   const mongoose = require("mongoose");

   /**
    * Connects to MongoDB using the connection string from environment variables.
    * Returns a Promise that resolves on successful connection or rejects on error.
    */
   function connectToDb() {
     // process.env.DB_CONNECT should contain the MongoDB URI
     mongoose
       .connect(process.env.DB_CONNECT, {
         useNewUrlParser: true,
         useUnifiedTopology: true,
       })
       .then(() => {
         console.log("🗄️  Connected to MongoDB");
       })
       .catch((err) => {
         console.error("❌ MongoDB connection error:", err);
       });
   }

   module.exports = connectToDb;
   ```
2. Explanation of each part:

   * **`require("mongoose")`**: Imports Mongoose to access its connect function and model features.
   * **`mongoose.connect(...)`**: Initiates a connection to the MongoDB server specified by `process.env.DB_CONNECT`.

     * `useNewUrlParser: true`: Uses the new MongoDB connection string parser (recommended).
     * `useUnifiedTopology: true`: Uses the new server discovery and monitoring engine.
   * **`.then()`**: Logs a success message if the connection is established.
   * **`.catch()`**: Catches and logs any connection errors.
   * **`module.exports = connectToDb;`**: Exports the function so other modules (like `app.js`) can import and call it.

**Why**

* This function ensures we only attempt to connect once at application startup.
* Placing the connection logic in its own file avoids cluttering `app.js` and allows easy reuse.
* The options in `mongoose.connect` prevent deprecation warnings and align with current best practices.

---

## 3. Configure `.env`

**What**
We will add a `DB_CONNECT` variable to our `.env` file so that the MongoDB connection string is not hardcoded in source code.

**How**

1. Open `Backend/.env`. Add (or update) lines:

   ```env
   PORT=4000
   DB_CONNECT=mongodb://0.0.0.0:27017/carvaan
   ```

   * `mongodb://0.0.0.0:27017/carvaan`: Assumes a local MongoDB instance running on default port 27017, using a database named `carvaan`.
   * If your local MongoDB runs on `localhost` instead of `0.0.0.0`, you can use `mongodb://localhost:27017/carvaan`.

2. Save the `.env` file.

**Why**

* Environment variables keep configuration separate from code.
* We can easily swap to a production or remote database by changing the `.env` value, without editing source files.
* Security: do not commit credentials or connection strings to version control if they contain username/password (for now ours is a local unauthenticated URL).

---

## 4. Update `app.js` to Use `connectToDb()`

**What**
We must call `connectToDb()` before the server starts listening, so that any DB operations later in the request-handling pipeline will succeed.

**How**

1. Open `Backend/app.js`. Replace its contents with:

   ```js
   // app.js

   // 1. Load environment variables
   const dotenv = require("dotenv");
   dotenv.config();

   // 2. Import Express and initialize
   const express = require("express");
   const app = express();

   // 3. Import CORS middleware
   const cors = require("cors");
   app.use(cors());

   // 4. Import and call our DB connection module
   const connectToDb = require("./db/db");
   connectToDb();  // Attempt to connect immediately

   // 5. (Optional) Parse JSON bodies
   app.use(express.json());

   // 6. Basic health check route
   app.get("/", (req, res) => {
     res.send("Hello World");
   });

   module.exports = app;
   ```
2. Key changes and reasoning:

   * **`dotenv.config()`**: Ensures `process.env.DB_CONNECT` is populated.
   * **`app.use(cors())`**: Remains near the top so all routes will allow cross-origin requests.
   * **`connectToDb()`**: Invokes the function from `db.js` to start the MongoDB connection.
   * **`app.use(express.json())`**: Keeps JSON parsing for future POST/PUT routes.
   * The rest is identical to the previous example, with a simple GET `/` endpoint to confirm the server is running.

**Why**

* We want to connect to the database at application startup, before any incoming requests are handled.
* Calling `connectToDb()` before defining routes helps ensure any subsequent route handlers can safely use Mongoose models.
* If the DB connection fails, the logged error will alert us immediately (rather than silently failing later).

---

## 5. Test Connection with `nodemon`

**What**
Restart the server and watch for the “Connected to MongoDB” message. Verify that no errors occur.

**How**

1. In `Backend/`, run:

   ```bash
   npx nodemon
   ```
2. Expected terminal output (abbreviated):

   ```
   PS D:\Btech…\Carvaan\Backend> npx nodemon
   [nodemon] 3.1.10
   [nodemon] to restart at any time, enter `rs`
   [nodemon] watching path(s): *.*
   [nodemon] watching extensions: js,mjs,cjs,json
   [nodemon] starting `node server.js`
   🗄️  Connected to MongoDB
   Server is running on port 4000
   ```
3. Open a browser (or Postman) to [http://localhost:4000](http://localhost:4000) to confirm you still see:

   ```
   Hello World
   ```
4. If you see `Connected to MongoDB` in the console and no errors, the connection is successful.

**Why**

* Seeing the “🗄️  Connected to MongoDB” confirmation ensures Mongoose connected to the specified URI.
* If there is any connection error (e.g., MongoDB isn’t running, or the URI is invalid), the `.catch(...)` block will log the error, preventing silent failures.

---

## 6. (Optional) Verify the Database from Mongo Shell or Atlas

**What**
Confirm that Mongoose actually created/connected to the `carvaan` database on your local MongoDB instance.

**How (Local Mongo Shell)**

1. Open a new terminal window (separate from the Express server).
2. Run:

   ```bash
   mongo
   ```

   This opens the MongoDB shell connected to `mongodb://localhost:27017` by default.
3. In the shell, list databases:

   ```js
   show dbs
   ```

   You should see `carvaan` in the list (it may be empty if no collections were created).
4. Switch to the `carvaan` database:

   ```js
   use carvaan
   ```
5. Create a test collection or list existing ones:

   ```js
   db.createCollection("testCollection");  // Optional
   show collections;
   ```
6. Exit the shell:

   ```js
   exit
   ```

**Why**

* Verifying via Mongo Shell ensures that Mongoose’s `connect()` call truly reached the right MongoDB instance and database name.
* Creating a test collection shows that writes can be performed, confirming read/write access.

---

## 7. Next Steps: Create Mongoose Models

With the database connection in place, we can now define Mongoose schemas and models (e.g., `User`, `Ride`, `Driver`) under a new folder (e.g., `models/`). Typical workflow:

1. **Create `models/` folder** in `Backend/`.
2. **Define a schema** for each entity. For instance, `models/User.js`:

   ```js
   const mongoose = require("mongoose"); 

   const userSchema = new mongoose.Schema({
     name: { type: String, required: true },
     email: { type: String, required: true, unique: true },
     passwordHash: { type: String, required: true },
     role: { type: String, enum: ["rider", "driver"], default: "rider" },
     createdAt: { type: Date, default: Date.now }
   });

   module.exports = mongoose.model("User", userSchema);
   ```
3. **Import and use models** in route handlers. For example, after setting up authentication routes, you might do:

   ```js
   const User = require("../models/User");
   ```
4. **Perform CRUD operations** using model methods (`User.find()`, `User.create()`, etc.).

In the next walkthrough file, we will cover model creation and basic CRUD routes.

---

*(End of 02-DB Connection & Mongoose Models)*
