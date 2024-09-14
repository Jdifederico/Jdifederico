
import React, {useState,useContext,useRef, createContext,useCallback} from 'react'

import { db } from '../../firebase';
import { doc,  query, updateDoc, collection, addDoc, setDoc, onSnapshot, where } from 'firebase/firestore';


import { getStorage, ref, uploadBytes,getDownloadURL,uploadString } from "firebase/storage";
import { UserAuth } from '../../context/AuthContext';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

const FreightBillContext = createContext();
export const FreightBillContextProvider = ({ children }) => {
    const { gearedUser } = UserAuth();
    const [homeFreightBills, setHomeFreightBills] = useState([]);
    const [homeExpenses, setHomeExpenses] = useState([]);
    const [homeDate, setHomeDate]= useState(formatDate(new Date(), '/', 'YYYY/MM/DD')); 
    const [homeDispatches, setHomeDispatches] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [freightBill, setFreightBill] = useState({});
    const [driverFreightBill, setDriverFreightBill] = useState({});
    const [calendarStartDate, setCalendarStartDate]= useState(null);
    const [calendarEndDate, setCalendarEndDate]= useState(null);
    const storage = getStorage();
    const unsubscribeFreightBillsRef = useRef(null); // Store the unsubscribe functionf
    const unsubscribeDispatchesRef = useRef(null); // Store the unsubscribe function
    const unsubscribeExpensesRef =useRef(null);
    const freightBillIDRef= useRef(null);
    console.log('gearedUSer on load = ', gearedUser)
    
    pdfFonts['Roboto-Medium'] = {
        normal: 'Roboto-Medium.ttf',
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Medium.ttf',
        bolditalics: 'Roboto-Medium.ttf',
      };
      
      pdfMake.vfs = pdfFonts.pdfMake.vfs;
    
    const fetchExpenses = async(id)=>{

        const q = query(collection(db, "Organizations/"+gearedUser.selectedOrgName+"/Expenses"),where("FreightBill", "==", id));
        const tempExpenses = [];
        unsubscribeExpensesRef.current=   onSnapshot(q, (querySnapshot) => {
                querySnapshot.docChanges().forEach((change) => {  
                    let tempExpense = change.doc.data();
                    tempExpense.ID=change.doc.id;
                    console.log('found an expnes = ',tempExpense)
                    if (change.type === "added") {
                        tempExpenses.push(tempExpense);
                    }
                 
                    if (change.type === "modified") { 
                        const expenseIndex = tempExpenses.findIndex(e => e.ID === tempExpense.ID);
                        tempExpenses[expenseIndex] = tempExpense;
                    }
                    if (change.type === "removed") {
                      console.log('i am removing the freightbill', tempExpense)
                        const expenseIndex = tempExpenses.findIndex(e => e.ID === tempExpense.ID);
                        tempExpenses.splice(expenseIndex, 1);
                    }
                }); 
                console.log('setting temp =' , tempExpenses);
                setExpenses((prevExpenses) => [...tempExpenses]); // Ensure a new array reference is created

            });
    }

    const fetchFreightBill = async (id) => {
        console.log('runnign fetch freithg bill ya bois!!')
        return new Promise((resolve, reject) => {
            console.log(' runnign fetch freightBill = ', freightBill)
            console.log('id = ', id)
          if(freightBill){
           if (id === freightBill.ID) {
                console.log('THIS SHOULD NOT FIRE!!!');
                return resolve(freightBill);
            }
          }
            const docRef = doc(db, `Organizations/${gearedUser.selectedOrgName}/FreightBills`, id);
            onSnapshot(docRef, async (docSnap) => {
         
                const source = docSnap.metadata.hasPendingWrites ? "Local" : "Server";
                console.log('source =' +source)
                if (docSnap.exists() && source === "Server") {
             
                    let tempFreightBill = docSnap.data();
                    tempFreightBill.ID=docSnap.id;
                    setFreightBill({ ...tempFreightBill });
                  
                    console.log("set freigghty: ",{ ...tempFreightBill });
                 
                    return resolve(tempFreightBill);
                }
            });
        });
    };

    const fetchDriverFreightBill = async (id) => {
        console.log('runnign fetch freithg bill ya bois!!')
        return new Promise((resolve, reject) => {
            console.log(' runnign fetch driverFreightBill = ', driverFreightBill)
            console.log('id = ', id)
          if(driverFreightBill){
           if (id === driverFreightBill.ID) {
                console.log('THIS SHOULD NOT FIRE!!!');
                return resolve(driverFreightBill);
            }
          }
            const docRef = doc(db, `Organizations/${gearedUser.selectedOrgName}/DriverFreightBills`, id);
            onSnapshot(docRef, async (docSnap) => {
         
                const source = docSnap.metadata.hasPendingWrites ? "Local" : "Server";
                console.log('source =' +source)
                if (docSnap.exists() && source === "Server") {
             
                    let tempDriverFreightBill = docSnap.data();
                    tempDriverFreightBill.ID=docSnap.id;
                    setDriverFreightBill({ ...tempDriverFreightBill });
                  
                    console.log("set driver freigghty: ",{ ...tempDriverFreightBill });
                 
                    return resolve(tempDriverFreightBill);
                }
            });
        });
    };

    const queryExpenses = useCallback((startDate, endDate) => {
        const tempHomeExpenses = [];
        if(startDate!==calendarStartDate && endDate!==calendarEndDate){
            if (unsubscribeExpensesRef.current) unsubscribeExpensesRef.current();
            
            console.log('I AM OPENING A LISTENER TO THISE Expenses!!')
            const queryName = `Organizations/${gearedUser.selectedOrgName}/Expenses`;
            const q = query(collection(db, queryName), where("QueryDate", ">=", startDate), where("QueryDate", "<=", endDate));
            unsubscribeExpensesRef.current = onSnapshot(q, (querySnapshot) => {
                querySnapshot.docChanges().forEach((change) => {
                    const tempExpense = change.doc.data(); 
                    let source = change.doc.metadata.hasPendingWrites ? "Local" : "Server";
                
                    tempExpense.ID = change.doc.id;
                    console.log('expense snapshot fired and change.type = ', change.type)
                    if (change.type === "added") {
                    
                        tempHomeExpenses.push(tempExpense);
                    }
                    if (change.type === "modified") { 
                        const expenseIndex = tempHomeExpenses.findIndex(e => e.ID === tempExpense.ID);
                        console.log('found an exppense b4? ', tempHomeExpenses[expenseIndex])
                        tempHomeExpenses[expenseIndex] = tempExpense;
                        console.log('found an exppense in the arrya after ',    tempHomeExpenses[expenseIndex] )
                    }
                    if (change.type === "removed") {
                    console.log('i am removing the expensebill', tempExpense)
                        const expenseIndex = tempHomeExpenses.findIndex(e => e.ID === tempExpense.ID);
                        tempHomeExpenses.splice(expenseIndex, 1);
                    }
                });
            
          
                setCalendarStartDate(startDate);
                setCalendarEndDate(endDate)
                setHomeExpenses((prevExpenses) => [...tempHomeExpenses]); 
    
                if(freightBillIDRef.current){
                    const tempExps= tempHomeExpenses.filter(expense => expense.FreightBill === freightBillIDRef.current);
                    setExpenses((prevExps)=>[...tempExps]);
                } 
             
           
            });
        }
    }, [calendarStartDate, calendarEndDate]);

    const queryFreightBills = useCallback((startDate, endDate) => {
        const freightBills = [];
        if(startDate!==calendarStartDate && endDate!==calendarEndDate){
            if (unsubscribeFreightBillsRef.current) unsubscribeFreightBillsRef.current();
            
            console.log('I AM OPENING A LISTENER TO THISE FREGITH BILLS!!')
            const queryName = `Organizations/${gearedUser.selectedOrgName}/FreightBills`;
            const q = query(collection(db, queryName), where("QueryDate", ">=", startDate), where("QueryDate", "<=", endDate));
            unsubscribeFreightBillsRef.current = onSnapshot(q, (querySnapshot) => {
                querySnapshot.docChanges().forEach((change) => {
                    const tempFB = change.doc.data(); 
                    let source = change.doc.metadata.hasPendingWrites ? "Local" : "Server";
                
                    tempFB.ID = change.doc.id;
                    if (change.type === "added") {
                    
                        freightBills.push(tempFB);
                    }
                    if (change.type === "modified") { 
                        const freightIndex = freightBills.findIndex(f => f.ID === tempFB.ID);
                        freightBills[freightIndex] = tempFB;
                    }
                    if (change.type === "removed") {
                    console.log('i am removing the freightbill', tempFB)
                        const freightIndex = freightBills.findIndex(f => f.ID === tempFB.ID);
                        freightBills.splice(freightIndex, 1);
                    }
                });
            
                let tempFreightBills =[...freightBills];
                setCalendarStartDate(startDate);
                setCalendarEndDate(endDate)
                setHomeFreightBills( tempFreightBills);
            });
        }
    }, [calendarStartDate, calendarEndDate]);
    
    const queryDispatches = useCallback((startDate, endDate) => {
      let dispatches = [];
      if (unsubscribeDispatchesRef.current) unsubscribeDispatchesRef.current();
     
      const queryName = `Organizations/${gearedUser.selectedOrgName}/Dispatches`;
      const q = query(collection(db, queryName), where("QueryDate", ">=", startDate), where("QueryDate", "<=", endDate));
      onSnapshot(q, (querySnapshot) => {
          console.log('DISPATCH HOME SNAPSHOT FIRING');
          querySnapshot.docChanges().forEach((change) => {
              const tempDispatch = change.doc.data();
              tempDispatch.FreightBills = [];
              if (change.type === "added") {
                  tempDispatch.ID = change.doc.id;
                  dispatches.push(tempDispatch);
              }
              if (change.type === "modified") {
                  const dispatchIndex = dispatches.findIndex(d => d.ID === tempDispatch.ID);
                  dispatches[dispatchIndex] = tempDispatch;
              }
          });
    
          console.log('setting full home Dispatches = ', dispatches);
          setHomeDispatches(dispatches);
      
      });
    }, [calendarStartDate, calendarEndDate]);

    const uploadPDFFile = async(document)=>{
        let storageRef = ref(storage, 'attachments/'+freightBill.companyID+'FreightBills/' +freightBill.ID+'/PDFs/'+freightBill.ID+'ShipperSign.pdf');
        const snapshot = await uploadString(storageRef, document, 'base64');
        const url = await getDownloadURL(storageRef);
        return url;
      }
    const createPDF =function(FreightBill){
      
        var truckname, trailername;
   
            
      
            if(FreightBill.Trailer){if(FreightBill.Trailer.Name==='No Trailer') trailername=''; else trailername=FreightBill.Trailer.Name;}else trailername='';
            if(FreightBill.Truck) {if(FreightBill.Truck.Name==='No Truck')  truckname=''; else truckname= FreightBill.Truck.Name;} else  truckname=''; 
            let CompanyHeader=  FreightBill.Company.Address +", " + FreightBill.Company.address2  +  "\nOffice: "  + FreightBill.Company.CompanyPhone+ "   Fax: "  +FreightBill.Company.Fax ;
            var haulerText= [{ bold:true, text:'Driver Name: '  }, FreightBill.driverName];
            if(FreightBill.Subhauler)  haulerText= [{ bold:true, text:'Sub-Hauler: ' },FreightBill.haulerName]; 
            let firstRow=[{colSpan: 2, rowSpan:2, fontSize: 15, text:haulerText}, {}, { text:[{bold:true,text: 'Job #: ' }, FreightBill.jobNO]}];
           
            let secondRow=[  {}, {}, { text:[{bold:true,text:'Date: '}, FreightBill.JobDate]} ]
            let thirdRow=[{ text:[{bold:true,text:'Rate Type: '}, FreightBill.PayType]}, { text:[{bold:true,text: 'Number of Loads: '}, FreightBill.loads]}, { text:[{bold:true,text: 'Truck: '}, truckname]}];
            let shipperAndReceiverRow=[
                {fontSize: 15, text:[{bold:true,text:'Shipper: ' }, FreightBill.Shipper.Name]},
                {fontSize: 15, text:[{bold:true, text:'Receiver: ' }, FreightBill.Receiver.Name]}
            ];
      
            let fourthRow=[ {text:[{bold:true, text:'Material: '}, FreightBill.materialName]},  {text:[{bold:true, text:'TruckType: ' }, FreightBill.TruckType.Name]},  {text:[{bold:true, text:'Trailer: ' }, trailername]}];
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
            
            var docDefinition = {
                content: [],
                 pageMargins: [15, 55, 15, 0],
                styles: {
                    header: {
                        fontSize: 18,
                        bold: true,
                        margin: [0, 0, 0, 10]
                    },
                    subheader: {
                        fontSize: 16,
                        bold: true,
                        margin: [0, 10, 0, 5]
                    },
                    tableExample: {
                        margin: [0, 5, 0, 15]
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 13,
                        color: 'black'
                    }
                }
            };
            
      
            docDefinition.header=[
                { margin: [0, 0, 0, 0],text:FreightBill.Company.CompanyName,  fontSize: 19,  bold: true, alignment: 'center'},
                {margin: [0, -18, 15, 0],text: 'FB#: ' + FreightBill.FBNO, alignment: 'right'}, 
                {  text: CompanyHeader, margin: [0, 2, 0, 0],  bold: true, alignment: 'center', fontSize: 10 }
            ];
            // docDefinition.content.push(FreightBillHeader2);
            
            let freightBillInfo= {
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
      
            pdfMake.createPdf(docDefinition).getBase64(async function(encodedString) {
                let base64PDF = encodedString;
            
                pdfMake.createPdf(docDefinition).download('FreightBill.pdf')
              
      
            });
      
          //  savePDF(action); 
      
      }
      
    return (
        <FreightBillContext.Provider value={{
            setHomeFreightBills, homeFreightBills, setHomeDispatches, homeDispatches, setHomeExpenses, homeExpenses, queryFreightBills, queryExpenses,queryDispatches,createPDF,
            formatDate,  homeDate, setHomeDate, fetchFreightBill, fetchDriverFreightBill, driverFreightBill, fetchExpenses, expenses, setExpenses, freightBill, setFreightBill, setDriverFreightBill, freightBillIDRef, 
        }}>
            {children}
        </FreightBillContext.Provider>
    );
}
    export const useFreightBill= () => {
        return useContext(FreightBillContext);
    };

    function formatDate(date, divider, format) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2)  month = '0' + month;
        if (day.length < 2)  day = '0' + day;
    
        if(format==='YYYY/MM/DD')return [year, month, day].join(divider);
        else return [month, day,year].join(divider);
    }