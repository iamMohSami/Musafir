# 13 - Integrating Captain Routes: Context, Signup/Login, Protected Home & Logout

**Purpose:**
Wire up the React frontend for the captain flow to your backend API. We’ll:

1. Establish a **CaptainContext** for shared driver state.
2. Integrate **CaptainSignup** and **CaptainLogin** pages with Axios and navigation.
3. Create a **CaptainProtectWrapper** HOC to guard the `/captain-home` route.
4. Implement a **CaptainLogout** page and route.

---

## 1. CaptainContext: Global State for Drivers

### 1.1 Create `src/context/CaptainContext.jsx`

```jsx
import { createContext, useState } from 'react';

// 1. Initialize a new context object
export const CaptainDataContext = createContext();

// 2. Provider component wraps the app and supplies state
const CaptainContext = ({ children }) => {
  const [captain, setCaptain] = useState(null);      // holds authenticated captain data
  const [isLoading, setIsLoading] = useState(false); // tracks in-progress profile fetch
  const [error, setError] = useState(null);          // stores any auth/profile errors

  // 3. Optionally, a helper to update captain data
  const updateCaptain = (captainData) => {
    setCaptain(captainData);
  };

  // 4. Value object passed to all consumers
  const value = {
    captain,
    setCaptain,
    isLoading,
    setIsLoading,
    error,
    setError,
    updateCaptain
  };

  return (
    <CaptainDataContext.Provider value={value}>
      {children}
    </CaptainDataContext.Provider>
  );
};

export default CaptainContext;
```

### 1.2 Why CaptainContext?

* **Shared state**: After signup/login, multiple pages (home, profile, header) need captain info.
* **Avoid prop drilling**: Context makes `captain`, `setCaptain` accessible anywhere without passing props.
* **Loading & error flags** centralize auth/profile fetch status for spinners or error messages.

---

## 2. Wrap the App with Context Providers

In `src/main.jsx`:

```jsx
import CaptainContext from './context/CaptainContext.jsx';
import UserContext from './context/UserContext.jsx';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

createRoot(...).render(
  <React.StrictMode>
    <CaptainContext>  {/* 1. CaptainContext outer so user flow nested */}
      <UserContext>    {/* 2. UserContext for riders */}
        <BrowserRouter>
          <App />        {/* 3. BrowserRouter enables routing */}
        </BrowserRouter>
      </UserContext>
    </CaptainContext>
  </React.StrictMode>
);
```

**Why this order?**

1. **CaptainContext** wraps the entire app so any component (including nested user pages) can access captain state.
2. **UserContext** nested for rider flows.
3. **BrowserRouter** inside contexts so route components can use both contexts.

---

## 3. CaptainSignup Integration

In `src/pages/CaptainSignup.jsx`:

```jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CaptainDataContext } from '../context/CaptainContext';

const CaptainSignup = () => {
  // 1. Local form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleCapacity, setVehicleCapacity] = useState('');
  const [vehicleType, setVehicleType] = useState('');

  const navigate = useNavigate();
  const { setCaptain } = useContext(CaptainDataContext);

  const submitHandler = async e => {
    e.preventDefault();

    const captainData = {
      fullname: { firstname: firstName, lastname: lastName },
      email,
      password,
      vehicle: { color: vehicleColor, plate: vehiclePlate, capacity: vehicleCapacity, vehicleType }
    };

    // 2. Call backend signup endpoint
    const response = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/captains/register`,
      captainData
    );

    if (response.status === 201) {
      // 3. Save data in context
      setCaptain(response.data.captain);
      // 4. Persist token
      localStorage.setItem('token', response.data.token);
      // 5. Navigate to captain home
      navigate('/captain-home');
    }
  };

  return (
    <form onSubmit={submitHandler}>
      {/* form fields... */}
      <button type='submit'>Register as Captain</button>
    </form>
  );
};

