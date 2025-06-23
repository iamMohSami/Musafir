import React, { useContext, useEffect, useState } from 'react'
import { UserDataContext } from  '../context/userContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const UserProtectWrapper = ({
    children
}) => {
    const token = localStorage.getItem('token')
    const navigate = useNavigate()
    const { user, setUser } = useContext(UserDataContext)

    useEffect(() => {
    if (!token) {
        navigate('/login')
    }
} , [token])


    return (
        <>
            {children}
        </>
    )
}

export default UserProtectWrapper