
import React, {useEffect, useState} from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber} from 'primereact/inputnumber';
import { Checkbox } from 'primereact/checkbox';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';

import { useInvoice } from './InvoiceContext';
import { UserAuth } from '../../context/AuthContext'
import AutoCompleteInput from '../AutoCompleteInput'; 
import LineItemList from '../ListComponents/LineItemList';
import TotalItemList from '../ListComponents/TotalItemList';


const InvoicePopUp = (props) => {
    const [activeTab, setActiveTab]= useState(0);
    const {companies, updateDocument, formatDate} = UserAuth();
  
    const { invoiceVisible, setInvoiceVisible, invoice, setInvoice, calcInvoiceTotal, checkInvoice, invoiceRef, invoicesRef,setInvoices, 
        printFBs, setPrintFBs, printTags, setPrintTags, invoices, makeFreightBillLineItem, makeExpenseLineItem, attachFreightBills, closePrintPopUp, printVisible, setShowPrintTags, showPrintTags,showPrintPopUp } = useInvoice();
    const [currentToggleValue, setCurrentToggleValue]=useState(true);
    const [inputValues, setInputValues] = useState({});
    const invoiceIndex =  invoicesRef.current.findIndex(obj => obj.ID === inputValues.ID);
    const scaleTagButton = inputValues.calcByLoad ? 'Invoice By Full Weight' : 'Invoice By Scale Tag';
    console.log('INMPUTVALUES WHEN POPUP LOADS = '+showPrintTags);
    const closeInvoicePopUp = () => {
        setInvoiceVisible(false); 
    };
    useEffect(() => {
        if (invoice && Object.keys(invoice).length > 0) {
            let tempInvoice = { ...invoice };
            tempInvoice.JobDateValue = new Date(tempInvoice.JobDate);
            tempInvoice.InvoiceDateValue = new Date(tempInvoice.InvoiceDate);
            console.log('StempInvoice.LineItems.length = '+ tempInvoice.LineItems.length );
            if (tempInvoice.LineItems.length > 0) {
                // Add an index to each line item for stable sorting
                const sorted = tempInvoice.LineItems
                    .map((item, index) => ({ ...item, originalIndex: index })) // Attach original index
                    .sort((a, b) => {
                        // Primary sorting by type to ensure 'Freight Bill' is first
                   
    
                        // Secondary sorting by FBNO
                        if (Number(a.FBNO) < Number(b.FBNO)) return -1;
                        if (Number(a.FBNO) > Number(b.FBNO)) return 1;
                        if (a.Type === 'Freight Bill' && b.Type !== 'Freight Bill') return -1;
                        if (a.Type !== 'Freight Bill' && b.Type === 'Freight Bill') return 1;
                        if (a.Type === 'Scale Tag' && b.Type !== 'Scale Tag') return -1;
                        if (a.Type !== 'Scale Tag' && b.Type === 'Scale Tag') return 1;
                        if (a.Type === 'Stand By' && b.Type !== 'Stand By') return -1;
                        if (a.Type !== 'Stand By' && b.Type === 'Stand By') return 1;
                        // Tertiary sorting by original index for stability
                        return a.originalIndex - b.originalIndex;
                    })
                    .map(({ originalIndex, ...item }) => item); // Remove the index after sorting
                    console.log('sorted = ', sorted);
                tempInvoice.LineItems = [...sorted];
                console.log('first line items = ',      tempInvoice.LineItems );
            }
            setInputValues({ ...tempInvoice });
            console.log('Setting inputValues = ', tempInvoice);
        }
    }, [invoice]);

     const handleFieldChange = (fieldName, value) => {
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
      
    };
    const changeInvoiceCompany= (fieldName, value) => {
        let qbCustomerID ='';
        for(let p=0; p<inputValues.Account.Quickbooks.length; p++)if(inputValues.Account.Quickbooks[p].realmID===value.realmID)qbCustomerID = inputValues.Account.Quickbooks[p].QBCustomerID;
        console.log('qb custoemr id  now = ', qbCustomerID)
        setInputValues((prev) => ({ ...prev, realmID:value.realmID, [fieldName]: value, QBCustomerID:qbCustomerID }));
      
    };

    const invoiceByScaleTag = function (Invoice) {
 
            Invoice.LineItems = [];
            if(scaleTagButton==='Invoice By Scale Tag') Invoice.calcByLoad = true;
            else  Invoice.calcByLoad = false;
            for (var i = 0; i < Invoice.FreightBills.length; i++) {
                if(scaleTagButton==='Invoice By Scale Tag')  Invoice.FreightBills[i].calcByLoad = true;
                else    Invoice.FreightBills[i].calcByLoad = false;
                Invoice.FreightBills[i].truckingBilled = false;
                Invoice.FreightBills[i].standByIsBilled = false;
                makeFreightBillLineItem(Invoice.FreightBills[i], Invoice.LineItems, Invoice);
            
                    
                
            }
            console.log('Invoice.Expenses = ', Invoice.Expenses)
            for (var j = 0; j < Invoice.Expenses.length; j++)   Invoice.LineItems.push( makeExpenseLineItem(Invoice.Expenses[j]));
      
        
        setInputValues(calcInvoiceTotal({...Invoice}))
        setInvoice(calcInvoiceTotal({...Invoice}))
    }
    

    const toggleAllOnHold = ()=>{
        for(let k=0;k<inputValues.LineItems.length; k++){
            let tempLineItem={...inputValues.LineItems[k]};
            tempLineItem.onHold=currentToggleValue;
            toggleOnHold(tempLineItem)
        }
        if(currentToggleValue)setCurrentToggleValue(false); else setCurrentToggleValue(true);
        console.log('togglin')
    }
    const toggleOnHold = (lineItem) =>{
        let tempInvoice ={...inputValues};
        let updateDoc ={onHold:lineItem.onHold}
        console.log('lineItem.Type == '+ lineItem.Type);
        for(let q=0; q<tempInvoice.LineItems.length; q++){
            if(lineItem.Type==='Expense'){
                if(tempInvoice.LineItems[q].ID===lineItem.ID){
                    tempInvoice.LineItems[q]=lineItem;
                    updateDocument(updateDoc, lineItem.ID, "Expenses");
                }
            }else if(tempInvoice.LineItems[q].FreightID===lineItem.FreightID){
                console.log('I found a lineitem that matches the freight id and it looks like this =', tempInvoice.LineItems[q])
                if(lineItem.Type==='Stand By' && tempInvoice.LineItems[q].Type===lineItem.Type){
                    tempInvoice.LineItems[q]=lineItem;
                    for(let i=0; i<tempInvoice.FreightBills.length; i++) if(tempInvoice.FreightBills[i].ID===lineItem.FreightID)tempInvoice.FreightBills[i].standByOnHold=lineItem.onHold;
                }
                if(lineItem.Type==='Scale Tag' && tempInvoice.LineItems[q].Type===lineItem.Type){
                    console.log('FOUDN THE SCALE TAG ITEM', tempInvoice.LineItems[q]);
                    let tempLineItem = {...tempInvoice.LineItems[q]}
                    tempLineItem.onHold =lineItem.onHold;
                    tempInvoice.LineItems[q]= tempLineItem;
                }
                  if(lineItem.Type==='Freight Bill'){
                    console.log('tempInvoice.LineItems[q].Type = '+ tempInvoice.LineItems[q].Type)
                    if(tempInvoice.LineItems[q].Type==='Expense'){
                        console.log('I found an expense lineitem for this freight bill and Im setting its onHold = '+ lineItem.onHold)
                        tempInvoice.LineItems[q].FreightHold=lineItem.onHold;
                        tempInvoice.LineItems[q].onHold=lineItem.onHold;
                        console.log('NAD NOW ITS ONOUHJLD = '+ tempInvoice.LineItems[q].onHold)

                    }
                    if(tempInvoice.LineItems[q].Type===lineItem.Type){
                        tempInvoice.LineItems[q]=lineItem;
                        updateDocument(updateDoc, lineItem.ID, "FreightBills");
                    } 
                  }
              
                 
                    
                
            }
         }
        
        invoicesRef.current[invoiceIndex]={...tempInvoice};
        let calcInvoice = calcInvoiceTotal({...tempInvoice});
        setInvoices(invoicesRef.current)
     console.log('this is where im setting Invoice to ', calcInvoice.LineItems)
        setInvoice({...calcInvoice})
    }
    const handleDateChange = ( fieldName, value) => {
        let formattedDate= formatDate(value, '/', 'MM/DD/YYYY');
        console.log('formattedDate = ', formattedDate)
        
        setInputValues((prev) => ({ ...prev,[fieldName]: formattedDate, [fieldName+'Value']: value }));
       
    };
    const renderHeader = () => {
        return (
            <div>
            <span >Invoice Details </span>
            <button style={{ float:'right', margin: '0', padding: '.5em', marginRight:'6em', width:"15%" }}   onClick={(e) =>checkInvoice(inputValues)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     > Create Invoices</button>
            </div>
        );
    };
    const changeInvoiceTab =(e)=>{
        console.log('tab clicked = ' ,e)
        if(e.index!==invoices.length){
            setInvoice({...invoices[e.index]});
            setShowPrintTags(false);
            
            setActiveTab(e.index)
            invoiceRef.current={...invoices[e.index]};
        }else showPrintPopUp(invoicesRef.current[0], true)
    }
    const tabHeader =(index)=>{
        console.log('SETING TAB EHADER = ', index)
        index+=1;
        return "Invoice - "+index.toString();
    }
    const header =renderHeader();
    console.log('invoices = ', invoices)

    const printFooterContent = (
  
        <div style={{paddingTop:'1em', textAlign:'center'}}  className="flex align-items-center gap-2">
                <Button style= {{fontSize:'1.5em', width:'9em'}} label="Close" icon="pi pi-times"  onClick={() => closePrintPopUp()} />
                <Button style= {{fontSize:'1.5em', width:'9em'}} label="Print" icon="pi pi-check" onClick={() => attachFreightBills(inputValues, false)}  />
        </div>
    
    );
return(
    <React.Fragment>
    {invoice.Account && (
        <Dialog header={header} visible={invoiceVisible} style={{ width: '100vw', height:"100%", maxHeight:"98%" }} breakpoints={{ '960px': '90vw', '641px': '100vw' }}  onHide={closeInvoicePopUp}>
         
                <TabView  style={{margin:"0"}} activeIndex={activeTab} onTabChange={(e) => changeInvoiceTab(e)}  >
                {invoices.map(( inv, index ) => (   <TabPanel header={tabHeader(index)} key={index}  style={{marginTop:"0"}}  />))}
                <TabPanel header="Print All" style={{marginTop:"0"}}  />
                </TabView>  
            <div className='mbsc-row'>
                <div className='mbsc-col-4'>
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon"> Account:</span>
                        <InputText value={inputValues.ParentName} disabled={true} onChange={(e) => handleFieldChange('ParentName', e.target.value)} />
                    </div>
                  
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon">Invoice Number:</span>
                        <InputNumber  useGrouping={false}  value={inputValues.InvoiceNumber} onChange={(e) => handleFieldChange('InvoiceNumber', e.value)} />
                    </div>
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon"> Job Number:</span>
                        <InputText value={inputValues.JobNumber} onChange={(e) => handleFieldChange('JobNumber', e.target.value)} />
                    </div>
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon"> PO Number:</span>
                        <InputText value={inputValues.PONumber}  onChange={(e) => handleFieldChange('PONumber', e.target.value)} />
                    </div>
                </div>
                <div className='mbsc-col-4'>
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon"> Job Date:</span>
                        <Calendar value={inputValues.JobDateValue} style={{width:"100%"}} onChange={(e) => handleDateChange( 'JobDate',e.value )} />
                    </div>
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon">Invoice Date:</span>
                        <Calendar value={inputValues.InvoiceDateValue} style={{width:"100%"}} onChange={(e) => handleDateChange( 'InvoiceDate',e.value )} />
                    </div>
                    
                    <AutoCompleteInput label="Company" fieldName="Company" field="CompanyName" value={inputValues.Company} compLabel={true} showLabel={false} suggestions={companies} setValue={setInputValues} handleFieldChange={changeInvoiceCompany} />

                </div>
                <div className="mbsc-col-4">
                <div className="p-inputgroup flex-1"  style={{padding:"1em"}}>
                    <button style={{ margin: '0', padding: '1em', width:"40%" }}   onClick={(e) =>showPrintPopUp(inputValues, false)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     > Print</button>
                </div>
                <div className="p-inputgroup flex-1" style={{padding:"1em"}}>
                    <button style={{ margin: '0', padding: '1em', width:"40%" }}   onClick={(e) =>invoiceByScaleTag(inputValues)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     > {scaleTagButton}</button>
                </div>
               
                </div>
            </div>
            {inputValues.LineItems && ( <div className='mbsc-row'>
                <table style={{ marginBottom: "5px", width: "100%", padding:"1.5em"}}>
                    <thead>
                        <tr className="mbsc-row" style={{ width: "100%", marginLeft: "1em" }}>
                            <th style={{ width: "8%" }}>FB #</th>
                            <th style={{ width: "10%" }}>Truck</th>
                            <th style={{ width: "15%" }}>Driver</th>
                            <th style={{ width: "6%" }}>Missing</th>
                            <th style={{ width: "8%" }}>    <button style={{ margin: '0', padding: '.4em', width:"95%" }}   onClick={(e) =>toggleAllOnHold()}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     > Toggle on Hold</button></th>
                            <th style={{ width: "10%"}}>Rate Type</th>
                            <th style={{ width: "5%"}}>Qty</th>
                            <th style={{ width: "8%"}}>Rate</th>
                            <th style={{ width: "10%"}}>Fuel Charge</th>
                            <th style={{ width: "10%"}}>Broker Fee</th>
                            <th style={{ width: "10%"}}>Total</th>
                    
                        </tr>
                    </thead>
                    <tbody>
                        {inputValues.LineItems.map(( lineItem, index ) => (
                            <LineItemList key={index}  lineItem={lineItem} toggleOnHold={toggleOnHold}  />
                        ))}
                    </tbody>
                </table>
            </div>)}
            {inputValues.Totals && ( <div className='mbsc-row'>
                <div className='mbsc-col-4 mbsc-offset-8'>
                    <table style={{ marginBottom: "5px", width: "100%", paddingBottom:"1.5em"}}>
                        <thead>
                            <tr className="mbsc-row" style={{ width: "100%", marginLeft: "1em" }}>
                                <th style={{ width: "33%" }}>Type</th>
                                <th style={{ width: "33%" }}>Qty</th>
                                <th style={{ width: "33%" }}>Total</th>
                        
                        
                            </tr>
                        </thead>
                        <tbody>
                            {inputValues.Totals.map(( totalItem, index ) => (
                                <TotalItemList key={index} totalItem={totalItem}  />
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>)}
            

                    
        </Dialog>)}

        <Dialog header="Print Details" visible={printVisible} style={{ width: '40vw' }} footer={printFooterContent} breakpoints={{ '960px': '75vw', '641px': '100vw' }} onHide={closePrintPopUp}>
            <div className="p-inputgroup mbsc-col-6 mbsc-offset-3" style={{fontSize:'1.3em'}}>
                <span className="p-inputgroup-addon p-checkbox-label">Print Freight Bills:</span>
                <Checkbox style={{ height:'3em'  }} onChange={e => setPrintFBs(e.checked)}   checked={printFBs}  />
            </div>  
            {showPrintTags && (<div className="p-inputgroup mbsc-col-6 mbsc-offset-3" style={{fontSize:'1.3em'}}>
                <span className="p-inputgroup-addon p-checkbox-label">Print Attached Scale Tags:</span>
                <Checkbox style={{ height:'3em'  }} onChange={e => setPrintTags(e.checked)}   checked={printTags}  />
            </div>  )}
       
               
 </Dialog>
    </React.Fragment>
);
};

export default InvoicePopUp;