import React, { useEffect, useState, useRef } from 'react';

import { UserAuth } from '../../context/AuthContext';

import { usePayStatement } from './PayStatementContext';

import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { DataTable } from 'primereact/datatable';
import { Checkbox } from 'primereact/checkbox';
import { Column } from 'primereact/column';
import { Calendar} from 'primereact/calendar';
import  { Button} from '@mobiscroll/react';

import { db } from '../../firebase';
import { doc,  query, collection, addDoc, setDoc, onSnapshot, where } from 'firebase/firestore';


const  PayStatementCreate =(props)=> {

    const { gearedUser, company, accounts, formatDate } = UserAuth();
    const {payStatementRef, payStatementsRef,setPayStatement,setPayStatements,setPayStatementVisible} = usePayStatement();
    const [sortedDispatches, setSortedDispatches]= useState([]);
    const payStatementExpenseListenersRef = useRef([]);
    const payStatementFreightListenersRef = useRef([]);
  
    


    const [filters, setFilters] = useState({
        realJobDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },

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

    const previewPayStatements = () =>{
        let tempPayStatements=[];
        payStatementsRef.current =[];
    
        if(payStatementFreightListenersRef.current.length>0)for(var u=0;u<payStatementFreightListenersRef.current.length; u++)payStatementFreightListenersRef.current[u]();
        if(payStatementExpenseListenersRef.current.length>0)for(var u=0;u<payStatementExpenseListenersRef.current.length; u++)payStatementExpenseListenersRef.current[u]();
        payStatementFreightListenersRef.current =[];
        payStatementExpenseListenersRef.current = [];
        for(let i=0; i<sortedDispatches.length; i++){
            if(sortedDispatches[i].Selected){
                if(sortedDispatches[i].isExpenseDispatch)previewPayStatementByExpense({...sortedDispatches[i]});
                else previewPayStatementByDispatch({...sortedDispatches[i]});
            }
        }
        console.log('so this is when we first set the payStatement ',payStatementsRef.current[0])
        payStatementRef.current=payStatementsRef.current[0];
    }

    const previewPayStatementByDispatch = (Dispatch)=>{
        var PayStatementNumber = 111111;
        if (!company.TermsAndCond)company.TermsAndCond = '';
 
        if (company.CurrentPayStatementNumber) {
            PayStatementNumber = company.CurrentPayStatementNumber;
            company.CurrentPayStatementNumber++;
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
                    if (!tempAccount.PayStatementNotes) accountTermsAndCond = ''; else accountTermsAndCond = tempAccount.PayStatementNotes;
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
                        PayStatementNotes: tempAccount.PayStatementNotes,
                        custAddress2: tempAccount.custAddress2
                    };
                }
            }
            if(!company.ShowPayStatementMaterial)company.ShowPayStatementMaterial=false;
            console.log('account = ', Account)
            let tempPayStatement = {
                ID: payStatementsRef.current.length,
                Name: '',
                BillBy: 'DispatchID',
                VNum: 1,
                ShowMaterial:company.ShowPayStatementMaterial,
                JobID: Dispatch.Job.ID,
                ParentID: Dispatch.ID,
                DispID: Dispatch.ID,
                ParentName: Dispatch.Account.Name,
                ParentPayStatement: '',
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
                PayStatementNumber: PayStatementNumber,
                LoadSite: Dispatch.LoadSite,
                DumpSite:Dispatch.DumpSite,
                Account: Account,
                AccountID: Account.ID,
                Paid: false,
                isFromPayStatement: false,
                Dispatch:{},
                Dispatches: [],
                FreightBills: [],
                PayStatementDate: formatDate(new Date(), '/', 'MM/DD/YYYY'),
                StartDate: Dispatch.JobDate,
                EndDate: Dispatch.JobDate,
                LineItems: [],
                Dates: [],
                Locations: [],
                realmID: realmID,
                showWeightTags: false,
                isExpensePayStatement: false,
                QBPayStatementID: '',
                createdAt: getCurrentTime(),
                createdBy:gearedUser.Email,
                PayStatementNotes: tempAccount.PayStatementNotes,
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
            if (!Dispatch.Company) tempPayStatement.Company = company; else tempPayStatement.Company = Dispatch.Company;
            if (company.ID == Dispatch.MaterialCompany.ID && Dispatch.SellMaterial) tempPayStatement.Company = Dispatch.MaterialCompany;



            tempPayStatement.Dispatch={...Dispatch};
            tempPayStatement.LoadSite = Dispatch.LoadSite;
            tempPayStatement.DumpSite = Dispatch.DumpSite;
            console.log(' tempPayStatement.DumpSite= ',  tempPayStatement.DumpSite);
            payStatementsRef.current.push({...tempPayStatement})
            const queryName = `Organizations/${gearedUser.selectedOrgName}/FreightBills`;
            const freightQuery = query(collection(db, queryName), where("dispatchID", "==", Dispatch.ID));
            
            
            payStatementFreightListenersRef.current.push(onSnapshot(freightQuery, (querySnapshot) => {
                const foundIndex =  payStatementsRef.current.findIndex(obj => obj.ID === tempPayStatement.ID);
                console.log('inside teh feright listener and the foundIndex = ' + foundIndex)
                querySnapshot.docChanges().forEach((change) => {
                    var source = change.doc.metadata.hasPendingWrites ? "Local" : "Server";
                 
                    var tempFreight = change.doc.data();
                    tempFreight.ID = change.doc.id;
                    if(tempFreight.PayStatement===''){
                     
                        if (change.type === "added") {
                            payStatementsRef.current[foundIndex].FreightBills.push(tempFreight);
                          //  makeFreightBillLineItem(tempFreight, payStatementsRef.current[foundIndex].LineItems, payStatementsRef.current[foundIndex]);
                            if (tempFreight.missing === true) tempFreight.onHold = true;
                        }
                        if (change.type === "modified") {
                            for (var i = 0; i < payStatementsRef.current[foundIndex].FreightBills.length; i++) {
                                if (tempFreight.ID == payStatementsRef.current[foundIndex].FreightBills[i].ID) {
                                    console.log('found this tempFreight = ', tempFreight)
                                    payStatementsRef.current[foundIndex].FreightBills[i] = tempFreight;
                                
                                    for (var j = 0; j < payStatementsRef.current[foundIndex].LineItems.length; j++) {
                                        if (payStatementsRef.current[foundIndex].LineItems[j].FreightID == tempFreight.ID && payStatementsRef.current[foundIndex].LineItems[j].Type!=='Expense') {
                                            payStatementsRef.current[foundIndex].LineItems.splice(j, 1);
                                            j--
                                        }
                                    }
                         
                                  //  makeFreightBillLineItem(tempFreight, payStatementsRef.current[foundIndex].LineItems, payStatementsRef.current[foundIndex]);
                                 
                                }
                            }
                        }
                    }


                });
        
                //payStatementsRef.current[foundIndex] = calcPayStatementTotal(payStatementsRef.current[foundIndex]);
                payStatementsRef.current[foundIndex].Balance = payStatementsRef.current[foundIndex].Total;
                payStatementsRef.current[foundIndex].Balance.Type = 'Amount Due';
       
                setPayStatements([...payStatementsRef.current]);
                if(payStatementRef.current.ID===payStatementsRef.current[foundIndex].ID)setPayStatement({...payStatementsRef.current[foundIndex]})

            }));
            const expenseQueryName = `Organizations/${gearedUser.selectedOrgName}/Expenses`;
            const expenseQuery = query(collection(db, expenseQueryName), where("dispatchID", "==", Dispatch.ID));
            payStatementExpenseListenersRef.current.push(onSnapshot(expenseQuery, (querySnapshot) => {
                const foundIndex =  payStatementsRef.current.findIndex(obj => obj.ID === tempPayStatement.ID);
                querySnapshot.docChanges().forEach((change) => {
                    var source = change.doc.metadata.hasPendingWrites ? "Local" : "Server";
                    var Expense = change.doc.data();
                    Expense.ID = change.doc.id;
                  
                    if (Expense.BillTo.ID === payStatementsRef.current[foundIndex].Account.ID) {
                        if (change.type === "added") {
                            console.log(', Expense adding to payStatement = ' , Expense);
                            if (Expense.bill && !Expense.billed && (!Expense.addToFreights || Expense.FreightBill != '')) {
                                payStatementsRef.current[foundIndex].Expenses.push(Expense);
                                //payStatementsRef.current[foundIndex].LineItems.push(makeExpenseLineItem(Expense ));
                            }
                        }                         
                        if (change.type === "removed") {
                            for (var i = 0; i < payStatementsRef.current[foundIndex].Expenses.length; i++) {
                                if (Expense.ID == payStatementsRef.current[foundIndex].Expenses[i].ID) {
                                    payStatementsRef.current[foundIndex].Expenses.splice(i, 1);
                                    for (var j = 0; j < payStatementsRef.current[foundIndex].LineItems.length; j++) {
                                        if (payStatementsRef.current[foundIndex].LineItems[j].ID == Expense.ID) {
                                            payStatementsRef.current[foundIndex].LineItems.splice(j, 1);
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
                        for (var i = 0; i < payStatementsRef.current[foundIndex].Expenses.length; i++) {
                            if (Expense.ID === payStatementsRef.current[foundIndex].Expenses[i].ID) {
                                foundExpense=true;
                                payStatementsRef.current[foundIndex].Expenses[i] = Expense;
                                for (var j = 0; j < payStatementsRef.current[foundIndex].LineItems.length; j++) {
                                    if (payStatementsRef.current[foundIndex].LineItems[j].ID === Expense.ID) {
                                        console.log('we found the current expense in teh line item and the expnes = ', Expense)
                                       /* if (Expense.bill && !Expense.billed && (!Expense.addToFreights || Expense.FreightBill !== '') && Expense.BillTo.ID === payStatementsRef.current[foundIndex].Account.ID)   payStatementsRef.current[foundIndex].LineItems[j]=makeExpenseLineItem(Expense);
                                        else{ 
                                            payStatementsRef.current[foundIndex].Expenses.splice(i,1);
                                            payStatementsRef.current[foundIndex].LineItems.splice(j,1);
                                        }  */
                                  
                                    }
                                }
                           
                            }
                        }
                        if(!foundExpense){
                            if (Expense.bill && !Expense.billed && (!Expense.addToFreights || Expense.FreightBill != '')) {
                                console.log('pushing to payStatement.exppenses = ' + payStatementsRef.current[foundIndex].Expenses.length);
                                payStatementsRef.current[foundIndex].Expenses.push(Expense);
                               // payStatementsRef.current[foundIndex].LineItems.push(makeExpenseLineItem(Expense ));
                            
                            }   
                        }
                    }
                });
           
              
              //  payStatementsRef.current[foundIndex] =calcPayStatementTotal(payStatementsRef.current[foundIndex]);
            
                payStatementsRef.current[foundIndex].Balance = payStatementsRef.current[foundIndex].Total;
                payStatementsRef.current[foundIndex].Balance.Type = 'Amount Due';
                setPayStatements([...payStatementsRef.current]);
                if(payStatementRef.current.ID===payStatementsRef.current[foundIndex].ID)setPayStatement({...payStatementsRef.current[foundIndex]})
            }));
       
            
            console.log('setting payStatementRef.current = ',payStatementsRef.current)
            setPayStatementVisible(true);
        


    }
    const previewPayStatementByExpense = (Dispatch)=>{
        var PayStatementNumber = 111111;
        if (!company.TermsAndCond)company.TermsAndCond = '';
 
        if (company.CurrentPayStatementNumber) {
            PayStatementNumber = company.CurrentPayStatementNumber;
            company.CurrentPayStatementNumber++;
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
                    if (!tempAccount.PayStatementNotes) accountTermsAndCond = ''; else accountTermsAndCond = tempAccount.PayStatementNotes;
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
                        PayStatementNotes: tempAccount.PayStatementNotes,
                        custAddress2: tempAccount.custAddress2
                    };
                }
            }
            if(!company.ShowPayStatementMaterial)company.ShowPayStatementMaterial=false;
            console.log('account = ', Account)
            let tempPayStatement = {
                ID: payStatementsRef.current.length,
                Name: '',
                BillBy: 'DispatchID',
                VNum: 1,
                ShowMaterial:company.ShowPayStatementMaterial,
                JobID: Dispatch.Job.ID,
                ParentID: Dispatch.ID,
                DispID: Dispatch.ID,
                ParentName: Dispatch.Account.Name,
                ParentPayStatement: '',
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
                PayStatementNumber: PayStatementNumber,
                LoadSite: Dispatch.LoadSite,
                DumpSite:Dispatch.DumpSite,
                Account: Account,
                AccountID: Account.ID,
                Paid: false,
                isFromPayStatement: false,
                Dispatch:{},
                Dispatches: [],
                FreightBills: [],
                PayStatementDate: formatDate(new Date(), '/', 'MM/DD/YYYY'),
                StartDate: Dispatch.JobDate,
                EndDate: Dispatch.JobDate,
                LineItems: [],
                Dates: [],
                Locations: [],
                realmID: realmID,
                showWeightTags: false,
                isExpensePayStatement: true,
                QBPayStatementID: '',
                createdAt: getCurrentTime(),
                createdBy:gearedUser.Email,
                PayStatementNotes: tempAccount.PayStatementNotes,
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
            if (!Dispatch.Company) tempPayStatement.Company = company; else tempPayStatement.Company = Dispatch.Company;
            if (company.ID == Dispatch.MaterialCompany.ID && Dispatch.SellMaterial) tempPayStatement.Company = Dispatch.MaterialCompany;



            tempPayStatement.Dispatch={...Dispatch};
            tempPayStatement.LoadSite = Dispatch.LoadSite;
            tempPayStatement.DumpSite = Dispatch.DumpSite;
      
            payStatementsRef.current.push({...tempPayStatement})
    
            console.log('im pushign tempPayStatement = ', tempPayStatement)
            
         
            const expenseQueryName = `Organizations/${gearedUser.selectedOrgName}/Expenses`;
            const expenseQuery = query(collection(db, expenseQueryName), where("dispatchID", "==", Dispatch.ID));
            payStatementExpenseListenersRef.current.push(onSnapshot(expenseQuery, (querySnapshot) => {
                const foundIndex =  payStatementsRef.current.findIndex(obj => obj.ID === tempPayStatement.ID);
                querySnapshot.docChanges().forEach((change) => {
                    var source = change.doc.metadata.hasPendingWrites ? "Local" : "Server";
                    var Expense = change.doc.data();
                    Expense.ID = change.doc.id;
                  
                    if (Expense.BillTo.ID === payStatementsRef.current[foundIndex].Account.ID) {
                        if (change.type === "added") {
                            console.log(', Expense adding to payStatement = ' , Expense);
                            if (Expense.bill && !Expense.billed && (!Expense.addToFreights || Expense.FreightBill != '')) {
                                payStatementsRef.current[foundIndex].Expenses.push(Expense);
                               // payStatementsRef.current[foundIndex].LineItems.push(makeExpenseLineItem(Expense ));
                            }
                        }                         
                        if (change.type === "removed") {
                            for (var i = 0; i < payStatementsRef.current[foundIndex].Expenses.length; i++) {
                                if (Expense.ID == payStatementsRef.current[foundIndex].Expenses[i].ID) {
                                    payStatementsRef.current[foundIndex].Expenses.splice(i, 1);
                                    for (var j = 0; j < payStatementsRef.current[foundIndex].LineItems.length; j++) {
                                        if (payStatementsRef.current[foundIndex].LineItems[j].ID == Expense.ID) {
                                            payStatementsRef.current[foundIndex].LineItems.splice(j, 1);
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
                        for (var i = 0; i < payStatementsRef.current[foundIndex].Expenses.length; i++) {
                            if (Expense.ID === payStatementsRef.current[foundIndex].Expenses[i].ID) {
                                foundExpense=true;
                                payStatementsRef.current[foundIndex].Expenses[i] = Expense;
                                for (var j = 0; j < payStatementsRef.current[foundIndex].LineItems.length; j++) {
                                    if (payStatementsRef.current[foundIndex].LineItems[j].ID === Expense.ID) {
                                        console.log('we found the current expense in teh line item and the expnes = ', Expense)
                                      /*  if (Expense.bill && !Expense.billed && (!Expense.addToFreights || Expense.FreightBill !== '') && Expense.BillTo.ID === payStatementsRef.current[foundIndex].Account.ID)   payStatementsRef.current[foundIndex].LineItems[j]=makeExpenseLineItem(Expense);
                                        else{ 
                                            payStatementsRef.current[foundIndex].Expenses.splice(i,1);
                                            payStatementsRef.current[foundIndex].LineItems.splice(j,1);
                                        }  */
                                  
                                    }
                                }
                           
                            }
                        }
                        if(!foundExpense){
                            if (Expense.bill && !Expense.billed && (!Expense.addToFreights || Expense.FreightBill != '')) {
                                console.log('pushing to payStatement.exppenses = ' + payStatementsRef.current[foundIndex].Expenses.length);
                                payStatementsRef.current[foundIndex].Expenses.push(Expense);
                              //  payStatementsRef.current[foundIndex].LineItems.push(makeExpenseLineItem(Expense ));
                            
                            }   
                        }
                    }
                });
           
              
               // payStatementsRef.current[foundIndex] =calcPayStatementTotal(payStatementsRef.current[foundIndex]);
            
                payStatementsRef.current[foundIndex].Balance = payStatementsRef.current[foundIndex].Total;
                payStatementsRef.current[foundIndex].Balance.Type = 'Amount Due';
                setPayStatements([...payStatementsRef.current]);
                if(payStatementRef.current.ID===payStatementsRef.current[foundIndex].ID)setPayStatement({...payStatementsRef.current[foundIndex]})
            }));
       
            
            console.log('setting payStatementRef.current = ',payStatementsRef.current)
            setPayStatementVisible(true);
        


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
         
         <Button  color="primary"  onClick={(event) =>previewPayStatements(event)} style={{margin:"0", paddingLeft:"1em !important", paddingBottom: ".2em", paddingTop: ".2em", height:"100%"}}>Preview PayStatements</Button>

               
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
    
    export default PayStatementCreate;