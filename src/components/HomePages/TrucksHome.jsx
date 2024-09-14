import React, { useState, useEffect } from 'react';
import { UserAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';
import { FilterMatchMode } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faMinusCircle } from '@fortawesome/free-solid-svg-icons';

const TrucksHome = (props) => {
    const { trucks,deleteDocument } = UserAuth();
    const { showTruckPopUp} = useGlobal();
    const [sortedTrucks, setSortedTrucks] = useState([]);

    useEffect(() => {
        // Sort the trucks array by Name
        const sorted = [...trucks].sort((a, b) => {
            if (a.Name < b.Name) return -1;
            if (a.Name > b.Name) return 1;
            return 0;
        });
        setSortedTrucks(sorted);
    }, [trucks]);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        Make: { value: null, matchMode: FilterMatchMode.CONTAINS}, 
        Model: { value: null, matchMode: FilterMatchMode.CONTAINS}, 
        LicensePlate: { value: null, matchMode: FilterMatchMode.CONTAINS},
        Status: { value: null, matchMode: FilterMatchMode.EQUALS },
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
       console.log('show roate ', rowData)
        showTruckPopUp(rowData);
    };
    const statusBodyTemplate = (rowData) => {
        return <Tag value={rowData.Status} severity={getSeverity(rowData.Status)} />;
    };

    const statusItemTemplate = (option) => {
        return <Tag value={option} severity={getSeverity(option)} />;
    };


    const statusRowFilterTemplate = (options) => {
        return (
            <Dropdown     value={options.value !== null ? options.value : undefined} options={statuses} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={statusItemTemplate} placeholder="Select One" className="p-column-filter" showClear style={{ minWidth: '12rem' }} />
        );
    };

    const deleteBodyTemplate = (rowData) => (
        <button type="button" onClick={() => handleDelete(rowData)}>
             <FontAwesomeIcon className="fas" icon={faMinusCircle} style={{color:"red", height:"1.25em", textAlign:"center", width:"1.25em !important"}}/> 
        </button>
    );

    const handleDelete = async (rowData) => {
        try {
            if (window.confirm("Are you sure you want delete this Truck?")) {
                deleteDocument(rowData,'Trucks' )
            }  
        } catch (error) {  console.error("Error removing document: ", error);  }
       
    };

  
    const header = renderHeader();

    return (
        <div className="card">
            <DataTable value={sortedTrucks} paginator rows={25} dataKey="ID" filters={filters} header="Trucks" filterDisplay="row" emptyMessage="No trucks found.">
                <Column style={{textAlign:"center"}} header="Edit" body={editBodyTemplate} />
                <Column style={{textAlign:"center"}} header="Delete" body={deleteBodyTemplate} />
                <Column field="Name" header="Name" filter filterPlaceholder="Search by name" />
                <Column field="DriverName" header="Driver" filter filterPlaceholder="Search by name" />
                <Column field="Make" header="Make" filter filterPlaceholder="Search by Make" />
                <Column field="Model" header="Model" filter filterPlaceholder="Search by Model"  />
                <Column field="Status" header="Status" showFilterMenu={false} filterMenuStyle={{ width: '14rem' }}  body={statusBodyTemplate} filter filterElement={statusRowFilterTemplate} />
                <Column field="LicensePlate" header="License Plate" filter filterPlaceholder="Search by License"  />
            </DataTable>
        </div>
    );
};

export default TrucksHome;
