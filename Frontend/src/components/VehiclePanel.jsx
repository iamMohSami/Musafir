import React from 'react'

const VehiclePanel = (props) => {
  return (
    <div>
       <h5 className='p-1 text-center w-[93%] absolute top-0' onClick={()=>{props.setVehiclePanel(false)}}><i className=" text-2xl  ri-arrow-down-wide-line"></i></h5>
                <h3 className='text-2xl font-semibold mb-5'>Choose a Vehicle</h3>
               <div  onClick={()=>{
props.setConfirmRidePanel(true)
props.setVehiclePanel(false)
               }}  className='flex w-full gap-4 items-center justify-between p-3 border-2 active:border-black rounded-xl mb-2'>
               <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSdc1aAZzBJjW2GhT0TquUROYNGjc-8j6cSNeafEQAIpAOFJPXdwH_DrnzTOVen5HoFDRc&usqp=CAU" alt="Uber Car" className='h-12' />
                <div className='w-1/2'>
                    <h4 className='text-lg font-semibold'>MusafirGo <span><i className="ri-user-3-fill"></i>4</span></h4>
                    <h5 className='text-sm text-gray-900 font-medium'>2 mins away</h5>
                    <p className='text-sm text-gray-500 font-normal'>Affordable & Compact</p>
                </div>
                <h2 className='text-xl font-bold'>$193</h2>
               </div>
               <div onClick={()=>{
props.setConfirmRidePanel(true)
props.setVehiclePanel(false)
               }}   className='flex w-full gap-4 items-center justify-between p-3 border-2 active:border-black rounded-xl mb-2 '>
               <img src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1649231091/assets/2c/7fa194-c954-49b2-9c6d-a3b8601370f5/original/Uber_Moto_Orange_312x208_pixels_Mobile.png" alt="Uber Bike" className='h-12' />
                <div className='w-1/2 ml-2'>
                    <h4 className='text-lg font-semibold'>MusafirMoto <span><i className="ri-user-3-fill"></i>1</span></h4>
                    <h5 className='text-sm text-gray-900 font-medium'>10 mins away</h5>
                    <p className='text-sm text-gray-500 font-normal'>Scenic and Fast</p>
                </div>
                <h2 className='text-xl font-bold'>$83</h2>
               </div>
               <div onClick={()=>{
props.setConfirmRidePanel(true)
props.setVehiclePanel(false)
               }}   className='flex w-full gap-4 items-center justify-between p-3 border-2 active:border-black rounded-xl mb-2 '>
               <img src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1648431773/assets/1d/db8c56-0204-4ce4-81ce-56a11a07fe98/original/Uber_Auto_558x372_pixels_Desktop.png" alt="Uber Bike" className='h-12' />
                <div className='w-1/2 ml-2'>
                    <h4 className='text-lg font-semibold'>MusafirAuto <span><i className="ri-user-3-fill"></i>3</span></h4>
                    <h5 className='text-sm text-gray-900 font-medium'>5 mins away</h5>
                    <p className='text-sm text-gray-500 font-normal'>Cheap and Good</p>
                </div>
                <h2 className='text-xl font-bold'>$101</h2>
               </div>
    </div>
  )
}

export default VehiclePanel
