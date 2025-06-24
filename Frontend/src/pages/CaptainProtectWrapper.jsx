import React, { useContext, useEffect, useState } from 'react'
import { CaptainDataContext } from '../context/CaptainContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const CaptainProtectWrapper = ({
    children
}) => {
    const token = localStorage.getItem('token')
    const navigate = useNavigate()
    const { captain, setCaptain } = useContext(CaptainDataContext)
    const [ isLoading, setIsLoading ] = useState(true)

    useEffect(() => {
        if (!token) {
            navigate('/captainlogin')
            return
        }

        axios.get(`${import.meta.env.VITE_BASE_URL}/captains/profile`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then(response => {
            if (response.status === 200 && response.data && response.data.captain) {
                setCaptain(response.data.captain)
                setIsLoading(false)
            } else {
                localStorage.removeItem('token')
                setCaptain(null)
                navigate('/captainlogin')
            }
        })
        .catch(err => {
            localStorage.removeItem('token')
            setCaptain(null)
            navigate('/captainlogin')
        })
    }, [ token, setCaptain, navigate ])

    useEffect(() => {
        if (!isLoading && (!token || !captain)) {
            navigate('/captainlogin')
        }
    }, [isLoading, token, captain, navigate])

    if (isLoading) {
        return (
            <div>Loading...</div>
        )
    }

    return (
        <>
            {children}
        </>
    )
}

export default CaptainProtectWrapper