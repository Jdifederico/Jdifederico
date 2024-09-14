// components/LoadingChecker.js
import React, { useEffect } from 'react';
import { UserAuth } from '../context/AuthContext';

const LoadingChecker = ({ onLoadingChange }) => {
  const {  loading } = UserAuth();
  console.log('laoding checker!! = ' + loading)
  useEffect(() => {
    console.log('we in teh use effect and loading = ' + loading)
    onLoadingChange( loading);
  }, [ loading]);

  return null;
};
   
export default LoadingChecker;