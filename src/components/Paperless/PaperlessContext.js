import React,{useState,useContext,createContext, useEffect} from 'react'

import  { setOptions} from '@mobiscroll/react';    
import { db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { doc, updateDoc,getDoc,  query, setDoc, collection,  onSnapshot, where } from 'firebase/firestore';

import { getStorage, ref, uploadBytes,getDownloadURL,uploadString } from "firebase/storage";
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { UserAuth } from '../../context/AuthContext'
const PaperlessContext = createContext();

export const PaperlessContextProvider = ({ children }) => {

  const storage = getStorage();
  const {gearedUser} = UserAuth();
  const [paperlessState, setPaperlessState] = useState('none');
  const [freightBill, setFreightBill]= useState({ID:''});
  const [loadOrders, setLoadOrders]= useState([]);
  const [truckFreightBills, setTruckFreightBills]= useState([]);
  const [submitStatus, setSubmitStatus] = useState('Entry');
  const [homeDate, setHomeDate]= useState(''); 
  const [approveType, setApproveType] = useState('');
  const [pdfUrl, setPdfUrl]=useState('');
  const [activeIndex, setActiveIndex] = useState(1);
  const [navListItems, setNavListItems] = useState(null);

  const navigate = useNavigate();

  const uploadPDFFile = async(document)=>{
    let storageRef = ref(storage, 'attachments/'+freightBill.companyID+'FreightBills/' +freightBill.ID+'/PDFs/'+freightBill.ID+'ShipperSign.pdf');
    const snapshot = await uploadString(storageRef, document, 'base64');
    const url = await getDownloadURL(storageRef);
    return url;
  }

  pdfFonts['Roboto-Medium'] = {
    normal: 'Roboto-Medium.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Medium.ttf',
    bolditalics: 'Roboto-Medium.ttf',
  };
  
  pdfMake.vfs = pdfFonts.pdfMake.vfs;

  function formatDate(date, divider, format) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    if(format==='YYYY/MM/DD')return [year, month, day].join(divider);
    else return [month, day,year].join(divider);
}

  const checkWeightTags = (tempApproveType)=>{
    var missingWeights = [];
    setApproveType(tempApproveType);

    var tempFields = ['timestamp','Status', 'StatusTime'];
    var tempValues = [Date.now(),'Signing Out', convertReactDate(Date.now())];
    updateFreightBillFields(tempFields,tempValues);
    if(freightBill.BillType=='Ton'){
        if(freightBill.Weights.length!=0){
            for (var v=0; v<freightBill.Weights.length; v++){
                var testWeight = freightBill.Weights[v];
                console.log('testWeight = ', testWeight)
                if(!testWeight.tagNO) missingWeights.push(testWeight.loadNumber);
                console.log('testWeight tag url= '+ testWeight.tagNO)
            }
        } 
        if(missingWeights.length>0){
            var missingWeightText = 'Missing scale tag for the following loads:';
            for(var k=0; k<missingWeights.length; k++){
                if(k==0)missingWeightText+=' #'+ missingWeights[k].toString();
                else missingWeightText+=', #' + missingWeights[k].toString();
            }
            missingWeightText +='. Would you like to continue?'
            window.confirm(missingWeightText, function(result) {
                if (result){viewPDF() }    
            });
        }else viewPDF();
    }else viewPDF();
}

const viewPDF = ()=>{
    createPDF('view');
    setActiveIndex(2);
    setPdfUrl('');
    setSubmitStatus('View PDF')
}

const createPDF =function(action){
      
  var truckname, trailername;
 // if(approveType=='Shipper')freightBill.approveShipperSignature = approveSignaturePad.toDataURL();
//  if(approveType=='Receiver')freightBill.approveReceiverSignature = approveSignaturePad.toDataURL();
      

      if(freightBill.Trailer){if(freightBill.Trailer.Name==='No Trailer') trailername=''; else trailername=freightBill.Trailer.Name;}else trailername='';
      if(freightBill.Truck) {if(freightBill.Truck.Name==='No Truck')  truckname=''; else truckname= freightBill.Truck.Name;} else  truckname=''; 
      let CompanyHeader=  freightBill.Company.Address +", " + freightBill.Company.address2  +  "\nOffice: "  + freightBill.Company.CompanyPhone+ "   Fax: "  +freightBill.Company.Fax ;
      var haulerText= [{ bold:true, text:'Driver Name: '  }, freightBill.driverName];
      if(freightBill.Subhauler)  haulerText= [{ bold:true, text:'Sub-Hauler: ' },freightBill.haulerName]; 
      let firstRow=[{colSpan: 2, rowSpan:2, fontSize: 15, text:haulerText}, {}, { text:[{bold:true,text: 'Job #: ' }, freightBill.jobNO]}];
     
      let secondRow=[  {}, {}, { text:[{bold:true,text:'Date: '}, freightBill.JobDate]} ]
      let thirdRow=[{ text:[{bold:true,text:'Rate Type: '}, freightBill.PayType]}, { text:[{bold:true,text: 'Number of Loads: '}, freightBill.loads]}, { text:[{bold:true,text: 'Truck: '}, truckname]}];
      let shipperAndReceiverRow=[
          {fontSize: 15, text:[{bold:true,text:'Shipper: ' }, freightBill.Shipper.Name]},
          {fontSize: 15, text:[{bold:true, text:'Receiver: ' }, freightBill.Receiver.Name]}
      ];

      let fourthRow=[ {text:[{bold:true, text:'Material: '}, freightBill.materialName]},  {text:[{bold:true, text:'TruckType: ' }, freightBill.TruckType.Name]},  {text:[{bold:true, text:'Trailer: ' }, trailername]}];
      let sixthRow=[{text:[{bold:true, text:'Origin: '}, freightBill.loadSite]}, {text:[{bold:true, text:'Destination: ' }, freightBill.dumpSite]}];
      let seventhRow=[{text:[{bold:true, text:'Address: ' }, freightBill.loadAddress]}, {text:[{bold:true, text:'Address: ' }, freightBill.dumpAddress]}];
      
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
  
      console.log('freightBill.approveShipperSignature = ', freightBill.approveShipperSignature)
      var driverSignatureImage={ width:265,text: '',  height:50}; 
      var approveSignatureImage={ width:265,text: '',  height:50};
      
      if(freightBill.driverSignature) driverSignatureImage={ width:265,image: freightBill.driverSignature, height:50};
      if(approveType==='Shipper') if(freightBill.approveShipperSignature)approveSignatureImage={ width:265,image: freightBill.approveShipperSignature, height:50};
      if(approveType==='Receiver') if(freightBill.approveReceiverSignature)approveSignatureImage={ width:265,image: freightBill.approveReceiverSignature, height:50};
      //    if(approveType=='Receiver')if(!freightBill.approveReceiverSignature)approveSignatureImage={ width:265,text: '',  height:50}; else approveSignatureImage={ width:265,image: freightBill.approveReceiverSignature, height:50};
  
  //  console.log('driverSignatureImage = ' +driverSignatureImage);
  //  console.log('approveSignatureImage = ' +approveSignatureImage);
      weightTable.push(weightTableHeaders);
      weightTable.push(weightTableHeaders2);
      expenseTable.push(expenseTableHeaders);
      
      let weightTableWidths=['*',55,'*','*','*',40,'*','*',40];
      let expenseTableWidths=['*','*','*','*'];
      for(var i=0; i<freightBill.Weights.length; i++){
          var materialName='';
        
          if(freightBill.Weights[i].Material){
            if(freightBill.Weights[i].Material.Name) materialName=freightBill.Weights[i].Material.Name;
            else materialName=freightBill.Weights[i].Material;
          } 
          var loadStart, loadEnd, dumpStart, dumpEnd;
          loadStart = convertReactDate(freightBill.Weights[i].loadStart);
          loadEnd = convertReactDate(freightBill.Weights[i].loadEnd);
          dumpStart = convertReactDate(freightBill.Weights[i].dumpStart);
          dumpEnd = convertReactDate(freightBill.Weights[i].dumpEnd);
          let weightTableRow=[
              {text: materialName, alignment:'center' },
              {text: freightBill.Weights[i].tagNO, alignment:'center' },
              {text: freightBill.Weights[i].weight, alignment:'right' },
              {text: loadStart, alignment:'center' },
              {text: loadEnd, alignment:'center' },
              {text: freightBill.Weights[i].excessLoad, alignment:'right' },
              {text: dumpStart, alignment:'center' },
              {text: dumpEnd, alignment:'center' },
              {text: freightBill.Weights[i].excessDump, alignment:'right' }
          ];
          weightTable.push(weightTableRow);
      }
      
      let totalWeightRow=[
          {colSpan: 2,bold:true, text: 'Total Weight:',  alignment: 'right'},
          {},
          {text:freightBill.tWeight,alignment: 'right'},
          {colSpan: 2, bold:true, text: 'Total:', alignment: 'right'},
          {},
          {text: freightBill.totalExcessLoad,alignment: 'right'},
          {colSpan: 2, bold:true, text: 'Total:', alignment: 'right'},
          {},
          {text: freightBill.totalExcessDump,alignment: 'right'}
      ];
      weightTable.push(totalWeightRow);
      console.log('weightTable = ', weightTable);
      
      let expenseRowCount=0;
      for(var j=0; j<freightBill.Expenses.length; j++){
          let expenseTableRow=[
              freightBill.Expenses[j].Name.Name,
              freightBill.Expenses[j].qty,
              freightBill.Expenses[j].rate,
              freightBill.Expenses[j].total
          ];
      if(freightBill.Expenses[j].Name!=='Stand By'){
          expenseRowCount++;
          expenseTable.push(expenseTableRow);
      } 
      }
      console.log('expenseTable = ',expenseTable);
      var startTime, endTime, arriveRoundTrip, departRoundTrip;
      startTime = convertReactDate(freightBill.startTime);
      endTime = convertReactDate(freightBill.endTime);
      arriveRoundTrip = convertReactDate(freightBill.arriveRoundTrip);
      departRoundTrip = convertReactDate(freightBill.departRoundTrip);
      let timeRows=[[{text:[{bold:true, text:'Start Time: '},startTime]},{text:[{bold:true, text:'End Time: ' }, endTime]}, {text:[{bold:true, text:'Total Hours: ' }, freightBill.grossHours]}, {text:[{bold:true, text:'Deduction: ' }, freightBill.lunch]}]];
      var timeRow2=[{},{}, {},{text:[{bold:true, text:'Hours: '}, freightBill.tHours]}  ];
      if(freightBill.PayType==='Hour' || freightBill.PayType==='Hour/Percent') timeRow2=[{text:[{bold:true, text:'Depart Load: '},departRoundTrip]},{text:[{bold:true, text:'Arrive Dump: ' }, arriveRoundTrip]}, {text:[{bold:true, text:'Running Time: ' }, freightBill.runningTime]},{text:[{bold:true, text:'Hours: '}, freightBill.tHours]}  ];
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
          { margin: [0, 0, 0, 0],text:freightBill.Company.CompanyName,  fontSize: 19,  bold: true, alignment: 'center'},
          {margin: [0, -18, 15, 0],text: 'FB#: ' + freightBill.FBNO, alignment: 'right'}, 
          {  text: CompanyHeader, margin: [0, 2, 0, 0],  bold: true, alignment: 'center', fontSize: 10 }
      ];
      // docDefinition.content.push(freightBillHeader2);
      
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
                  [{ text: [{ bold: true, text: 'Driver Name: ' }, freightBill.driverName] }, { text: [{ bold: true, text: 'Consignor Name: ' }, freightBill.signatureName] }],
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
      if(!freightBill.approverComments)freightBill.approverComments='';
      
      let freightBillComments={
          table: {
              widths: ['*', '*'],
              body: [
                  [{text:[{bold:true, text:'Driver Comments: '},   freightBill.Comments ], alignment:'center' },
                  {text:[{bold:true, text:'Approver Comments: '},   freightBill.approverComments ], alignment:'center' }]
              ]
          }
      }
      
      docDefinition.content.push(freightBillComments);
     
      console.log('docDefinition = ' , docDefinition);

      pdfMake.createPdf(docDefinition).getBase64(async function(encodedString) {
          let base64PDF = encodedString;
          const PDFURL = await uploadPDFFile(base64PDF);
          if(PDFURL)setPdfUrl(PDFURL);
          if(action =='download') pdfMake.createPdf(docDefinition).download('FreightBill.pdf')
          if(action==='text')setTimeout(textPDF(),0)
          console.log('pdfUrl=', pdfUrl);
      });

    //  savePDF(action); 

}

