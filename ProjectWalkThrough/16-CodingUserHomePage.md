# 16 - Completing the User Homepage Flow

**Goal:**
Implement the three core panels and the final `Riding` page to complete the user’s end-to-end ride-booking experience:

1. **LocationSearchPanel** – List of address suggestions.
2. **VehiclePanel** – Choose ride type & view fares.
3. **ConfirmRidePanel** – Review and confirm ride details.
4. **LookingForDriverPanel** – Loading state while matching a driver.
5. **WaitingForDriverPanel** – Display matched driver info.
6. **Riding Page** – Active ride view with live map & actions.

---

## 1. LocationSearchPanel Component

### File: `src/components/LocationSearchPanel.jsx`

```jsx
import React from 'react';

const LocationSearchPanel = ({ onSelect }) => {
  // 1. Sample locations array (mocked for now)
  const locations = [
    "24B, 1st Floor, 1st Cross...560068",
    "114A, 3rd Floor, 3rd Cross...560068",
    "123, 4th Floor, 4th Cross...560068"
  ];

  return (
    <div className='p-4'>
      {locations.map((loc, idx) => (
        <div
          key={idx}
          onClick={() => onSelect(loc)}       // 2. Pass selection up
          className='flex gap-4 border-2 p-3 rounded-xl items-center my-2 active:border-black'
        >
          <div className='bg-[#eee] h-8 w-8 flex items-center justify-center rounded-full'>
            <i className='ri-map-pin-fill'></i>
          </div>
          <h4 className='font-medium'>{loc}</h4>
        </div>
      ))}
    </div>
  );
};

export default LocationSearchPanel;
```

**Notes:**

* **`onSelect(loc)`**: callback prop invoked when a user picks an address.
* **Mock data**: Replace with real geolocation/suggestions API later.
* **Styling**: Tailwind classes for spacing, borders, and rounded icons.

---

## 2. VehiclePanel Component

### File: `src/components/VehiclePanel.jsx`

```jsx
import React from 'react';

const VehiclePanel = ({ options, onSelect }) => {
  return (
    <div className='fixed bottom-0 w-full z-10 bg-white px-3 py-8 transform translate-y-full' ref={options.panelRef}>
      <h3 className='text-2xl font-semibold mb-5'>Choose a Vehicle</h3>
      {options.list.map((v, i) => (
        <div
          key={i}
          onClick={() => onSelect(v)}      // 1. Return selected vehicle
          className='flex items-center justify-between gap-4 p-3 border-2 rounded-xl mb-2 active:border-black'
        >
          <img src={v.icon} alt={v.type} className='h-12' />
          <div className='w-1/2'>
            <h4 className='text-lg font-semibold'>
              {v.name} <span><i className='ri-user-3-fill'></i>{v.capacity}</span>
            </h4>
            <h5 className='text-sm font-medium'>{v.eta} away</h5>
            <p className='text-sm text-gray-500'>{v.description}</p>
          </div>
          <h2 className='text-xl font-bold'>{v.fare}</h2>
        </div>
      ))}
    </div>
  );
};

export default VehiclePanel;
```

**Notes:**

1. **`options.list`**: an array of vehicle objects `{ name, icon, capacity, eta, description, fare }`.
2. **`onSelect(v)`**: callback to store vehicle choice.
3. **Positioning**: `fixed bottom-0` ensures panel overlays map.
4. **`transform translate-y-full`**: initially hidden off-screen; GSAP will animate it into view.

---

## 3. ConfirmRidePanel Component

### File: `src/components/ConfirmRidePanel.jsx`

