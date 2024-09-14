

import React, {useRef} from 'react';
import {  Route, Routes } from 'react-router-dom';


import PayStatementCreate from './PayStatementCreate';

import PayStatementHome from './PayStatementHome';
import ProtectedRoute from '../ProtectedRoute';
import  {  Page } from '@mobiscroll/react';
import { Toast } from 'primereact/toast';





function PayStatementParent() {



    console.log('FINVOICE BILL PARENT RE RENDERING')

    const toast = useRef(null);

 
return ( 
    <Page>
        <React.Fragment>
        <Toast ref={toast} />
    
        <Routes>
            <Route path='list' element={<ProtectedRoute><PayStatementHome/></ProtectedRoute>} /> 
            <Route path='create' element={<ProtectedRoute><PayStatementCreate/></ProtectedRoute>} />  
        </Routes>

        </React.Fragment>
    </Page>
  );
}

export default PayStatementParent;