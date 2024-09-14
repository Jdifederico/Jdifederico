import React from 'react';

import AccountPopUp from './AccountPopUp';
import ContactPopUp from './ContactPopUp';
import DriverPopUp from './DriverPopUp';
import MaterialPopUp from './MaterialPopUp';

import TruckPopUp from './TruckPopUp';
import TrailerPopUp from './TrailerPopUp';
import TruckTypePopUp from './TruckTypePopUp';
import LocationPopUp from './LocationPopUp';
import NamePopUp from './NamePopUp';
import ImagePopUp from './ImagePopUp';

function PopUpParent() {

 
  return ( 

    <React.Fragment>
        <AccountPopUp />
        <ContactPopUp />
        <DriverPopUp />
        <MaterialPopUp />
        <TruckPopUp />
        <TrailerPopUp />
        <TruckTypePopUp />
        <LocationPopUp />
        <NamePopUp /> 
        <ImagePopUp />
    </React.Fragment>
 
  );
}

export default PopUpParent;