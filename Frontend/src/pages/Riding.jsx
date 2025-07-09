import React from "react";
import { Link } from "react-router-dom";

const Riding = () => {
  return (
    <div className="h-screen relative overflow-hidden">
        <Link to='/home' className="fixed right-2 top-2 h-10 w-10 bg-white flex items-center justify-center rounded-full">
            <i className="text-lg font-medium ri-home-5-line"></i>
        </Link>


      <div className="h-1/2">
        {/* image for temporary use  */}
        <img
          className="h-full w-full object-cover"
          src="/Images/homemapgif.gif"
          alt="background"
        />
      </div>
      <div className="h-1/2">
        <div className="flex items-center justify-between">
          <img
            className="h-12"
            src="https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg"
            alt=""
          />
          <div className="text-right">
            <h2 className="text-lg font-medium capitalize">Salman Khan</h2>
            <h4 className="text-xl font-semibold -mt-1 -mb-1">MH02 BX 6945</h4>
            <p className="text-sm text-gray-600">Maruti Suzuki Alto</p>
            {/* <h1 className='text-lg font-semibold'>  {props.ride?.otp} </h1> */}
          </div>
        </div>

        <div className="flex gap-2 justify-between flex-col items-center">
          <div className="w-full mt-5">
            <div className="flex items-center gap-5 p-3 border-b-2">
              <i className="text-lg ri-map-pin-2-fill"></i>
              <div>
                <h3 className="text-lg font-medium">11-B</h3>
                <p className="text-sm -mt-1 text-gray-600">Bus Stand, Nipani</p>
              </div>
            </div>
            <div className="flex items-center gap-5 p-3">
              <i className="ri-currency-line"></i>
              <div>
                <h3 className="text-lg font-medium">₹100</h3>
                <p className="text-sm -mt-1 text-gray-600">Fare</p>
              </div>
            </div>
            <div>
                <button  className='w-[75%] mt-8 mx-12 bg-green-600 text-white font-semibold p-2 rounded-lg'>Make a Payment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Riding;
