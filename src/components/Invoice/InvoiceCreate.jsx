import React, { useEffect, useState, useRef } from 'react';

import { UserAuth } from '../../context/AuthContext';

import { useInvoice } from './InvoiceContext';

import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { Calendar} from 'primereact/calendar';
import  { Button} from '@mobiscroll/react';

import { db } from '../../firebase';
import { doc,  query, collection, addDoc, setDoc, onSnapshot, where } from 'firebase/firestore';


const  InvoiceCreate =(props)=> {
    const { createDispatches,queryDispatches,  createExpenseDispatches,createExpenses, queryExpenses,  setInvoice, setInvoices,     setPrintTags, invoicesRef, setInvoiceVisible,calcInvoiceTotal, invoiceRef, makeFreightBillLineItem, makeExpenseLineItem } = useInvoice();
    const { gearedUser, company, accounts,formatDate } = UserAuth();
  
    const [sortedDispatches, setSortedDispatches]= useState([]);
    const invoiceExpenseListenersRef = useRef([]);
    const invoiceFreightListenersRef = useRef([]);
  
    
    useEffect(() => {
        // Use Promise.all to wait for both queries to complete
        Promise.all([queryDispatches(), queryExpenses()])
            .then(([fetchedDispatches, fetchedExpenses]) => {
                createExpenseDispatches(fetchedDispatches, fetchedExpenses);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }, []);
    useEffect(() => {
        // Sort the createDispatches array by QueryDate
        const sorted = [...createDispatches].sort((a, b) => {
            if (a.QueryDate < b.QueryDate) return -1;
            if (a.QueryDate > b.QueryDate) return 1;
            return 0;
        });

        // Add index to each row for unique keys
        const dispatchesWithIndex = sorted.map((dispatch, index) => ({ ...dispatch, index }));
        setSortedDispatches(dispatchesWithIndex);
    }, [createDispatches]);

    const [filters, setFilters] = useState({
        realJobDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
        AccountName: { value: null, matchMode: FilterMatchMode.CONTAINS}, 
        JobNumber: { value: null, matchMode: FilterMatchMode.CONTAINS}, 
        LoadSiteName: { value: null, matchMode: FilterMatchMode.CONTAINS},
        DumpSiteName: { value: null, matchMode: FilterMatchMode.CONTAINS },
        unBilledFreights: { value: null, matchMode: FilterMatchMode.EQUALS },
        // Don't set anything here for Account.Name initially
    });


   
      
    const getCurrentTime= () =>{
        var tempdate = new Date();
   
        var realTempDate = formatDate(tempdate, '/', 'MM/DD/YYYY');
        if (Number(tempdate.getMinutes()) < 10) realTempDate = realTempDate + ' ' + tempdate.getHours() + ':' + '0' + tempdate.getMinutes();
        else realTempDate = realTempDate + ' ' + tempdate.getHours() + ':' + tempdate.getMinutes();
        return realTempDate;
    }

    const previewInvoices = () =>{
        let tempInvoices=[];
        invoicesRef.current =[];
        setPrintTags(false);
        if(invoiceFreightListenersRef.current.length>0)for(var u=0;u<invoiceFreightListenersRef.current.length; u++)invoiceFreightListenersRef.current[u]();
        if(invoiceExpenseListenersRef.current.length>0)for(var u=0;u<invoiceExpenseListenersRef.current.length; u++)invoiceExpenseListenersRef.current[u]();
        invoiceFreightListenersRef.current =[];
        invoiceExpenseListenersRef.current = [];
        for(let i=0; i<sortedDispatches.length; i++){
            if(sortedDispatches[i].Selected){
                if(sortedDispatches[i].isExpenseDispatch)previewInvoiceByExpense({...sortedDispatches[i]});
                else previewInvoiceByDispatch({...sortedDispatches[i]});
            }
        }
        console.log('so this is when we first set the invoice ',invoicesRef.current[0])
        invoiceRef.current=invoicesRef.current[0];
    }

    const previewInvoiceByDispatch = (Dispatch)=>{
        var InvoiceNumber = 111111;
        if (!company.TermsAndCond)company.TermsAndCond = '';
 
        if (company.CurrentInvoiceNumber) {
            InvoiceNumber = company.CurrentInvoiceNumber;
            company.CurrentInvoiceNumber++;
        }


            console.log('dispatch = ', Dispatch);
            var contactEmail = '';
            var contactName = 'No Contact';
            if (Dispatch.Contact) {
                if (Dispatch.Contact.Name !== '' && Dispatch.Contact.Name) contactName = Dispatch.Contact.Name;
                if (Dispatch.Contact.Email !== '' && Dispatch.Contact.Email) contactEmail = Dispatch.Contact.Email;
            }

           
            for (var q = 0; q < accounts.length; q++) {
                if (accounts[q].ID === Dispatch.Account.ID) {
                    var tempAccount = {...accounts[q]};
                    console.log('accounts[q] = ' , accounts[q])
                    tempAccount.custAddress2 = tempAccount.City + ', ' + tempAccount.State + ' ' + tempAccount.ZipCode;
                    var  realmID, accountTermsAndCond, qbCustomerID;
                    if (!tempAccount.Quickbooks) tempAccount.Quickbooks = [];
                    if (!tempAccount.InvoiceNotes) accountTermsAndCond = ''; else accountTermsAndCond = tempAccount.InvoiceNotes;
                    if (!tempAccount.QBCustomerID) qbCustomerID = ''; else qbCustomerID = tempAccount.QBCustomerID;
                    if (!Dispatch.Company.realmID) {
                        for(let p=0; p<tempAccount.Quickbooks.length; p++)if(tempAccount.Quickbooks[p].realmID===Dispatch.Company.realmID)qbCustomerID = tempAccount.Quickbooks[p].QBCustomerID;
                        if (!company.realmID) realmID = ''; else realmID = company.realmID;
                    } else realmID = Dispatch.Company.realmID;

                    var Account = {
                        ID: tempAccount.ID,
                        Name: tempAccount.Name,
                        Address: tempAccount.Address,
                        City: tempAccount.City,
                        State: tempAccount.State,
                        ZipCode: tempAccount.ZipCode,
                        Quickbooks: tempAccount.Quickbooks,
                        InvoiceNotes: tempAccount.InvoiceNotes,
                        custAddress2: tempAccount.custAddress2
                    };
                }
            }
            if(!company.ShowInvoiceMaterial)company.ShowInvoiceMaterial=false;
            console.log('account = ', Account)
            let tempInvoice = {
                ID: invoicesRef.current.length,
                Name: '',
                BillBy: 'DispatchID',
                VNum: 1,
                ShowMaterial:company.ShowInvoiceMaterial,
                JobID: Dispatch.Job.ID,
                ParentID: Dispatch.ID,
                DispID: Dispatch.ID,
                ParentName: Dispatch.Account.Name,
                ParentInvoice: '',
                Contact: {
                    Name: contactName,
                    Email: contactEmail
                },
                DispatchID: Dispatch.ID,
                ContactName: contactName,
                DispatchJobDate: Dispatch.JobDate,
                JobDate: Dispatch.JobDate,
                QueryDate:  formatDate(new Date(Dispatch.JobDate), '/', 'YYYY/MM/DD'),
                PONumber: Dispatch.PONumber,
                ContractNumber: Dispatch.ContractNumber,
                JobNumber: Dispatch.JobNumber,
                InvoiceNumber: InvoiceNumber,
                LoadSite: Dispatch.LoadSite,
                DumpSite:Dispatch.DumpSite,
                Account: Account,
                AccountID: Account.ID,
                Paid: false,
                isFromInvoice: false,
                Dispatch:{},
                Dispatches: [],
                FreightBills: [],
                InvoiceDate: formatDate(new Date(), '/', 'MM/DD/YYYY'),
                StartDate: Dispatch.JobDate,
                EndDate: Dispatch.JobDate,
                LineItems: [],
                Dates: [],
                Locations: [],
                realmID: realmID,
                showWeightTags: false,
                isExpenseInvoice: false,
                QBInvoiceID: '',
                createdAt: getCurrentTime(),
                createdBy:gearedUser.Email,
                InvoiceNotes: tempAccount.InvoiceNotes,
                TermsAndCond: company.TermsAndCond,
                Versions: [{ VNum: 1, URL: '' }],
                PDFLogo:'',
                sortByDisp:true,
                Totals: [],
                Payments: [],
                Expenses: [],
                FreightBills:[]
            };
       
            Dispatch.Job.unBilledFreights = 0;
            if (!Dispatch.Company) tempInvoice.Company = company; else tempInvoice.Company = Dispatch.Company;
            if (company.ID == Dispatch.MaterialCompany.ID && Dispatch.SellMaterial) tempInvoice.Company = Dispatch.MaterialCompany;



            tempInvoice.Dispatch={...Dispatch};
            tempInvoice.LoadSite = Dispatch.LoadSite;
            tempInvoice.DumpSite = Dispatch.DumpSite;
            console.log(' tempInvoice.DumpSite= ',  tempInvoice.DumpSite);
            invoicesRef.current.push({...tempInvoice})
            const queryName = `Organizations/${gearedUser.selectedOrgName}/FreightBills`;
            const freightQuery = query(collection(db, queryName), where("dispatchID", "==", Dispatch.ID));
            
            
            invoiceFreightListenersRef.current.push(onSnapshot(freightQuery, (querySnapshot) => {
                const foundIndex =  invoicesRef.current.findIndex(obj => obj.ID === tempInvoice.ID);
                console.log('inside teh feright listener and the foundIndex = ' + foundIndex)
                querySnapshot.docChanges().forEach((change) => {
                    var source = change.doc.metadata.hasPendingWrites ? "Local" : "Server";
                 
                    var tempFreight = change.doc.data();
                    tempFreight.ID = change.doc.id;
                    if(tempFreight.Invoice===''){
                     
                        if (change.type === "added") {
                            invoicesRef.current[foundIndex].FreightBills.push(tempFreight);
                            makeFreightBillLineItem(tempFreight, invoicesRef.current[foundIndex].LineItems, invoicesRef.current[foundIndex]);
                            if (tempFreight.missing === true) tempFreight.onHold = true;
                        }
                        if (change.type === "modified") {
                            for (var i = 0; i < invoicesRef.current[foundIndex].FreightBills.length; i++) {
                                if (tempFreight.ID == invoicesRef.current[foundIndex].FreightBills[i].ID) {
                                    console.log('found this tempFreight = ', tempFreight)
                                    invoicesRef.current[foundIndex].FreightBills[i] = tempFreight;
                                
                                    for (var j = 0; j < invoicesRef.current[foundIndex].LineItems.length; j++) {
                                        if (invoicesRef.current[foundIndex].LineItems[j].FreightID == tempFreight.ID && invoicesRef.current[foundIndex].LineItems[j].Type!=='Expense') {
                                            invoicesRef.current[foundIndex].LineItems.splice(j, 1);
                                            j--
                                        }
                                    }
                         
                                    makeFreightBillLineItem(tempFreight, invoicesRef.current[foundIndex].LineItems, invoicesRef.current[foundIndex]);
                                 
                                }
                            }
                        }
                    }


                });
        
                invoicesRef.current[foundIndex] = calcInvoiceTotal(invoicesRef.current[foundIndex]);
                invoicesRef.current[foundIndex].Balance = invoicesRef.current[foundIndex].Total;
                invoicesRef.current[foundIndex].Balance.Type = 'Amount Due';
       
                setInvoices([...invoicesRef.current]);
                if(invoiceRef.current.ID===invoicesRef.current[foundIndex].ID)setInvoice({...invoicesRef.current[foundIndex]})

            }));
            const expenseQueryName = `Organizations/${gearedUser.selectedOrgName}/Expenses`;
            const expenseQuery = query(collection(db, expenseQueryName), where("dispatchID", "==", Dispatch.ID));
            invoiceExpenseListenersRef.current.push(onSnapshot(expenseQuery, (querySnapshot) => {
                const foundIndex =  invoicesRef.current.findIndex(obj => obj.ID === tempInvoice.ID);
                querySnapshot.docChanges().forEach((change) => {
                    var source = change.doc.metadata.hasPendingWrites ? "Local" : "Server";
                    var Expense = change.doc.data();
                    Expense.ID = change.doc.id;
                  
                    if (Expense.BillTo.ID === invoicesRef.current[foundIndex].Account.ID) {
                        if (change.type === "added") {
                            console.log(', Expense adding to invoice = ' , Expense);
                            if (Expense.bill && !Expense.billed && (!Expense.addToFreights || Expense.FreightBill != '')) {
                                invoicesRef.current[foundIndex].Expenses.push(Expense);
                                invoicesRef.current[foundIndex].LineItems.push(makeExpenseLineItem(Expense ));
                            }
                        }                         
                        if (change.type === "removed") {
                            for (var i = 0; i < invoicesRef.current[foundIndex].Expenses.length; i++) {
                                if (Expense.ID == invoicesRef.current[foundIndex].Expenses[i].ID) {
                                    invoicesRef.current[foundIndex].Expenses.splice(i, 1);
                                    for (var j = 0; j < invoicesRef.current[foundIndex].LineItems.length; j++) {
                                        if (invoicesRef.current[foundIndex].LineItems[j].ID == Expense.ID) {
                                            invoicesRef.current[foundIndex].LineItems.splice(j, 1);
                                            j--
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (change.type === "modified") {
                        var foundExpense =false;
                        console.log('found a modified epxense = ', Expense);
                        for (var i = 0; i < invoicesRef.current[foundIndex].Expenses.length; i++) {
                            if (Expense.ID === invoicesRef.current[foundIndex].Expenses[i].ID) {
                                foundExpense=true;
                                invoicesRef.current[foundIndex].Expenses[i] = Expense;
                                for (var j = 0; j < invoicesRef.current[foundIndex].LineItems.length; j++) {
                                    if (invoicesRef.current[foundIndex].LineItems[j].ID === Expense.ID) {
                                        console.log('we found the current expense in teh line item and the expnes = ', Expense)
                                        if (Expense.bill && !Expense.billed && (!Expense.addToFreights || Expense.FreightBill !== '') && Expense.BillTo.ID === invoicesRef.current[foundIndex].Account.ID)   invoicesRef.current[foundIndex].LineItems[j]=makeExpenseLineItem(Expense);
                                        else{ 
                                            invoicesRef.current[foundIndex].Expenses.splice(i,1);
                                            invoicesRef.current[foundIndex].LineItems.splice(j,1);
                                        }  
                                  
                                    }
                                }
                           
                            }
                        }
                        if(!foundExpense){
                            if (Expense.bill && !Expense.billed && (!Expense.addToFreights || Expense.FreightBill != '')) {
                                console.log('pushing to invoice.exppenses = ' + invoicesRef.current[foundIndex].Expenses.length);
                                invoicesRef.current[foundIndex].Expenses.push(Expense);
                                invoicesRef.current[foundIndex].LineItems.push(makeExpenseLineItem(Expense ));
                            
                            }   
                        }
                    }
                });
           
              
                invoicesRef.current[foundIndex] =calcInvoiceTotal(invoicesRef.current[foundIndex]);
            
                invoicesRef.current[foundIndex].Balance = invoicesRef.current[foundIndex].Total;
                invoicesRef.current[foundIndex].Balance.Type = 'Amount Due';
                setInvoices([...invoicesRef.current]);
                if(invoiceRef.current.ID===invoicesRef.current[foundIndex].ID)setInvoice({...invoicesRef.current[foundIndex]})
            }));
       
            
            console.log('setting invoiceRef.current = ',invoicesRef.current)
            setInvoiceVisible(true);
        


    }
    const previewInvoiceByExpense = (Dispatch)=>{
        var InvoiceNumber = 111111;
        if (!company.TermsAndCond)company.TermsAndCond = '';
 
        if (company.CurrentInvoiceNumber) {
            InvoiceNumber = company.CurrentInvoiceNumber;
            company.CurrentInvoiceNumber++;
        }


            console.log('dispatch = ', Dispatch);
            var contactEmail = '';
            var contactName = 'No Contact';
            if (Dispatch.Contact) {
                if (Dispatch.Contact.Name !== '' && Dispatch.Contact.Name) contactName = Dispatch.Contact.Name;
                if (Dispatch.Contact.Email !== '' && Dispatch.Contact.Email) contactEmail = Dispatch.Contact.Email;
            }

           
            for (var q = 0; q < accounts.length; q++) {
                if (accounts[q].ID == Dispatch.Account.ID) {
                    var tempAccount = {...accounts[q]};
                    console.log('accounts[q] = ' , accounts[q])
                    tempAccount.custAddress2 = tempAccount.City + ', ' + tempAccount.State + ' ' + tempAccount.ZipCode;
                    var  realmID, accountTermsAndCond, qbCustomerID;
                    if (!tempAccount.Quickbooks) tempAccount.Quickbooks = [];
                    if (!tempAccount.InvoiceNotes) accountTermsAndCond = ''; else accountTermsAndCond = tempAccount.InvoiceNotes;
                    if (!tempAccount.QBCustomerID) qbCustomerID = ''; else qbCustomerID = tempAccount.QBCustomerID;
                    if (!Dispatch.Company.realmID) {
                        for(let p=0; p<tempAccount.Quickbooks.length; p++)if(tempAccount.Quickbooks[p].realmID===Dispatch.Company.realmID)qbCustomerID = tempAccount.Quickbooks[p].QBCustomerID;
                        if (!company.realmID) realmID = ''; else realmID = company.realmID;
                    } else realmID = Dispatch.Company.realmID;

                    var Account = {
                        ID: tempAccount.ID,
                        Name: tempAccount.Name,
                        Address: tempAccount.Address,
                        City: tempAccount.City,
                        State: tempAccount.State,
                        ZipCode: tempAccount.ZipCode,
                        Quickbooks: tempAccount.Quickbooks,
                        InvoiceNotes: tempAccount.InvoiceNotes,
                        custAddress2: tempAccount.custAddress2
                    };
                }
            }
            if(!company.ShowInvoiceMaterial)company.ShowInvoiceMaterial=false;
            console.log('account = ', Account)
            let tempInvoice = {
                ID: invoicesRef.current.length,
                Name: '',
                BillBy: 'DispatchID',
                VNum: 1,
                ShowMaterial:company.ShowInvoiceMaterial,
                JobID: Dispatch.Job.ID,
                ParentID: Dispatch.ID,
                DispID: Dispatch.ID,
                ParentName: Dispatch.Account.Name,
                ParentInvoice: '',
                Contact: {
                    Name: contactName,
                    Email: contactEmail
                },
                DispatchID: Dispatch.ID,
                ContactName: contactName,
                DispatchJobDate: Dispatch.JobDate,
                JobDate: Dispatch.JobDate,
                QueryDate:  formatDate(new Date(Dispatch.JobDate), '/', 'YYYY/MM/DD'),
                PONumber: Dispatch.PONumber,
                ContractNumber: Dispatch.ContractNumber,
                JobNumber: Dispatch.JobNumber,
                InvoiceNumber: InvoiceNumber,
                LoadSite: Dispatch.LoadSite,
                DumpSite:Dispatch.DumpSite,
                Account: Account,
                AccountID: Account.ID,
                Paid: false,
                isFromInvoice: false,
                Dispatch:{},
                Dispatches: [],
                FreightBills: [],
                InvoiceDate: formatDate(new Date(), '/', 'MM/DD/YYYY'),
                StartDate: Dispatch.JobDate,
                EndDate: Dispatch.JobDate,
                LineItems: [],
                Dates: [],
                Locations: [],
                realmID: realmID,
                showWeightTags: false,
                isExpenseInvoice: true,
                QBInvoiceID: '',
                createdAt: getCurrentTime(),
                createdBy:gearedUser.Email,
                InvoiceNotes: tempAccount.InvoiceNotes,
                TermsAndCond: company.TermsAndCond,
                Versions: [{ VNum: 1, URL: '' }],
                PDFLogo:'',
                sortByDisp:true,
                Totals: [],
                Payments: [],
                Expenses: [],
                FreightBills:[]
            };
       
            Dispatch.Job.unBilledFreights = 0;
            if (!Dispatch.Company) tempInvoice.Company = company; else tempInvoice.Company = Dispatch.Company;
            if (company.ID == Dispatch.MaterialCompany.ID && Dispatch.SellMaterial) tempInvoice.Company = Dispatch.MaterialCompany;



            tempInvoice.Dispatch={...Dispatch};
            tempInvoice.LoadSite = Dispatch.LoadSite;
            tempInvoice.DumpSite = Dispatch.DumpSite;
      
            invoicesRef.current.push({...tempInvoice})
    
            console.log('im pushign tempInvoice = ', tempInvoice)
            
         
            const expenseQueryName = `Organizations/${gearedUser.selectedOrgName}/Expenses`;
            const expenseQuery = query(collection(db, expenseQueryName), where("dispatchID", "==", Dispatch.ID));
            invoiceExpenseListenersRef.current.push(onSnapshot(expenseQuery, (querySnapshot) => {
                const foundIndex =  invoicesRef.current.findIndex(obj => obj.ID === tempInvoice.ID);
                querySnapshot.docChanges().forEach((change) => {
                    var source = change.doc.metadata.hasPendingWrites ? "Local" : "Server";
                    var Expense = change.doc.data();
                    Expense.ID = change.doc.id;
                  
                    if (Expense.BillTo.ID === invoicesRef.current[foundIndex].Account.ID) {
                        if (change.type === "added") {
                            console.log(', Expense adding to invoice = ' , Expense);
                            if (Expense.bill && !Expense.billed && (!Expense.addToFreights || Expense.FreightBill != '')) {
                                invoicesRef.current[foundIndex].Expenses.push(Expense);
                                invoicesRef.current[foundIndex].LineItems.push(makeExpenseLineItem(Expense ));
                            }
                        }                         
                        if (change.type === "removed") {
                            for (var i = 0; i < invoicesRef.current[foundIndex].Expenses.length; i++) {
                                if (Expense.ID == invoicesRef.current[foundIndex].Expenses[i].ID) {
                                    invoicesRef.current[foundIndex].Expenses.splice(i, 1);
                                    for (var j = 0; j < invoicesRef.current[foundIndex].LineItems.length; j++) {
                                        if (invoicesRef.current[foundIndex].LineItems[j].ID == Expense.ID) {
                                            invoicesRef.current[foundIndex].LineItems.splice(j, 1);
                                            j--
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if (change.type === "modified") {
                        var foundExpense =false;
                        console.log('found a modified epxense = ', Expense);
                        for (var i = 0; i < invoicesRef.current[foundIndex].Expenses.length; i++) {
                            if (Expense.ID === invoicesRef.current[foundIndex].Expenses[i].ID) {
                                foundExpense=true;
                                invoicesRef.current[foundIndex].Expenses[i] = Expense;
                                for (var j = 0; j < invoicesRef.current[foundIndex].LineItems.length; j++) {
                                    if (invoicesRef.current[foundIndex].LineItems[j].ID === Expense.ID) {
                                        console.log('we found the current expense in teh line item and the expnes = ', Expense)
                                        if (Expense.bill && !Expense.billed && (!Expense.addToFreights || Expense.FreightBill !== '') && Expense.BillTo.ID === invoicesRef.current[foundIndex].Account.ID)   invoicesRef.current[foundIndex].LineItems[j]=makeExpenseLineItem(Expense);
                                        else{ 
                                            invoicesRef.current[foundIndex].Expenses.splice(i,1);
                                            invoicesRef.current[foundIndex].LineItems.splice(j,1);
                                        }  
                                  
                                    }
                                }
                           
                            }
                        }
                        if(!foundExpense){
                            if (Expense.bill && !Expense.billed && (!Expense.addToFreights || Expense.FreightBill != '')) {
                                console.log('pushing to invoice.exppenses = ' + invoicesRef.current[foundIndex].Expenses.length);
                                invoicesRef.current[foundIndex].Expenses.push(Expense);
                                invoicesRef.current[foundIndex].LineItems.push(makeExpenseLineItem(Expense ));
                            
                            }   
                        }
                    }
                });
           
              
                invoicesRef.current[foundIndex] =calcInvoiceTotal(invoicesRef.current[foundIndex]);
            
                invoicesRef.current[foundIndex].Balance = invoicesRef.current[foundIndex].Total;
                invoicesRef.current[foundIndex].Balance.Type = 'Amount Due';
                setInvoices([...invoicesRef.current]);
                if(invoiceRef.current.ID===invoicesRef.current[foundIndex].ID)setInvoice({...invoicesRef.current[foundIndex]})
            }));
       
            
            console.log('setting invoiceRef.current = ',invoicesRef.current)
            setInvoiceVisible(true);
        


    }
    const dateBodyTemplate = (rowData) => {
        return formatDate(rowData.realJobDate, '/', 'MM/DD/YYYY');
    };
    const handleSelectedChange = (disp, value)=>{
        let tempDispatches =[...sortedDispatches]
        for(let i=0; i<tempDispatches.length; i++)if(tempDispatches[i].index===disp.index) tempDispatches[i].Selected=value;
        setSortedDispatches([...tempDispatches])
    }
    const booleanBodyTemplate = (rowData, field) => {
        return (
            <Checkbox  onChange={(e) => handleSelectedChange(rowData, e.checked)}  checked={rowData[field]}  />
        );
    };

    const dateFilterTemplate = (options) => {
        return <Calendar value={options.value} onChange={(e) =>  options.filterCallback(e.value, options.index)} dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" mask="99/99/9999" />;
    };
  

      const renderHeader = () => (
        <div className="flex justify-content-end">
         
         <Button  color="primary"  onClick={(event) =>previewInvoices(event)} style={{margin:"0", paddingLeft:"1em !important", paddingBottom: ".2em", paddingTop: ".2em", height:"100%"}}>Preview Invoices</Button>

               
        </div>
    );

      const header = renderHeader();
    return (
        <div className="card">
            <DataTable value={sortedDispatches} paginator rows={25} dataKey="index" filters={filters} header={header} filterDisplay="row" emptyMessage="No dispatches found.">
                <Column field="Selected" header="Selected" dataType="boolean" style={{ minWidth: '6rem' }} body={(rowData) => booleanBodyTemplate(rowData, 'Selected')}  />
                <Column field="realJobDate" header="Job Date" dataType="date" sortable body={dateBodyTemplate}   filterPlaceholder="Search by Date" />
                <Column header="Account" filter filterField="Account?.Name" filterPlaceholder="Search by Account"  body={(rowData) => rowData.Account?.Name || 'N/A'}/>
              
                <Column field="JobNumber" header="Job Number" filter filterPlaceholder="Search by job number" />
                <Column header="Load Site" filter filterField="LoadSite?.Name" filterPlaceholder="Search by Load Site"  body={(rowData) => rowData.LoadSite?.Name || 'N/A'}/>
                <Column header="Dump Site" filter filterField="DumpSite?.Name" filterPlaceholder="Search by Dump Site"  body={(rowData) => rowData.DumpSite?.Name || 'N/A'}/>

            
                <Column field="unBilledFreights" header="unBilled Items" filter filterPlaceholder="Search by unbilled"  />
            </DataTable>
        </div>
    );
    };
    
    export default InvoiceCreate;