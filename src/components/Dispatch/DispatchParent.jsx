

import React, {useRef} from 'react';
import {  Route, Routes } from 'react-router-dom';
import DispatchEdit from './DispatchEdit';
import DispatchHome from './DispatchHome';
import TruckBank from './TruckBank';
import ProtectedRoute from '../ProtectedRoute';
import  {  Page } from '@mobiscroll/react';
import { Toast } from 'primereact/toast';





function DispatchParent() {


    console.log('DISPATCH PARENT RE RENDERING')

    const toast = useRef(null);

 
  return ( 
 <Page>
    <React.Fragment>
      <Toast ref={toast} />
      <div className="mbsc-grid" style={{padding:"0"}}>
        <div className="mbsc-row"  style={{margin:"0"}}>
          <div className="mbsc-col-lg-8 mbsc-col-12"  style={{padding:"0"}} >
              <Routes>
                <Route path=':id' element={<ProtectedRoute><DispatchEdit/></ProtectedRoute>} />
                <Route path='home' element={<ProtectedRoute><DispatchHome/></ProtectedRoute>} />
              </Routes>
          </div>
       <div className="mbsc-col-lg-4 mbsc-col-12 "  style={{padding:"0", paddingLeft:".25em"}} ><TruckBank/>  </div>    
        </div>
        
     
    </div>
    </React.Fragment>
    </Page>
  );
}

export default DispatchParent;