// components/GearedUserChecker.js
import React, { useEffect } from 'react';
import { UserAuth } from '../context/AuthContext';

const GearedUserChecker = ({ onGearedUserChange }) => {
  const { gearedUser } = UserAuth();

  useEffect(() => {
    onGearedUserChange(gearedUser);
  }, [gearedUser, onGearedUserChange]);

  return null;
};

export default GearedUserChecker;