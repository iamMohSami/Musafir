# 01-Setup

**Purpose:**
Set up a basic Express backend for the Carvaan project, configure environment variables, enable CORS, verify with a “Hello World” endpoint, and initialize a Git repository with appropriate ignores.

**Prerequisites:**

* Node.js (v14+ recommended) installed on your machine
* Git installed and configured with GitHub credentials
* Optional: VS Code (or any code editor/IDE) for editing files

---

## 1. Create the Backend Folder

**What**
We need a dedicated folder to house all backend-related code and configuration.

**How**

1. In your project root, create a new folder named `Backend`. For example, if your project root is:

   ```
   D:\Btech IIIT Surat 2022-2026\Web Dev\..Web Dev Projects\Carvaan
   ```

   open a terminal there and run:

   ```bash
   mkdir Backend
   ```
2. Change into that directory:

   ```bash
   cd Backend
   ```
3. Verify the folder exists by listing files:

   ```bash
   dir
   ```

   You should see an empty `Backend` folder or a prompt indicating you are now inside it.

**Why**

* Segregating frontend and backend code helps maintain a clear project structure.
* A dedicated `Backend` folder makes it easy to locate all server-related files later.

---

## 2. Initialize `package.json` (`npm init -y`)

**What**
Scaffold a minimal `package.json` file, which tracks dependencies, scripts, and metadata.

**How**

1. In the `Backend/` folder’s terminal, run:

   ```bash
   npm init -y
   ```
2. Terminal output (abbreviated):

   ```
   PS D:\Btech…\Carvaan\Backend> npm init -y
   Wrote to D:\Btech…\Carvaan\Backend\package.json:

   {
     "name": "backend",
     "version": "1.0.0",
     "description": "",
     "main": "index.js",
     "scripts": {
       "test": "echo \"Error: no test specified\" && exit 1"
     },
     "keywords": [],
     "author": "",
     "license": "ISC"
   }
   ```
3. Open `package.json` to confirm its contents:

   ```json
   {
     "name": "backend",
     "version": "1.0.0",
     "description": "",
     "main": "index.js",
     "scripts": {
       "test": "echo \"Error: no test specified\" && exit 1"
     },
     "keywords": [],
     "author": "",
     "license": "ISC"
   }
   ```

**Why**

* `package.json` is the central manifest for our Node.js project.
* Using `-y` accepts all defaults and quickly creates a boilerplate. We can customize fields (e.g., description, author) later as needed.
* The `"main": "index.js"` field won’t matter immediately since we’ll create `app.js` and `server.js`, but it’s standard to have.

---

## 3. Install Core Dependencies (`express`, `dotenv`, `cors`)

**What**
Add essential libraries:

* **Express**: Fast, unopinionated web framework for Node.js.
* **dotenv**: Loads environment variables from a `.env` file into `process.env`.
* **cors**: Middleware to enable Cross-Origin Resource Sharing, allowing our frontend (e.g., React Native) to call this API.

**How**

1. In the same `Backend/` folder, run:

   ```bash
   npm install express dotenv cors
   ```
2. Terminal output (abbreviated):

   ```
   PS D:\Btech…\Carvaan\Backend> npm install express dotenv cors
   added 50 packages, and audited 70 packages in 2s

   15 packages are looking for funding
     run `npm fund` for details

   found 0 vulnerabilities
   ```
3. Directory now contains:

   ```
   Backend/
   ├── node_modules/
   ├── package-lock.json
   └── package.json
   ```

**Why**

* **Express** is the backbone of our API server—easy routing, middleware support.
* **dotenv** lets us keep secrets (like ports, API keys, database URIs) out of source code.
* **cors** prevents “Cross-Origin Request” errors when, for example, our React Native app (on `localhost:8081`) tries to call `localhost:4000`. By enabling CORS, we allow the frontend to talk to the backend seamlessly.

---

## 4. Create Core Files (`app.js`, `server.js`, `.env`)

### 4.1 `app.js`

**What**
Defines the Express application, middleware setup, and basic routes. We’ll export `app` so `server.js` can instantiate the HTTP server.

**How**

1. In `Backend/`, create `app.js` with the following content:

   ```js
   // app.js

   // 1. Load environment variables as early as possible
   const dotenv = require("dotenv");
   dotenv.config();

   // 2. Import Express and initialize app
   const express = require("express");
   const app = express();            // ← Must come before any app.use() calls

   // 3. Enable CORS so our frontend can make requests
   const cors = require("cors");
   app.use(cors());

   // 4. (Optional) Parse JSON bodies in incoming requests
   app.use(express.json());

   // 5. Define a basic root route for quick testing
   app.get("/", (req, res) => {
     res.send("Hello World");
   });

   // 6. Export the app instance
   module.exports = app;
   ```
2. Save and double-check indentations (2 spaces per level is fine).

**Why**

