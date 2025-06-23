import React from 'react'
import {Route, Routes} from 'react-router-dom'
import Start from './pages/Start'
import Home from './pages/Home'
import UserSignup from './pages/UserSignup'
import CaptainLogin from './pages/CaptainLogin'
import CaptainSignup from './pages/CaptainSignup'
import UserProtectWrapper from './pages/UserProtectWrapper'
import UserLogout from './pages/UserLogout'
import UserLogin from './pages/userLogin'


const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/login" element={<UserLogin />} />
        <Route path="/signup" element={<UserSignup />} />
        <Route path="/captainlogin" element={<CaptainLogin />} />
        <Route path="/captainsignup" element={<CaptainSignup />} />
        <Route path="/home" element={
          <UserProtectWrapper>
          <Home />
          </UserProtectWrapper>
          } />
          <Route path='/user/logout' element={
            <UserProtectWrapper>
              <UserLogout />
            </UserProtectWrapper>
          } />
      </Routes>
    </div>
  )
}

export default App