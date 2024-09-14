import React, { useState, useEffect } from 'react';
import { UserAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';
import { classNames } from 'primereact/utils';
import { FilterMatchMode } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { TriStateCheckbox } from 'primereact/tristatecheckbox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';

const DriversHome = (props) => {
    const { drivers } = UserAuth();
    const { showDriverPopUp } = useGlobal();
    const [sortedDrivers, setSortedDrivers] = useState([]);

    useEffect(() => {
        // Sort the drivers array by Name
        const sorted = [...drivers].sort((a, b) => {
            if (a.Name < b.Name) return -1;
            if (a.Name > b.Name) return 1;
            return 0;
        });
        setSortedDrivers(sorted);
    }, [drivers]);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        'Truck.Name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        displayPhone: { value: null, matchMode: FilterMatchMode.CONTAINS}, 
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
        console.log('driver = ', rowData)
      showDriverPopUp(rowData);
    };
    const statusBodyTemplate = (rowData) => {
        return <Tag value={rowData.Status} severity={getSeverity(rowData.Status)} />;
    };

    const statusItemTemplate = (option) => {
        return <Tag value={option} severity={getSeverity(option)} />;
    };


    const booleanBodyTemplate = (rowData, field) => (
        <i className={classNames('pi', {
            'true-icon pi-check-circle': rowData[field],
            'false-icon pi-times-circle': !rowData[field]
        })} />
    );

    const statusRowFilterTemplate = (options) => {
        return (
            <Dropdown     value={options.value !== null ? options.value : undefined} options={statuses} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={statusItemTemplate} placeholder="Select One" className="p-column-filter" showClear style={{ minWidth: '12rem' }} />
        );
    };

    const booleanFilterTemplate = (options) => (
        <TriStateCheckbox style={{ borderColor: "#d1d5db", background: "white" }} value={options.value || undefined} onChange={(e) => options.filterApplyCallback(e.value)} />
    );

    const accountFilterFunction = (value, filter) => {
        return value?.Name?.toLowerCase().includes(filter.toLowerCase()) ?? false;
    };

    const header = renderHeader();

    return (
        <div className="card">
            <DataTable value={sortedDrivers} paginator rows={25} dataKey="ID" filters={filters} header="Drivers" filterDisplay="row" emptyMessage="No drivers found.">
                <Column header="Edit" body={editBodyTemplate} />
                <Column field="Name" header="Name" filter filterPlaceholder="Search by name" />
                <Column header="Truck" filter filterField="Truck?.Name" filterPlaceholder="Search by Truck"  body={(rowData) => rowData.Truck?.Name || 'N/A'}/>
                <Column field="Email" header="Email" filter filterPlaceholder="Search by Email" />
                <Column field="displayPhone" header="Phone" filter filterPlaceholder="Search by phone" />
                <Column field="Status" header="Status" showFilterMenu={false} filterMenuStyle={{ width: '14rem' }}  body={statusBodyTemplate} filter filterElement={statusRowFilterTemplate} />
            </DataTable>
        </div>
    );
};

export default DriversHome;
