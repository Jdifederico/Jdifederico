import React from 'react';
import { Route, Routes } from 'react-router-dom';

import { GlobalContextProvider } from '../context/GlobalContext';
import { DispatchContextProvider } from './Dispatch/DispatchContext';
import {FreightBillContextProvider } from './FreightBill/FreightBillContext';
import {InvoiceContextProvider } from './Invoice/InvoiceContext';
import {PayStatementContextProvider } from './PayStatement/PayStatementContext';
import TopMenuComponent from './TopMenuComponent';
import DispatchParent from './Dispatch/DispatchParent';
import FreightBillParent from './FreightBill/FreightBillParent';
import PopUpParent from './PopUpComponents/PopUpParent';
import InvoiceParent from './Invoice/InvoiceParent';
import PayStatementParent  from './PayStatement/PayStatementParent';

import AccountsHome from './HomePages/AccountsHome';
import ContactsHome from './HomePages/ContactsHome';
import LocationsHome from './HomePages/LocationsHome';
import DriversHome from './HomePages/DriversHome';
import TrucksHome from './HomePages/TrucksHome';
import TrailersHome from './HomePages/TrailersHome';
import TruckTypesHome from './HomePages/TruckTypesHome';
import MaterialsHome from './HomePages/MaterialsHome';
import CapabilitiesHome from './HomePages/CapabilitiesHome';
import ExpensesHome from './HomePages/ExpensesHome';
import ComplianceNamesHome from './HomePages/ComplianceNamesHome';

const MainContent = ({ loading }) => {
 

    return (
              <div>  
            {!loading && (
                <GlobalContextProvider>
                    <TopMenuComponent/>
                    <PopUpParent/>
                    <Routes>
                        <Route path='/accounts' element={<AccountsHome/>} />
                        <Route path='/contacts' element={<ContactsHome/>} />
                        <Route path='/locations' element={<LocationsHome/>} />
                        <Route path='/drivers' element={<DriversHome/>} />
                        <Route path='/trucks' element={<TrucksHome/>} />
                        <Route path='/trailers' element={<TrailersHome/>} />
                        <Route path='/trucktypes' element={<TruckTypesHome/>} />
                        <Route path='/materials' element={<MaterialsHome/>} />
                        <Route path='/capabilities' element={<CapabilitiesHome/>} />
                        <Route path='/expenses' element={<ExpensesHome/>} />
                        <Route path='/compliancenames/:compType' element={<ComplianceNamesHome/>} />
                        <Route  path='/dispatch/*'  element={<DispatchContextProvider><DispatchParent /></DispatchContextProvider>}  />
                        <Route path='/freightbill/*' element={<FreightBillContextProvider><FreightBillParent /> </FreightBillContextProvider>} />
                        <Route  path='/invoice/*'  element={ <InvoiceContextProvider> <InvoiceParent /></InvoiceContextProvider>}  />
                        <Route  path='/paystatement/*'  element={ <PayStatementContextProvider> <PayStatementParent /></PayStatementContextProvider>}  />
                    </Routes>
                  
           
             
                  

                </GlobalContextProvider>
            )}
           </div>    
    );
};

export default MainContent;