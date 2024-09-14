
import React, { useState, useEffect} from 'react';

import { UserAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';

import { classNames } from 'primereact/utils';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
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

const AccountsHome = (props) => {
  const { accounts} = UserAuth();
  const { showAccountPopUp} = useGlobal();
  const [sortedAccounts, setSortedAccounts] = useState([]);

  useEffect(() => {
      // Sort the accounts array by Name
      const sorted = [...accounts].sort((a, b) => {
          if (a.Name < b.Name) return -1;
          if (a.Name > b.Name) return 1;
          return 0;
      });
      setSortedAccounts(sorted);
  }, [accounts]);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        Name: { value: null, matchMode: FilterMatchMode.CONTAINS },
        Status: { value: null, matchMode: FilterMatchMode.EQUALS },
        Subhauler: { value: null, matchMode: FilterMatchMode.EQUALS },
        DedicatedSubhauler: { value: null, matchMode: FilterMatchMode.EQUALS },
        Vendor: { value: null, matchMode: FilterMatchMode.EQUALS },
        Boker: { value: null, matchMode: FilterMatchMode.EQUALS }
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
        let _filters = { ...filters };
        _filters['global'].value = value;
        setFilters(_filters);
        setGlobalFilterValue(value);
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-content-end">
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText   style={{paddingLeft: "2.5rem"}}   value={globalFilterValue !== null ? globalFilterValue : ''} onChange={onGlobalFilterChange} placeholder="Keyword Search" />
                </IconField>
            </div>
        );
    };

    const editBodyTemplate = (rowData) => {
      return (
          <button type="button" onClick={() => handleEdit(rowData)}>
              <FontAwesomeIcon icon={faEdit} />
          </button>
      );
  };
  
  // Sample handleEdit function
  const handleEdit = (rowData) => {
      console.log("Edit button clicked for:", rowData);
      showAccountPopUp(rowData)
      // Implement your edit functionality here
  };
    const statusBodyTemplate = (rowData) => {
        return <Tag value={rowData.Status} severity={getSeverity(rowData.Status)} />;
    };

    const statusItemTemplate = (option) => {
        return <Tag value={option} severity={getSeverity(option)} />;
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


    const statusRowFilterTemplate = (options) => {
        return (
            <Dropdown     value={options.value !== null ? options.value : undefined} options={statuses} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={statusItemTemplate} placeholder="Select One" className="p-column-filter" showClear style={{ minWidth: '12rem' }} />
        );
    };

    const booleanFilterTemplate = (options) => {
      return (
        <TriStateCheckbox style={{borderColor:"#d1d5db", background:"white"}}
          value={options.value !== null ? options.value : undefined}
          onChange={(e) => options.filterApplyCallback(e.value)}
        />
      );
    };
  

  return (
    <div className="card">
      <DataTable value={sortedAccounts} paginator rows={25} dataKey="ID" filters={filters}  header="Accounts" filterDisplay="row"  emptyMessage="No customers found.">
          <Column  header="Edit" body={editBodyTemplate}/>
          <Column field="Name" header="Name" filter filterPlaceholder="Search by name" />
          <Column field="displayPhone" header="Phone" filter filterPlaceholder="Search by phone" />
          <Column field="Address" header="Address" filter filterPlaceholder="Search by Address" />
          <Column field="City" header="City" filter filterPlaceholder="Search by City"  />
          <Column field="State" header="State" filter filterPlaceholder="Search by State"  />
          <Column field="Status" header="Status" showFilterMenu={false} filterMenuStyle={{ width: '14rem' }}  body={statusBodyTemplate} filter filterElement={statusRowFilterTemplate} />
          <Column field="Subhauler" header="Subhauler" dataType="boolean" style={{ minWidth: '6rem' }} body={(rowData) => booleanBodyTemplate(rowData, 'Subhauler')} filter filterElement={booleanFilterTemplate} />
          <Column field="DedicatedSubhauler" header="Dedicated" dataType="boolean" style={{ minWidth: '6rem' }}  body={(rowData) => booleanBodyTemplate(rowData, 'DedicatedSubhauler')} filter filterElement={booleanFilterTemplate}/>
          <Column field="Vendor" header="Vendor" dataType="boolean" style={{ minWidth: '6rem' }} body={(rowData) => booleanBodyTemplate(rowData, 'Vendor')} filter filterElement={booleanFilterTemplate} />
          <Column field="Broker" header="Broker" dataType="boolean" style={{ minWidth: '6rem' }}  body={(rowData) => booleanBodyTemplate(rowData, 'Broker')} filter filterElement={booleanFilterTemplate}/>
      </DataTable>
    </div>
  );
}
export default AccountsHome;
        