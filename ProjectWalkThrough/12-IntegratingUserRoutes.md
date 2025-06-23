# 12 - Integrating User Routes: Signup, Login, Protected Home & Logout

**Purpose:**
Connect your React frontend pages to the backend API for user signup, login, and logout. Implement programmatic navigation, centralize your base URL for different environments, and protect sensitive routes using a wrapper component.

---

## 1. Renaming Landing vs. Home Pages

1. **Rename** the old landing page:

   ```bash
   mv src/pages/Home.jsx src/pages/Start.jsx
   ```
2. **Create** a new `src/pages/Home.jsx` for the authenticated user’s dashboard.
3. **Update** your routes in `src/App.jsx`:

   ```jsx
   import Start from './pages/Start';
   import Home from './pages/Home';
   import UserLogin from './pages/UserLogin';
   import UserSignup from './pages/UserSignup';
   import CaptainLogin from './pages/CaptainLogin';
   import CaptainSignup from './pages/CaptainSignup';

   function App() {
     return (
       <Routes>
         {/* Public landing */}
         <Route path='/' element={<Start />} />

         {/* Authentication */}
         <Route path='/login' element={<UserLogin />} />
         <Route path='/signup' element={<UserSignup />} />
         <Route path='/captainlogin' element={<CaptainLogin />} />
         <Route path='/captainsignup' element={<CaptainSignup />} />

         {/* Protected home */}
         <Route path='/home' element={<Home />} />
       </Routes>
     );
   }

   export default App;
   ```

**Why?** Separating the **public landing** (`Start`) from the **user dashboard** (`Home`) clarifies which routes require authentication.

---

## 2. Centralize the Backend URL

1. In `Frontend/.env`, add:

   ```env
   VITE_BASE_URL=http://localhost:4000
   ```
2. Access it in code via:

   ```js
   import.meta.env.VITE_BASE_URL
   ```

**Why?** Easily switch between development and production APIs without changing source files.

---

## 3. UserSignup Page Integration

### 3.1 Install Dependencies

```bash
npm install axios
```

### 3.2 Updates to `UserSignup.jsx`

```jsx
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../context/UserContext';

const UserSignup = () => {
  // Local form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const navigate = useNavigate();          // Programmatic navigation
  const { setUser } = useContext(UserContext);

  const submitHandler = async (e) => {
    e.preventDefault();                    // Prevent page reload

    const newUser = {
      fullname: { firstname: firstName, lastname: lastName },
      email,
      password,
      confirmPassword
    };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/register`,
        newUser
      );

      if (response.status === 201) {
        // 1. Store user in context
        setUser(response.data.user);
        // 2. Persist token
        localStorage.setItem('token', response.data.token);
        // 3. Redirect to protected home
        navigate('/home');
      }
    } catch (err) {
      console.error('Signup failed:', err.response?.data || err.message);
      // TODO: display validation errors to user
    }

    // Reset form
    setFirstName(''); setLastName('');
    setEmail(''); setPassword(''); setConfirmPassword('');
  };

  return (
    <div className='p-7 h-screen flex flex-col justify-between'>
      <form onSubmit={submitHandler}>
        {/* Form fields for name, email, password, confirmPassword */}
        <button type='submit'>Create new account</button>
      </form>
      <Link to='/login'>Already have an account? Login here!</Link>
    </div>
  );
};

export default UserSignup;
```

**Key Points:**

* **`useNavigate`**: React Router hook for programmatic redirection.
* **Axios**: simplifies HTTP requests, returns status + data.
* **Context**: `setUser` populates global user state upon successful signup.
* **Form reset**: clears inputs for better UX.

---

## 4. UserLogin Page Integration

In `UserLogin.jsx`, mirror the signup logic:

```jsx
const submitHandler = async (e) => {
  e.preventDefault();

  const credentials = { email, password };
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/users/login`,
      credentials
    );
    if (response.status === 200) {
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);
      navigate('/home');
    }
  } catch (err) {
    console.error('Login failed:', err.response?.data || err.message);
    // TODO: show error to user
  }

  setEmail(''); setPassword('');
};
```

**Why?** Same flow: authenticate → store state & token → redirect.

---

## 5. Protecting the Home Route

### 5.1 Create `UserProtectWrapper.jsx`

```jsx
import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const UserProtectWrapper = ({ children }) => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    // If no token or no user data, redirect to login
    if (!token || !user.email) {
      navigate('/login');
    }
  }, [token, user, navigate]);

  return <>{children}</>;
};

export default UserProtectWrapper;
```

### 5.2 Wrap the Home Route

```jsx
import UserProtectWrapper from './components/UserProtectWrapper';

<Route
  path='/home'
  element={
    <UserProtectWrapper>
      <Home />
    </UserProtectWrapper>
  }
/>
```

**Why?**

* Ensures that accessing `/home` without authentication immediately redirects to `/login`.
* `useEffect` runs on mount — checks state + token and navigates away if invalid.

---

## 6. UserLogout Flow

### 6.1 Create `UserLogout.jsx`

```jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserLogout = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BASE_URL}/users/logout`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        if (response.status === 200) {
          localStorage.removeItem('token');
          navigate('/login');
        }
      })
      .catch(err => {
        console.error('Logout failed:', err);
        navigate('/login');
      });
  }, [navigate, token]);

  return <div>Logging out...</div>;
};

export default UserLogout;
```

### 6.2 Add Logout Route

```jsx
<Route
  path='/user/logout'
  element={
    <UserProtectWrapper>
      <UserLogout />
    </UserProtectWrapper>
  }
/>
```

**Why?**

* Automatically calls the backend logout endpoint, which clears the cookie and blacklists the token.
* Removes token from `localStorage`, then redirects the user.

---

## 7. Summary & Next Steps

* **Signup/Login** pages now communicate with your `/users` API routes.
* **Navigation** uses `useNavigate` for redirects post-auth.
* **Environment vars** keep backend URLs configurable.
* **`UserProtectWrapper`** enforces authentication for `/home` and `/user/logout`.

**Next:** Implement similar flows for captains, handle API error displays in the UI, and integrate ride-hailing features on the protected home screen.

*(End of 12-IntegratingUser.md)*
