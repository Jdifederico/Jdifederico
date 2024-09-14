import React, { useState, useEffect, useRef } from 'react';
import { UserAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';
import { FilterMatchMode } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faMinusCircle } from '@fortawesome/free-solid-svg-icons';
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { classNames } from 'primereact/utils';

import AutoCompleteInput from '../AutoCompleteInput'; 

import { db } from '../../firebase';
import { doc,  query, collection, onSnapshot, where } from 'firebase/firestore';
const InvoicesHome = (props) => {
    const { deleteDocument, gearedUser,companies,company, formatDate } = UserAuth();
  
    const { showInvoicePopUp} = useGlobal();
    const [invoices, setInvoices] = useState([]);
    const [sortedInvoices, setSortedInvoices] = useState([]);
    console.log('user auth company on load = ', companies)
    const [homeObject, setHomeObject]= useState({Company:{...company}})
    const [queryRange, setQueryRange]= useState('SixMonths');
    const queryRanges = [ {text :'Six Months',value: 'SixMonths'},{text :'Twelve Months',value: 'TwelveMonths'} ];
    const unsubscribeInvoicesRef = useRef(null)
    const invoicesRef=useRef(null);
    useEffect(() => {
        if (company && Object.keys(company).length > 0) {
            setHomeObject({Company:{...company}})
           
        }
    }, [company]);
    useEffect(() => {
        if (homeObject.Company.ID && Object.keys(homeObject.Company).length > 0) {
            console.log('HOMEOBJECT COMPANY = ', homeObject.Company)
            getInvoices();
           
        }
    }, [homeObject.Company, queryRange]);

    useEffect(() => {
        // Sort the invoices array by Name
        const sorted = [...invoices].sort((a, b) => {
            if (a.QueryDate >= b.QueryDate) return -1;
            if (a.QueryDate <= b.QueryDate) return 1;
            return 0;
        });
        setSortedInvoices(sorted);
    }, [invoices]);
                                                                                                                                                                
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        JobNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
        InvoiceNumber: { value: null, matchMode: FilterMatchMode.CONTAINS}, 
        'Account.Name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        License: { value: null, matchMode: FilterMatchMode.CONTAINS}
   
        // Don't set anything here for Account.Name initially
    });

    const [globalFilterValue, setGlobalFilterValue] = useState('');
  
   
    const onGlobalFilterChange = (e) => {
        const value = e.target.value || '';
        setFilters((prevFilters) => ({
            ...prevFilters,
            global: { ...prevFilters.global, value }
        }));
        setGlobalFilterValue(value);
    };
    const getInvoices = () => {
      
        invoicesRef.current=[];
        if (unsubscribeInvoicesRef.current) unsubscribeInvoicesRef.current();
        let tempDate =new Date();
        let monthSubtract;
        if(queryRange==='TwelveMonths')monthSubtract=12;
        if(queryRange==='SixMonths')monthSubtract=6;
        tempDate.setMonth(tempDate.getMonth()-monthSubtract);
        tempDate=formatDate(tempDate, '/','YYYY/MM/DD');
        console.log('homeObject.Company = ' , homeObject.Company);

        const queryName = `Organizations/${gearedUser.selectedOrgName}/Invoices`;

        const q = query(
            collection(db, queryName),
            where("QueryDate", ">=", tempDate),
            where("Company.ID","==", homeObject.Company.ID)
        );

        unsubscribeInvoicesRef.current = onSnapshot(q, (querySnapshot) => {
            console.log('Invoice HOME SNAPSHOT FIRING');
            querySnapshot.docChanges().forEach((change) => {
                const tempInvoice = change.doc.data();
                tempInvoice.FreightBills = [];
                tempInvoice.ID = change.doc.id;
                tempInvoice.realInvoiceDate = new Date(tempInvoice.InvoiceDate);
             
                if (change.type === "added") {
                    invoicesRef.current.push(tempInvoice); 
                }
                if (change.type === "modified") {
                    const invoiceIndex = invoicesRef.current.findIndex((d) => d.ID === tempInvoice.ID);
                    invoicesRef.current[invoiceIndex] = tempInvoice;
                }
            });

            console.log('setting full home Invoicees = ',  invoicesRef.current);
            setInvoices([... invoicesRef.current]) // Return the fetched invoices
        }); // Handle errors by rejecting the promise
      
    };

    const handleChangeInvoiceCompany = (fieldName, value) =>{
        setHomeObject((prev) => ({ ...prev, [fieldName]: value }));
    }
    const renderHeader = () => (
        <div className="mbsc-row">
            <span>Invoices</span>
                <div className="p-inputgroup mbsc-col-3 mbsc-offset-4">
                    <span className="p-inputgroup-addon">Range:</span>
                    <Dropdown value={queryRange} onChange={(e) => setQueryRange( e.value)} options={queryRanges} optionLabel="text" placeholder="Select a Range" className="w-full md:w-14rem" />
            </div>
            <div className="mbsc-col-3">
                <AutoCompleteInput fieldName="Company" field="CompanyName" value={homeObject.Company} suggestions={companies}  setValue={setHomeObject}  handleFieldChange={handleChangeInvoiceCompany}   />
            </div>

        </div>
    );

    const editBodyTemplate = (rowData) => (
        <button type="button" onClick={() => handleEdit(rowData)}>
            <FontAwesomeIcon icon={faEdit} />
        </button>
    );

    const handleEdit = (rowData) => {
       console.log('show roate ', rowData)
        showInvoicePopUp(rowData);
    };
 

    const deleteBodyTemplate = (rowData) => (
        <button type="button" onClick={() => handleDelete(rowData)}>
             <FontAwesomeIcon className="fas" icon={faMinusCircle} style={{color:"red", height:"1.25em", textAlign:"center", width:"1.25em !important"}}/> 
        </button>
    );

    const handleDelete = async (rowData) => {
        try {
            if (window.confirm("Are you sure you want delete this Invoice?")) {
               await deleteDocument(rowData,'Invoices' )
            }
            
        } catch (error) {  console.error("Error removing document: ", error);  }
       
    };

    const booleanFilterTemplate = (options) => {
        return (
          <TriStateCheckbox style={{borderColor:"#d1d5db", background:"white"}}
            value={options.value !== null ? options.value : undefined}
            onChange={(e) => options.filterApplyCallback(e.value)}
          />
        );
      };
      const booleanBodyTemplate = (rowData, field) => {
        return (
          <i
            className={classNames('pi', {
              'true-icon pi-check-circle': rowData[field],
              'false-icon pi-times-circle': !rowData[field]
            })}
          />
        );
      };
    const dateBodyTemplate = (rowData) => {
        console.log('making date boyd temp = ', rowData.realInvoiceDate)
        return formatDate(rowData.realInvoiceDate, '/', 'MM/DD/YYYY');
    };
    const currencyBodyTemplate = (rowData, fieldOne, fieldTwo) => {
  
        console.log('and rowData[field] = ' ,rowData)
        return (
           <span style={{paddingRight:".5em", float:"right"}}>${Number(rowData[fieldOne][fieldTwo]).toFixed(2)}</span>
        );
    };
    const header = renderHeader();

    return (
        <div className="card">
            <DataTable value={sortedInvoices} paginator rows={25} dataKey="ID" stripedRows filters={filters} header={header} filterDisplay="row" emptyMessage="No invoices found.">
                <Column header="Edit" body={editBodyTemplate} />
                <Column style={{textAlign:"center"}} header="Delete" body={deleteBodyTemplate} />
                <Column field="JobNumber"  style={{ maxWidth: '11rem' }} sortable header="Job Number" filter filterPlaceholder="Search by job number" />
                <Column field="InvoiceNumber" style={{ maxWidth: '11rem' }} sortable header="Invoice Number" filter filterPlaceholder="Search by invoice number" />
                <Column header="Account" style={{ maxWidth: '11rem' }}  filter filterField="Account?.Name" filterPlaceholder="Search by Account"  body={(rowData) => rowData.Account?.Name || 'N/A'}/>
                <Column field="realInvoiceDate" header="Invoice Date" dataType="date" sortable body={dateBodyTemplate}   filterPlaceholder="Search by Date" />
              
                <Column field="Paid" header="Paid" dataType="boolean" style={{ minWidth: '6rem' }}  body={(rowData) => booleanBodyTemplate(rowData, 'Paid')} filter filterElement={booleanFilterTemplate}/>
                <Column header="Total"  body={(rowData) => currencyBodyTemplate(rowData, 'Total','Total')} sortable style={{ minWidth: '6rem' }}/>
                <Column header="Balance"  body={(rowData) => currencyBodyTemplate(rowData, 'Balance', 'Total')} sortable style={{ minWidth: '6rem' }}/>
            </DataTable>
        </div>
    );
};

export default InvoicesHome;