```jsx
import React from 'react';

const ConfirmRidePanel = ({ pickup, destination, vehicle, fare, onConfirm, onClose }) => (
  <div className='fixed bottom-0 w-full z-20 bg-white px-3 py-6 pt-12 transform translate-y-full' ref={vehicle.confirmRef}>
    <h5 onClick={onClose} className='absolute top-0 w-full text-center p-1'>
      <i className='ri-arrow-down-wide-line text-3xl text-gray-200'></i>
    </h5>
    <h3 className='text-2xl font-semibold mb-5'>Confirm your Ride</h3>

    <div className='flex flex-col items-center gap-5'>
      <img src={vehicle.icon} alt={vehicle.name} className='h-20' />
      <div className='w-full space-y-3'>
        <div className='flex items-center gap-5 p-3 border-b-2'>
          <i className='ri-map-pin-user-fill'></i>
          <div>
            <h3 className='text-lg font-medium'>{pickup}</h3>
            <p className='text-sm text-gray-600'>Pickup</p>
          </div>
        </div>

        <div className='flex items-center gap-5 p-3 border-b-2'>
          <i className='ri-map-pin-2-fill'></i>
          <div>
            <h3 className='text-lg font-medium'>{destination}</h3>
            <p className='text-sm text-gray-600'>Drop-off</p>
          </div>
        </div>

        <div className='flex items-center gap-5 p-3'>
          <i className='ri-currency-line'></i>
          <div>
            <h3 className='text-lg font-medium'>{fare}</h3>
            <p className='text-sm text-gray-600'>Fare</p>
          </div>
        </div>
      </div>

      <button
        onClick={onConfirm}
        className='w-full mt-5 bg-green-600 text-white font-semibold p-2 rounded-lg'
      >Confirm Ride</button>
    </div>
  </div>
);

export default ConfirmRidePanel;
```

**Notes:**

* **Props:**

  * `pickup`, `destination`, `vehicle.icon`, `fare`.
  * `onConfirm()`: fires ride request.
  * `onClose()`: collapses panel.

---

## 4. LookingForDriverPanel Component

Same layout as **ConfirmRidePanel** but without the confirm button, instead a loading spinner:

```jsx
import React from 'react';
const LookingForDriverPanel = ({ pickup, destination, vehicle }) => (
  <div>/* similar JSX */<div className='spinner'></div></div>
);
export default LookingForDriverPanel;
```

**Notes:** Show a spinner to indicate matching in progress.

---

## 5. WaitingForDriverPanel Component

Displays real driver details once matched:

```jsx
import React from 'react';
const WaitingForDriverPanel = ({ pickup, destination, driver }) => (
  <div>/* driver.name, driver.vehicle, driver.photo */</div>
);
export default WaitingForDriverPanel;
```

**Notes:**

* Rendered only after backend notifies acceptance via WebSocket or polling.

---

## 6. Riding Page

### File: `src/pages/Riding.jsx`

```jsx
import React from 'react';
import { Link } from 'react-router-dom';

const Riding = ({ driver, pickup, destination, fare }) => (
  <div className='h-screen relative overflow-hidden'>
    {/* Home button to exit ride */}
    <Link to='/home' className='fixed top-2 right-2 h-10 w-10 bg-white flex items-center justify-center rounded-full'>
      <i className='ri-home-5-line text-lg'></i>
    </Link>

    {/* Live Map (half-screen) */}
    <div className='h-1/2'>
      <img src='/Images/homemapgif.gif' alt='map' className='h-full w-full object-cover' />
    </div>

    {/* Ride Details & Payment */}
    <div className='h-1/2 p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <img src={driver.photo} alt={driver.name} className='h-12' />
        <div className='text-right'>
          <h2 className='font-medium'>{driver.name}</h2>
          <h4 className='font-semibold'>{driver.plate}</h4>
          <p className='text-sm text-gray-600'>{driver.vehicleType}</p>
        </div>
      </div>

      <div className='space-y-3'>
        <div className='flex items-center gap-4 border-b-2 p-3'>
          <i className='ri-map-pin-2-fill'></i>
          <div><h3>{pickup}</h3><p className='text-sm text-gray-600'>Pickup</p></div>
        </div>
        <div className='flex items-center gap-4 p-3'>
          <i className='ri-currency-line'></i>
          <div><h3>{fare}</h3><p className='text-sm text-gray-600'>Fare</p></div>
        </div>
      </div>

      <button className='w-full bg-green-600 text-white font-semibold p-2 rounded-lg'>Make Payment</button>
    </div>
  </div>
);

export default Riding;
```

**Notes:**

* Use real-time map and driver tracking via socket in future.
* Payment integration to follow once booking is complete.

---

## Integration Summary

1. **State orchestration** in `Home.jsx`: maintain flags (`panelOpen`, `vehiclePanel`, `confirmPanel`, etc.) and data (`pickup`, `destination`, `vehicle`, `driver`).
2. **GSAP tweens** for each panel’s `ref` transitioning on flag toggles.
3. **Props & callbacks**: child components are stateless, receive data & event props.
4. **Data flow**: from mock arrays → local state → eventual API requests & WebSocket events.

This modular approach makes swapping mock data for real services straightforward while keeping each panel self-contained for testing and styling.

*(End of 16-BuildingUserHomepage3.md)*
