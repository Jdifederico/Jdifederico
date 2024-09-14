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
import { faEdit, faMinusCircle} from '@fortawesome/free-solid-svg-icons';

const LocationsHome = (props) => {
    const { locations, deleteDocument } = UserAuth();
    const { showLocationPopUp } = useGlobal();
    const [sortedLocations, setSortedLocations] = useState([]);

    useEffect(() => {
        // Sort the locations array by Name
        const sorted = [...locations].sort((a, b) => {
            if (a.Name < b.Name) return -1;
            if (a.Name > b.Name) return 1;
            return 0;
        });
        setSortedLocations(sorted);
    }, [locations]);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        Address: { value: null, matchMode: FilterMatchMode.CONTAINS}, 
        City: { value: null, matchMode: FilterMatchMode.CONTAINS}, 
       State: { value: null, matchMode: FilterMatchMode.CONTAINS}, 
       ZipCode: { value: null, matchMode: FilterMatchMode.STARTS_WITH}, 
        // Don't set anything here for Account.Name initially
    });

    const [globalFilterValue, setGlobalFilterValue] = useState('');
  
    const [statuses] = useState(['Active','Inactive']);

    const getSeverity = (status) => {
        switch (status) {
          case 'Active':
            return 'success';
          case 'Inactive':
            return 'danger';
        }
    };


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
       
        showLocationPopUp(rowData);
    };
 

    const deleteBodyTemplate = (rowData) => (
        <button type="button" onClick={() => handleDelete(rowData)}>
             <FontAwesomeIcon className="fas" icon={faMinusCircle} style={{color:"red", height:"1.25em", textAlign:"center", width:"1.25em !important"}}/> 
        </button>
    );

    const handleDelete = async (rowData) => {
        try {
            if (window.confirm("Are you sure you want delete this Location?")) {
                deleteDocument(rowData,'Locations' )
            }  
        } catch (error) {  console.error("Error removing document: ", error);  }
       
    };

 
    const header = renderHeader();

    return (
        <div className="card">
            <DataTable value={sortedLocations} paginator rows={25} dataKey="ID" filters={filters} header="Locations" filterDisplay="row" emptyMessage="No locations found.">
                <Column style={{textAlign:"center"}} header="Edit" body={editBodyTemplate} />
                <Column style={{textAlign:"center"}} header="Delete" body={deleteBodyTemplate} />
                <Column field="Name" header="Name" filter filterPlaceholder="Search by name" />
                <Column field="Address" header="Address" filter filterPlaceholder="Search by Address" />
                <Column field="City" header="City" filter filterPlaceholder="Search by City"  />
                <Column field="State" header="State" filter filterPlaceholder="Search by State"  />
                <Column field="ZipCode" header="Zip Code" filter filterPlaceholder="Search by Zip Code"  />
            </DataTable>
        </div>
    );
};

export default LocationsHome;
