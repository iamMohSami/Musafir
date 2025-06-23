import React from 'react'
import { Link } from 'react-router-dom'

const Start = () => {
  return (
    <div>
      <div className='bg-[url(/Images/hometraffic.jpg)] bg-bottom bg-cover h-screen pt-8 bg-red-400 w-full flex justify-between flex-col'>
        <h1 className='ml-8 text-3xl font-mono font-extrabold  text-white' >Musafir</h1>
        <div className='bg-white pb-7 py-4 px-4'>
          <h2 className='text-2xl font-bold'>Get Started with Musafir</h2>
          <Link to='/login' className='flex items-center justify-center w-full bg-black text-white py-3 rounded mt-5'>Continue</Link>
        </div> 
      </div>
    </div>
  )
}

export default Start