const textPDF=()=>{
  
        
  var data = {

      OrganizationName: freightBill.companyID,
      FreightID:freightBill.ID,
      body:  'Click this link to download PDF of Freight Bill ' + pdfUrl,
      from: '+14084594362',
      to: '+1'+freightBill.textPhoneNumber
  };
  fetch('https://geared.tech/text',{
      method: 'POST',   
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
  }).then(function successCallback(response) {
      console.log('TEXT IS SENT', response);

  }, function errorCallback(response) {
   

      console.log('text faield to send = ', response);
  });
}

  const checkGearedTime = (time) => {
    if(time){
      if (time!=='' && time.length!==5)return true; else return false;
    }else return false;
  }

  const updateAuditLog = async(tempFreightBill)=>{

    const secondsSinceEpoch = Math.round(Date.now() / 1000);
    let fullDate = new Date().toString();

    let newAuditLog={
      User:gearedUser.Name,
      ID:secondsSinceEpoch.toString(),
      DateAndTime: fullDate,
      ActivityType:"add Load on Mobile FB", 
      ObjectType:"FreightBills",
      Value: tempFreightBill.Weights
    }
    console.log(' newAuditLog =',  newAuditLog);
    console.log(' this looks like = ' + 'Organizations/'+ freightBill.companyID+'/AuditLogs/FreightBills/'+ tempFreightBill.ID+'/' +secondsSinceEpoch.toString());
  
    const auditLogRef = doc(db, 'Organizations/'+ freightBill.companyID+'/AuditLogs/FreightBills/'+ tempFreightBill.ID, secondsSinceEpoch.toString());
    setDoc(auditLogRef,  newAuditLog);
          //  Organization.collection("AuditLogs").doc(objectType).collection(objectID).doc(secondsSinceEpoch.toString()).set(newAuditLog).then(function(finishedDoc){	}).catch(function(error) { console.log('error getting driver freight two', error); });
        
  }
        
  const fetchTrucksFreightBill = async (tempFreightBill,orgName, id) => {
    console.log('tempfreightBill = ', tempFreightBill);
    const q = query(collection(db, "Organizations/"+orgName+"/DriverFreightBills"),where("phoneNumber", "==", tempFreightBill.phoneNumber),where("Driver", "==",tempFreightBill.Driver),where("dispatchID", "==",tempFreightBill.dispatchID));


      tempFreightBill.TrucksAssigned = 0;
      let tempTruckFreightBills=[];
      console.log('about to runt eh truck freightbill querye');
      let tempdate = new Date;

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
    
          const cities = [];
          querySnapshot.docChanges().forEach((change) => {
    
            let truckFreightBill= change.doc.data();
            if (change.type === "added") {
              tempFreightBill.TrucksAssigned++;
              tempTruckFreightBills.push(truckFreightBill);  
            }
            if (change.type === "modified") {
              tempTruckFreightBills=truckFreightBills;
              console.log('truckFreightBills.length = ' + truckFreightBills.length);
              for(var q=0; q<truckFreightBills.length; q++){
                console.log('tempTruckFreightBills[q] = ', tempTruckFreightBills[q]);
                if(tempTruckFreightBills[q].ID==truckFreightBill.ID)tempTruckFreightBills[q]=truckFreightBill;
              }
                console.log("Modified city: ", change.doc.data());
            }
            if (change.type === "removed") {
              tempTruckFreightBills=truckFreightBills;
              console.log('truckFreightBills.length = ' + truckFreightBills.length);
              for(var q=0; q<truckFreightBills.length; q++){
                if(tempTruckFreightBills[q].ID==truckFreightBill.ID)tempTruckFreightBills.splice(q,1)
                tempFreightBill.TrucksAssigned--;
              }
            }
            console.log('id  =', id)
            console.log('found truckFreight =', truckFreightBill)
          
            if(!truckFreightBill.Received){
              let realTempDate=  formatDate(tempdate.setDate(tempdate.getDate()), '/', 'MM/DD/YYYY');
              if (Number(tempdate.getMinutes()) < 10) realTempDate = realTempDate + ' ' + tempdate.getHours() + ':' + '0' + tempdate.getMinutes();
              else realTempDate = realTempDate + ' ' + tempdate.getHours() + ':' + tempdate.getMinutes();
              console.log('trealTempDate= ', realTempDate);
              truckFreightBill.Received = true;
        
              var newReceivedFreight = { FreightID:  truckFreightBill.ID, Received: true, ReceivedTime: realTempDate };
              let receivedFreightRef = doc(db, 'Organizations/'+orgName+'/ReceivedFreightBills', truckFreightBill.ID);
              setDoc(receivedFreightRef,  newReceivedFreight);
            }
          
          });
          console.log('setting truck freight bills = ', tempTruckFreightBills);
   
          setTruckFreightBills(tempTruckFreightBills);
          return new Promise(function(resolve,reject){
            console.log('when does this run?!?!');
            console.log('and the real truck freight bills = ', truckFreightBills);
            setFreightBill(prevState => ({...prevState,  TrucksAssigned: tempTruckFreightBills.TrucksAssigned }));
            return resolve( tempTruckFreightBills);
          });
       
        }); 
      
  }

  
 const fetchNoDispatch =async(id,orgname)=>{
        
 
      console.log('we are fetching dispatch for orgname = ', orgname);
      console.log('and the id = '+ id);
      const docRef = doc(db, 'Organizations/'+orgname+'/UnassignedTexts', id);
      const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            var UnassignedText = docSnap.data();
            UnassignedText.read=true;
            console.log('we got the nodispatch object like this ', UnassignedText);
            setFreightBill(UnassignedText);
            const noDispRef = doc(db, 'Organizations/'+ orgname+'/UnassignedTexts', id);
          
            updateDoc(noDispRef, {"read": true}).then((tempFreight) => {
              
            })
      
          }else console.log('this text no EXIST');
     


    
}
  const fetchFreightBill = async (id,orgName) => {
 
    return new Promise(function(resolve,reject){
      console.log('orgName = ' + orgName)
      console.log('id = ' + id)
      console.log('freightBill.ID =' + freightBill.ID)
      if(id===freightBill.ID){
        console.log('THIS SHOULD NOT FIRE!!!');
        if(!freightBill.startTimePaid && !freightBill.Subhauler)  setSubmitStatus('Clock-In');  
        if(freightBill.Material)freightBill.materialName=freightBill.Material.Name;
        resolve(freightBill);
      } 
      const docRef = doc(db, 'Organizations/'+orgName+'/DriverFreightBills', id);
 
    
      let firstTime = true;
        
    
       onSnapshot(docRef, async(docSnap) => {
        console.log("Current data: ", docSnap.exists());
        const source = docSnap.metadata.hasPendingWrites ? "Local" : "Server";

        if (docSnap.exists() && source ==="Server") {
          docSnap.data().ID=docSnap.id;
      
          let paperlessFreight=docSnap.data();
          console.log('GETTING Fb and its  = ',   paperlessFreight)
          let tempDate = new Date();
          if(!paperlessFreight.totalYardHours)paperlessFreight.totalYardHours=0;
          if(!paperlessFreight.travelTime)paperlessFreight.travelTime=0;
          if(!paperlessFreight.startTravelTime)paperlessFreight.startTravelTime='';
       
          if(checkGearedTime(paperlessFreight.startTimePaid))paperlessFreight.startTimePaid=  paperlessFreight.startTimePaid.toDate();
          if(checkGearedTime(paperlessFreight.endTimePaid))paperlessFreight.endTimePaid=  paperlessFreight.endTimePaid.toDate();
          console.log('GETTING FB AND STARTIMEPAID ==  = ',   paperlessFreight.startTimePaid)
          if (checkGearedTime(paperlessFreight.startTime))  paperlessFreight.startTime = paperlessFreight.startTime.toDate();
          if(checkGearedTime(paperlessFreight.endTime))paperlessFreight.endTime=  paperlessFreight.endTime.toDate();
          if(checkGearedTime(paperlessFreight.departRoundTrip))paperlessFreight.departRoundTrip=  paperlessFreight.departRoundTrip.toDate();
          if(checkGearedTime(paperlessFreight.arriveRoundTrip))paperlessFreight.arriveRoundTrip=  paperlessFreight.arriveRoundTrip.toDate();

          for (let i = 0; i< paperlessFreight.Weights.length; i++){
        
            // paperlessFreight.Weights[i].uploadRef=useRef(null);
            console.log('paperlessFreight.Weights[i]?.loadStart) = ' , paperlessFreight.Weights[i].loadStart)
            if(checkGearedTime(paperlessFreight.Weights[i].loadStart)) paperlessFreight.Weights[i].loadStart =  paperlessFreight.Weights[i].loadStart.toDate();
            if(checkGearedTime(paperlessFreight.Weights[i].dumpStart)) paperlessFreight.Weights[i].dumpStart =  paperlessFreight.Weights[i].dumpStart.toDate();
            if(checkGearedTime(paperlessFreight.Weights[i].dumpEnd)) paperlessFreight.Weights[i].dumpEnd =  paperlessFreight.Weights[i].dumpEnd.toDate();
            if(checkGearedTime(paperlessFreight.Weights[i].loadEnd)) paperlessFreight.Weights[i].loadEnd =  paperlessFreight.Weights[i].loadEnd.toDate();
            if(paperlessFreight.Weights[i].Material)paperlessFreight.Weights[i].materialName=paperlessFreight.Weights[i].Material.Name;
            console.log('paperlessweight now = ', paperlessFreight.Weights[i]);
          }  
          if(paperlessFreight.Material)paperlessFreight.materialName=paperlessFreight.Material.Name;
          console.log('paperlessFreight.materialName = ' + paperlessFreight.materialName);
          paperlessFreight.loaded=true;
          if(!paperlessFreight.startTimePaid)  setSubmitStatus('Clock-In'); 
          console.log('RETURNING THE SNAP.DATA!!! ')
          if(firstTime){
            firstTime=false;
            if(!paperlessFreight.Received){
              let tempdate = new Date;
              let realTempDate=  formatDate(tempdate.setDate(tempdate.getDate()), '/', 'MM/DD/YYYY');
              if (Number(tempdate.getMinutes()) < 10) realTempDate = realTempDate + ' ' + tempdate.getHours() + ':' + '0' + tempdate.getMinutes();
              else realTempDate = realTempDate + ' ' + tempdate.getHours() + ':' + tempdate.getMinutes();
              console.log('trealTempDate= ', realTempDate);
              paperlessFreight.Received = true;
        
              var newReceivedFreight = { FreightID:  paperlessFreight.ID, Received: true, ReceivedTime: realTempDate };
              let receivedFreightRef = doc(db, 'Organizations/'+orgName+'/ReceivedFreightBills', paperlessFreight.ID);
              setDoc(receivedFreightRef,  newReceivedFreight);
              if(paperlessFreight.Cancelled ) alert('Thank you, your dispatcher has been notified you have received this cancellation.')
            }
          
            const loadOrderRef = doc(db, 'Organizations/'+paperlessFreight.companyID+'/LoadOrders',paperlessFreight.dispatchID);
            onSnapshot(loadOrderRef, async(docSnap) => {
              console.log("Current data: ", docSnap.exists());
              const source = docSnap.metadata.hasPendingWrites ? "Local" : "Server";
    
              if (docSnap.exists() && source ==="Server") {
                docSnap.data().ID=docSnap.id;
            
                let tempLoadOrders=docSnap.data();
                setLoadOrders(tempLoadOrders.LoadOrders)
                console.log('got the load oorders = ' , tempLoadOrders.LoadOrders)
                
              }
              });
          }
          setFreightBill(paperlessFreight)
          console.log('we are now setting freightbill and it = ',  freightBill)
          return resolve(paperlessFreight);
         

        
        }
      });

    })
  

  };
  const fetchFileFromUrl = ( weight) => {
    fetch(weight.TagUrl)
      .then((response) => response.blob())
      .then((blob) => {
   
        const file = new File([blob], "weight"+weight.loadNumber+"TagPic.jpg", { type: "image/jpeg" });
        weight.selectedFiles=[file];
        return file;
    
      })
      .catch((error) => console.error(error));
  };
  const uploadWeightFile = async(file,weight)=>{
    console.log('file = ', file)
    
    let storageRef = ref(storage, 'attachments/'+freightBill.companyID+'/FreightBills/' + freightBill.ID+'/Weights/'+file.name);
    uploadBytes(storageRef, file).then((snapshot) => {
      getDownloadURL(storageRef).then((url) => {
        console.log('Uploaded a blob or file!', url);
        weight.TagUrl=url;
        console.log('wait how does the weight lookd = ', weight);
        console.log('Freightbill.weights = ', freightBill.Weights);
        updateFreightBillField('Weights',freightBill.Weights);
      });
    });
  }
  const uploadFreightFile = async(file)=>{
    console.log('file = ', file)
    let storageRef = ref(storage, 'attachments/'+freightBill.companyID+'/FreightBills/' + freightBill.ID+'/'+file.name);
    uploadBytes(storageRef, file).then((snapshot) => {
      getDownloadURL(storageRef).then((url) => {
        console.log('Uploaded a blob or file!', url);
        freightBill.Picture=url;
        console.log('Freightbill.Picture = ', freightBill.Picture);
        updateFreightBillField('Picture',freightBill.Picture);
      });
    });
  }
  const updateQuillNotes = async(fieldName,rawText, quillFieldName, quillFieldValue,cursorSelectionName, cursorSelection  ) =>{
    const freightRef = doc(db, 'Organizations/'+ freightBill.companyID+'/DriverFreightBills', freightBill.ID);
    await updateDoc(freightRef, { 
      [fieldName]:  rawText, 
      [quillFieldName]:quillFieldValue, 
      [cursorSelectionName]: cursorSelection 
    }).then((tempFreight) => {
      console.log('hmmm mtemp freigth = ', tempFreight);
    });
  }
  const convertReactDate = (reactDate) =>{
    if(reactDate!='' && reactDate!="NaN:NaN"){
      var date = new Date(reactDate);
      console.log('convertin date = ' , reactDate);
      if(!date.getHours())return reactDate;
      var hours, minutes;
      if(Number(date.getHours())<10)hours = "0" + date.getHours();
      else  hours = date.getHours();

      if(Number(date.getMinutes())<10)minutes = "0" + date.getMinutes();
      else minutes =  date.getMinutes().toString();

      var formattedTime = hours + ':' + minutes.substring(-2);
      console.log('formatted Time = ' + formattedTime)

      return formattedTime;
    }else return '';

  }
  const updateFreightBillWeights = async() =>{
    const freightRef = doc(db, 'Organizations/'+ freightBill.companyID+'/DriverFreightBills', freightBill.ID);
    setFreightBill(prevState => ({...prevState,  Weights:freightBill.Weights }));
   
    console.log('setting status of freigtbhill = ' , freightBill.Status);
    if(!freightBill.AverageRoundTrip) freightBill.AverageRoundTrip = '';
    if(!freightBill.AverageDumpTime) freightBill.AverageDumpTime = '';
    if(!freightBill.AverageLoadTime) freightBill.AverageLoadTime= '';
    if(!freightBill.mobileStartTime)freightBill.mobileStartTime='';
    if(!freightBill.paidStandExMin)freightBill.paidStandExMin=0;
    if(!freightBill.paidExpenses)freightBill.paidExpenses=0;
    if(!freightBill.billedExpenses)freightBill.billedExpenses=0;
    if(!freightBill.hoursWorked)freightBill.hoursWorked=0;
    if(!freightBill.paidHoursWorked)freightBill.paidHoursWorked=0;
    console.log('statustime BEFORRE= ' + freightBill.StatusTime)
    if(!freightBill.StatusTime)freightBill.StatusTime='';
    else  freightBill.StatusTime=convertReactDate(freightBill.StatusTime);
    console.log('statustime = ' + freightBill.StatusTime)
    if(!freightBill.totalYardHours)freightBill.totalYardHours=0;
    if(!freightBill.billedExpenses)freightBill.billedExpenses=0;
    if(!freightBill.tFee)freightBill.tFee=0;
    if(!freightBill.bFee)freightBill.bFee=0;
    if(!freightBill.fuelBilled)freightBill.fuelBilled=0;
    if(!freightBill.profit)freightBill.profit=0;
    if(!freightBill.paidBrokerFee)freightBill.paidBrokerFee=0;
    if(!freightBill.totalExcessLoad)freightBill.totalExcessLoad=0;
    if(!freightBill.totalExcessDump)freightBill.totalExcessDump=0;

    if(!freightBill.deliveredLoads)freightBill.deliveredLoads=0;
    if(!freightBill.progressLoads)freightBill.progressLoads=0;
    if(!freightBill.deliveredTons)freightBill.deliveredTons=0;
    if(!freightBill.progressTons)freightBill.progressTons=0;
    let nowDate = Date.now();


  
    await updateDoc(freightRef, {  
      Weights:freightBill.Weights, 
      runningTime:freightBill.runningTime, 
      endTime:freightBill.endTime,
      startTime:freightBill.startTime,
      timeStamp: nowDate,
      loads:freightBill.loads,
      deliveredLoads: freightBill.deliveredLoads,
      progressLoads: freightBill.progressLoads,
      deliveredTons: freightBill.deliveredTons,
      progressTons: freightBill.progressTons,
      billedQty: freightBill.billedQty,
      billedExpenses:freightBill.billedExpenses,
      tBilled: freightBill.tBilled,
      standExMin: freightBill.standExMin,
      paidStandExMin: freightBill.paidStandExMin,
      standBilled: freightBill.standBilled,
      standPaid:freightBill.standPaid,
      totalDriverPay:freightBill.totalDriverPay,
      paidExpenses:freightBill.paidExpenses,
      paidQty:freightBill.paidQty,
      tFee:freightBill.tFee,
      bFee:freightBill.bFee,
      profit:freightBill.profit,
      paidBrokerFee:freightBill.paidBrokerFee,
      fuelBilled: freightBill.fuelBilled,
      arriveRoundTrip:freightBill.arriveRoundTrip,
      departRoundTrip:freightBill.departRoundTrip,
      AverageDumpTime:freightBill.AverageDumpTime,
      AverageLoadTime:freightBill.AverageLoadTime,
      AverageRoundTrip:freightBill.AverageRoundTrip,
      totalExcessDump:freightBill.totalExcessDump,
      totalExcessLoad:freightBill.totalExcessLoad,
      StatusTime: freightBill.StatusTime,
      Status: freightBill.Status,
      tPaid:freightBill.tPaid,
      bTotal: freightBill.bTotal,
      totalYardHours: freightBill.totalYardHours,
      tHours: freightBill.tHours,
      travelTime: freightBill.travelTime,
      startTravelTime: freightBill.startTravelTime,
      lunch: freightBill.lunch,
      grossHours: freightBill.grossHours,
      tHoursPaid:freightBill.tHoursPaid,
      hoursWorked:freightBill.hoursWorked,
      paidHoursWorked: freightBill.paidHoursWorked,
      tWeight: freightBill.tWeight
  }).then((tempFreight) => {
    console.log('hmmm mtemp freigth = ', tempFreight);
  });
 
  }
  const updateFreightBillField =  async(fieldName,value) => {
    setFreightBill(prevState => ({...prevState,  [fieldName]: value }));
    freightBill[fieldName] = value;
  
    const freightRef = doc(db, 'Organizations/'+ freightBill.companyID+'/DriverFreightBills', freightBill.ID);
  
    await updateDoc(freightRef, {timestamp:Date.now(), [fieldName]: value }).then((tempFreight) => {
      console.log('hmmm mtemp freigth = ', freightBill[fieldName]);
     
    });
  };

  const updateFreightBillFields =  async(fields,values) => {
    setFreightBill(prevState => {
      let newState = { ...prevState };
      for (let i = 0; i < fields.length; i++) {
        newState[fields[i]] = values[i];
      }
      return newState;
    });
    const updateObject = {};
    fields.forEach((field, index) => {
      updateObject[field] = values[index];
    });
    updateObject.timestamp = Date.now();
    console.log('updateObject= ',updateObject);
    const freightRef = doc(db, 'Organizations/'+ freightBill.companyID+'/DriverFreightBills', freightBill.ID);
    await updateDoc(freightRef, updateObject).then((tempFreight) => {
      console.log('hmmm mtemp freigth = ', tempFreight);
    });
  };
  
  const clockOutFB = () =>{
    console.log('HELLOOOO!!!!1')
    updateFreightBillField('dSubmitted', true);
    setSubmitStatus('Entry');
    
    navToPaperlessHome();
  }

const navToPaperlessHome=()=>{   
  console.log('is there a home rout?')
  navigate(`/home`);  }

  useEffect(() => {
    setOptions({ theme: 'ios', themeVariant:"light" });
  });
  useEffect(() => {
    console.log('truckFreightBills=', truckFreightBills);
  }, [truckFreightBills])

  return (
    <PaperlessContext.Provider value={{ uploadPDFFile, setFreightBill, fetchNoDispatch, navToPaperlessHome, clockOutFB, setSubmitStatus, setNavListItems, navListItems,convertReactDate, setTruckFreightBills, truckFreightBills, submitStatus, activeIndex, setActiveIndex, approveType, pdfUrl,createPDF, checkWeightTags, setHomeDate,setPaperlessState,paperlessState, homeDate, updateFreightBillFields,checkGearedTime, loadOrders,  freightBill, fetchTrucksFreightBill, fetchFreightBill, updateFreightBillField, updateAuditLog, uploadWeightFile,uploadFreightFile, updateFreightBillWeights,updateQuillNotes}}>
      {children}
    </PaperlessContext.Provider>
  );
};

export const usePaperless= () => {
  return useContext(PaperlessContext);
};
