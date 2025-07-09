import React from 'react'

// const LocationSearchPanel = ({ suggestions, setVehiclePanel, setPanelOpen, setPickup, setDestination, activeField }) => {

    // const handleSuggestionClick = (suggestion) => {
    //     if (activeField === 'pickup') {
    //         setPickup(suggestion)
    //     } else if (activeField === 'destination') {
    //         setDestination(suggestion)
    //     }
    //     // setVehiclePanel(true)
    //     // setPanelOpen(false)
    // }

const LocationSearchPanel = (props) => {
    //sample array for location
    const locations = [
        "24B, 1st Floor, 1st Cross, 1st Sector, HSR Layout, Bengaluru, Karnataka 560068",
        "114A, 3rd Floor, 3rd Cross, 3rd Sector, HSR Layout, Bengaluru, Karnataka 560068",
        "123, 4th Floor, 4th Cross, 4th Sector, HSR Layout, Mumbai, Maharashtra 560068"
    ]

    return (
        <div>
            {/* Display fetched suggestions
            {
                suggestions.map((elem, idx) => (
                    <div key={idx} onClick={() => handleSuggestionClick(elem)} className='flex gap-4 border-2 p-3 border-gray-50 active:border-black rounded-xl items-center my-2 justify-start'>
                        <h2 className='bg-[#eee] h-8 flex items-center justify-center w-12 rounded-full'><i className="ri-map-pin-fill"></i></h2>
                        <h4 className='font-medium'>{elem}</h4>
                    </div>
                ))
            } */}
            
            {
                locations.map(function(elem, idx){
                    return <div key={idx} onClick={()=>{
                        props.setVehiclePanel(true)
                        props.setPanelOpen(false)
                    }} className='flex gap-4 border-2 p-3 border-gray-50 active:border-black rounded-xl items-center my-2 justify-start'>
                        <h2 className='bg-[#eee] h-8 flex items-center justify-center w-12 rounded-full'><i className="ri-map-pin-fill"></i></h2>
                        <h4 className='font-medium'>{elem}</h4>
                    </div>
                })
            }
        </div>
    )
}

export default LocationSearchPanel