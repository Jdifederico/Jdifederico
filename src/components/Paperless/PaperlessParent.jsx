



import React, {useRef,useState} from 'react';
import { useNavigate, Route, Routes } from 'react-router-dom';
import { usePaperless } from './PaperlessContext';

import PaperlessNoDispatch from './PaperlessNoDispatch';
import PaperlessDispatch from './PaperlessDispatch';
import PaperlessTrucksDispatch from './PaperlessTrucksDispatch';
import PaperlessFreightBill from './PaperlessFreightBill';
import { UserAuth } from '../../context/AuthContext';



import PaperlessNavBar from './PaperlessNavBar';
import ProtectedRoute from '../ProtectedRoute';
import PaperlessLoadOrders from './PaperlessLoadOrders';



import { Toast } from 'primereact/toast';
function PaperlessParent() {
  const {user, logout} = UserAuth();
  const navigate = useNavigate();
 

  const { freightBill, paperlessState, navToPaperlessHome, setActiveIndex} = usePaperless();

  const toast = useRef(null);
 
 
  const navToPaperlessTrucksDispatch=()=>{ navigate(`/trucksdispatch/${freightBill.companyID}/${freightBill.ID}`);}
  const navToPaperlessFreightBill=()=>{ navigate(`/freightbill/${freightBill.companyID}/${freightBill.ID}`);}
  const navToPaperlessDispatch=()=>{  navigate(`/dispatch/${freightBill.companyID}/${freightBill.ID}`); }
  const navToPaperlessLoadOrders=()=>{ 
    console.log('are we NAVVING A??A?A');
    navigate(`/loadorders/${freightBill.companyID}/${freightBill.ID}`);  
  }
  const showClockOutToast =()=>{   toast.current.show({severity:'success', summary: 'Success', detail:'Freight Bill Submitted', life: 3000});}


 
  return (
    <React.Fragment>
        <Toast ref={toast} />
        {user && Object.keys(user).length && (
          <React.Fragment>
        
    
        
              <PaperlessNavBar
                logout={logout}
                navToPaperlessHome={navToPaperlessHome} 
                navToPaperlessDispatch={navToPaperlessDispatch} 
                navToPaperlessTrucksDispatch={navToPaperlessTrucksDispatch} 
                navToPaperlessFreightBill={navToPaperlessFreightBill} 
                
              />
         
          </React.Fragment>
          )}   
       <Routes>
       <Route path='/nodispatch/:orgName/:id' element={<ProtectedRoute><PaperlessNoDispatch  setActiveIndex={setActiveIndex} /></ProtectedRoute>} />
        <Route path='/dispatch/:orgName/:id' element={<ProtectedRoute><PaperlessDispatch navToPaperlessFreightBill={navToPaperlessFreightBill}  navToPaperlessLoadOrders={navToPaperlessLoadOrders}  setActiveIndex={setActiveIndex} /></ProtectedRoute>} />
        <Route path='/trucksdispatch/:orgName/:id' element={<ProtectedRoute><PaperlessTrucksDispatch navToPaperlessFreightBill={navToPaperlessFreightBill}  navToPaperlessLoadOrders={navToPaperlessLoadOrders}  setActiveIndex={setActiveIndex} /></ProtectedRoute>} />
        <Route path='/freightbill/:orgName/:id' element={<ProtectedRoute><PaperlessFreightBill showClockOutToast={showClockOutToast} navToPaperlessHome={navToPaperlessHome} navToPaperlessLoadOrders={navToPaperlessLoadOrders}  setActiveIndex={setActiveIndex} /></ProtectedRoute>} />
        <Route path='/loadorders/:orgName/:id' element={<ProtectedRoute><PaperlessLoadOrders navToPaperlessFreightBill={navToPaperlessFreightBill} /></ProtectedRoute>} />
      
      </Routes>
    </React.Fragment>
  );
}

export default PaperlessParent;