export default CaptainSignup;
```

**Why?**

1. **Axios** handles HTTP POST and returns JSON.
2. **Context** stores the returned captain object for use elsewhere.
3. **Token in localStorage** used by protector and subsequent API calls.
4. **navigate()** for programmatic redirect to the captain’s dashboard.

---

## 4. CaptainHome & Route

1. **Create** `src/pages/CaptainHome.jsx`:

   ```jsx
   import React from 'react';
   const CaptainHome = () => <div>Welcome, Captain!</div>;
   export default CaptainHome;
   ```
2. **Add** route in `src/App.jsx`:

   ```jsx
   import CaptainHome from './pages/CaptainHome.jsx';

   <Route path='/captain-home' element={<CaptainHome />} />
   ```

**Why separate?** Clean isolation of captain dashboard component.

---

## 5. CaptainLogin Integration

In `src/pages/CaptainLogin.jsx`:

```jsx
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CaptainDataContext } from '../context/CaptainContext';

const CaptainLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setCaptain } = useContext(CaptainDataContext);
  const navigate = useNavigate();

  const submitHandler = async e => {
    e.preventDefault();
    const creds = { email, password };

    const response = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/captains/login`,
      creds
    );

    if (response.status === 200) {
      setCaptain(response.data.captain);
      localStorage.setItem('token', response.data.token);
      navigate('/captain-home');
    }

    setEmail(''); setPassword('');
  };

  return (<form onSubmit={submitHandler}>/* fields */</form>);
};

export default CaptainLogin;
```

**Why?** Follows same pattern as signup: authenticate → context → token → redirect.

---

## 6. Protecting the CaptainHome Route

### 6.1 Create `CaptainProtectWrapper.jsx`

```jsx
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CaptainDataContext } from '../context/CaptainContext';

const CaptainProtectWrapper = ({ children }) => {
  const { captain, setCaptain, setIsLoading } = useContext(CaptainDataContext);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/captainlogin');
      return;
    }
    // Attempt to fetch profile
    axios.get(
      `${import.meta.env.VITE_BASE_URL}/captains/profile`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(res => {
      setCaptain(res.data.captain);
      setIsLoading(false);
    })
    .catch(() => {
      localStorage.removeItem('token');
      navigate('/captainlogin');
    });
  }, [token, navigate, setCaptain, setIsLoading]);

  // Optionally display a loader while verifying
  if (!captain) return <div>Loading...</div>;

  return <>{children}</>;
};

export default CaptainProtectWrapper;
```

### 6.2 Wrap the Route

```jsx
import CaptainProtectWrapper from './components/CaptainProtectWrapper.jsx';

<Route
  path='/captain-home'
  element={
    <CaptainProtectWrapper>
      <CaptainHome />
    </CaptainProtectWrapper>
  }
/>
```

**Why?**

* On mount, the wrapper checks for a token.
* Fetches the captain’s profile from the backend to confirm validity.
* Redirects to login if unauthorized or on error.

---

## 7. Captainlogout Flow

### 7.1 Create `CaptainLogout.jsx`

```jsx
import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CaptainDataContext } from '../context/CaptainContext';

const CaptainLogout = () => {
  const { setCaptain } = useContext(CaptainDataContext);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(
      `${import.meta.env.VITE_BASE_URL}/captains/logout`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then(() => {
      localStorage.removeItem('token');
      setCaptain(null);
      navigate('/captainlogin');
    })
    .catch(() => navigate('/captainlogin'));
  }, [navigate, setCaptain, token]);

  return <div>Logging out...</div>;
};

export default CaptainLogout;
```

### 7.2 Add Logout Route

```jsx
<Route
  path='/captain/logout'
  element={
    <CaptainProtectWrapper>
      <CaptainLogout />
    </CaptainProtectWrapper>
  }
/>
```

**Why?**

* Calls backend to blacklist token & clear cookie.
* Clears local state and storage, then re-routes to login.

---

## 8. Summary & Next Steps

* **Context**: Central store for captain data, errors, loading flags.
* **Signup/Login**: Axios calls → context → token → redirect.
* **Protection**: Wrapper fetches profile, enforces authentication.
* **Logout**: Blacklist on server + local cleanup.

**Next:** Build real-time ride requests on the protected captain home, integrate maps, and enable accept/decline functionality.

*(End of 13-IntegratingCaptainRoutes.md)*
