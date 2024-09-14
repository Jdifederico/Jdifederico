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

const TruckTypesHome = (props) => {
    const { truckTypes, deleteDocument } = UserAuth();
    const { showTruckTypePopUp} = useGlobal();
    const [sortedTruckTypes, setSortedTruckTypes] = useState([]);

    useEffect(() => {
        // Sort the truckTypes array by Name
        const sorted = [...truckTypes].sort((a, b) => {
            if (a.Name < b.Name) return -1;
            if (a.Name > b.Name) return 1;
            return 0;
        });
        setSortedTruckTypes(sorted);
    }, [truckTypes]);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        TruckCode: { value: null, matchMode: FilterMatchMode.CONTAINS}, 
        NumOfAxles: { value: null, matchMode: FilterMatchMode.CONTAINS}, 
        DefaultRate: { value: null, matchMode: FilterMatchMode.CONTAINS},
        NightRate: { value: null, matchMode: FilterMatchMode.CONTAINS},
        WeekendRate: { value: null, matchMode: FilterMatchMode.CONTAINS},
        CapacityTons: { value: null, matchMode: FilterMatchMode.CONTAINS},
        CapacityYards: { value: null, matchMode: FilterMatchMode.CONTAINS},

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
       showTruckTypePopUp(rowData);
    };
 
    const deleteBodyTemplate = (rowData) => (
        <button type="button" onClick={() => handleDelete(rowData)}>
             <FontAwesomeIcon className="fas" icon={faMinusCircle} style={{color:"red", height:"1.25em", textAlign:"center", width:"1.25em !important"}}/> 
        </button>
    );

    const handleDelete = async (rowData) => {
        try {
            if (window.confirm("Are you sure you want delete this Truck Type?")) {
                deleteDocument(rowData,'TruckTypes' )
            }  
        } catch (error) {  console.error("Error removing document: ", error);  }
       
    };

  
    const header = renderHeader();

    return (
        <div className="card">
            <DataTable value={sortedTruckTypes} paginator rows={25} dataKey="ID" stripedRows filters={filters} header="TruckTypes" filterDisplay="row" emptyMessage="No truckTypes found.">
                <Column style={{textAlign:"center"}} header="Edit" body={editBodyTemplate} />
                <Column style={{textAlign:"center"}} header="Delete" body={deleteBodyTemplate} />
                <Column field="Name" header="Name" filter filterPlaceholder="Search by name" />
          
                <Column field="TruckCode" header="Truck Code" filter filterPlaceholder="Search by Truck Code" />
                <Column field="NumOfAxles" header="Number of Axles" filter filterPlaceholder="Search by Number of Axles"  />
                <Column field="DefaultRate" header="Default Rate" filter filterPlaceholder="Search by Default Rate"  />
                <Column field="NightRate" header="Night Rate" filter filterPlaceholder="Search by Night Rate"  />
                <Column field="WeekendRate" header="Weekend Rate" filter filterPlaceholder="Search by Weekend Rate"  />
                <Column field="CapacityTons" header="Capacity (Tons)" filter filterPlaceholder="Search Ton Capacity"  />
                <Column field="CapacityYards" header="Capacity (Yards)" filter filterPlaceholder="Search Yard Capacity"  />
            </DataTable>
        </div>
    );
};

export default TruckTypesHome;
