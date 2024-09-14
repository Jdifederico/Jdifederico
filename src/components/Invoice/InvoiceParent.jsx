

import React, {useRef} from 'react';
import {  Route, Routes } from 'react-router-dom';


import InvoiceCreate from './InvoiceCreate';
import InvoicePopUp from './InvoicePopUp';
import InvoiceHome from './InvoiceHome';
import ProtectedRoute from '../ProtectedRoute';
import  {  Page } from '@mobiscroll/react';
import { Toast } from 'primereact/toast';





function InvoiceParent() {



    console.log('FINVOICE BILL PARENT RE RENDERING')

    const toast = useRef(null);

 
return ( 
    <Page>
        <React.Fragment>
        <Toast ref={toast} />
        <InvoicePopUp />    
        <Routes>
            <Route path='list' element={<ProtectedRoute><InvoiceHome/></ProtectedRoute>} /> 
            <Route path='create' element={<ProtectedRoute><InvoiceCreate/></ProtectedRoute>} />  
        </Routes>

        </React.Fragment>
    </Page>
  );
}

export default InvoiceParent;