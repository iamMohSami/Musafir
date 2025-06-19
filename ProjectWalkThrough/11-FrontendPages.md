# 11 - Frontend Setup: Vite + React + Tailwind + Routing + Context (In-Depth)

I’m building this MERN app for the first time, so below I’ve tried to explain **why** we perform each step, not just **how**.

---

## 1. Create the Vite React Project

### Steps

1. **Run** at repo root:

   ```bash
   npm create vite@latest Frontend
   ```
2. **Choose** the `react` template (or `react-ts` for TypeScript).
3. **Navigate**:

   ```bash
   cd Frontend
   ```
4. **Clean up**: Delete boilerplate example code in `src/` (keep only essential files).

### Why?

* **Vite** gives lightning-fast startup and HMR (hot module replacement) compared to Create React App.
* Beginners benefit from a minimal config: Vite auto-generates working webpack-like setup under the hood.

---

## 2. Install & Configure Tailwind CSS

### Steps

1. **Install** dev dependencies:

   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
2. **Configure** `tailwind.config.js`:

   ```js
   module.exports = {
     content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
     theme: { extend: {} },
     plugins: [],
   }
   ```
3. **Add** to `src/index.css`:

   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
4. **Import** it in `src/main.jsx`:

   ```js
   import './index.css';
   ```

### Why?

* **Tailwind** is a utility-first CSS framework: instead of writing custom CSS classes, you compose built-in utility classes (e.g. `bg-blue-500`, `p-4`) directly in JSX.
* **PostCSS** processes your CSS (handles `@tailwind` directives).
* **Autoprefixer** adds vendor prefixes automatically.

---

## 3. Scaffold Page Components

### Steps

1. **Make** `src/pages/` with files:

   * `Home.jsx`
   * `UserLogin.jsx`, `UserSignup.jsx`
   * `CaptainLogin.jsx`, `CaptainSignup.jsx`
2. **Use** the `rafce` snippet (React Arrow Function Component Export) to generate a skeletal function:

   ```jsx
   import React from 'react';

   const Home = () => {
     return <div>Home</div>;
   };

   export default Home;
   ```

### Why?

* **Component-per-page** keeps each route’s JSX isolated, improving readability and maintainability.
* **`rafce`** quickly scaffolds boilerplate function + export.

---

## 4. Add React Router

### Steps

1. **Install**:

   ```bash
   npm install react-router-dom
   ```
2. **Wrap** your app in `BrowserRouter` in `src/main.jsx`:

   ```jsx
   import { BrowserRouter } from 'react-router-dom';

   createRoot(...).render(
     <BrowserRouter>
       <App />
     </BrowserRouter>
   );
   ```
3. **Define** routes in `src/App.jsx`:

   ```jsx
   import { Routes, Route } from 'react-router-dom';

   function App() {
     return (
       <Routes>
         <Route path='/' element={<Home />} />
         <Route path='/login' element={<UserLogin />} />
         {/* etc. */}
       </Routes>
     );
   }
   ```

### Why React Router?

* Browsers by default **reload** the page on `<a href>` navigation. React Router intercepts URL changes and renders the appropriate component **without a full reload**, creating a true single-page application (SPA) experience.

### Why wrap with `BrowserRouter`?

* `BrowserRouter` listens for changes to the browser’s address bar (`window.history`) and provides routing context to all nested `<Route>` components.

### Why `<Routes>` and `<Route>` syntax?

* `<Routes>` is a container for multiple `<Route>`s. Each `<Route path="..." element={...}/>` maps a URL path to a React component.
* Using the `element` prop replaces the older `component` prop in v6.

---

## 5. Build Page UIs & Key React Concepts

### 5.1 Home.jsx: Understanding `<Link>`

```jsx
import { Link } from 'react-router-dom';

<Link to='/login'>Continue</Link>
```

* **Why `<Link>` instead of `<a>`?**

  * `<Link>` prevents full page reloads and works with React Router’s history.
  * The `to` prop (string or object) specifies the target route.

### 5.2 UserLogin.jsx: `useState`, `useContext`, Two-Way Binding

```jsx
import { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';

// 1. Local state for form fields
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');

// 2. Global context setter
const { setUser } = useContext(UserContext);

// 3. Handle submit
const submitHandler = e => {
  e.preventDefault(); // Prevent browser’s default form submission behavior (page reload)
  setUser({ email, fullName: {} });
  setEmail('');
  setPassword('');
};
```

* **`useState`**: React hook to create local state variables. Syntax:

  ```js
  const [value, setValue] = useState(initialValue);
  ```
* **Why `useState`?** Stores dynamic data (form input) so React can re-render on changes.
* **Two-Way Binding**: The input’s `value={email}` + `onChange={e => setEmail(e.target.value)}` keeps React state and the UI in sync.
* **`e.preventDefault()`**: Stops the browser from sending a GET/POST and reloading the page, letting us handle data in JavaScript instead.
* **`useContext`**: Accesses shared context (User state) so we can lift form data into global state.

---

## 6. Global State with Context API

### 6.1 What & Why Context?

* **Problem solved**: Passing props through many components (prop drilling).
* **Alternative**: Redux (more boilerplate and learning curve). For small/medium apps, Context is lighter.

### 6.2 Creating & Using Context

**`src/context/UserContext.jsx`**

```jsx
import { createContext, useState } from 'react';

export const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState({ email: '', fullName: { firstName: '', lastName: '' }});
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
```

* **`createContext()`**: Initializes a new context object.
* **Provider**: Wraps your app so any descendent can access the context via `useContext(UserContext)`.
* **`children` prop**: Represents whatever JSX is nested inside `<UserProvider>…</UserProvider>`.

### 6.3 Wrapping the App

In `src/main.jsx`:

```jsx
import UserProvider from './context/UserContext';

<UserProvider>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</UserProvider>
```

* This makes `user` and `setUser` available in any component under `<App />`.

---

## 7. When to Use Redux Instead

* **Redux** offers a single global store & strict update patterns (actions, reducers).
* **When it shines**: Large apps with complex state logic across many unrelated components.
* **Why we skipped**: Our state needs are simple (just user info), so Context is faster to set up and requires less boilerplate.

---

## 8. Next Steps

1. **API Integration:** Hook forms up to your Express endpoints using `fetch` or `axios`.
2. **Protected Routes:** Build a `<PrivateRoute>` wrapper that checks for `user.email` or a valid JWT before rendering sensitive pages.
3. **CaptainContext:** Mirror `UserContext` for driver data.
4. **Deployment:** Run `npm run build` and serve via Node or a host like Netlify/Vercel.

*(End of 11-Frontend.md)*
