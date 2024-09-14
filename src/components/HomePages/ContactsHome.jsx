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

const ContactsHome = (props) => {
    const { contacts } = UserAuth();
    const { showContactPopUp } = useGlobal();
    const [sortedContacts, setSortedContacts] = useState([]);
    useEffect(() => {
        // Sort the contacts array by Name
        const sorted = [...contacts].sort((a, b) => {
            if (a.Name < b.Name) return -1;
            if (a.Name > b.Name) return 1;
            return 0;
        });
        setSortedContacts(sorted);
    }, [contacts]);

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        'Account.Name': { value: null, matchMode: FilterMatchMode.CONTAINS },
        // Don't set anything here for Account.Name initially
    });

    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [departments] = useState(['Admin', 'Dispatch', 'Foreman', 'Billing', 'Estimating']);

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
        showContactPopUp(rowData);
    };

    const departmentBodyTemplate = (rowData) => (
        <Tag value={rowData.Department} severity={rowData.Department} />
    );

    const departmentItemTemplate = (option) => (
        <Tag value={option} severity={option} />
    );

    const booleanBodyTemplate = (rowData, field) => (
        <i className={classNames('pi', {
            'true-icon pi-check-circle': rowData[field],
            'false-icon pi-times-circle': !rowData[field]
        })} />
    );

    const departmentRowFilterTemplate = (options) => (
        <Dropdown value={options.value || undefined} options={departments} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={departmentItemTemplate} placeholder="Select One" className="p-column-filter" showClear style={{ minWidth: '12rem' }} />
    );

    const booleanFilterTemplate = (options) => (
        <TriStateCheckbox style={{ borderColor: "#d1d5db", background: "white" }} value={options.value || undefined} onChange={(e) => options.filterApplyCallback(e.value)} />
    );

    const accountFilterFunction = (value, filter) => {
        return value?.Name?.toLowerCase().includes(filter.toLowerCase()) ?? false;
    };

    const header = renderHeader();

    return (
        <div className="card">
            <DataTable value={sortedContacts} paginator rows={25} dataKey="ID" filters={filters} header="Contacts" filterDisplay="row" emptyMessage="No contacts found.">
                <Column header="Edit" body={editBodyTemplate} />
                <Column field="Name" header="Name" filter filterPlaceholder="Search by name" />
                <Column header="Account" filter filterField="Account.Name" filterPlaceholder="Search by Account"  body={(rowData) => rowData.Account?.Name || 'N/A'}/>
                <Column field="Email" header="Email" filter filterPlaceholder="Search by Email" />
                <Column field="Department" header="Department" showFilterMenu={false} filterMenuStyle={{ width: '14rem' }} body={departmentBodyTemplate} filter filterElement={departmentRowFilterTemplate} />
            </DataTable>
        </div>
    );
};

export default ContactsHome;
