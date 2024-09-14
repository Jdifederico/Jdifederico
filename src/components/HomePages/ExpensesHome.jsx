import React, { useState, useEffect } from 'react';
import { UserAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';

import { FilterMatchMode } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinusCircle, faEdit } from '@fortawesome/free-solid-svg-icons';

const ExpensesHome = (props) => {
    const {  expenseNames,deleteDocument } = UserAuth();
    const { showNamePopUp} = useGlobal();
    const [sortedExpenseNames, setsortedExpenseNames] = useState([]);

    useEffect(() => {
        // Sort the expenseNames array by Name
        const sorted = [...expenseNames].sort((a, b) => {
            if (a.Name < b.Name) return -1;
            if (a.Name > b.Name) return 1;
            return 0;
        });
        setsortedExpenseNames(sorted);
    }, [expenseNames]);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        Name: { value: null, matchMode: FilterMatchMode.CONTAINS }

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

    const renderHeader = () => (
        <div className="flex justify-content-end">
            <IconField iconPosition="left">
                <InputIcon className="pi pi-search" />
                <InputText style={{ paddingLeft: "2.5rem" }} value={globalFilterValue || ''} onChange={onGlobalFilterChange} placeholder="Keyword Search" />
            </IconField>
        </div>
    );

    const editBodyTemplate = (rowData) => (
        <button type="button" onClick={() => handleEdit(rowData)}>
            <FontAwesomeIcon icon={faEdit} />
        </button>
    );
 
    const handleEdit = (rowData) => {
       console.log('show roate ', rowData)
       showNamePopUp(rowData, 'expenseNames');
    
    };

    const deleteBodyTemplate = (rowData) => (
        <button type="button" onClick={() => handleDelete(rowData)}>
             <FontAwesomeIcon className="fas" icon={faMinusCircle} style={{color:"red", height:"1.25em", textAlign:"center", width:"1.25em !important"}}/> 
        </button>
    );

    const handleDelete = async (rowData) => {
        try {
            if (window.confirm("Are you sure you want delete this Expense Name?")) {
                deleteDocument(rowData,'DefaultNames' )
               
            }
            
        } catch (error) {  console.error("Error removing document: ", error);  }
       
    };

  
    const header = renderHeader();

    return (
        <div className="card">
            <DataTable value={sortedExpenseNames} paginator rows={25} dataKey="ID" stripedRows filters={filters} header="Expenses" filterDisplay="row" emptyMessage="No expenseNames found.">
                <Column style={{textAlign:"center"}} header="Edit" body={editBodyTemplate} />
                <Column style={{textAlign:"center"}} header="Delete" body={deleteBodyTemplate} />
                <Column field="Name" header="Name" filter filterPlaceholder="Search by name" />
          
            </DataTable>
        </div>
    );
};

export default ExpensesHome;
