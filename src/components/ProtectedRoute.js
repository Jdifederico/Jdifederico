import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserAuth } from '../context/AuthContext';

const ProtectedRoute = ({children}) => {
const auth = UserAuth();
const { user, loading } = auth ? auth : { user: null, loading: true };
    if (loading) {
      return <p>Loading...</p>;
    }
    if(!user || !Object.keys(user).length){
        return <Navigate to='/'/>;
    } 
     
    return children; 
}

export default ProtectedRoute;