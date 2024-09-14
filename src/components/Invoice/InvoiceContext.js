
import React, {useState,useContext,useRef, createContext,useCallback} from 'react'

import { db } from '../../firebase';
import { doc,  query,getDoc, collection, addDoc, setDoc, onSnapshot, where } from 'firebase/firestore';


import { UserAuth } from '../../context/AuthContext';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

const InvoiceContext = createContext();
export const InvoiceContextProvider = ({ children }) => {
    const { gearedUser, addDocument, updateDocument } = UserAuth();
    const [invoice, setInvoice] = useState({});
    const [invoices, setInvoices] = useState([]);
    const [invoiceVisible, setInvoiceVisible] = useState(false);
    const [showPrintTags, setShowPrintTags]= useState(false);
    const [showPrintFBImages, setShowPrintFBImages]= useState(false);
    const [printVisible, setPrintVisible]= useState(false);
    const [printFBs, setPrintFBs]= useState(false);
    const [printFBImages, setPrintFBImages]= useState(false);
    const [printTags, setPrintTags]= useState(false);
    const [printAllInvoices, setPrintAllInvoices]= useState(false);
    const unsubscribeExpensesRef = useRef(null); // Store the unsubscribe function
    const unsubscribeDispatchesRef = useRef(null); // Store the unsubscribe function
    const [createDispatches, setCreateDispatches] = useState([]);
    const [createExpenses, setCreateExpenses] = useState([]);
    const invoiceRef = useRef({});
    const invoicesRef = useRef([]);
    pdfFonts['Roboto-Medium'] = {
        normal: 'Roboto-Medium.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Medium.ttf',
        bolditalics: 'Roboto-Medium.ttf',
    };
    pdfMake.vfs = pdfFonts.pdfMake.vfs;
  
    const updateFreightBill =(FreightBill)=>{
        let updateDoc ={  
            "timestamp": Date.now(),
            billed:FreightBill.billed,
            calcByLoad: FreightBill.calcByLoad,
            truckingBilled:FreightBill.truckingBilled,
            missing:FreightBill.missing,
            onHold:FreightBill.onHold,
            Adjusting:FreightBill.Adjusting,
            standByIsBilled:FreightBill.standByIsBilled,
            StandByInvoiceVNum:FreightBill.StandByInvoiceVNum,
            StandByInvoice:FreightBill.StandByInvoice,
            Invoice: FreightBill.Invoice
      
         };
         console.log('updateDoc for FB = ', updateDoc)
       //  updateDocument(FreightBill, FreightBill.ID, 'FreightBills');
    }
    const checkFreightBill=(Invoice, Dispatch,FreightBill)=>{
        console.log('checkign FB = ', FreightBill)
        if (!FreightBill.onHold) {
            FreightBill.truckingBilled = true;
            FreightBill.missing = false;
            FreightBill.Adjusting = false;
            var ExpenseBilled = true;
           // var MaterialBilled = true;
            var standByBilled = true;

        /*    if (FreightBill.SellMaterial && !FreightBill.materialBilled) {
                if (FreightBill.MaterialCompany.ID === FreightBill.Company.ID) {
                    if (!FreightBill.materialOnHold) {
                        FreightBill.MaterialInvoiceVNum = Invoice.VNum;
                        FreightBill.MaterialInvoice = Invoice.ID;
                    } else MaterialBilled = false;
                }
            }*/
            if (!FreightBill.standByOnHold) {
                FreightBill.standByIsBilled = true;
                FreightBill.StandByInvoiceVNum = Invoice.VNum;
                FreightBill.StandByInvoice = Invoice.ID;
            }
            else {
                Dispatch.unBilledItems++;
                standByBilled = false;
                FreightBill.standByIsBilled = false;
                FreightBill.StandByInvoiceVNum = '';
                FreightBill.StandByInvoice = '';
            }
            if (FreightBill.truckingBilled && ExpenseBilled && standByBilled) FreightBill.billed = true;
            
            FreightBill.InvoiceVNum = Invoice.VNum;
            FreightBill.Invoice = Invoice.ID;
            Invoice.FreightBillSelected++;
            updateFreightBill( FreightBill);
        }else {
            Dispatch.unBilledItems++;
            if(FreightBill.hasStandBy) Dispatch.unBilledItems++;
            FreightBill.truckingBilled = false;
            FreightBill.standByIsBilled = false;
            FreightBill.StandByInvoiceVNum = '';
            FreightBill.StandByInvoice = '';
            FreightBill.billed = false;
            FreightBill.InvoiceVNum = 0;
            FreightBill.Invoice = '';
            FreightBill.InvoiceName = '';
            Invoice.FreightBillSelected++;
            updateFreightBill( FreightBill);
        }
    }
 
    const updateExpense =(Expense)=>{
        let updateDoc ={  
            "timestamp": Date.now(),
            billed:Expense.billed,
            onHold:Expense.onHold,
            Invoice: Expense.Invoice
         };
         console.log('updateDoc for expense = ', updateDoc)
       //  updateDocument(FreightBill, FreightBill.ID, 'FreightBills');
    }
    const checkExpense =  (Invoice, Dispatch, Expense)=> {
  
        if (!Expense.onHold) {
            Expense.Invoice = Invoice.ID;
            Expense.billed = true;
        } else{
            Expense.billed = false;
            Dispatch.unBilledItems++;
        } 
        updateExpense(Invoice, Expense);
    }

    const updateChidObjects = (Invoice, Dispatch, FreightBills, Expenses)=>{
        
        Dispatch.unBilledItems=0;
        for (var f = 0; f < FreightBills.length; f++) checkFreightBill(Invoice, Dispatch, {...FreightBills[f]})
        for (var e = 0; e < Expenses.length; e++)   checkExpense(Invoice, Dispatch, {...Expenses[e]});
        if(Dispatch.unBilledItems<=0)Dispatch.Billable=false;

        console.log('Dispatch.unBill edItems = '+Dispatch.unBilledItems)
        
    }

    const createInvoice = async(Invoice)=>{
        let tempDispatch = {...Invoice.Dispatch};
        Invoice.Dispatch={};
        let tempFreightBills = [...Invoice.FreightBills];
        Invoice.FreightBills={};
        let tempExpenses = [...Invoice.Expenses];
        Invoice.Expenses={};
        console.log('now we are creating invoice and tempDispatch =- ', tempDispatch);
        console.log(' and the fireght bills = ', tempFreightBills);
        console.log('invoice we trying to add = ', Invoice)
        try {
        
            let newInvoiceID = 'poop'
            //await   addDocument(Invoice, 'Invoices');
            Invoice.ID=newInvoiceID;
            updateChidObjects(Invoice, tempDispatch, tempFreightBills, tempExpenses)
        } catch (e){ console.error("Error adding document: ", e);}
   
    }
    const checkInvoices = ()=>{
        for( var i; i<invoicesRef.current.length; i++)checkInvoice(invoicesRef.current[i]);
    }
    const checkInvoice =(Invoice)=>{
        let InvoiceWarning=false;
        for (var j = 0; j < Invoice.LineItems.length; j++) {
            if (Invoice.LineItems[j].Amount === 0 && !Invoice.LineItems[j].onHold) InvoiceWarning = true;
            if (Invoice.LineItems[j].missing && !Invoice.LineItems[j].onHold) InvoiceWarning = true;
        }
        if (InvoiceWarning){ 
            if (window.confirm('Warning: You are about to create an Invoice with a line item that is missing or has a total 0, are you sure you want to continue?')) {
                createInvoice(Invoice);
            }  
       
        }else createInvoice(Invoice);
        
    }
    const queryDispatches = () => {
        return new Promise((resolve, reject) => {
            let dispatches = [];
            if (unsubscribeDispatchesRef.current) unsubscribeDispatchesRef.current();
    
            const queryName = `Organizations/${gearedUser.selectedOrgName}/Dispatches`;
            const q = query(
                collection(db, queryName),
                where("Billable", "==", true),
                where("QueryDate", ">=", "2023/12/31")
            );
    
            unsubscribeDispatchesRef.current = onSnapshot(q, (querySnapshot) => {
                console.log('DISPATCH HOME SNAPSHOT FIRING');
                querySnapshot.docChanges().forEach((change) => {
                    const tempDispatch = change.doc.data();
                    tempDispatch.FreightBills = [];
                    tempDispatch.ID = change.doc.id;
                    tempDispatch.realJobDate = new Date(tempDispatch.JobDate);
    
                    if (change.type === "added") {
                        dispatches.push(tempDispatch);
                    }
                    if (change.type === "modified") {
                        const dispatchIndex = dispatches.findIndex((d) => d.ID === tempDispatch.ID);
                        dispatches[dispatchIndex] = tempDispatch;
                    }
                });
    
                console.log('setting full home Dispatches = ', dispatches);
                resolve(dispatches);  // Return the fetched dispatches
            }, reject); // Handle errors by rejecting the promise
        });
    };
    
    const queryExpenses = () => {
        return new Promise((resolve, reject) => {
            let expenses = [];
            if (unsubscribeExpensesRef.current) unsubscribeExpensesRef.current();
    
            const queryName = `Organizations/${gearedUser.selectedOrgName}/Expenses`;
            const q = query(
                collection(db, queryName),
                where("billed", "==", false),
                where("floatingBillExpense", "==", true)
            );
    
            unsubscribeExpensesRef.current = onSnapshot(q, (querySnapshot) => {
                console.log('EXPENSE HOME SNAPSHOT FIRING');
                querySnapshot.docChanges().forEach((change) => {
                    const tempExpense = change.doc.data();
                    tempExpense.ID = change.doc.id;
                    tempExpense.realJobDate = new Date(tempExpense.JobDate);
    
                    if (change.type === "added") {
                        expenses.push(tempExpense);
                    }
                    if (change.type === "modified") {
                        const expenseIndex = expenses.findIndex((e) => e.ID === tempExpense.ID);
                        expenses[expenseIndex] = tempExpense;
                    }
                });
    
                console.log('setting full home Expenses = ', expenses);
                // Assuming there's a state setter or other handler for expenses
                resolve(expenses);  // Return the fetched expenses
            }, reject); // Handle errors by rejecting the promise
        });
    };
    const createExpenseDispatches =(Dispatches, Expenses)=>{
        var ExpenseDispatches = [];
     
        for(var v=0; v<Dispatches.length; v++){
            let dispatch = {...Dispatches[v]};
            var ExpenseDispatch = {
                ID: dispatch.ID,
                Job:dispatch.Job,
                Account:dispatch.Account,
                isExpenseDispatch: true,
                unBilledItems: 0,
                FreightBills: [],
                realJobDate: new Date(dispatch.JobDate),
                PONumber: dispatch.PONumber,
                ContractNumber: dispatch.ContractNumber,
                Expenses: [],
                JobNumber: dispatch.JobNumber,
                JobDate: dispatch.JobDate,
                Company: dispatch.Company,
                MaterialCompany: dispatch.MaterialCompany,
                SellMaterial:dispatch.SellMaterial,
                LoadSite: dispatch.LoadSite,
                DumpSite: dispatch.DumpSite
            };
        
  
            for (var j = 0; j < Expenses.length; j++) {
                if (Expenses[j].dispatchID === dispatch.ID && (!Expenses[j].addToFreights || Expenses[j].FreightBill !== '')) {
                    var foundAccount = false;
                    if (dispatch.AccountID == Expenses[j].BillTo.ID) {
                        foundAccount = true;
                        dispatch.unBilledItems++;
            
                        dispatch.Expenses.push({...Expenses[j]});
                    
                    }
                    for (var k = 0; k < ExpenseDispatches.length; k++) {
                        if (ExpenseDispatches[k].Account.ID === Expenses[j].BillTo.ID) {
                            foundAccount = true;
                            ExpenseDispatches[k].unBilledItems++;
                            ExpenseDispatches[k].Expenses.push({...Expenses[j]});
                        }
                    }
                    if (!foundAccount) {
                        ExpenseDispatch.Expenses = [];
                        ExpenseDispatch.AccountName = Expenses[j].BillTo.Name;
                        ExpenseDispatch.Account = Expenses[j].BillTo;
                        ExpenseDispatch.unBilledItems = 1;

                        console.log('making new expensedispath for  expesne= ', Expenses[j]);
                        ExpenseDispatch.Expenses.push({...Expenses[j]});
                        ExpenseDispatches.push({...ExpenseDispatch});
                    }
                }
            }
        }
        Dispatches.push(...ExpenseDispatches)
        console.log('setting create dipsahtces to ', Dispatches)
        setCreateDispatches(Dispatches);
    }

    const calcInvoiceTotal = (Invoice) => {
        if (Invoice) {
          // Initialize the Totals array
          Invoice.Totals = [];
            console.log('CALICING TOTAL BOIS!')
          // Helper function to sum values based on a filter
          const sumValues = (items, field, filter = () => true, log = false) => 
            items
                .filter(item => !item.onHold && filter(item)) // Exclude items with onHold = true
                .reduce((sum, item) => {
                    const value = Number(item[field] || 0);
                    const newTotal = sum + value;
        
                    // Round the new total to two decimal places
                    const roundedTotal = Math.round((newTotal + Number.EPSILON) * 100) / 100;
        
                    if (log) {
                        console.log(`Adding ${value} to current total of ${sum} for ${field}, new total: ${roundedTotal}`);
                    }
        
                    return roundedTotal;
                }, 0);
          // Calculate Totals for 'Tons'
          Invoice.Tons = {
            Type: 'Tons',
            Qty: sumValues(Invoice.LineItems, 'Qty', item => item.RateType === 'Ton'),
            Total: sumValues(Invoice.LineItems, 'Total', item => item.RateType === 'Ton', undefined, true)
          };
          Invoice.Tons.QtyString = '$' + Invoice.Tons.Qty.toFixed(2);
          Invoice.Totals.push(Invoice.Tons);
      
          // Calculate Totals for 'Loads'
          Invoice.Loads = {
            Type: 'Loads',
            Qty: sumValues(Invoice.LineItems, 'Qty', item => item.RateType === 'Load'),
            Total: sumValues(Invoice.LineItems, 'Total', item => item.RateType === 'Load')
          };
          Invoice.Loads.QtyString = '$' + Invoice.Loads.Qty.toFixed(2);
          Invoice.Totals.push(Invoice.Loads);
      
          // Calculate Totals for 'Hours'
          Invoice.Hours = {
            Type: 'Hours',
            Qty: sumValues(Invoice.LineItems, 'Qty', item => item.RateType === 'Hour'),
            Total: sumValues(Invoice.LineItems, 'Total', item => item.RateType === 'Hour')
          };
          Invoice.Hours.QtyString = '$' + Invoice.Hours.Qty.toFixed(2);
          Invoice.Totals.push(Invoice.Hours);
      
          // Calculate Totals for 'Broker' yea b23
          Invoice.Broker = {
            Type: 'Broker',
            Qty: Invoice.BrokerPercent || 'N/A',
            Total: sumValues(Invoice.LineItems, 'BrokerTotal') // Enable logging for BrokerTotal
        };
          Invoice.Totals.push(Invoice.Broker);
      
          // Calculate Totals for 'Fuel'
          Invoice.Fuel = {
            Type: 'Fuel',
            Qty: Invoice.FuelPercent || 'N/A',
            Total: sumValues(Invoice.LineItems, 'FuelCharge')
          };
          Invoice.Totals.push(Invoice.Fuel);
      
          // Calculate Totals for 'Stand By'
          Invoice.StandBy = {
            Type: 'Stand By',
            loadTotal: sumValues(Invoice.LineItems, 'loadTotal'),
            dumpTotal: sumValues(Invoice.LineItems, 'dumpTotal'),
            loadQty: sumValues(Invoice.LineItems, 'loadQty'),
            dumpQty: sumValues(Invoice.LineItems, 'dumpQty'),
            Qty: sumValues(Invoice.LineItems, 'Qty', item => item.Type === 'Stand By'),
            Total: sumValues(Invoice.LineItems, 'Total', item => item.Type === 'Stand By')
          };
          Invoice.StandBy.QtyString = '$' + Invoice.StandBy.Qty.toFixed(2);
          Invoice.Totals.push(Invoice.StandBy);
      
          // Calculate Totals for 'Expenses'
          Invoice.ExpenseTotals = {
            Type: 'Expenses',
            Qty: sumValues(Invoice.LineItems, 'Qty', item => item.Type === 'Expense'),
            Total: sumValues(Invoice.LineItems, 'Total', item => item.Type === 'Expense')
          };
          Invoice.ExpenseTotals.QtyString = '$' + Invoice.ExpenseTotals.Qty.toFixed(2);
          Invoice.Totals.push(Invoice.ExpenseTotals);
      
          // Calculate the Invoice Total
          Invoice.Total = {
            Type: 'Amount Due',
            Qty: 'N/A',
            Total: sumValues(Invoice.Totals, 'Total')
          };
          Invoice.Totals.push(Invoice.Total);
      
          console.log('Calculated Invoice Totals:', Invoice.Totals);
        }
        return Invoice;
    };

    const printInvoice =(Invoice)=>{


        let CompanyHeader = Invoice.Company.Address + ', ' + Invoice.Company.address2 + '\n' + 'Office: ' + Invoice.Company.CompanyPhone + '   Fax: ' + Invoice.Company.Fax;
        let termsAndCond ='';
        if (Invoice.Account.InvoiceNotes === '') termsAndCond = Invoice.Company.TermsAndCond; else termsAndCond = Invoice.Account.InvoiceNotes;

     

        let docDefinition = {
            compress:true,
            content: [],
            pageMargins: [40, 85, 40, 115],
            pageBreakBefore: function (currentNode, followingNodesOnPage, nodesOnNextPage, previousNodesOnPage) {
                return currentNode.headlineLevel === 1 && followingNodesOnPage.length === 0;
            },
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    margin: [0, 0, 0, 0]
                },
                subheader: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 10, 0, 5]
                },
                tableExample: {
                    margin: [0, 5, 0, 15]
                },
                lineItemTable: {
                    margin: [0, 10, 0, 15]
                },
                headerTable: {
                    margin: [0, 0, 0, -10],
                    border:[true,true,true,false]
                },
                tableHeader: {
                    bold: true,
                    fontSize: 13,
                    color: 'black'
                }

            },
            footer: function (currentPage, pageCount) {
                return [
                    {
                        alignment: 'center',
                        fontSize: 9,
                        margin: [150, 0, 150, 0],
                        text: termsAndCond
                    }, {
                        alignment: 'center',
                        margin: [50, 0, 50, 0],
                        text: 'Page ' + currentPage.toString() + ' of ' + pageCount
                    }
                ]
            }
        };

        let headerColumns =[];
        headerColumns.push({ width: 50, height: 50, text: '' });
        headerColumns.push([{ width: 200, text: Invoice.Company.CompanyName, bold: true, alignment: 'center', fontSize: 18, margin: [0, 10, 0, 0] }, { text: CompanyHeader, margin: [0, 0, 0, 0], bold: true, alignment: 'center', fontSize: 11 }]);
        headerColumns.push({ width: 100, text: '' });
        docDefinition.header = [{ columns: headerColumns }];


        if(printAllInvoices)addInvoicetoPDF(invoicesRef.current[0], 0, docDefinition)
        else addInvoicetoPDF(Invoice, 0, docDefinition)
    }

    const addFreightToPDF =function(docDefinition, FreightBill){
      
        var truckname, trailername;
   
            
      
            if(FreightBill.Trailer){if(FreightBill.Trailer.Name==='No Trailer') trailername=''; else trailername=FreightBill.Trailer.Name;}else trailername='';
            if(FreightBill.Truck) {if(FreightBill.Truck.Name==='No Truck')  truckname=''; else truckname= FreightBill.Truck.Name;} else  truckname=''; 
            let CompanyHeader=  FreightBill.Company.Address +", " + FreightBill.Company.address2  +  "\nOffice: "  + FreightBill.Company.CompanyPhone+ "   Fax: "  +FreightBill.Company.Fax ;
            var haulerText= [{ bold:true, text:'Driver Name: '  }, FreightBill.driverName];
            if(FreightBill.Subhauler)  haulerText= [{ bold:true, text:'Sub-Hauler: ' },FreightBill.haulerName]; 
            let firstRow=[{colSpan: 2, rowSpan:2, fontSize: 15, text:haulerText}, {}, {  text: [{bold: true,text: 'FB #: '}, FreightBill.FBNO]}];
           
            let secondRow=[  {}, {}, { text:[{bold:true,text: 'Job #: ' }, FreightBill.jobNO]} ]
            let thirdRow=[{ text:[{bold:true,text:'Rate Type: '}, FreightBill.PayType]}, { text:[{bold:true,text: 'Number of Loads: '}, FreightBill.loads]}, { text:[{bold:true,text:'Date: '}, FreightBill.JobDate]}];
            let shipperAndReceiverRow=[
                {fontSize: 15, text:[{bold:true,text:'Shipper: ' }, FreightBill.Shipper.Name]},
                {fontSize: 15, text:[{bold:true, text:'Receiver: ' }, FreightBill.Receiver.Name]}
            ];
      
            let fourthRow=[ {text:[{bold:true, text:'Material: '}, FreightBill.materialName]},  {text:[{bold:true, text:'TruckType: ' }, FreightBill.TruckType.Name]},   {text: [{bold: true,text: 'Truck: '}, truckname+'  ',{bold: true,text: 'Trailer: '}, trailername]}];
            let sixthRow=[{text:[{bold:true, text:'Origin: '}, FreightBill.loadSite]}, {text:[{bold:true, text:'Destination: ' }, FreightBill.dumpSite]}];
            let seventhRow=[{text:[{bold:true, text:'Address: ' }, FreightBill.loadAddress]}, {text:[{bold:true, text:'Address: ' }, FreightBill.dumpAddress]}];
            
            let weightTable=[];
            let expenseTable=[];
            let weightTableHeaders=[
                {colSpan: 3, text: 'Weights', fontSize:20, style: 'tableHeader', alignment: 'center'},
                {},
                {},
                {colSpan: 3, text: 'Load', fontSize:20, style: 'tableHeader', alignment: 'center'},
                {},
                {},
                {colSpan: 3, text: 'Dump', fontSize:20, style: 'tableHeader', alignment: 'center'},
                {},
                {}
            ];
            let weightTableHeaders2=[
                {text: 'Material', style: 'tableHeader', alignment: 'center'},
                {text: 'Scale Tag', style: 'tableHeader', alignment: 'center'},
                {text: 'Weight', style: 'tableHeader', alignment: 'center'},
                {text:'Arrive', style: 'tableHeader', alignment: 'center'},
                {text: 'Depart', style: 'tableHeader', alignment: 'center'},
                {text: 'Stand By', style: 'tableHeader', alignment: 'center'},
                {text: 'Arrive', style: 'tableHeader', alignment: 'center'},
                {text: 'Depart', style: 'tableHeader', alignment: 'center'},
                {text: 'Stand By', style: 'tableHeader', alignment: 'center'}
            ];
            let expenseTableHeaders=[
                {text: 'Description', style: 'tableHeader', alignment: 'center'},
                {text: 'Qty', style: 'tableHeader', alignment: 'center'},
                {text: 'Rate', style: 'tableHeader', alignment: 'center'},
                {text: 'Total', style: 'tableHeader', alignment: 'center'}
                
            ];
        
            console.log('FreightBill.approveShipperSignature = ', FreightBill.approveShipperSignature)
            var driverSignatureImage={ width:265,text: '',  height:50}; 
            var approveSignatureImage={ width:265,text: '',  height:50};
            
            if(FreightBill.driverSignature) driverSignatureImage={ width:265,image: FreightBill.driverSignature, height:50};

           if(FreightBill.approveShipperSignature) approveSignatureImage={ width:265,image: FreightBill.approveShipperSignature, height:50};
           else if(FreightBill.approveReceiverSignature)approveSignatureImage={ width:265,image: FreightBill.approveReceiverSignature, height:50};

            weightTable.push(weightTableHeaders);
            weightTable.push(weightTableHeaders2);
            expenseTable.push(expenseTableHeaders);
            
            let weightTableWidths=['*',55,55,45,45,40,45,45,40];
            let expenseTableWidths=['*','*','*','*'];
            for(var i=0; i<FreightBill.Weights.length; i++){
                var materialName='';
              
                if(FreightBill.Weights[i].Material){
                  if(FreightBill.Weights[i].Material.Name) materialName=FreightBill.Weights[i].Material.Name;
                  else materialName=FreightBill.Weights[i].Material;
                } 
        
                let weightTableRow=[
                    {text: materialName, alignment:'center' },
                    {text: FreightBill.Weights[i].tagNO, alignment:'center' },
                    {text: FreightBill.Weights[i].weight, alignment:'right' },
                    {text: FreightBill.Weights[i].loadStart, alignment:'center' },
                    {text: FreightBill.Weights[i].loadEnd, alignment:'center' },
                    {text: FreightBill.Weights[i].excessLoad, alignment:'right' },
                    {text: FreightBill.Weights[i].dumpStart, alignment:'center' },
                    {text: FreightBill.Weights[i].dumpEnd, alignment:'center' },
                    {text: FreightBill.Weights[i].excessDump, alignment:'right' }
                ];
                weightTable.push(weightTableRow);
            }
            
            let totalWeightRow=[
                {colSpan: 2,bold:true, text: 'Total Weight:',  alignment: 'right'},
                {},
                {text:FreightBill.tWeight,alignment: 'right'},
                {colSpan: 2, bold:true, text: 'Total:', alignment: 'right'},
                {},
                {text: FreightBill.totalExcessLoad,alignment: 'right'},
                {colSpan: 2, bold:true, text: 'Total:', alignment: 'right'},
                {},
                {text: FreightBill.totalExcessDump,alignment: 'right'}
            ];
            weightTable.push(totalWeightRow);
            console.log('weightTable = ', weightTable);
            
            let expenseRowCount=0;
            for(var j=0; j<FreightBill.Expenses.length; j++){
                let expenseTableRow=[
                    FreightBill.Expenses[j].Name.Name,
                    FreightBill.Expenses[j].qty,
                    FreightBill.Expenses[j].rate,
                    FreightBill.Expenses[j].total
                ];
            if(FreightBill.Expenses[j].Name!=='Stand By'){
                expenseRowCount++;
                expenseTable.push(expenseTableRow);
            } 
            }
            console.log('expenseTable = ',expenseTable);
  
            let timeRows=[[{text:[{bold:true, text:'Start Time: '},FreightBill.startTime]},{text:[{bold:true, text:'End Time: ' }, FreightBill.endTime]}, {text:[{bold:true, text:'Total Hours: ' }, FreightBill.grossHours]}, {text:[{bold:true, text:'Deduction: ' }, FreightBill.lunch]}]];
            var timeRow2=[{},{}, {},{text:[{bold:true, text:'Hours: '}, FreightBill.tHours]}  ];
            if(FreightBill.PayType==='Hour' || FreightBill.PayType==='Hour/Percent') timeRow2=[{text:[{bold:true, text:'Depart Load: '},FreightBill.departRoundTrip]},{text:[{bold:true, text:'Arrive Dump: ' }, FreightBill.arriveRoundTrip]}, {text:[{bold:true, text:'Running Time: ' }, FreightBill.runningTime]},{text:[{bold:true, text:'Hours: '}, FreightBill.tHours]}  ];
            timeRows.push(timeRow2);          
        
            // docDefinition.content.push(FreightBillHeader2);
            
            let freightBillInfo= {
                pageBreak:'before',
                style: 'tableExample',
                table: { widths: ['*',  '*', '*'], body: [firstRow,secondRow,thirdRow,fourthRow]}
            };
            docDefinition.content.push(freightBillInfo);
            
            let freightBillShipperAndReceiver={
                style: 'tableExample',
                table: { widths: ['*',  '*'], body: [shipperAndReceiverRow,sixthRow,seventhRow ]}
            };
            docDefinition.content.push(freightBillShipperAndReceiver);
            
            let freightBillWeightTable={
                style: 'tableExample',
                table: {widths: weightTableWidths, body: weightTable } 
            }
            docDefinition.content.push( freightBillWeightTable);        
            let freightBillExpenseTable={
                style: 'tableExample',
                table: {widths: expenseTableWidths, body: expenseTable } 
            }
            if(expenseRowCount>0)docDefinition.content.push(freightBillExpenseTable);        
                    
            let freightBillTimes={
                style: 'tableExample',
                table: {widths: ['*',  '*', '*', '*' ], body: timeRows } 
            }
            docDefinition.content.push(freightBillTimes);        
                    
            let freightBillSignatureLabels={
                table: {
                    widths: ['*', '*'],
                    body: [
                        [{ text: [{ bold: true, text: 'Driver Name: ' }, FreightBill.driverName] }, { text: [{ bold: true, text: 'Consignor Name: ' }, FreightBill.signatureName] }],
                        [{ border: [false, false,false,false],  bold: true, text: 'Driver Signature:' }, { border: [false, false,false,false], bold: true, text: 'Consignor Signature:' }]
                    ]
                }
            }
            docDefinition.content.push(freightBillSignatureLabels);        
                    
            let freightBillSignatures={
                columns: [
                    { width: 5, text: '' },
                    driverSignatureImage,
                    { width: 20, text: '' },
                    approveSignatureImage
                ], 
            }
           docDefinition.content.push(freightBillSignatures);  
            if(!FreightBill.approverComments)FreightBill.approverComments='';
            
            let freightBillComments={
                table: {
                    widths: ['*', '*'],
                    body: [
                        [{text:[{bold:true, text:'Driver Comments: '},   FreightBill.Comments ], alignment:'center' },
                        {text:[{bold:true, text:'Approver Comments: '},   FreightBill.approverComments ], alignment:'center' }]
                    ]
                }
            }
            
            docDefinition.content.push(freightBillComments);
           
            console.log('docDefinition = ' , docDefinition);
      
           return(docDefinition);
      
          //  savePDF(action); 
      
    }
    const closePrintPopUp =()=>{
        setPrintVisible(false);
    }
    const checkFBsForPrintPopUp=(Invoice)=>{
        let printFreightBills=[];
        console.log('showprint tags = ', showPrintTags)
        for (var k = 0; k < Invoice.LineItems.length; k++) {
            if (!Invoice.LineItems[k].onHold) {   
                var foundFreightBill = false;
                for (var q = 0; q <printFreightBills.length; q++)if (printFreightBills[q].ID === Invoice.LineItems[k].FreightID)foundFreightBill = true;
                if (!foundFreightBill) {
                    for (var y = 0; y < Invoice.FreightBills.length; y++){
                        console.log('checking FBNP = ' +Invoice.FreightBills[y].FBNO +' to see if its weights have a TagURL' );
                        if (Invoice.FreightBills[y].ID === Invoice.LineItems[k].FreightID){
                            console.log('for FBNO = ' +Invoice.FreightBills[y].FBNO +' we found the line item = ', Invoice.LineItems[k] );
                            Invoice.FreightBills[y].tagCount=0;
                            if ((Invoice.FreightBills[y].Picture)) {
                                setPrintFBImages(true);
                                setShowPrintFBImages(true);
                                setPrintFBImages(true);
                            }
                            console.log('AND NOW WE GONNA CHEKC THE WEIGHTS= ' ,Invoice.FreightBills[y].Weights );
                            for (var j = 0; j < Invoice.FreightBills[y].Weights.length; j++){
                                if (Invoice.FreightBills[y].Weights[j].TagUrl) {
                                    Invoice.FreightBills[y].tagCount++;
                                    console.log('setting print tags is true for this weight ',Invoice.FreightBills[y].Weights[j] )
                                    setShowPrintTags(true);
                                    setPrintTags(true);
                                }
                            }
                            printFreightBills.push({...Invoice.FreightBills[y]});
                        }
                    }
                }
            }
        }
    }
    const showPrintPopUp = (Invoice, printInvoices)=>{
      
        setPrintFBs(true);
        setPrintAllInvoices(printInvoices);
        console.log('printInvoices = ' + printInvoices)
        if(printInvoices){
            for( let p=0; p<invoicesRef.current.length; p++)checkFBsForPrintPopUp(invoicesRef.current[p]);
        }else checkFBsForPrintPopUp(Invoice);
      
          
        
        setPrintVisible(true)
    }
    const attachFreightBills = async (Invoice) => {
        return new Promise(async (resolve, reject) => {
            const checkFBAttach = async (Invoice) => {
                Invoice.printFreightBills=[];
                console.log('Invoice.LineItems before =', Invoice.LineItems);
           
                const printFreightBills = Invoice.FreightBills
                .filter(item => item.onHold !== true)
                .sort((a, b) => Number(a.FBNO) - Number(b.FBNO));
                console.log('About to check FB Attachments for freight bills =', Invoice.FreightBills);
                Invoice.readyToPrint = await checkFBAttachments(Invoice, printFreightBills);
                console.log('Ready to print =', Invoice.readyToPrint);
               if(Invoice.readyToPrint) printInvoice(Invoice);
               setPrintVisible(false);
            };
        
            checkFBAttach(Invoice);
        });
    };
    const checkFBAttachments = async (Invoice, FreightBills) => {
        return new Promise(async (resolve, reject) => {
          console.log('Checking the FB attachments');
      
            const finishCheckFreightBills = async (Invoice, FreightBills) => {
                let WarningString = "";
                let FreightWarningString = "";
                let TagWarningString = "Missing Scale Tag Attachments for Loads: ";
                let count = 0;
                let totalTagMissingCount = 0;
        
                for (let i = 0; i < FreightBills.length; i++) {
                    if (printTags)  checkWeightAttachments(FreightBills[i]); // Ensure checkWeightAttachments is defined

                    if ((!FreightBills[i].Picture || FreightBills[i].Picture === '') &&  (!FreightBills[i].PDFurl || FreightBills[i].PDFurl === '')) {
                        if (count !== 0)  FreightWarningString += ', ' + FreightBills[i].FBNO;
                        else  FreightWarningString += FreightBills[i].FBNO;
                        count++;
                    }
                }
        
                if (printFBs && count > 0) {
                    WarningString += "WARNING Missing Attachments for Freight Bills: ";
                    WarningString += FreightWarningString;
                    if (printTags && totalTagMissingCount > 0)  WarningString += "\n Also ";
                    
                }
        
                if (printTags && totalTagMissingCount > 0)  WarningString += TagWarningString;
                WarningString += ". Would you like to create Anyway?";
                console.log('Checked print tags and total tag missing count =', totalTagMissingCount);
        
                if (printTags && totalTagMissingCount > 0) {
                    if (window.confirm(WarningString)) {
                        Invoice.readyToPrint = true;
                        resolve(Invoice.readyToPrint);
                    } else {
                        Invoice.readyToPrint = false;
                        // Replace any popups with proper React-based solutions if needed
                        resolve(Invoice.readyToPrint);
                    }
                } else {
                    Invoice.readyToPrint = true;
                    console.log('Returning readyToPrint =', Invoice.readyToPrint);
                    resolve(Invoice.readyToPrint);
                }
            };
      
          finishCheckFreightBills(Invoice, FreightBills);
        });
    };
    const checkWeightAttachments = (FreightBill) => {
        let tagCount = 0;
        let TagWarningString = "Missing Scale Tag Attachments for Loads: ";
        let totalTagMissingCount = 0;
    
        console.log('Checking weight attachments for driver =', FreightBill.driverName);
        console.log('FreightBill.Weights =', FreightBill.Weights);
    
        FreightBill.Weights.forEach((weight, index) => {
            if (!weight.TagUrl || weight.TagUrl === '') {
                // Update the warning string based on the count of missing tags
                if (tagCount !== 0) TagWarningString += ', ' + weight.loadNumber;
                else  TagWarningString += "(" + weight.loadNumber;
                tagCount++;
                totalTagMissingCount++;
            }
        });
    
        if (tagCount > 0)  TagWarningString += " on " + FreightBill.FBNO + ")";
        
        console.log('TagWarningString =', TagWarningString);
        console.log('Total Missing Tag Count =', totalTagMissingCount);
    
        // Optionally, return the results if needed for further processing
        return { TagWarningString, totalTagMissingCount };
    };

    

    const getWeightAttachments = async (FreightBill, docDefinition) => {
        let tagCount = 0;
        let newWeightPictures = [];
      
        return new Promise(async (resolve, reject) => {
          let foundWeightTag = true;
      
          if (FreightBill.Weights.length === 0) foundWeightTag = false;
      
          for (let i = 0; i < FreightBill.Weights.length; i++) {
            if (FreightBill.Weights[i].TagUrl !== '' && FreightBill.Weights[i].TagUrl != null) {
              const getTagPic = async (FreightBill, Weight, docDefinition) => {
                console.log('Attaching the Weight Picture for load number =', Weight.loadNumber);
                console.log('Attaching docDefinition =', docDefinition);
      
                // Copy Weight and get the image as base64
                const tempWeight = { ...Weight };
                try {
                  tempWeight.TagBase64 = await getBase64ImageFromURL(tempWeight.TagUrl); // Ensure getBase64ImageFromURL is available and works as expected
                  newWeightPictures.push(tempWeight);
                  tagCount++;
                  console.log('and now tagCount = ' + tagCount +' while the FB tag count = ' + FreightBill.tagCount)
                  if (tagCount === FreightBill.tagCount) {
                    // Sort newWeightPictures by loadNumber
                    newWeightPictures.sort((a, b) => a.loadNumber - b.loadNumber);
                    newWeightPictures.forEach((weight) => {
                      docDefinition.content.push({ pageBreak: 'before', width: 520, image: weight.TagBase64 });
                    });
                    console.log('Returning the get weight attachment for freightbill =', FreightBill.FBNO);
                    resolve(docDefinition);
                  }
                } catch (error) {
                  console.error('Error fetching image:', error);
                  reject(error);
                }
              };
      
              await getTagPic(FreightBill, FreightBill.Weights[i], docDefinition);
            } else {
              foundWeightTag = false;
            }
          }
      
          console.log('foundWeightTag =', foundWeightTag);
          if (!foundWeightTag) resolve(docDefinition);
        });
    };
    const getFreightBillAttachment = async (FreightBill, docDefinition ) => {
        return new Promise(async (resolve, reject) => {
          console.log('Starting to get attachments for freight bill =', FreightBill);
      
            if (FreightBill.Picture) {
                if (FreightBill.Picture !== '') {
                    const getFBPic = async (FreightBill) => {
                        if (printFBs) {
                            console.log('Attaching the FB Picture for ID =', FreightBill.ID);
                            try {
                                const FBPic = await getBase64ImageFromURL(FreightBill.Picture); // Ensure getBase64ImageFromURL is defined
                                const FreightPicture = { 
                                pageBreak: 'before', 
                                width: 590, 
                                height: 700, 
                                image: FBPic, 
                                alignment: 'center', 
                                margin: [0, 0, 0, 0] 
                                };
                                docDefinition.content.push(FreightPicture);
                            } catch (error) {
                                console.error('Error fetching FB picture:', error);
                                reject(error);
                            }
                        }
            
                        if (printTags)  resolve(await getWeightAttachments(FreightBill, docDefinition)); // Ensure getWeightAttachments is defined
                        else  resolve(docDefinition);
                    
                    };
                    await getFBPic(FreightBill);
                } else {
                    try {
                        if (printFBs) docDefinition = addFreightToPDF(docDefinition, FreightBill); // Ensure addFreightToPDF is defined
                        if (printTags) resolve(await getWeightAttachments(FreightBill, docDefinition));
                        else  resolve(docDefinition);
                    } catch (error) {
                        console.error("Error adding document:", error);
                        reject(error);
                    }
                }
            } else {
                try {
                    if (printFBs)  docDefinition = addFreightToPDF(docDefinition,FreightBill); // Ensure addFreightToPDF is defined
                    if (printTags)  resolve(await getWeightAttachments(FreightBill, docDefinition));
                    else  resolve(docDefinition);
                
                } catch (error) {
                console.error("Error adding document:", error);
                reject(error);
                }
            }
        });
    };
      
    const getFreightBillAttachments = async (freightIndex, Invoice, docDefinition ) => {
        return new Promise(async (resolve, reject) => {
            const printFreightBills = Invoice.FreightBills
            .filter(item => item.onHold !== true)
            .sort((a, b) => Number(a.FBNO) - Number(b.FBNO));
            const getFreightAttach = async (Freight, freightIndex) => {
                try {
                    docDefinition = await getFreightBillAttachment(Freight, docDefinition, true, true); // Ensure getFreightBillAttachment is defined
                    //console.log('DONE WITH ONE FREIGHT AND ITS INDEX =', freightIndex, 'AND invoice.printFreightBills.length =', Invoice.printFreightBills.length);
                
                    if ((printFreightBills.length - 1) === freightIndex)  resolve(docDefinition);
                    else   resolve(await getFreightBillAttachments(freightIndex + 1, Invoice, docDefinition, true, true));

                } catch (error) {
                    console.error('Error in getFreightAttach:', error);
                    reject(error);
                }
            };
      
            // Initialize or fetch Freight Bills if they are not already present
           

            await getFreightAttach(printFreightBills[freightIndex], freightIndex);
           
           /* } else if (Invoice.FreightBills.length === 0) {
                try {
                    const queryName = `Organizations/${gearedUser.selectedOrgName}/FreightBills`;
                    const q = query(collection(db, queryName), where("Invoice", "==", Invoice.ID));
                    onSnapshot(q, (querySnapshot) => {
                    const freight = doc.data();
                    Invoice.printFreightBills.push(freight);
                    console.log('Adding Freight Bill with FBNO =', freight.FBNO, 'and now the length =', Invoice.printFreightBills.length);
                });
        
                Invoice.printFreightBills.sort((a, b) => a.FBNO - b.FBNO);
                console.log('Starting to get freight attach for index =', freightIndex, 'AND Invoice.printFreightBills[freightIndex].FBNO =', Invoice.printFreightBills[freightIndex].FBNO);
                await getFreightAttach(Invoice.printFreightBills[freightIndex], freightIndex);
                } catch (error) {
                console.error("Error fetching Freight Bills:", error);
                reject(error);
                }
            }*/
        });
    };

    const addInvoicetoPDF = async (Invoice, InvoiceIndex, docDefinition) => {
        let separateStandBy = false;
        let pageBreak = false;
        let lineItemTableBody = [];
        let headerTableBody =[];
        if(InvoiceIndex!=0)   pageBreak = true;
            
        console.log('invoice.company = ' ,Invoice.Company);
              

            let InvoiceDateRow = [{ text: [{ bold: true, text: 'Date: ' }, Invoice.InvoiceDate] }];
            let JobRow = [{ text: [{ bold: true, text: 'Job #: ' }, Invoice.JobNumber] }];
            var InvoiceNumber = Invoice.InvoiceNumber;
            let InvoiceNumRow = [{ text: [{ bold: true, text: 'Invoice #: ' }, InvoiceNumber] }];
            let PORow={};
            if (Invoice.PONumber != '' && Invoice.PONumber) PORow = [{ text: [{ bold: true, text: 'PO #: ' }, Invoice.PONumber] }]
            
            
            const tempTotalLineItems= Invoice.LineItems.filter(item => item.onHold !== true);
            console.log('temptotalLineItems = ',tempTotalLineItems);
            
            if (tempTotalLineItems.length > 0) {

                let tableHeaderRow = [{ colSpan: 7, text: [{ bold: true, text: 'Load Site: ' }, Invoice.LoadSite.Name] }, {}, {}, {}, {}, {}, {}];
                if (Invoice.calcByLoad) {
                    tableHeaderRow[0].colSpan += 1;
                    tableHeaderRow.push({});
                }
                tableHeaderRow.push({ colSpan: 7, text: [{ bold: true, text: 'Dump Site: ' },  Invoice.DumpSite.Name] }, {}, {}, {}, {}, {}, {});
                if (Invoice.calcByLoad) {
                    tableHeaderRow[8].colSpan += 1;
                    tableHeaderRow.push({});
                }
                console.log('pushign tableHeaderRow = ', tableHeaderRow)
                headerTableBody.push(tableHeaderRow);
                console.log('    headerTableBody RIGHT NOW  ',    headerTableBody)
                tableHeaderRow = [{ colSpan: 7, rowSpan: 2, border:[true,true,true,false], text: [{ bold: true, text: 'Address: ' }, Invoice.LoadSite.fullAddress] }, {}, {}, {}, {}, {}, {}];

                if (Invoice.calcByLoad) {
                    tableHeaderRow[0].colSpan += 1;
                    tableHeaderRow.push({});
                }
                tableHeaderRow.push({ colSpan: 7, rowSpan: 2, border:[true,true,true,false], text: [{ bold: true, text: 'Address: '},  Invoice.DumpSite.fullAddress] }, {}, {}, {}, {}, {}, {});

                if (Invoice.calcByLoad) {
                    tableHeaderRow[8].colSpan += 1;
                    tableHeaderRow.push({});
                    console.log('scope.tableHeaderRow[8].colSpan ' + tableHeaderRow[8].colSpan);
                }

                headerTableBody.push(tableHeaderRow);

                tableHeaderRow = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
                if (Invoice.calcByLoad) {
                    tableHeaderRow.push({});
                    tableHeaderRow.push({});
                }

                console.log('tableHeaderRow= ', tableHeaderRow)
                headerTableBody.push(tableHeaderRow);
           

                let columns = [
                    { colSpan: 2, bold: true, text: 'Job Date' }, {},
                    { colSpan: 2, bold: true, text: 'FB #' }, {},
                    { colSpan: 2, bold: true, text: 'Truck' }, {}
                ];
                if (Invoice.calcByLoad) columns.push({ colSpan: 2, bold: true, text: 'Tickets' }, {});

                columns.push({ colSpan: 2, bold: true, text: 'Bill Type' }, {});
                columns.push({ colSpan: 2, bold: true, text: 'Qty' }, {});
                columns.push({ colSpan: 2, bold: true, text: 'Bill Rate' }, {});
                columns.push({ colSpan: 2, bold: true, alignment: 'right', text: 'Total' }, {});
                
                lineItemTableBody.push(columns);

            
                var tableRowCount = 0;
                var tableLength = 0;
                console.log('tempTotalLineItems = ', tempTotalLineItems);
                let lineItemRowTable={};
                for (var i = 0; i < tempTotalLineItems.length; i++) {
                    console.log('we are making alineItemtable for this ', tempTotalLineItems[i]);
                    var qtyString;
                   
                    if (tempTotalLineItems[i].Type === 'Freight Bill' || tempTotalLineItems[i].Type === 'Material' || (tempTotalLineItems[i].Type === 'Scale Tag' && tempTotalLineItems[i].firstWeight) || tempTotalLineItems[i].Type === 'Special Fee' || tempTotalLineItems[i].Type === 'Expense') {
                        lineItemRowTable  = {
                            headerRows: 1,
                            dontBreakRows: true,
                            alignment: 'center',
                            keepWithHeaderRows: tempTotalLineItems[i].tableLength,
                            widths: [30, 25, 25, 25, 20, 15, 35, 30, 15, 15, 30, 25, 35, 35],
                            body: []
                        };
                        if (Invoice.calcByLoad) lineItemRowTable.widths = [30, 25, 25, 25, 20, 15, 35, 30, 20, 20, 15, 15, 30, 25, 35, 35];
                        tableLength = tempTotalLineItems[i].tableLength;
                        tableRowCount = 0;
                    }
                    var border = [true, true, true, true];
                    if (tempTotalLineItems[i].RateType === 'Ton') qtyString = Number(tempTotalLineItems[i].Qty).formatMoney(2);
                    else if (tempTotalLineItems[i].RateType === 'Hour') qtyString = Number(tempTotalLineItems[i].Qty).formatMoney(1);
                    else qtyString = Number(tempTotalLineItems[i].Qty).toString();

                    let lineItemRow = [
                        { colSpan: 2, text: tempTotalLineItems[i].JobDate }, { text: "" },
                        { colSpan: 2, text: tempTotalLineItems[i].FBNO }, { text: "" },
                        { colSpan: 2, text: tempTotalLineItems[i].truck }, { text: "" }
                    ];
                    if (tempTotalLineItems[i].hideFBNO) lineItemRow[0] = { colSpan: 2, text: "" };
                    if (tempTotalLineItems[i].RateType === 'Stand By') lineItemRow[2].text = "";
                    console.log('tempTotalLineItems[i].Weights.length = ' + tempTotalLineItems[i].Weights.length);
                    console.log('tempTotalLineItems[i].Typ= ' + tempTotalLineItems[i].Type);
                    if (tempTotalLineItems[i].RateType === 'Stand By' && separateStandBy) {
                        var loadStandByLineItem = {...lineItemRow};
                        if (Invoice.calcByLoad) loadStandByLineItem.push({ colSpan: 2, text: tempTotalLineItems[i].Description }, { text: "" });
                        loadStandByLineItem.push({ colSpan: 2, fontSize: 10, text: 'Stand By - Load' }, { text: "" });
                        loadStandByLineItem.push({ colSpan: 2, alignment: 'right', text: Number(tempTotalLineItems[i].loadQty).toString() }, { text: "" });
                        loadStandByLineItem.push({ colSpan: 2, alignment: 'right', text: tempTotalLineItems[i].RateString }, { text: "" });
                        loadStandByLineItem.push({ colSpan: 2, alignment: 'right', text: '$' + Number(tempTotalLineItems[i].loadTotal).formatMoney(2) }, { text: "" });
                        if ( tempTotalLineItems[i].dumpTotal > 0) border = [true, false, true, false]; else border = [true, false, true, true];
                        for (var q = 0; q < loadStandByLineItem.length; q++) loadStandByLineItem[q].border = border;
                        if (tempTotalLineItems[i].loadTotal > 0) lineItemRowTable.body.push(loadStandByLineItem);

                        lineItemRow.push({ colSpan: 2, text: tempTotalLineItems[i].Description }, { text: "" });
                        lineItemRow.push({ colSpan: 2, fontSize: 10, text: 'Stand By - Dump' }, { text: "" });
                        lineItemRow.push({ colSpan: 2, alignment: 'right', text: Number(tempTotalLineItems[i].dumpQty).toString() }, { text: "" });
                        lineItemRow.push({ colSpan: 2, alignment: 'right', text: tempTotalLineItems[i].RateString }, { text: "" });
                        lineItemRow.push({ colSpan: 2, alignment: 'right', text: '$' + Number(tempTotalLineItems[i].dumpTotal).formatMoney(2) }, { text: "" });
                    }
                    else {
                        if (tempTotalLineItems[i].Type === 'Scale Tag') {
                            console.log('adding scale tag and hideFBNO = ' + tempTotalLineItems[i].hideFBNO);
                            if (tempTotalLineItems[i].hideFBNO) {
                                lineItemRow = [
                                    { colSpan: 2, text: '' }, { text: "" },
                                    { colSpan: 2, text: '' }, { text: "" },
                                    { colSpan: 2, text: '' }, { text: "" }
                                ];
                            }
                
                        }
                        if (Invoice.calcByLoad) lineItemRow.push({ colSpan: 2, text: tempTotalLineItems[i].Description }, { text: "" });
                        lineItemRow.push({ colSpan: 2, text: tempTotalLineItems[i].RateType }, { text: "" });
                        lineItemRow.push({ colSpan: 2, alignment: 'right', text: qtyString }, { text: "" });
                        lineItemRow.push({ colSpan: 2, alignment: 'right', text: tempTotalLineItems[i].RateString }, { text: "" });
                        lineItemRow.push({ colSpan: 2, alignment: 'right', text: tempTotalLineItems[i].TotalString }, { text: "" });
                        if (tempTotalLineItems[i].hideFBNO) border = [true, false, true, false]; else border = [true, true, true, true];
                        if(tempTotalLineItems[i].firstWeight) border= [true, true, true, false];
                        for (var q = 0; q < lineItemRow.length; q++) lineItemRow[q].border = border;
                    }

                    if (tempTotalLineItems[i].RateType === 'Stand By' || tempTotalLineItems[i].Type === 'Reimbursement' || tempTotalLineItems[i].hideFBNO || tempTotalLineItems[i].Type === 'Scale Tag') {
                        if (tempTotalLineItems[i].lastWeight) {
                            if (tempTotalLineItems[i].hasStandBy) border = [true, false, true, false]; else border = [true, false, true, true];
                        } else border = [true, false, true, false];
                    } else if (tempTotalLineItems[i].hasStandBy) border = [true, false, true, false];

                    tableRowCount++;
                    if (tempTotalLineItems[i].RateType === 'Stand By') {
                        if (separateStandBy) {
                            if (tempTotalLineItems[i].dumpTotal > 0) border = [true, false, true, true]; else border = [true, false, true, true];
                        }else border = [true, false, true, true];
                    }
                    if (i === (tempTotalLineItems.length - 1)) border[3]=true;
                    for (var q = 0; q < lineItemRow.length; q++) lineItemRow[q].border = border;
                    let lineItemRowObject ={};
                    
                    if (!Invoice.calcByLoad) lineItemRowObject = [{ margin: [-5, -3, -5, -3], colSpan: 14, border: border, table: lineItemRowTable }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
                    else  lineItemRowObject = [{ margin: [-5, -3, -5, -3], colSpan: 16, border: border, table: lineItemRowTable }, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
                    console.log('lineItemRowTable = ', lineItemRowTable);
                    console.log('tableLength = ' + tableLength);
                    lineItemRowTable.body.push(lineItemRow);
                
                    if (tableRowCount === tableLength) lineItemTableBody.push(lineItemRowObject);

            
                //  console.log('  tableHeader = ', tableHeader)
                console.log('lineitemtable = ',lineItemRowTable)
            
                
                
                }
            }
         
            let totalsTable = [];
            let totalsHeader = [{ bold: true, text: 'Type' }, { bold: true, text: 'Qty' }, { bold: true, text: 'Total' }];
            totalsTable.push(totalsHeader);
            
            let InvoiceTotalRow={};
            for (var k = 0; k < Invoice.Totals.length; k++) {

                console.log('Invoice.Totals[k].Type = ' + Invoice.Totals[k].Type);
            
                if (Invoice.Totals[k].Type === 'Invoice Total' || Invoice.Totals[k].Type === 'Amount Due') {
                    InvoiceTotalRow = [{ colSpan: 2, bold: true, text: 'Total ' }, {}, { alignment: 'right', text: '$' + Number(Invoice.Totals[k].Total).formatMoney(2) }];
                } else {
                    console.log('Invoice.Totals[k].Total = ' + Invoice.Totals[k].Total);
                    if (Number(Invoice.Totals[k].Total) != 0) {
                        var totalsTableRow = [{ text: Invoice.Totals[k].Type }];
                        var QtyString;
                        if (Invoice.Totals[k].Type === 'Broker' || Invoice.Totals[k].Type === 'Fuel') QtyString = Invoice.Totals[k].Qty + '%';
                        if (Invoice.Totals[k].Type === 'Loads') QtyString = Number(Invoice.Totals[k].Qty).formatMoney(0);
                        if (Invoice.Totals[k].Type === 'Stand By') {
                            if (separateStandBy) {
                                totalsTableRow = [{ text: 'Load - Stand By' }];
                                QtyString = Number(Invoice.Totals[k].loadQty).formatMoney(0);
                                totalsTableRow.push({ alignment: 'right', text: QtyString });
                                totalsTableRow.push({ alignment: 'right', text: '$' + Number(Invoice.Totals[k].loadTotal).formatMoney(2) });
                                if (Number(Invoice.Totals[k].loadTotal) > 0) totalsTable.push(totalsTableRow);
                                totalsTableRow = [{ text: 'Dump - Stand By' }];
                                QtyString = Number(Invoice.Totals[k].dumpQty).formatMoney(0);
                            } else QtyString = Number(Invoice.Totals[k].Qty).formatMoney(0);
                        }
                        if (Invoice.Totals[k].Type === 'Expenses') QtyString = Number(Invoice.Totals[k].Qty).formatMoney(2);
                        if (Invoice.Totals[k].Type === 'Tons') QtyString = Number(Invoice.Totals[k].Qty).formatMoney(2);
                        if (Invoice.Totals[k].Type === 'Hours') QtyString = Number(Invoice.Totals[k].Qty).formatMoney(1);
                        if (Invoice.Totals[k].Type === 'Amount Due') QtyString = Invoice.Totals[k].Qty;
                        if (Invoice.Totals[k].Type === 'Material') QtyString = Number(Invoice.Totals[k].Qty).formatMoney(1);
                        totalsTableRow.push({ alignment: 'right', text: QtyString });
                        if (separateStandBy && Invoice.Totals[k].Type === 'Stand By') totalsTableRow.push({ alignment: 'right', text: '$' + Number(Invoice.Totals[k].dumpTotal).formatMoney(2) });
                        else totalsTableRow.push({ alignment: 'right', text: '$' + Number(Invoice.Totals[k].Total).formatMoney(2) });
                        if (separateStandBy) {
                            if (Invoice.Totals[k].Type === 'Stand By') {
                                if (Number(Invoice.Totals[k].dumpTotal) > 0) totalsTable.push(totalsTableRow);
                            } else totalsTable.push(totalsTableRow);
                        } else totalsTable.push(totalsTableRow);
                        console.log('totalsTableRow = ', totalsTableRow);
                    }
                }
                if (k === (Invoice.Totals.length - 1)) totalsTable.push(InvoiceTotalRow);
            }
            console.log('totalsTable = ', totalsTable);
            if (Invoice.Totals.length === 0) totalsTable.push(InvoiceTotalRow);


            let JobandPONumber = [];
            JobandPONumber.push(InvoiceNumRow);
            JobandPONumber.push(InvoiceDateRow);
            JobandPONumber.push(JobRow);
            if (Invoice.PONumber != '' && Invoice.PONumber) JobandPONumber.push(PORow);

            let InvoicePDFAccount = { 

                columns: [
                    { width: 25, text: '' },
                    { width: 200, margin: [0, 57, 0, 27], text: [{ fontSize: 15, bold: true, text: Invoice.Account.Name }, { fontSize: 12, bold: true, text: '\n ' + Invoice.Account.Address + '\n ' + Invoice.Account.custAddress2 }] },
                    { width: 140, text: '' },
                    { width: 120, margin: [0, -20, 0, 0], table: { alignment: 'right', style: 'dateTableHeader', widths: ['*'], body: JobandPONumber } }
                ]
            };
            if (pageBreak) InvoicePDFAccount.pageBreak = 'before';
            docDefinition.content.push(InvoicePDFAccount);
            console.log('headerTableBody = ', headerTableBody)

            var headerTable = {
                dontBreakRows: true,
                alignment: 'center',
                widths: [30, 25, 25, 25, 20, 15, 35, 30, 15, 15, 30, 25, 35, 35],
                body: headerTableBody
            };
            
            if (Invoice.calcByLoad) headerTable.widths = [30, 25, 25, 25, 20, 15, 35, 30, 20, 20, 15, 15, 30, 25, 35, 35];

            console.log('headerTable =  = ', headerTable)
            docDefinition.content.push({ style: 'headerTable', table:  headerTable});
    
        
            let lineItemTable = {
                headerRows:1,
                alignment: 'center',
                dontBreakRows:true,
                widths: [30, 25, 25, 25, 20, 15, 35, 30, 15, 15, 30, 25, 35, 35],
                body: lineItemTableBody
            };
            if (Invoice.calcByLoad) lineItemTable.widths = [30, 25, 25, 25, 20, 15, 35, 30, 20, 20, 15, 15, 30, 25, 35, 35];
        
        
            console.log('line item table =  = ' ,lineItemTable)
            docDefinition.content.push({ style: 'lineItemTable', table: lineItemTable });
        

    
            var firstColumnOffset = 266;
            if (Invoice.calcByLoad) firstColumnOffset = 325;
            let InvoicePDFTotals = {
                columns: [
                    { width: firstColumnOffset, text: [{ bold: true, text: 'Notes: ' }, Invoice.CustomNotes], alignment: 'center' },
                    { width: 220, table: { headerRows: 1, keepWithHeaderRows: 10, dontBreakRows: true, widths: ['*', '*', 78], body: totalsTable } }
                ]
            };
            if (Invoice.Payments) {
                if (Invoice.Payments.length > 0) {
                    var paymentsTable = [];
                    var paymentsHeader = [{ bold: true, text: 'Date' }, { bold: true, text: 'Amount' }];
                    paymentsTable.push(paymentsHeader);
                    for (var j = 0; j < Invoice.Payments.length; j++) {
                        var paymentRow = [{ text: Invoice.Payments[j].formattedDate }, { alignment: 'right', text: Invoice.Payments[j].displayAmount }];
                        paymentsTable.push(paymentRow);
                    }
                    var paymentRow = [{ text: 'Amount Due', bold: true }, { alignment: 'right', text: '$' + Number(Invoice.Balance.Total).formatMoney(2) }];

                    paymentsTable.push(paymentRow);
                    var middleWidthOffset = firstColumnOffset - 180;
                    InvoicePDFTotals.columns = [
                        { width: 180, table: { headerRows: 1, keepWithHeaderRows: 10, dontBreakRows: true, widths: ['*', '*',], body: paymentsTable } },
                        { width: middleWidthOffset, text: '' },
                        { width: 215, table: { headerRows: 1, keepWithHeaderRows: 10, dontBreakRows: true, widths: ['*', '*', 78], body: totalsTable } }
                    ]
                }
            }
            //  if (Invoice.InvoiceNotes != '') InvoicePDFTotals.columns[0].text = [{ bold: true, text: 'Notes: ' }, Invoice.InvoiceNotes];
            docDefinition.content.push(InvoicePDFTotals);
            console.log('docdefinition look like dis = ' , docDefinition);
            console.log('I am moving on for invoice number = '+printFBs);
            if (printFBs || printTags){
                console.log('ABOUT OT URN GET FRIEGHT ATTACHMENTS')
                docDefinition = await getFreightBillAttachments(0, Invoice, docDefinition, true, true);
                if (printAllInvoices){
                    if((invoicesRef.current.length - 1) === InvoiceIndex) {
                      
                       // if (createInvoices) CreateInvoicesBeta();
                        return pdfMake.createPdf(docDefinition).download();
                    }  else  return addInvoicetoPDF(invoicesRef.current[InvoiceIndex+1], InvoiceIndex+1, docDefinition,true, true, printAllInvoices);
                }  else {
           
                    return pdfMake.createPdf(docDefinition).download();
            }   
            console.log('im guessing it happens here ', docDefinition);
            }else {
               if (printAllInvoices){
                    if((invoicesRef.current.length - 1) === InvoiceIndex) {
                   
                     //   if (createInvoices) CreateInvoicesBeta();
                        return pdfMake.createPdf(docDefinition).download();
                    }  else  return addInvoicetoPDF(invoicesRef.current[InvoiceIndex+1], InvoiceIndex+1, docDefinition,true, true, printAllInvoices);
                } else{
               
                    return pdfMake.createPdf(docDefinition).download();
             }   
            }
            pdfMake.createPdf(docDefinition).download();
    
      
    }
   

    const makeFreightBillLineItem =  (FreightBill, LineItems, Invoice)=> {
        var newLineItem = {};
     
        if (FreightBill.ParentFreight === '') FreightBill.ParentFreight = FreightBill.ID;
        newLineItem.loadSite = FreightBill.loadSite;
        newLineItem.dumpSite = FreightBill.dumpSite;
        newLineItem.loadAddress = FreightBill.loadAddress;
        newLineItem.dumpAddress = FreightBill.dumpAddress;
        newLineItem.Description = FreightBill.loadSite + ' - ' + FreightBill.dumpSite;
        newLineItem.Type = 'Freight Bill';
        newLineItem.hideFBNO = false;
        if(!FreightBill.billedQty)newLineItem.Qty=0; else newLineItem.Qty = FreightBill.billedQty;
        newLineItem.ID=FreightBill.ID;
        newLineItem.QtyString = Number(newLineItem.Qty).toString();
 
        newLineItem.VNum = FreightBill.VNum;
        newLineItem.TotalWeight = FreightBill.tWeight;
        newLineItem.Rate = FreightBill.BillRate;
        newLineItem.TotalString = '$' + Number(FreightBill.tBilled).toString();
        newLineItem.tWeight = FreightBill.tWeight;
        newLineItem.tHours = FreightBill.tHours;
        newLineItem.loads = FreightBill.loads;
        if (FreightBill.VNum === 1) newLineItem.FreightID = FreightBill.ID; else newLineItem.FreightID = FreightBill.ParentFreight;
    
        newLineItem.onHold = FreightBill.onHold;
        newLineItem.missing = FreightBill.missing;
        newLineItem.JobDate = FreightBill.JobDate;
        newLineItem.Weights = [];
        newLineItem.FBNumber = Number(FreightBill.FBNO);
        newLineItem.tableLength = 1;


        newLineItem.Amount = Number(Number(newLineItem.Rate) * Number(newLineItem.Qty).toString());
        //newLineItem.PONumber = FreightBill.PONumber;
        newLineItem.FBNO = FreightBill.FBNO;
        if (FreightBill.QueryDate < Invoice.QueryStartDate) {
            Invoice.QueryStartDate = FreightBill.QueryDate;
            Invoice.StartDate = FreightBill.JobDate;
        }
        if (FreightBill.QueryDate > Invoice.QueryEndDate) {
            Invoice.QueryEndDate = FreightBill.QueryDate;
            Invoice.EndDate = FreightBill.JobDate;
        }
        console.log('about to set line item.truc = ' , FreightBill.Truck)
        if (FreightBill.Truck) {
            if(!FreightBill.Truck.Name )  newLineItem.truck = FreightBill.Truck;
            else if (FreightBill.Truck.Name != 'No Truck' &&  FreightBill.Truck.Name != 'Truck #') newLineItem.truck = FreightBill.Truck.Name; else{
                newLineItem.truck = '';
            }
        } else newLineItem.truck = '';
        console.log('newLineItem.truck = ', newLineItem.truck);
        newLineItem.Driver = FreightBill.driverName;
        newLineItem.Rate = FreightBill.BillRate;
        newLineItem.RateString = '$' + Number(newLineItem.Rate).toString();
        newLineItem.FreightTotal = FreightBill.bTotal;
        newLineItem.RateType = FreightBill.BillType;
        newLineItem.BillType = FreightBill.BillType;
        //newLineItem.InvoiceVNums = FreightBill.InvoiceVNums;
        newLineItem.FuelPercent = FreightBill.FuelCharge + '%';
        newLineItem.BrokerPercent = FreightBill.billedBrokerPercent + '%';
        newLineItem.background = 'background-color : transparent!important';
        newLineItem.printBackground = 'background-color : transparent!important';
        newLineItem.isFreightBill = true;


        if (FreightBill.FreightTaxable) {
            if (FreightBill.FreightTaxTotal) newLineItem.TaxTotal = FreightBill.FreightTaxTotal; else newLineItem.TaxTotal = 0;
            if (FreightBill.FreightTaxRate) Invoice.TaxRate = FreightBill.FreightTaxRate
            newLineItem.Taxable = true;
        } else {
            newLineItem.TaxTotal = 0;
            newLineItem.Taxable = false;
        }
        if (FreightBill.MaterialTaxable) {
            if (FreightBill.MaterialTaxRate) Invoice.TaxRate = FreightBill.MaterialTaxRate
        }
        if (FreightBill.billedBrokerPercent > 0) Invoice.BrokerPercent = FreightBill.billedBrokerPercent;
        console.log('FreightBill.tBilled= ' + FreightBill.tBilled)
        if (FreightBill.tBilled && FreightBill.tBilled !== '') {
            if (FreightBill.billedTruckingBrokerTotal) newLineItem.BrokerTotal = FreightBill.billedTruckingBrokerTotal;
            else if (FreightBill.bFee && FreightBill.bFee !== '' && FreightBill.billedBrokerPercent) newLineItem.BrokerTotal = Math.round(-1 * (FreightBill.tBilled * (FreightBill.billedBrokerPercent / 100)) * 100) / 100;
            else newLineItem.BrokerTotal = 0;
            console.log('newLineItem.BrokerTotal= ' + newLineItem.BrokerTotal)
        } else {
            newLineItem.BrokerTotal = 0;
            newLineItem.Amount = 0;
            newLineItem.Total = 0;
        }

        newLineItem.Total = FreightBill.tBilled;
        newLineItem.Amount = Number(FreightBill.tBilled);

        newLineItem.BrokerTotalString = '$' + Number(newLineItem.BrokerTotal).toString();

        if (FreightBill.fuelBilled != '' && !FreightBill.fuelBilled ) {
            newLineItem.FuelTotal = FreightBill.fuelBilled;
            Invoice.FuelPercent = FreightBill.FuelCharge;
            Invoice.showFuelCharge = true;
        } else newLineItem.FuelTotal = 0;

        newLineItem.backTotal = newLineItem.Total + newLineItem.FuelTotal + newLineItem.BrokerTotal;
        if (newLineItem.BrokerTotal < 0) Invoice.showBrokerFee = true;

        newLineItem.dispatchID = FreightBill.dispatchID;

        if ((FreightBill.UseStandBy && FreightBill.standBilled > 0) && (!FreightBill.standByIsBilled || FreightBill.standByIsBilled)) {
            FreightBill.hasStandBy = true;
            newLineItem.hasStandBy = true;
            newLineItem.tableLength++;
        }
        else {
            FreightBill.hasStandBy = false;
            newLineItem.hasStandBy = false;
        }
        if(!FreightBill.calcByLoad)FreightBill.calcByLoad=false;
        if(FreightBill.BillType==='Ton') Invoice.showCalcByLoad = true;
 
        if (FreightBill.Company.ID === Invoice.Company.ID && !FreightBill.truckingBilled) {
            for (var j = 0; j < FreightBill.Weights.length; j++) {
                var amount = '$' + Number(Number(FreightBill.Weights[j].weight) * Number(FreightBill.BillRate).toString());
                if (!FreightBill.Weights[j].tagNO) FreightBill.Weights[j].tagNO = '';
                newLineItem.Weights.push({
                    tagNumber: FreightBill.Weights[j].tagNO,
                    Weight: Number(FreightBill.Weights[j].weight),
                    Amount: amount
                });
               // FreightBill.truckingBilled = true;
                if (FreightBill.calcByLoad && FreightBill.BillType=='Ton' ) makeScaleTagLineItem(Invoice, FreightBill, FreightBill.Weights[j], LineItems);

            }
            if (!FreightBill.calcByLoad || FreightBill.BillType!='Ton') LineItems.push({...newLineItem});
        }

        //addSTand By
        /*(if (FreightBill.SellMaterial) {
         
            if (!FreightBill.MaterialCompany) makeMaterialLineItem(Invoice, FreightBill, LineItems);
            else if (FreightBill.MaterialCompany.ID === Invoice.Company.ID) makeMaterialLineItem(Invoice, FreightBill, LineItems);
        } */
        FreightBill.materialBilled = true;
        
        if (FreightBill.hasStandBy) makeStandByLineItem(FreightBill, LineItems); else FreightBill.standByIsBilled = true;



    }
    const makeExpenseLineItem =  (Expense)=> {

        console.log('Making expense line item ', Expense);
        var newLineItem = {...Expense};

        newLineItem.isFreightBill = false;
        newLineItem.dispatchID = Expense.dispatchID;
       // newLineItem.InvoiceVNums = Expense.InvoiceVNums;
        newLineItem.Qty = Expense.qty;
        newLineItem.ExpenseID = Expense.ID;


        newLineItem.QtyString = Number(newLineItem.Qty).toString();
        newLineItem.tableLength = 1;
        newLineItem.Total = 0 + Expense.total;
        newLineItem.Rate = 0 + Expense.rate;
        newLineItem.Type = 'Expense';
        if(!newLineItem.Name)newLineItem.Name={Name:'No Description'};
        newLineItem.RateType = newLineItem.Name.Name;
        
        newLineItem.hideFBNO = false;
        newLineItem.RateString = newLineItem.Rate.toString();
        newLineItem.TotalString = '$' + Number(newLineItem.Total).toString();
        newLineItem.Qty = Expense.qty;
        newLineItem.backTotal = newLineItem.Total;
        newLineItem.ID = Expense.ID;
        newLineItem.FBNO = Number(Expense.FBNO);
        newLineItem.TaxTotal = 0;
        newLineItem.Taxable = false;
        newLineItem.FreightID = Expense.FreightBill;
        newLineItem.ParentFreight = Expense.FreightBill;
        newLineItem.Weights = [];
        newLineItem.truck = Expense.Truck;
        newLineItem.JobDate = Expense.JobDate;
        newLineItem.FBNO = Expense.FBNO;
        newLineItem.FBNumber = Number(Expense.FBNO);
        newLineItem.VNum = 1;
        newLineItem.Description = newLineItem.Name.Name;
        newLineItem.onHold = Expense.onHold;
        
        newLineItem.Driver = Expense.driverName;
        newLineItem.BrokerPercent = '';
        newLineItem.FuelPercent = '';
        newLineItem.FuelTotal = '';
        newLineItem.tWeight = '';
        newLineItem.Amount = Number((Number(newLineItem.Rate) * Number(newLineItem.Qty)));
        newLineItem.BrokerTotal = 0;

        console.log('newLineItem.Total= ' + newLineItem.Total);
        return newLineItem;

 

    }

    const makeScaleTagLineItem =  (Invoice, FreightBill, Weight, LineItems) =>{
        var newLineItem = {};
        console.log('making scale tag line item for driver = ' + FreightBill.driverName + ' and scale tag = ' + Weight.tagNO);
        if (FreightBill.ParentFreight === '') FreightBill.ParentFreight = FreightBill.ID;
       // Invoice.calcByLoad = true;
        newLineItem.FBNO = FreightBill.FBNO.toString();
        newLineItem.FBNumber = Number(FreightBill.FBNO);
        if (FreightBill.Weights.indexOf(Weight) === 0) {
            if (FreightBill.Truck) {
                if (FreightBill.Truck.Name != 'No Truck' && FreightBill.Truck != '' && FreightBill.Truck.Name != 'Truck #') newLineItem.truck = FreightBill.Truck.Name; else newLineItem.truck = '';
            } else newLineItem.truck = '';
            newLineItem.hideFBNO = false;
            newLineItem.Driver = FreightBill.driverName;
            newLineItem.firstWeight = true;

        } else {
            newLineItem.hideFBNO = true;
            newLineItem.truck = '';
            newLineItem.Driver = '';
            newLineItem.firstWeight = false;


        }

        if (FreightBill.Weights.indexOf(Weight) === (FreightBill.Weights.length - 1)) {
            newLineItem.lastWeight = true;
            newLineItem.hasStandBy = FreightBill.hasStandBy;
        } else newLineItem.lastWeight = false;



        if(newLineItem.firstWeight && newLineItem.lastWeight)   newLineItem.Style = { 'border-top': '1px solid #ddd', 'border-bottom': '1px solid #ddd'};
        if(newLineItem.firstWeight && !newLineItem.lastWeight) newLineItem.Style = { 'border-top': '1px solid #ddd', 'border-bottom': '0px'};
        if(!newLineItem.firstWeight && newLineItem.lastWeight) newLineItem.Style = { 'border-top': '0px', 'border-bottom': '1px solid #ddd'};
        if(!newLineItem.firstWeight && !newLineItem.lastWeight) newLineItem.Style = { 'border-top': '0px', 'border-bottom': '0px'};
  
        newLineItem.loadSite = FreightBill.loadSite;
        newLineItem.dumpSite = FreightBill.dumpSite;
        newLineItem.loadAddress = FreightBill.loadAddress;
        newLineItem.dumpAddress = FreightBill.dumpAddress;
        newLineItem.Description = Weight.tagNO;
        newLineItem.Type = 'Scale Tag';
        if(!Weight.weight) newLineItem.Qty=0; else newLineItem.Qty = Weight.weight;
        newLineItem.QtyString = Number(Weight.weight).formatMoney(2);
        newLineItem.VNum = FreightBill.VNum;
        newLineItem.TotalWeight = FreightBill.tWeight;
        newLineItem.Rate = FreightBill.BillRate;
        newLineItem.dispatchID = FreightBill.dispatchID;
        newLineItem.FreightHold = false;
        newLineItem.tWeight = FreightBill.tWeight;
        newLineItem.tHours = FreightBill.tHours;
        newLineItem.loads = FreightBill.loads;
        if (FreightBill.VNum === 1) newLineItem.FreightID = FreightBill.ID;
        else newLineItem.FreightID = FreightBill.ParentFreight;
        newLineItem.ParentFreight = FreightBill.ParentFreight;
        if (FreightBill.missing) FreightBill.onHold = true;
        newLineItem.onHold = FreightBill.onHold;
        newLineItem.JobDate = FreightBill.JobDate;
        newLineItem.Weights = [];



      

        newLineItem.tableLength = 1;


        newLineItem.Amount = Number(Number(newLineItem.Rate) * Number(newLineItem.Qty));
        newLineItem.Total = Math.round(Number(Number(newLineItem.Rate) * Number(newLineItem.Qty).toString()) * 100) / 100;

        if (!FreightBill.fuelBilled) {
            newLineItem.FuelTotal = Math.round((newLineItem.Amount * (FreightBill.FuelCharge / 100)) * 100) / 100;
            Invoice.showFuelCharge = true;
        } else newLineItem.FuelTotal = 0;
        if (FreightBill.billedBrokerPercent) { if (FreightBill.billedBrokerPercent > 0) newLineItem.BrokerTotal = Math.round(-1 * (newLineItem.Total * (FreightBill.billedBrokerPercent / 100)) * 100) / 100; else newLineItem.BrokerTotal = 0; } else newLineItem.BrokerTotal = 0;

        newLineItem.backTotal = newLineItem.Total + newLineItem.FuelTotal + newLineItem.BrokerTotal;
        newLineItem.TotalString = '$' + Number(newLineItem.Amount).formatMoney(2);
        //newLineItem.PONumber = FreightBill.PONumber;

        if (FreightBill.FreightTaxable) {

            if (FreightBill.FreightTaxRate) {
                Invoice.TaxRate = FreightBill.FreightTaxRate
                newLineItem.TaxTotal = newLineItem.Total * FreightBill.FreightTaxRate;
            } else newLineItem.TaxTotal = 0;
            newLineItem.Taxable = true;
        } else {
            newLineItem.TaxTotal = 0;
            newLineItem.Taxable = false;
        }


        newLineItem.Rate = FreightBill.BillRate;
        newLineItem.RateString = '$' + Number(newLineItem.Rate).formatMoney(2);
        newLineItem.FreightTotal = FreightBill.bTotal;
        newLineItem.RateType = FreightBill.BillType;
        newLineItem.BillType = FreightBill.BillType;
       // newLineItem.InvoiceVNums = FreightBill.InvoiceVNums;
        newLineItem.FuelPercent = FreightBill.FuelCharge + '%';
        newLineItem.BrokerPercent = FreightBill.billedBrokerPercent + '%';
        newLineItem.background = 'background-color : transparent!important';
        newLineItem.printBackground = 'background-color : transparent!important';
        newLineItem.isFreightBill = true;
        newLineItem.loadSite = FreightBill.loadSite;
        newLineItem.dumpSite = FreightBill.dumpSite;
      
        console.log("LineItems.length before = " + LineItems.length);
        LineItems.push(newLineItem);
        console.log("LineItems.length before = " + LineItems.length);
    }

    const makeStandByLineItem = (FreightBill, LineItems) => {
        var newLineItem = {};
        newLineItem.Type = 'Stand By';
        newLineItem.Description = 'Stand By';
        newLineItem.RateType = 'Stand By';
        if (FreightBill.totalStandBilled) newLineItem.amountString = '$' + Number(FreightBill.totalStandBilled).formatMoney(2);
        else newLineItem.amountString = '$' + Number(FreightBill.totalStandBilled).formatMoney(2);
        newLineItem.truckingBilled = FreightBill.truckingBilled;
        if(FreightBill.truckingBilled) newLineItem.hideFBNO=false; else newLineItem.hideFBNO=true;
      
        newLineItem.loadSite = FreightBill.loadSite;
        newLineItem.isFreightBill = false;
        newLineItem.dumpSite = FreightBill.dumpSite;
        newLineItem.dispatchID = FreightBill.dispatchID;
        newLineItem.FreightTotal = '';
      //  newLineItem.InvoiceVNums = FreightBill.InvoiceVNums;
        newLineItem.Qty = FreightBill.standExMin;
        newLineItem.QtyString = Number(newLineItem.Qty).formatMoney(2);
        newLineItem.Rate = FreightBill.standBR;
        newLineItem.Total = FreightBill.standBilled;
        if (!FreightBill.calcByLoad) newLineItem.lastWeight = true;
        newLineItem.RateString = '$' + Number(FreightBill.standBR).formatMoney(2);
        newLineItem.TotalString = '$' + Number(FreightBill.standBilled).formatMoney(2);
         newLineItem.FreightID = FreightBill.ID; 
        newLineItem.ParentFreight = FreightBill.ParentFreight;
        newLineItem.Amount = Number((Number(newLineItem.Rate) * Number(newLineItem.Qty)));
        newLineItem.truck = '';
        newLineItem.VNum = FreightBill.VNum;
        newLineItem.JobDate = '';
        newLineItem.Weights = [];
        newLineItem.TaxTotal = 0;
        newLineItem.onHold = FreightBill.onHold;
        if (FreightBill.onHold ) FreightBill.standByIsBilled = false; else FreightBill.standByIsBilled = true;
        newLineItem.FreightHold = FreightBill.onHold;
        console.log(' making stand byline item and on hold === '+newLineItem.onHold)
        if (FreightBill.PONumber) newLineItem.PONumber = FreightBill.PONumber;
        else newLineItem.PONumber = '';
        newLineItem.FBNO = FreightBill.FBNO;
        newLineItem.FBNumber = Number(FreightBill.FBNO);
        newLineItem.Driver = FreightBill.driverName;
        newLineItem.FuelPercent = '';

        if (FreightBill.totalExcessLoad) newLineItem.loadQty = FreightBill.totalExcessLoad; else newLineItem.loadQty = 0
        if (FreightBill.totalExcessDump) newLineItem.dumpQty = FreightBill.totalExcessDump; else newLineItem.dumpQty = 0;
        newLineItem.loadTotal = Math.round(Number(newLineItem.loadQty * FreightBill.standBR * 100)) / 100;
        newLineItem.dumpTotal = Math.round(Number(newLineItem.dumpQty * FreightBill.standBR * 100)) / 100;

        if (FreightBill.billedBrokerPercent) {
            newLineItem.BrokerTotal = Math.round(-1 * (FreightBill.standBilled * (FreightBill.billedBrokerPercent / 100)) * 100) / 100;
            newLineItem.loadBrokerTotal = Math.round(-1 * (FreightBill.loadTotal * (FreightBill.billedBrokerPercent / 100)) * 100) / 100;
            newLineItem.dumpBrokerTotal = Math.round(-1 * (FreightBill.loadTotal * (FreightBill.billedBrokerPercent / 100)) * 100) / 100;
        } else {
            newLineItem.BrokerTotal = 0;
            newLineItem.loadBrokerTotal = 0;
            newLineItem.dumpBrokerTotal = 0;
        }
     /*   if (FreightBill.FuelCharge) {
            newLineItem.FuelTotal = Math.round((FreightBill.standBilled * (FreightBill.FuelCharge / 100)) * 100) / 100;
            newLineItem.loadFuelTotal = Math.round((FreightBill.dumpTotal * (FreightBill.FuelCharge / 100)) * 100) / 100;
            newLineItem.dumpFuelTotal = Math.round((FreightBill.dumpTotal * (FreightBill.FuelCharge / 100)) * 100) / 100;
        } */
            newLineItem.FuelTotal = 0;
            newLineItem.loadFuelTotal = 0;
            newLineItem.dumpFuelTotal = 0;
      

        newLineItem.backTotal = newLineItem.Total + newLineItem.FuelTotal + newLineItem.BrokerTotal;
        newLineItem.loadBackTotal = newLineItem.loadTotal + newLineItem.loadFuelTotal + newLineItem.loadBrokerTotal;
        newLineItem.dumpBackTotal = newLineItem.dumpTotal + newLineItem.dumpFuelTotal + newLineItem.dumpBrokerTotal;
        newLineItem.tWeight = '';
        newLineItem.hasStandBy = false;
        console.log('FreightBill.FuelCharge = ' + FreightBill.FuelCharge);
        console.log('makign stand by line item and hideFBNO= '+ newLineItem.hideFBNO)
 
        LineItems.push({...newLineItem});
        console.log('LineItems inside stand by push =' + LineItems[LineItems.length-1].onHold)
    }

    Number.prototype.formatMoney = function(c, d, t) {
        var roundNum=this;
        roundNum=roundNum+.000001;
        var n = Number(roundNum),
            c = isNaN(c = Math.abs(c)) ? 2 : c,
            d = d === undefined ? "." : d,
            t = t === undefined ? "," : t,
            s = n < 0 ? "-" : "",
            
            i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
            j = (j = i.length) > 3 ? j % 3 : 0;
              
        return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
     
    };
    const getBase64ImageFromURL= (url) => {
        return new Promise((resolve, reject) => {
         const img = new Image();
         img.crossOrigin = 'Anonymous';
         img.src = url;
          
          img.onload = () => {
            var canvas = document.createElement("canvas");
            
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            var dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
          };
          img.onerror = error => {
            reject(error);
          };
        
        });
      }
    function toDataUrl(url, callback) {
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
                callback(reader.result);
            }
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
    } 
    return (
        <InvoiceContext.Provider value={{
            queryDispatches,createDispatches, createExpenseDispatches, createExpenses, queryExpenses, invoice, setInvoice, invoiceVisible, setInvoiceVisible,calcInvoiceTotal, checkInvoice, invoiceRef,printInvoice,printVisible, closePrintPopUp,
            makeFreightBillLineItem, makeScaleTagLineItem, makeExpenseLineItem, makeStandByLineItem,attachFreightBills, invoices, setInvoices,invoicesRef, setPrintTags, setPrintFBs, printTags, printFBs,showPrintTags,showPrintPopUp,setShowPrintTags
        }}>
            {children}
        </InvoiceContext.Provider>
    );
}
    export const useInvoice= () => {
        return useContext(InvoiceContext);
    };

