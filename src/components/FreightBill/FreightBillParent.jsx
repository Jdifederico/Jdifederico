

import React, {useRef} from 'react';
import {  Route, Routes } from 'react-router-dom';

import FreightBillHome from './FreightBillHome';
import DispatchFreights from './DispatchFreights';
import FreightBillEdit from './FreightBillEdit';

import ProtectedRoute from '../ProtectedRoute';
import  {  Page } from '@mobiscroll/react';
import { Toast } from 'primereact/toast';





function FreightBillParent() {



    console.log('FREIGHT BILL PARENT RE RENDERING')

    const toast = useRef(null);

 
return ( 
    <Page>
        <React.Fragment>
        <Toast ref={toast} />

                    <Routes>
                        <Route path='dashboard' element={<ProtectedRoute><FreightBillHome/></ProtectedRoute>} />
                        <Route path='freights/:id' element={<ProtectedRoute><DispatchFreights/></ProtectedRoute>} />
                        <Route path='freightbill/:id' element={<ProtectedRoute><FreightBillEdit/></ProtectedRoute>} />
                    </Routes>

        </React.Fragment>
    </Page>
  );
}

export default FreightBillParent;