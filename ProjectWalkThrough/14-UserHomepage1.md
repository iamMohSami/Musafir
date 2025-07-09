# 14 - Building the User Homepage

**Objective:**
Craft an interactive, animated homepage for users to initiate ride requests, featuring:

1. **Map area** (temporary GIF placeholder).
2. **Musafir logo** overlay.
3. **Sliding panel** with pickup/destination inputs.
4. **Animation** via GSAP when the panel expands or collapses.

---

## Prerequisites

Install necessary libraries:

```bash
npm install gsap @gsap/react remixicon
```

* **GSAP**: High-performance animation library.
* **@gsap/react**: React bindings for GSAP hooks.
* **remixicon**: Icon font for UI affordances.

---

## Home.jsx Walkthrough

```jsx
import React, { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import 'remixicon/fonts/remixicon.css';
import LocationSearchPanel from '../components/LocationSearchPanel';
```

* **`useState`**: Tracks dynamic UI state (pickup, destination, panelOpen).
* **`useRef`**: References DOM nodes directly for GSAP.
* **`useGSAP`**: Runs animations in response to state changes.
* **`gsap`**: Core animation API.
* **`remixicon.css`**: Provides arrow-down icon.
* **`LocationSearchPanel`**: Placeholder for location suggestions (to be implemented).

```jsx
const Home = () => {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);

  // DOM refs for animations:
  const panelRef = useRef(null);          // bottom sliding panel
  const panelCloseRef = useRef(null);     // close arrow button
  const logoRef = useRef(null);           // Musafir logo

  // No-op form submit handler prevents default HTML behavior:
  const submitHandler = e => e.preventDefault();

  // GSAP animations triggered on panelOpen changes:
  useGSAP(() => {
    if (panelOpen) {
      // 1) Expand panel height to 70%, add padding
      gsap.to(panelRef.current, { height: '70%', padding: 24 });
      // 2) Fade in the close icon
      gsap.to(panelCloseRef.current, { opacity: 1 });
      // 3) Fade out the logo so map fills screen
      gsap.to(logoRef.current, { opacity: 0 });
    } else {
      // Reverse animation when closing panel
      gsap.to(panelRef.current, { height: '0%', padding: 0 });
      gsap.to(panelCloseRef.current, { opacity: 0 });
      gsap.to(logoRef.current, { opacity: 1 });
    }
  }, [panelOpen]);

  return (
    <div className='h-screen relative overflow-hidden'>
      {/* Logo overlay */}
      <h1
        ref={logoRef}
        className='absolute z-10 top-6 left-6 text-black text-3xl font-mono font-extrabold'
      >
        Musafir
      </h1>

      {/* Map placeholder full-screen */}
      <div className='h-screen w-screen'>
        <img
          className='h-full w-full object-cover'
          src='/Images/homemapgif.gif'
          alt='background map'
        />
      </div>

      {/* Sliding panel container positioned at bottom */}
      <div className='absolute top-0 w-full h-screen flex flex-col justify-end'>
        {/* Collapsed panel with inputs */}
        <div className='h-[30%] p-6 bg-white relative'>
          {/* Close button, initially hidden */}
          <h5
            ref={panelCloseRef}
            onClick={() => setPanelOpen(false)}
            className='absolute opacity-0 right-6 top-6 text-2xl'
          >
            <i className='ri-arrow-down-wide-line'></i>
          </h5>

          <h4 className='text-2xl font-semibold'>Find a trip</h4>
          <form
            onSubmit={submitHandler}
            className='relative py-3'
          >
            {/* Vertical line connecting inputs */}
            <div className='line absolute h-16 w-1 top-[50%] -translate-y-1/2 left-5 bg-gray-700 rounded-full'></div>

            {/* Pickup input */}
            <input
              onClick={() => setPanelOpen(true)}      // Open panel on focus
              value={pickup}
              onChange={e => setPickup(e.target.value)}
              className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full'
              type='text'
              placeholder='Add a pick-up location'
            />

            {/* Destination input */}
            <input
              onClick={() => setPanelOpen(true)}
              value={destination}
              onChange={e => setDestination(e.target.value)}
              className='bg-[#eee] px-12 py-2 text-lg rounded-lg w-full mt-3'
              type='text'
              placeholder='Enter your destination'
            />
          </form>
        </div>

        {/* Hidden content panel expands via GSAP */}
        <div ref={panelRef} className='bg-white h-0'>
          <LocationSearchPanel />
        </div>
      </div>
    </div>
  );
};

export default Home;
```

### Detailed Explanation

1. **State Hooks (`useState`):**

   * `pickup`, `destination`: hold current input values.
   * `panelOpen`: toggles expanded/collapsed state.
2. **Refs (`useRef`):**

   * `panelRef`: points to the `<div>` wrapping `LocationSearchPanel`; GSAP animates its height & padding.
   * `panelCloseRef`: points to the close icon (`<h5>`); GSAP animates its opacity.
   * `logoRef`: points to the `<h1>` logo; GSAP fades it in/out.
3. **`submitHandler`:** prevents default form submission to avoid page reload; placeholder until search logic is added.
4. **Animation (`useGSAP`):** hook accepts a callback and dependencies: when `panelOpen` changes, GSAP tweens run:

   * **Opening:** expand panel to 70% height, show padding, show close arrow, hide logo.
   * **Closing:** reverse back to 0 height, hide padding, hide close arrow, show logo.
5. **Render Structure:**

   * **Wrapper**: `relative`, full-screen height, `overflow-hidden` to clip content.
   * **Logo**: Absolutely positioned top-left for branding; hidden on panel open.
   * **Map container**: full-screen `<img>` placeholder; later replaced by a dynamic map component.
   * **Sliding panel**: positioned at bottom via `flex flex-col justify-end`; consists of two parts:

     * **Header** (`h-[30%]`): always visible, contains inputs and open/close logic.
     * **Body** (initial `h-0`): invisible until expanded, holds `LocationSearchPanel` for typeahead suggestions.
6. **UX Flow:**

   * User clicks either input → `setPanelOpen(true)` → GSAP animates panel up, logo fades, close arrow appears.
   * Close arrow clicked → `setPanelOpen(false)` → GSAP collapses panel, logo reappears.

---

## Next Steps

* Implement **`LocationSearchPanel`**:

  * Use browser Geolocation API for current position.
  * Integrate Mapbox/Google Places API for autocomplete suggestions.
  * On selection, perform route preview (polyline overlay).

*(End of 14-BuildingUserHomepage.md)*
8