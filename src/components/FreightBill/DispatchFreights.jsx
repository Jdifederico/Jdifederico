import React, { useEffect, useState, useRef, useCallback } from 'react';
import {useParams } from 'react-router-dom';
import { useFreightBill } from './FreightBillContext';
import {useNavigate } from 'react-router-dom'
import { classNames } from 'primereact/utils';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';


import { TriStateCheckbox } from 'primereact/tristatecheckbox';


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';  

function DispatchFreights(props) {
    const { id } = useParams();
    const {  homeFreightBills,setFreightBill,homeExpenses, setExpenses,freightBillIDRef } = useFreightBill();
    const navigate = useNavigate();

    // Sort the fbs  array by loadorder
    const dispatchFreightBills = homeFreightBills.filter(freightBill => freightBill.dispatchID === id).sort((a, b) => {
        if (a.loadOrder < b.loadOrder) return -1;
        if (a.loadOrder > b.loadOrder) return 1;
        return 0;
    });

    console.log('dioapthc freight = ', dispatchFreightBills)

    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        driverName: { value: null, matchMode: FilterMatchMode.CONTAINS },
        FBNO: { value: null, matchMode: FilterMatchMode.CONTAINS },
        Loads: { value: null, matchMode: FilterMatchMode.EQUALS },
        profit: { value: null, matchMode: FilterMatchMode.CONTAINS },
        billedQty: { value: null, matchMode: FilterMatchMode.CONTAINS },
        tPaid: { value: null, matchMode: FilterMatchMode.CONTAINS },
        tBilled: { value: null, matchMode: FilterMatchMode.CONTAINS },
        dSubmitted: { value: null, matchMode: FilterMatchMode.EQUALS },
        missing: { value: null, matchMode: FilterMatchMode.EQUALS },
        onHold: { value: null, matchMode: FilterMatchMode.EQUALS },
        billed: { value: null, matchMode: FilterMatchMode.EQUALS },
        paid: { value: null, matchMode: FilterMatchMode.EQUALS },
        approved: { value: null, matchMode: FilterMatchMode.EQUALS }
  });
  

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
    setFreightBill(rowData);
    const tempExpenses = homeExpenses.filter(expense => expense.FreightBill === rowData.ID);
    setExpenses((prevExpenses) => [...tempExpenses]); 
    freightBillIDRef.current=rowData.ID;
    navigate('/freightbill/freightbill/'+rowData.ID)
   // showAccountPopUp(rowData)
    // Implement your edit functionality here
};


const currencyBodyTemplate = (rowData, field) => {
    return (
       <span style={{paddingRight:".5em", float:"right"}}>${ rowData[field]}</span>
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



  const booleanFilterTemplate = (options) => {
    return (
      <TriStateCheckbox style={{borderColor:"#d1d5db", background:"white"}}
        value={options.value !== null ? options.value : undefined}
        onChange={(e) => options.filterApplyCallback(e.value)}
      />
    );
  };

  return(
    <div className="card">
    <DataTable value={dispatchFreightBills} paginator rows={25} dataKey="ID" filters={filters}  header="Freight Bills" filterDisplay="row"  emptyMessage="No Freight Bills found.">
        <Column  header="Edit" body={editBodyTemplate}/>
        <Column field="driverName" header="Name" filter filterPlaceholder="Search by name" />
        <Column field="FBNO" header="FB #" filter filterPlaceholder="Search" />
        <Column header="Truck" filter filterField="Truck.Name" filterPlaceholder="Search by Truck"  body={(rowData) => rowData.Truck?.Name || 'N/A'}/>
        <Column field="loads" header="Loads"  />
        <Column field="billedQty" header="Qty"   />

        <Column field="missing" header="Missing" dataType="boolean" style={{ minWidth: '4rem' }} body={(rowData) => booleanBodyTemplate(rowData, 'missing')} filter filterElement={booleanFilterTemplate} />
        <Column field="onHold" header="On Hold" dataType="boolean" style={{ minWidth: '4rem' }}  body={(rowData) => booleanBodyTemplate(rowData, 'onHold')} filter filterElement={booleanFilterTemplate}/>
        <Column field="dSubmitted" header="Submitted" dataType="boolean" style={{ minWidth: '4rem' }} body={(rowData) => booleanBodyTemplate(rowData, 'dSubmitted')} filter filterElement={booleanFilterTemplate} />
        <Column field="approved" header="Approved" dataType="boolean" style={{ minWidth: '4rem' }}  body={(rowData) => booleanBodyTemplate(rowData, 'approved')} filter filterElement={booleanFilterTemplate}/>
        <Column field="bTotal" header="Bill Total"  body={(rowData) => currencyBodyTemplate(rowData, 'bTotal')} style={{ minWidth: '6rem' }}/>
        <Column field="tPaid" header="Pay Total"  body={(rowData) => currencyBodyTemplate(rowData, 'tPaid')} style={{ minWidth: '6rem' }}/>
        <Column field="profit" header="Profit"  body={(rowData) => currencyBodyTemplate(rowData, 'profit')} style={{ minWidth: '6rem' }}/>
        <Column field="billed" header="Billed" dataType="boolean" style={{ minWidth: '4rem' }}  body={(rowData) => booleanBodyTemplate(rowData, 'billed')} filter filterElement={booleanFilterTemplate}/>
        <Column field="paid" header="Paid" dataType="boolean" style={{ minWidth: '4rem' }}  body={(rowData) => booleanBodyTemplate(rowData, 'paid')} filter filterElement={booleanFilterTemplate}/>
    </DataTable>
  </div>

  )
}


export default DispatchFreights;