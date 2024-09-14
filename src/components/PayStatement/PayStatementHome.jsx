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
import { usePayStatement } from './PayStatementContext';
import { db } from '../../firebase';
import { doc,  query, collection, onSnapshot, where } from 'firebase/firestore';
const PayStatementsHome = (props) => {
    const {payStatementRef, payStatementsRef} = usePayStatement();
    const { deleteDocument, gearedUser,companies,company, formatDate } = UserAuth();

    const { showPayStatementPopUp} = useGlobal();
    const [payStatements, setPayStatements] = useState([]);
    const [sortedPayStatements, setSortedPayStatements] = useState([]);
    console.log('user auth company on load = ', companies)
    const [homeObject, setHomeObject]= useState({Company:{...company}})
    const [queryRange, setQueryRange]= useState('SixMonths');
    const queryRanges = [ {text :'Six Months',value: 'SixMonths'},{text :'Twelve Months',value: 'TwelveMonths'} ];
    const unsubscribePayStatementsRef = useRef(null)
 

    useEffect(() => {
        if (company && Object.keys(company).length > 0) {
            setHomeObject({Company:{...company}})
           
        }
    }, [company]);
    useEffect(() => {
        if (homeObject.Company.ID && Object.keys(homeObject.Company).length > 0) {
            console.log('HOMEOBJECT COMPANY = ', homeObject.Company)
            getPayStatements();
           
        }
    }, [homeObject.Company, queryRange]);

    useEffect(() => {
        // Sort the payStatements array by Name
        const sorted = [...payStatements].sort((a, b) => {
            if (a.QueryDate >= b.QueryDate) return -1;
            if (a.QueryDate <= b.QueryDate) return 1;
            return 0;
        });
        setSortedPayStatements(sorted);
    }, [payStatements]);
                                                                                                                                                                
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        JobNumber: { value: null, matchMode: FilterMatchMode.CONTAINS },
        DPSNum: { value: null, matchMode: FilterMatchMode.CONTAINS}, 
        ParentName: { value: null, matchMode: FilterMatchMode.CONTAINS }
   
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
    const getPayStatements = () => {
      
        payStatementsRef.current=[];
        if (unsubscribePayStatementsRef.current) unsubscribePayStatementsRef.current();
        let tempDate =new Date();
        let monthSubtract;
        if(queryRange==='TwelveMonths')monthSubtract=12;
        if(queryRange==='SixMonths')monthSubtract=6;
        tempDate.setMonth(tempDate.getMonth()-monthSubtract);
        tempDate=formatDate(tempDate, '/','YYYY/MM/DD');
        console.log('homeObject.Company = ' , homeObject.Company);

        const queryName = `Organizations/${gearedUser.selectedOrgName}/PayStatements`;

        const q = query(
            collection(db, queryName),
            where("QBDPSDate", ">=", tempDate),
            where("Company.ID","==", homeObject.Company.ID)
        );
        console.log('tempDAte = ', tempDate)
        unsubscribePayStatementsRef.current = onSnapshot(q, (querySnapshot) => {
            console.log('PayStatement HOME SNAPSHOT FIRING');
            querySnapshot.docChanges().forEach((change) => {
                const tempPayStatement = change.doc.data();
                tempPayStatement.FreightBills = [];
                tempPayStatement.ID = change.doc.id;
                tempPayStatement.realDPSDate = new Date(tempPayStatement.DPSDate);
             
                if (change.type === "added") {
                    payStatementsRef.current.push(tempPayStatement); 
                }
                if (change.type === "modified") {
                    const payStatementIndex = payStatementsRef.current.findIndex((d) => d.ID === tempPayStatement.ID);
                    payStatementsRef.current[payStatementIndex] = tempPayStatement;
                }
            });

            console.log('setting full home PayStatementes = ',  payStatementsRef.current);
            setPayStatements([... payStatementsRef.current]) // Return the fetched payStatements
        }); // Handle errors by rejecting the promise
      
    };

    const handleChangePayStatementCompany = (fieldName, value) =>{
        setHomeObject((prev) => ({ ...prev, [fieldName]: value }));
    }
    const renderHeader = () => (
        <div className="mbsc-row">
            <span>PayStatements</span>
                <div className="p-inputgroup mbsc-col-3 mbsc-offset-4">
                    <span className="p-inputgroup-addon">Range:</span>
                    <Dropdown value={queryRange} onChange={(e) => setQueryRange( e.value)} options={queryRanges} optionLabel="text" placeholder="Select a Range" className="w-full md:w-14rem" />
            </div>
            <div className="mbsc-col-3">
                <AutoCompleteInput fieldName="Company" field="CompanyName" value={homeObject.Company} suggestions={companies}  setValue={setHomeObject}  handleFieldChange={handleChangePayStatementCompany}   />
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
        showPayStatementPopUp(rowData);
    };
 

    const deleteBodyTemplate = (rowData) => (
        <button type="button" onClick={() => handleDelete(rowData)}>
             <FontAwesomeIcon className="fas" icon={faMinusCircle} style={{color:"red", height:"1.25em", textAlign:"center", width:"1.25em !important"}}/> 
        </button>
    );

    const handleDelete = async (rowData) => {
        try {
            if (window.confirm("Are you sure you want delete this PayStatement?")) {
               await deleteDocument(rowData,'PayStatements' )
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
        console.log('making date boyd temp = ', rowData.realDPSDate)
        return formatDate(rowData.realDPSDate, '/', 'MM/DD/YYYY');
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
            <DataTable value={sortedPayStatements} paginator rows={25} dataKey="ID" stripedRows filters={filters} header={header} filterDisplay="row" emptyMessage="No payStatements found.">
                <Column header="Edit" body={editBodyTemplate} />
                <Column style={{textAlign:"center"}} header="Delete" body={deleteBodyTemplate} />
          
                <Column field="DPSNum" style={{ maxWidth: '11rem' }} sortable header="Statement #" filter filterPlaceholder="Search by Statement #" />
                <Column field="ParentName" header="Driver" style={{ maxWidth: '11rem' }}  filter  filterPlaceholder="Search by Driver"  sortable />
                <Column field="Subhauler" header="Subhauler" dataType="boolean" style={{ minWidth: '6rem' }}  body={(rowData) => booleanBodyTemplate(rowData, 'Subhauler')} filter filterElement={booleanFilterTemplate}/>
                <Column field="realDPSDate" header="Statement Date" dataType="date" sortable body={dateBodyTemplate}   filterPlaceholder="Search by Date" />
              
                <Column field="Paid" header="Paid" dataType="boolean" style={{ minWidth: '6rem' }}  body={(rowData) => booleanBodyTemplate(rowData, 'Paid')} filter filterElement={booleanFilterTemplate}/>
                <Column header="Total"  body={(rowData) => currencyBodyTemplate(rowData, 'Total','Total')} sortable style={{ minWidth: '6rem' }}/>
                <Column header="Balance"  body={(rowData) => currencyBodyTemplate(rowData, 'Balance', 'Total')} sortable style={{ minWidth: '6rem' }}/>
            </DataTable>
        </div>
    );
};

export default PayStatementsHome;