* **`dotenv.config()`**: Loads `.env` variables into `process.env`. Must come before using `process.env.PORT` in `server.js`.
* **`const app = express()` first**: We cannot use `app.use(...)` until `app` is defined—this avoids the “Cannot access ‘app’ before initialization” error.
* **`app.use(cors())`**: Necessary middleware for cross-origin requests.
* **`express.json()`**: Built-in middleware to parse JSON payloads—useful once we add POST/PUT endpoints.
* **`app.get("/", …)`**: A sanity check that the server is up and responding.
* **`module.exports = app`**: Exports the Express instance so `server.js` can attach it to an HTTP server.

---

### 4.2 `server.js`

**What**
Creates the HTTP server that listens on a port (from `.env` or default `3000`) and uses the Express app from `app.js`.

**How**

1. In `Backend/`, create `server.js` with:

   ```js
   // server.js

   // 1. Native HTTP module
   const http = require("http");

   // 2. Import our Express app
   const app = require("./app");

   // 3. Read port from environment or fallback to 3000
   const port = process.env.PORT || 3000;

   // 4. Create the HTTP server wrapping our Express app
   const server = http.createServer(app);

   // 5. Start listening on the specified port
   server.listen(port, () => {
     console.log(`Server is running on port ${port}`);
   });
   ```
2. Save the file.

**Why**

* Separating `server.js` from `app.js` makes future extensions easy (e.g., attaching WebSocket listeners or specialized server logic).
* By reading `process.env.PORT`, we allow easy reconfiguration without changing code—just edit `.env`.

---

### 4.3 `.env`

**What**
Define environment-specific configuration (port number, database credentials, API keys) outside source code.

**How**

1. In `Backend/`, create a file named `.env` (no filename extension).
2. Add:

   ```
   PORT=4000
   ```
3. Save.

**Why**

* Using a `.env` file keeps “secrets” or environment settings out of version control.
* We set `PORT=4000` so our server listens on port 4000. If we omit a `.env`, `server.js` will default to port 3000.

---

## 5. Test the Server with `nodemon`

**What**
Run the server in “watch” mode so changes restart the process automatically. Confirm that the “Hello World” route works.

**How**

1. Install `nodemon` globally or use `npx` to run it without installing:

   ```bash
   npx nodemon
   ```
2. Terminal output:

   ```
   PS D:\Btech…\Carvaan\Backend> npx nodemon
   [nodemon] 3.1.10
   [nodemon] to restart at any time, enter `rs`
   [nodemon] watching path(s): *.*
   [nodemon] watching extensions: js,mjs,cjs,json
   [nodemon] starting `node server.js`
   Server is running on port 4000
   ```
3. Open a browser (or Postman) and navigate to:

   ```
   http://localhost:4000
   ```

   You should see:

   ```
   Hello World
   ```

**Why**

* **`nodemon`** restarts our server whenever we modify any JavaScript files—great for development.
* Verifying the root endpoint confirms that our Express app, environment variables, and CORS setup are all functioning.

---

## 6. Initialize Git and Create `.gitignore`

### 6.1 `git init` & Initial Commit

**What**
Set up a local Git repository to track changes. We’ll push this to GitHub after ignoring files we don’t want in version control.

**How**

1. In `Backend/`, run:

   ```bash
   git init
   ```

   Terminal output:

   ```
   Initialized empty Git repository in D:/Btech…/Carvaan/Backend/.git/
   ```
2. Stage files and commit:

   ```bash
   git add .
   git commit -m "chore: initial Express setup with CORS and Hello World"
   ```

   Terminal output:

   ```
   [main (root-commit) abcdef1] chore: initial Express setup with CORS and Hello World
    3 files changed, 50 insertions(+)
    create mode 100644 app.js
    create mode 100644 server.js
    create mode 100644 .env
   ```

**Why**

* Version control is essential for tracking changes, collaborating, and reverting mistakes.
* The first commit saves our baseline: a working Express server.

---

### 6.2 Create `.gitignore`

**What**
Prevent certain files/folders (e.g., `node_modules`, `.env`) from being committed to Git.

**How**

1. In `Backend/`, create a file named `.gitignore` with:

   ```
   # Node modules
   node_modules/

   # Environment variables
   .env

   # VS Code settings (optional)
   .vscode/

   # MacOS system files (optional)
   .DS_Store
   ```

2. Save `.gitignore`.

3. Update Git to ignore these files. If any were already staged, unstage and remove from tracking:

   ```bash
   git rm -r --cached node_modules/ .env
   ```

   Terminal output:

   ```
   rm 'node_modules/express/index.js'
   rm 'node_modules/…'
   rm '.env'
   ```

4. Stage and commit the `.gitignore`:

   ```bash
   git add .gitignore
   git commit -m "chore: add .gitignore to exclude node_modules and .env"
   ```

   Terminal output:

   ```
   [main abcdef2] chore: add .gitignore to exclude node_modules and .env
    1 file changed, 4 insertions(+)
    create mode 100644 .gitignore

   ```
