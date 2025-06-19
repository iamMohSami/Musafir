import React, { useState, useContext } from 'react'
import { Link } from 'react-router-dom'


// To perform the Two-way binding of the user data, we will use the useContext hook to access the UserDataContext. (will see further more later)
const UserLogin = () => {
  const [ email, setEmail ] = useState('')
  const [ password, setPassword ] = useState('')
  const [ userData, setUserData ] = useState({})

const submitHandler = async (e) => {
    e.preventDefault();
    setUserData({
      email: email,
      password: password
    });
    // console.log(email, password);
    setEmail('')
    setPassword('')
  }

  return (
    <div className='p-7 h-screen flex flex-col justify-between'>
      <div>
      <h1 className='mb-6 text-3xl font-mono font-extrabold' >Musafir</h1>

        <form onSubmit={(e) => {
          submitHandler(e)
        }}>
          <h3 className='text-lg font-medium mb-2'>What's your email?</h3>
          <input
            required
            // below is the two-way binding of the email input field 
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
            }}
            // The above lines are important to ensure that the input field updates the state variable email whenever the user types in it.
            className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base'
            type="email"
            placeholder='email@example.com'
          />

          <h3 className='text-lg font-medium mb-2'>Enter Password</h3>

          <input
            className='bg-[#eeeeee] mb-7 rounded-lg px-4 py-2 border w-full text-lg placeholder:text-base'
            // below is the two-way binding of the password input field
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
            }}
            // The above lines are important to ensure that the input field updates the state variable password whenever the user types in it.
            required 
            type="password"
            placeholder='password' 
          />

          <button
            className='bg-[#111] text-white font-semibold mb-3 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base'
          >Login</button>

        </form>
        <p className='text-center'>New here? <Link to='/signup' className='text-blue-600'>Create new Account</Link></p>
      </div>
      <div>
        <Link
          to='/captainlogin'
          className='bg-[#10b461] flex items-center justify-center text-white font-semibold mb-5 rounded-lg px-4 py-2 w-full text-lg placeholder:text-base'
        >Sign in as Captain</Link>
      </div>
    </div>
  )
}

export default UserLogin