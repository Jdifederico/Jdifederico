import React, { useEffect, useState,  useRef} from 'react';
import {  useParams } from 'react-router-dom';
import { Document, Page, pdfjs} from 'react-pdf';
import { FileUpload } from 'primereact/fileupload';

import  { Input, setOptions,Textarea, Button,  Dropdown, Datepicker  } from '@mobiscroll/react';
import mobiscroll from '@mobiscroll/react4';

import { Card } from 'primereact/card';
import { InputNumber } from 'primereact/inputnumber';
import { Image } from 'primereact/image';
import { Dialog } from 'primereact/dialog';
import { Steps } from 'primereact/steps';
import {usePaperless } from './PaperlessContext';
import { Editor } from 'primereact/editor';
import PaperlessWeight from './PaperlessWeight';

import SignatureCanvas from 'react-signature-canvas'     
import { UserAuth } from '../../context/AuthContext'


function PaperlessFreightBill(props) {

    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const signInPadRef = useRef(null);
    const signaturePadRef = useRef(null);
    const approverNotesRef = useRef(null);
    const [visible, setVisible] = useState(false);
    const { id, orgName } = useParams();
    const { materials, trucks, trailers, logout } = UserAuth();
    const { fetchFreightBill,freightBill,  activeIndex, approveType,updateAuditLog, clockOutFB, uploadFreightFile, setNavListItems, convertReactDate, pdfUrl, checkWeightTags,  createPDF, setSubmitStatus, submitStatus, checkGearedTime, setFreightBill, updateFreightBillFields, updateFreightBillField,updateFreightBillWeights,setPaperlessState,  updateQuillNotes} = usePaperless();
    const toast = useRef(null);
    const fileUploadRef = useRef(null); 
    const fileUploadRefs = useRef([]);

    const items = [
        {
            label: 'Clock In',
            command: (event) => {
              setSubmitStatus('Clock-In')
              setActiveIndex(0);
            
           
            }
        },
        {
            label: 'Freight Bill',
            command: (event) => {
              if(!freightBill.startTimePaid)  setSubmitStatus('Clock-In');  else  setSubmitStatus('Entry'); 
              setActiveIndex(1);
       
            }
        },
        {
            label: 'Sign out',
            command: (event) => {
              setVisible(true)
            }
        },
        {
          label: 'Clock out',
          command: (event) => {
            setActiveIndex(3);
            submitFreightBill();
       
          }
      },
      {
        label: 'Submitted'     
    }
  ];
    const navToPaperlessLoadOrders = props.navToPaperlessLoadOrders
    const setActiveIndex = props.setActiveIndex;
    const showClockOutToast = props.showClockOutToast;
    const saveSignIn= () => {
        console.log('signaturePadRef = ' , signInPadRef.current);
        freightBill.driverSignature=signInPadRef.current.toDataURL();
        console.log('afreightBill.driverSignature== ' ,freightBill.driverSignature);
    }
    const saveSignature = () => {
    

        if(approveType==='Shipper')  freightBill.approveShipperSignature=signaturePadRef.current.toDataURL();
        if(approveType==='Receiver')  freightBill.approveReceiverSignature=signaturePadRef.current.toDataURL();

    }

    const clearSignIn = () => {
        console.log('signaturePadRef = ' , signaturePadRef);
        signInPadRef.current.clear();
    }

    const clearSignature = () => {
        console.log('signaturePadRef = ' , signaturePadRef);
        signaturePadRef.current.clear();
    }

    const clockInFB = () => {
        console.log('runnign cllick in');
        if(freightBill.startTimePaid || freightBill.Subhauler){
            setSubmitStatus('Entry');
            setActiveIndex(1);
        }else alert('Please enter a valid time to clock in.')
    }

 

    const finishSignature = ()=> {
        let fields= [];
        let values = [];
        if(approveType==='Shipper') {
            fields=[ 'ShipperApproved', 'approveShipperSignature'];
            values = [true, freightBill.approveShipperSignature];
        } 
        if(approveType==='Receiver'){
            fields=[ 'ReceiverApproved', 'approveReceiverSignature'];
            values = [true, freightBill.approveReceiverSignature];
        } 

        updateFreightBillFields(fields,values );
        if(freightBill.textForeman)createPDF('text');
        if(freightBill.Subhauler)clockOutFB();
        else{
            setActiveIndex(3);
            setSubmitStatus('Clock-Out');
        } 
    }

    const onTemplateSelect = ( e, uploadRef) => {
        console.log('wat is going on here e= ',)
       uploadFreightFile(e.files[0])
   
    };

    const unsubmitFreightBill= function (){
        if (window.confirm("Are you sure you want to Unsubmit this Freight Bill?")) {
            updateFreightBillField('dSubmitted', false);
        }
       
    }

    const setQtyandCalc = () => {
        console.log('ok now we setting the qty and we calccinn1' + freightBill.PayType )
            freightBill.tWeight =parseFloat(Math.round((Number(freightBill.tWeight))*100)/100);
            if (freightBill.PayType === 'Hour' || freightBill.PayType === 'Hour/Percent')  freightBill.paidQty =  Number(freightBill.tHours);
            if (freightBill.PayType === 'Load' || freightBill.PayType === 'Load/Percent') freightBill.paidQty = Number(freightBill.loads);
            if (freightBill.PayType === 'Ton' || freightBill.PayType === 'Ton/Percent') freightBill.paidQty = Number(freightBill.tWeight);
            if (freightBill.BillType === 'Hour') freightBill.billedQty = Number(freightBill.tHours);
            if (freightBill.BillType === 'Load') freightBill.billedQty = Number(freightBill.loads);
            if (freightBill.BillType === 'Ton') freightBill.billedQty = Number(freightBill.tWeight);
            //console.log('Setting QTy for Frieghtbill with billed qty = ' + freightBill.billedQty);
            if (freightBill.billedQty > 0 || freightBill.paidQty > 0)freightBill.missing = false;
            calcTotal(freightBill.Expenses);
        
    }
 



    const calcTotal = ( Expenses) =>{
            console.log('running Calc Total for freight Bill = ', freightBill)
        
              freightBill.matTotal = 0; 

              //Calculate odometer difference
              freightBill.odDiff = freightBill.odEnd - freightBill.odStart;
              
              freightBill.JobOvertimeRate=parseFloat(Math.round((Number(freightBill.PayRate)*1.5)*100)/100);
              freightBill.TravelOvertimeRate=parseFloat(Math.round((Number(freightBill.travelRate)*1.5)*100)/100);
              if (Number(freightBill.billedQty)){
                  freightBill.tBilled = Number(Number(freightBill.BillRate) * Number(freightBill.billedQty));
                  freightBill.tBilled=parseFloat(Math.round(freightBill.tBilled*100)/100);
              }
                      
              if(freightBill.hoursWorked<freightBill.tHours){
                  freightBill.hourMinBilledQty=freightBill.tHours-freightBill.hoursWorked;
                  freightBill.hourMinBilled = parseFloat(Math.round(Number(freightBill.BillRate * freightBill.hourMinBilledQty)*100)/100);
                }else freightBill.hourMinBilled =0; 
                  
              if(freightBill.paidHoursWorked<freightBill.tHoursPaid){
                  if (freightBill.PayType.includes('Percent')){
                         freightBill.hourMinPaidQty=freightBill.tHoursPaid-freightBill.paidHoursWorked;
                         freightBill.hourMinTotalPaid = parseFloat(Math.round(Number(freightBill.PayRate * freightBill.hourMinPaidQty)*100)/100);
                         freightBill.hourMinPaid = parseFloat(Math.round(Number((freightBill.PayRate * freightBill.hourMinPaidQty) * Number(freightBill.driverPercent / 100)))*100)/100;
                  }else {
                      freightBill.hourMinPaidQty=freightBill.tHoursPaid-freightBill.paidHoursWorked;
                      freightBill.hourMinPaid = parseFloat(Math.round(Number(freightBill.PayRate * freightBill.hourMinPaidQty)*100)/100);
                      freightBill.hourMinTotalPaid = freightBill.hourMinPaid;
                    }
              }else{
                   freightBill.hourMinPaid =0;
                   freightBill.hourMinPaidQty =0;
                   freightBill.hourMinTotalPaid =0;
              }
                  
              //Calculate paid trucking totals
               freightBill.overtimeTotal=0;
             console.log('FIM SO CONFUSED== ' + freightBill.paidQty);
              if (Number(freightBill.paidQty)) {
                 console.log('freightBill.PayRate == ' + freightBill.PayRate);
                    freightBill.totalTruckPay = parseFloat(Math.round(Number(freightBill.PayRate * freightBill.paidQty)*100)/100);
                    console.log('total truck pay = ' + freightBill.totalTruckPay);
                  if (freightBill.PayType.includes('Percent')){
               
                      var tempdriverpay = Number(freightBill.totalTruckPay  * Number(freightBill.driverPercent / 100));
                 //    console.log('tempdriverpay = ' + tempdriverpay.formatMoney(2));
                      freightBill.totalDriverPay= parseFloat(Math.round(Number(freightBill.totalTruckPay  * Number(freightBill.driverPercent / 100))*100)/100);
                      
                  }else if(freightBill.PayType == 'Hour' && !freightBill.Subhauler){
                      freightBill.startTravelAndJobTime=Number(freightBill.paidQty);
                      freightBill.JobOvertimeQty=0;
                      freightBill.TravelOvertimeQty=0;
                   /*   if(freightBill.startTravelAndJobTime>8){
                          freightBill.JobOvertimeQty= Number(Number(freightBill.startTravelAndJobTime-8)*10)/10;
                          freightBill.paidQty= parseFloat(Math.round(Number( freightBill.paidQty-freightBill.JobOvertimeQty)*100)/100);
                          freightBill.TravelOvertimeQty=freightBill.endTravelTime;
                          freightBill.totalTruckPay = parseFloat(Math.round(Number(freightBill.PayRate * freightBill.paidQty)*100)/100);
                      }else{*/
                          freightBill.totalTime=freightBill.startTravelAndJobTime + freightBill.endTravelTime;
                          if(freightBill.totalTime>8) freightBill.TravelOvertimeQty=freightBill.totalTime-8
                     // } 
                      freightBill.JobOvertimeTotal= parseFloat(Math.round(Number(freightBill.JobOvertimeQty*freightBill.JobOvertimeRate)*100)/100);
                      freightBill.TravelOvertimeTotal= parseFloat(Math.round(Number(freightBill.TravelOvertimeQty*freightBill.TravelOvertimeRate)*100)/100);
                      freightBill.overtimeTotal=parseFloat(Math.round(Number(freightBill.TravelOvertimeTotal+freightBill.JobOvertimeTotal)*100)/100);
                      if( freightBill.hourMinPaid>0)freightBill.truckPaid= freightBill.truckPaid-freightBill.hourMinPaid;
                      
                      freightBill.totalDriverPay= freightBill.totalTruckPay;
                  }else  freightBill.totalDriverPay= freightBill.totalTruckPay;
              }
              
              //Calculate Standby
           
          
                 if(freightBill.paidStandExMin){ 
                      freightBill.standPaid = parseFloat(Math.round(Number(freightBill.paidStandExMin*  freightBill.standPR)*100)/100);
                      freightBill.totalStandPaid=parseFloat(Math.round(Number(freightBill.paidStandExMin*  freightBill.standPR)*100)/100);
                 
                      if(freightBill.PayType.includes("Percent")) freightBill.standPaid = parseFloat(Math.round(Number(freightBill.standPaid) *(Number(freightBill.driverPercent / 100))*100)/100);
                 }else freightBill.standPaid =0;
                  freightBill.standBilled= parseFloat(Math.round(Number(freightBill.standExMin*  freightBill.standBR)*100)/100);
              
                  
            //Calculate Total number to use for % based billing charges
            if (freightBill.UseStandBy && freightBill.standBilled>0) freightBill.totalForBilledPercents=Number(freightBill.standBilled +freightBill.tBilled);
            else freightBill.totalForBilledPercents= freightBill.tBilled;
            
            //Calculate Total number to use for % based paying charges
            if (freightBill.UseStandBy && freightBill.standPaid>0)  freightBill.totalForPaidPercents=Number(freightBill.standPaid +freightBill.totalTruckPay );
            else freightBill.totalForPaidPercents= freightBill.totalTruckPay ;
        
    
            //Calculate Fuel Surchage
            if (freightBill.FuelCharge>0)freightBill.fuelBilled = Math.round(Number(freightBill.tBilled  * (freightBill.FuelCharge / 100))*100)/100;
             else freightBill.fuelBilled  =0;
              
            //Calculate Billed Broker Fee
            if (freightBill.billedBrokerPercent>0){
              if(freightBill.billBrokerFuel)freightBill.fuelBilled =freightBill.fuelBilled-  Math.round((Number(freightBill.fuelBilled  * (freightBill.billedBrokerPercent / 100)))*100)/100;
              freightBill.billedTruckingBrokerTotal=   Math.round(-1 * (Number(freightBill.tBilled  * (freightBill.billedBrokerPercent / 100)))*100)/100;
              freightBill.bFee=  Math.round(-1 * (Number(freightBill.totalForBilledPercents  * (freightBill.billedBrokerPercent / 100)))*100)/100;
            }else {
              freightBill.billedTruckingBrokerTotal=0;
              freightBill.bFee=0;
            }	
            
            //Calculate Paid Broker Fee
            if (freightBill.paidBrokerPercent>0){
              freightBill.paidTruckingBrokerTotal=  Math.round(-1 * (Number(freightBill.totalTruckPay * (freightBill.paidBrokerPercent / 100)))*100)/100;
              freightBill.paidBrokerFee = Math.round(-1 * (Number(freightBill.totalForPaidPercents  * (freightBill.paidBrokerPercent / 100)))*100)/100;
            }else{
              freightBill.paidTruckingBrokerTotal=0;
              freightBill.paidBrokerFee =0;
            } 
    
            //Calculate Trailer Fees
             if (freightBill.trailerPercent>0){
              freightBill.truckingTrailerTotal =  Math.round(-1 * (Number(freightBill.totalTruckPay* (freightBill.trailerPercent / 100))*100))/100;
              freightBill.tFee =   Math.round(-1 * (Number(freightBill.totalForPaidPercents  * (freightBill.trailerPercent / 100))*100))/100;
            }else{
              freightBill.truckingTrailerTotal=0;
                 freightBill.tFee =0;
            }
            
              //Calculate Expenses
              var billedExpenses = 0;
              var paidExpenses = 0;
              for (var i = 0; i < Expenses.length; i++) {
                var expenseTotal = 0;
                if (Expenses[i].bill) billedExpenses = parseFloat(Math.round(Number(billedExpenses + Expenses[i].total)*100)/100);
                if (Expenses[i].pay) {
                  expenseTotal = Expenses[i].total;
    
                  paidExpenses = parseFloat(Math.round(Number(paidExpenses + Expenses[i].total)*100)/100);
                  if (Expenses[i].applyBrokerFee && freightBill.paidBrokerPercent > 0) freightBill.paidBrokerFee -= parseFloat(Math.round(Number(expenseTotal * (freightBill.paidBrokerPercent / 100))*100)/100);
                }
                if (Expenses[i].bCustomer || Expenses[i].MaterialExpense) {
                  expenseTotal = Expenses[i].total;
                  billedExpenses = parseFloat(Math.round(Number(billedExpenses + Expenses[i].total)*100)/100);
                  if (Expenses[i].applyBrokerFee && freightBill.billedBrokerPercent > 0) freightBill.bFee -= parseFloat(Math.round(Number(expenseTotal * (freightBill.billedBrokerPercent / 100))*100)/100);
                }
                if (Expenses[i].bDriver) paidExpenses = parseFloat(Math.round(Number(paidExpenses - Expenses[i].total)*100)/100);
    
    
                console.log('paidExpenses = ' + paidExpenses);
                console.log('billedExpenses = ' + billedExpenses);
    
              }
              //calculate Travel Pay
              if(freightBill.travelRate && freightBill.travelTime && !freightBill.Subhauler && !freightBill.PayType.includes('Percent')){
                  if(freightBill.TravelOvertimeQty>0)freightBill.paidTravelTime=parseFloat(Math.round(Number(freightBill.travelRate*Number(freightBill.travelTime-freightBill.TravelOvertimeQty))*100)/100);
                  else freightBill.paidTravelTime=parseFloat(Math.round(Number(freightBill.travelRate*freightBill.travelTime)*100)/100);
              }else freightBill.paidTravelTime=0;
                  
              freightBill.paidExpenses = paidExpenses;
              freightBill.billedExpenses = billedExpenses;
              //Calculate final totals and profit
    
              freightBill.bTotal = parseFloat(Math.round(Number(freightBill.tBilled + freightBill.matTotal + freightBill.fuelBilled + freightBill.billedExpenses + freightBill.bFee)*100)/100);
              freightBill.tPaid = parseFloat(Math.round(Number(freightBill.overtimeTotal + freightBill.totalDriverPay + freightBill.tFee + freightBill.paidBrokerFee + freightBill.paidExpenses +freightBill.paidTravelTime )*100)/100);
            
              console.log('p  freightBill.bTotal= ' +   freightBill.bTotal);
              console.log('freightBill.tPaid = ' + freightBill.tPaid);
            
              if(freightBill.VNum>1 && freightBill.truckingPaid)this.findAdjustmentDifference(freightBill);
              if (freightBill.UseStandBy) {
                  freightBill.tPaid = parseFloat(Math.round(Number(freightBill.tPaid + freightBill.standPaid)*100)/100);
                  freightBill.bTotal = parseFloat(Math.round(Number(freightBill.bTotal + freightBill.standBilled)*100)/100);
              }   
              if(freightBill.SellMaterial && freightBill.MaterialTotal>0){
                  freightBill.bTotal = parseFloat(Math.round(Number(freightBill.bTotal + freightBill.MaterialTotal)*100)/100);
              }
              if(freightBill.Subhauler)freightBill.hourlyRate = parseFloat(Math.round(Number(freightBill.tPaid/freightBill.tHours)*100)/100); 
              else if(freightBill.totalYardHours) freightBill.hourlyRate = parseFloat(Math.round(Number(freightBill.tPaid/freightBill.totalYardHours)*100)/100);
              freightBill.profit = parseFloat(Math.round(Number(freightBill.bTotal - freightBill.tPaid)*100)/100);
              
             
          
    
      }
    const calcRunningTime = () => {

        var runningMinutes =getDifferenceInMinutes(freightBill.departRoundTrip,freightBill.arriveRoundTrip);
        calcTime(freightBill, freightBill.departRoundTrip, freightBill.arriveRoundTrip, 'runningTime');
    
        if(checkGearedTime(freightBill.endTime)) {
            let someVar = freightBill.endTime.getTime() +(runningMinutes*60000);
            if(checkGearedTime(freightBill.endTime))  freightBill.endTime  =new Date(someVar);
            setQtyandCalc();
        }
    }

    const getDifferenceInMinutes = (start, end) =>{
        console.log('start = ',start)
        if(checkGearedTime(start) && checkGearedTime(end)){
            let differenceMinutes =(end.getTime() - start.getTime()) / 60000;
            return Math.round(differenceMinutes);
        }else return 0;
    }

    const calcTime = (freightBill, start, end, timeName) => {
        if(checkGearedTime(start) && checkGearedTime(end)){
            let  totalMinutes=(end.getTime() - start.getTime()) / 1000;
            totalMinutes /= 60;
            totalMinutes=  Math.abs(Math.round(totalMinutes));
    
            if (timeName === 'runningTime') freightBill.tripTotalMinutes = totalMinutes;
            if (totalMinutes < 0) totalMinutes = 1440 + totalMinutes;

            let time = Math.floor(Number(totalMinutes) / 60);
            let  minutes = Number(totalMinutes) % 60;
            roundTimeToNearestTenth(freightBill, time, timeName, minutes);
        }
    }
    
    const formatTime = () => {
   
        freightBill.totalTravelMinutes = 0;
        console.log('startTimePaid = '+freightBill.startTimePaid)
        if(freightBill.startTime && freightBill.startTimePaid){
            calcTime(freightBill, freightBill.startTimePaid, freightBill.startTime, 'startTravelTime');
         
            freightBill.travelTime = freightBill.startTravelTime;
            freightBill.totalTravelMinutes =getDifferenceInMinutes(freightBill.startTimePaid,freightBill.startTime);
        
            let travelHour= Math.floor(Number( freightBill.totalTravelMinutes) / 60);
            var extraTravelMinutes= Number( freightBill.totalTravelMinutes) % 60;

            freightBill.totalTravelMinutes+= getDifferenceInMinutes(freightBill.endTime,freightBill.endTimePaid);
         
            roundTimeToNearestTenth(freightBill, travelHour,'travelTime',  extraTravelMinutes);
            calcTime(freightBill, freightBill.startTimePaid, freightBill.endTimePaid, 'totalYardHours');
            calcTime(freightBill, freightBill.startTime, freightBill.endTime, 'grossHours');
            calcTime(freightBill, freightBill.startTime, freightBill.endTime, 'tHours');

            console.log('freightBill.tHours= ' +freightBill.tHours);
            if (freightBill.lunch && freightBill.lunch !== '') {
                if (Number(freightBill.lunch) >= 60) {
                    freightBill.lunchHours = Math.floor(Number(freightBill.lunch) / 60);
                    freightBill.lunchRemainder = Number(freightBill.lunch) % 60;
                } 
                else {
                    freightBill.lunchHours = 0;
                    freightBill.lunchRemainder = Number(freightBill.lunch);
                }
              
                roundTimeToNearestTenth(freightBill, freightBill.lunchHours, 'lunchHours', freightBill.lunchRemainder);
                freightBill.tHours = Number(Number(freightBill.tHours) - Number(freightBill.lunchHours));
             
            }else freightBill.lunchHours = 0;
        }
    
        if (freightBill.tHours > 8 && freightBill.BillType === 'Hour') freightBill.OverTimeAmount = -1 * (8 - freightBill.tHours);
    
        // freightBill.tHours=  Number(freightBill.tHours * 10) / 10;
        if (freightBill.Company.payByJobHours || freightBill.Subhauler) freightBill.tHoursPaid = freightBill.tHours;
        else freightBill.tHoursPaid = freightBill.totalYardHours;
        freightBill.hoursWorked = freightBill.tHours;
        freightBill.paidHoursWorked = freightBill.tHoursPaid;

   

        setFreightBill(freightBill);
    }

    const calcExcessStandBy = function(){
        freightBill.totalExcessLoad=0;
        freightBill.totalExcessDump=0;
        freightBill.totalRoundTrip=0; 
        freightBill.fullExcessDump=0;
        freightBill.fullExcessLoad=0;
        var countedTrips=0;
        var countedLoadStandBy=0;
        var countedDumpStandBy=0;
     
          for (let i = 0; i < freightBill.Weights.length; i++) {
            let calcWeight =freightBill.Weights[i];
          
            calcWeight.roundTrip=0;
            calcWeight.loadTrip=0;
            calcWeight.dumpTrip=0;
            calcWeight.loadTrip=0;
     
            if( i>0 && calcWeight.loadStart && freightBill.Weights[i-1].dumpEnd) calcWeight.loadTrip =getDifferenceInMinutes(freightBill.Weights[i-1].dumpEnd,  calcWeight.loadStart);
            if(calcWeight.loadEnd && calcWeight.dumpStart)calcWeight.dumpTrip =getDifferenceInMinutes(calcWeight.loadEnd, calcWeight.dumpStart);
            
        
            if(!freightBill.standLA)freightBill.standLA=0;

           // calculate the raw standby
           if(calcWeight.loadStart && calcWeight.loadEnd)  calcWeight.fullExcessLoad= getDifferenceInMinutes( calcWeight.loadStart,   calcWeight.loadEnd ); else  calcWeight.fullExcessLoad=0;
           if(calcWeight.dumpStart && calcWeight.dumpEnd)  calcWeight.fullExcessDump=getDifferenceInMinutes( calcWeight.dumpStart,  calcWeight.dumpEnd ); else  calcWeight.fullExcessDump=0;
         

            if (calcWeight.fullExcessLoad <= freightBill.standLA) calcWeight.excessLoad = 0;
            if (calcWeight.fullExcessLoad > freightBill.standLA) calcWeight.excessLoad = calcWeight.fullExcessLoad- freightBill.standLA;
            freightBill.totalExcessLoad = parseFloat(Number(freightBill.totalExcessLoad + calcWeight.excessLoad));

            if (calcWeight.fullExcessDump <= freightBill.standDA ) calcWeight.excessDump = 0;
            if (calcWeight.fullExcessDump > freightBill.standDA) calcWeight.excessDump = calcWeight.fullExcessDump - freightBill.standDA;
            freightBill.totalExcessDump = parseFloat(Number(freightBill.totalExcessDump + calcWeight.excessDump));
  
            calcWeight.roundTrip=calcWeight.loadTrip + calcWeight.dumpTrip;
  
            freightBill.fullExcessLoad+=Number(calcWeight.fullExcessLoad);
            freightBill.fullExcessDump+=Number(calcWeight.fullExcessDump);

            if(calcWeight.fullExcessLoad !==0 )countedLoadStandBy++;
            if(calcWeight.fullExcessDump !==0 )countedDumpStandBy++;
         
            if(calcWeight.loadTrip !==0 && calcWeight.dumpTrip!==0){
                countedTrips++;
                freightBill.totalRoundTrip+=Number(calcWeight.roundTrip);   
            }
            delete calcWeight['LoadSite'];
            delete calcWeight['DumpSite'];
        
        }
        if(countedTrips>0) freightBill.AverageRoundTrip = Math.round(freightBill.totalRoundTrip/countedTrips);
        if(countedLoadStandBy>0) freightBill.AverageLoadTime = Math.round(freightBill.fullExcessLoad/countedLoadStandBy); else freightBill.AverageLoadTime=0;
        if(countedDumpStandBy>0) freightBill.AverageDumpTime = Math.round(freightBill.fullExcessDump/countedDumpStandBy); else  freightBill.AverageDumpTime=0;
        calcStandBy(freightBill);
    }
    
    const calcStandBy =function(freightBill){
      // freightBill.standByIsBilled=false; 
   
           freightBill.loadStandPaid= parseFloat(Number(freightBill.totalExcessLoad*  freightBill.standPR));
           freightBill.loadStandBilled=parseFloat(Number(freightBill.totalExcessLoad*  freightBill.standBR));
  
 
           freightBill.dumpStandPaid=  parseFloat(Number(freightBill.totalExcessDump*  freightBill.standPR));
           freightBill.dumpStandBilled=parseFloat(Number(freightBill.totalExcessDump*  freightBill.standBR));

           freightBill.standExMin = parseFloat(Number(freightBill.totalExcessLoad + freightBill.totalExcessDump));
           freightBill.paidStandExMin = parseFloat(Number(freightBill.totalExcessLoad + freightBill.totalExcessDump));

        
      setQtyandCalc();  
    }

    const roundTimeToNearestTenth = (freightBill, timeValue, timeName, minuteDifference) => {
       
            console.log('timeValue' + timeValue + ' And the minute difference = ' + minuteDifference);
            minuteDifference=Number(minuteDifference);
            var tMinutes = 0;
            if (minuteDifference === 0)  tMinutes = 0;
            if (minuteDifference > 0 && minuteDifference <= 2)tMinutes = 0;
            if (minuteDifference > 2 && minuteDifference <= 8) tMinutes = .1;
            if (minuteDifference > 8 && minuteDifference <= 14) tMinutes = .2;
            if (minuteDifference > 14 && minuteDifference <= 20) tMinutes = .3;
            if (minuteDifference > 20 && minuteDifference <= 26) tMinutes = .4;
            if (minuteDifference > 26 && minuteDifference <= 32) tMinutes = .5;
            if (minuteDifference > 32 && minuteDifference <= 38) tMinutes = .6;
            if (minuteDifference > 38 && minuteDifference <= 44) tMinutes = .7;
            if (minuteDifference > 44 && minuteDifference <= 50) tMinutes = .8;
            if (minuteDifference > 50 && minuteDifference <= 56) tMinutes = .9;
            if (minuteDifference > 56 && minuteDifference <= 60) tMinutes = 1.0;
            timeValue += Number(tMinutes);
            freightBill[timeName]= Number(timeValue);
          
    }
 
    const addLoad = () => {
        var lastWeight = freightBill.Weights[freightBill.Weights.length-1];
        if(freightBill.Weights.length==0 || (lastWeight.loadStart && lastWeight.loadEnd && lastWeight.dumpStart && lastWeight.dumpEnd) || freightBill.onSiteMode){
        var loadNumber=Number(freightBill.Weights.length+1);
        freightBill.loads=loadNumber;
        freightBill.Status='Starting Load';
        freightBill.StatusTime=  Date.now();
        console.log('FreighBill.Material = ', freightBill.Material);
        let newWeight ={ 
            tagNO:"",  
            Material:freightBill.Material,
            weight:"",  
            loadNumber: loadNumber, 
            loadStart:'', loadEnd:'', dumpStart:'', dumpEnd:'', 
            excessLoad:'', excessDump:'',
            materialName:freightBill.Material.Name,
            Editing:false, showLoadEnd:false, showDumpStart:false, showDumpEnd:false, readyDelete:false
        };
        freightBill.progressLoads=1;
        freightBill.Weights.push(newWeight); 
        console.log('newWeight.materialName = '+ newWeight.materialName); 
   
        updateAuditLog(freightBill);
          
        console.log('newweight material = ',freightBill.Weights[freightBill.Weights.length-1].Material); 
        updateFreightBillWeights();
    }else alert('Please enter in times for last load before adding in another load' )
    }
    const deleteLoad = () => {
       
        console.log('UMM WTF DELETING LOAD = ',freightBill.Weights[freightBill.Weights.length-1])
        if(freightBill.Weights.length>0){
        if (window.confirm("Are you sure you want to delete load?")) {
            freightBill.Weights.splice(freightBill.Weights.length-1,1); 
            console.log('freightb ill dot weights after ',freightBill.Weights)
            freightBill.loads--;
            for(var i=0; i<freightBill.Weights.length; i++) freightBill.Weights[i].loadNumber=i+1;
            

            
            formatTime();
            updateFreightBillWeights();
        }
    }else window.alert('No weights to delete');
      
    }
    const findObjectById = (objectList, Id) =>{
        for(let i=0; i<objectList.length; i++)
            if(objectList[i].Name===Id) return objectList[i];
        
    
    }

    function openTimePicker(datepicker) {
        if(datepicker._value==="") datepicker.setTempVal(Date.now())
    }
    const changeFreightLunch = (value) =>{
        freightBill.lunch=value;
        setFreightBill(prevState => ({...prevState, 'lunch': value}));
        formatTime();
        let fields= ['tHours', 'grossHours', 'totalYardHours','travelTime','startTravelTime', 'lunch', 'tHoursPaid','hoursWorked', 'paidHoursWorked'  ];
        let values = [freightBill.tHours,freightBill.grossHours,freightBill.totalYardHours,freightBill.travelTime,freightBill.startTravelTime,freightBill.lunch, freightBill.tHoursPaid, freightBill.hoursWorked, freightBill.paidHoursWorked];
        updateFreightBillFields(fields,values );
    }    
    const changeFreightTime = (timeName, mobileName, newValue) =>{

        freightBill[timeName]   = new Date(newValue); 
        freightBill[mobileName]   = new Date(newValue);
    

        var tempFields = [timeName, mobileName];
        var tempValues = [new Date(newValue),new Date(newValue)];
         updateFreightBillFields( tempFields, tempValues );
         formatTime();

         let fields= ['tHours', 'grossHours', 'totalYardHours','travelTime','startTravelTime', 'lunch', 'tHoursPaid','hoursWorked', 'paidHoursWorked',timeName, mobileName];
         let values = [freightBill.tHours,freightBill.grossHours,freightBill.totalYardHours,freightBill.travelTime,freightBill.startTravelTime,freightBill.lunch, freightBill.tHoursPaid, freightBill.hoursWorked, freightBill.paidHoursWorked,new Date(newValue),new Date(newValue) ];
         updateFreightBillFields(fields,values );
      
        setFreightBill(prevState => ({...prevState, timeName: new Date(newValue)}))
        
   
    }

    const changeFreightBillSelectField = (fieldName, newValue, list) => {
        console.log('new Value = ' + newValue)
        freightBill[fieldName] = findObjectById (list,newValue);

        updateFreightBillField(fieldName,freightBill[fieldName] );
    }
    
    const changeTextForeman = (value)=>{
        setFreightBill(prevState => ({...prevState, 'textForeman': value}));
    }

    const changeTextPhoneNumber = (value) =>{
        setFreightBill(prevState => ({...prevState, 'textPhoneNumber': value})); 
    }

 
    function validateEmail(email) {
        var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
        return re.test(email);
    }

   
    const reviewAndSubmit = function () {
        setActiveIndex(2);
        setSubmitStatus('Sign-Out')

        if (approveType === 'Shipper') {
            if(freightBill.Foreman) setFreightBill(prevState => ({...prevState, 'textPhoneNumber': freightBill.Foreman.Phone}));
        //    console.log(' freightBill.Foreman.Phone = ' +  freightBill.textPhoneNumber)
            setTimeout(() => {  if(freightBill.approveShipperSignature)signaturePadRef.current.fromDataURL(freightBill.approveShipperSignature, {}); }, 0) 
            if (freightBill.Weights.length > 1) {
                var lastWeight = freightBill.Weights[freightBill.Weights.length - 1];
                var secondToLastWeight =freightBill.Weights[freightBill.Weights.length - 2];
                
                //if lastWeight.loadStart is Null set it to current time
                if (!lastWeight.loadStart){
                    lastWeight.loadStart= new Date();
                    console.log('last.loadStart first = ', lastWeight.loadStart);
                    lastWeight.loadStart =  new Date(Math.round(lastWeight.loadStart.getTime()/60000)*60000)
                }  
        
                //calculate lastWeight.loadEnd from 2nd to last weight loadEnd - loadStart
                if (!lastWeight.loadEnd && secondToLastWeight.loadEnd && secondToLastWeight.loadStart) {
                    var loadStandByMinutes = getDifferenceInMinutes(secondToLastWeight.loadStart,secondToLastWeight.loadEnd )  
                    lastWeight.loadEnd = new Date(lastWeight.loadStart.getTime()+(loadStandByMinutes*60000));
                }

                //calculate lastWeight.dumpStart from 2nd to last weight loadEnd - dumpStart
                if (!lastWeight.dumpStart && secondToLastWeight.loadEnd && secondToLastWeight.dumpStart){
                    let runningMinutes = getDifferenceInMinutes(secondToLastWeight.loadEnd, secondToLastWeight.dumpStart);
                    lastWeight.dumpStart = new Date(lastWeight.loadEnd.getTime()+(runningMinutes*60000));
                } 
                //calculate  lastWeight.dumpEnd  from 2nd to last weight dumpStart - dumpEnd
                if(!lastWeight.dumpEnd && lastWeight.dumpStart && secondToLastWeight.dumpStart && secondToLastWeight.dumpEnd) {
                    let standByMinutes = getDifferenceInMinutes(secondToLastWeight.dumpStart,secondToLastWeight.dumpEnd);
                    lastWeight.dumpEnd = new Date(lastWeight.dumpStart.getTime()+(standByMinutes*60000)); 
                } 

                if(freightBill.Company.CalcRunningTime==='Last Load') {
                    freightBill.departRoundTrip = lastWeight.loadEnd;
                    freightBill.arriveRoundTrip = lastWeight.dumpStart;
                    freightBill.mobileArriveRoundTrip = lastWeight.mobileloadEnd;
                    freightBill.mobileDepartRoundTrip = lastWeight.mobiledumpStart;
                }
                freightBill.endTime = lastWeight.dumpEnd;

                calcRunningTime();
                calcExcessStandBy();
                formatTime();
                updateFreightBillWeights();

            }
            console.log('signaturePadRef.current = ' , signaturePadRef.current)
        }else   {
            setTimeout(() => {   if(freightBill.approveReceiverSignature)signaturePadRef.current.fromDataURL(freightBill.approveReceiverSignature, {}); }, 0) 
            if(freightBill.ReceiverForeman)    setFreightBill(prevState => ({...prevState, 'textPhoneNumber': freightBill.ReceiverForeman.Phone}));
            console.log(' I just got REceiver signauter')
        }
      
   
        //  freightBill.signatureName = freightBill.Foreman.Name;

        // if (approveType == 'Receiver') freightBill.signatureName = freightBill.ReceiverForeman.Name;
        
    } 
    
  const submitFreightBill = ()=> {
    console.log('freightBill.endTimePaid = ', freightBill.endTimePaid)
    if(freightBill.Subhauler)finishClockOut();
    else{
        setActiveIndex(3);
        setSubmitStatus('Clock-Out');
    } 
    freightBill.Status='Submitted';
    var tempFields = ['Status', 'StatusTime'];
    var tempValues = ['Submitted', convertReactDate(Date.now())];
    updateFreightBillFields(tempFields,tempValues);

  
  }

    
    const finishClockOut = ()=>{
        
        if(freightBill.endTimePaid || freightBill.Subhauler){
            clockOutFB()
            showClockOutToast();
        }else alert('Please enter a valid time to clock out.')
    }
  
    const saveApproverNotes = function(e){
        console.log('quill = ', e.htmlValue);
        console.log('element = ', approverNotesRef.current.getElement());
        console.log('quiilld = ', approverNotesRef.current.getQuill().editor.delta.ops);
  
        console.log(' = ', approverNotesRef.current);
        var tempCursorObject = {index:approverNotesRef.current.getQuill().selection.savedRange.index, length:0}
        freightBill.approverComments= e.textValue;

        
        updateQuillNotes('approverComments',e.textValue, 'QuillApproverNotes', e.htmlValue,'ApproverNotesCursorSelection', tempCursorObject  )

        //var AuditDescription = 'Update Internal Notes';
           // $rootScope.addAuditLog(AuditDescription,'FreightBills',$scope.FreightBills[y].ID, InternalNotes);
       
        
        
    }

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }
    const signOutFreightBill = (signOutType) =>{
        setVisible(false);
   
     
        checkWeightTags(signOutType);
      
    }
    const closeSignOutPopUp =()=>{
        setActiveIndex(1);
        setVisible(false);
    }
    const renderHeader = () => {
        return (
            <span className="ql-formats">
                <button className="ql-bold" aria-label="Bold"></button>
                <button className="ql-italic" aria-label="Italic"></button>
                <button className="ql-underline" aria-label="Underline"></button>
            </span>
        );
    };

    const enterFreightBill= ()=>{
        setActiveIndex(1);
        setSubmitStatus('Entry');
    }
    const header = renderHeader();
    const navigateToLoadSite = () =>{
        window.location.href=" https://www.google.com/maps/dir//"+freightBill.loadAddress;
    }
    const navigateToDumpSite = () =>{
        window.location.href=" https://www.google.com/maps/dir//"+freightBill.loadAddress;
    }
    const activateOnSite =()=>{
        freightBill.onSiteMode=true;   
        updateFreightBillField('onSiteMode', true);
    
        setNavListItems([
          
         //   {id:'navBar2', name:'Show Day on Time Picker', action:{action:showDayTime}, key:'navBarKey2'},
            {id:'navBar3', name:'Logout', key:'navBarKey3' , action:{action:logout}},
        ])
    }
    const deActivateOnSite =()=>{
        freightBill.onSiteMode=false;   

        updateFreightBillField('onSiteMode', false);
    
        setNavListItems([
         

            {id:'navBar3', name:'Logout', key:'navBarKey3' , action:{action:logout}},
        ])
    }
    
    useEffect(() => {
        console.log('submitStatus= '+ submitStatus);
        setPaperlessState('paperlessfreightbill');
        if(submitStatus==='Clock-In')setActiveIndex(0);
        if(submitStatus==='Entry')setActiveIndex(1);
        if(submitStatus==='Sign-Out')setActiveIndex(2);
        if(submitStatus==='Clock-Out')setActiveIndex(3);
        if(freightBill.dSubmitted && submitStatus==='Entry')setActiveIndex(4);
        if(freightBill.onSiteMode){
            setNavListItems([
           
                {id:'navBar3', name:'Logout', key:'navBarKey3' , action:{action:logout}},
            ])
        }else {
            setNavListItems([
             
                {id:'navBar3', name:'Logout', key:'navBarKey3' , action:{action:logout}},
            ])
        }
      
        const getData = async () => {
            console.log('setting options getting frieghtbill= ', pdfjs);
            setOptions({  theme: 'ios'   });
            await fetchFreightBill(id, orgName).then((tempFreight) => {
             
               
             //   console.log('tempfreightSTOP THIS PRINT ', tempFreight.startTimePaid);   
            });
        
        };
        getData();
       
        pdfjs.GlobalWorkerOptions.workerSrc =`//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;
    }, []);



  return ( 
    <React.Fragment>   
        <Dialog header=" Choose Sign Out" visible={visible} style={{ width: '30vw' }} onHide={closeSignOutPopUp}>
            <Button  color="primary" style={{marginRight:'2em'}} onClick={()=>signOutFreightBill('Shipper')} >Sign Out Load  <i style={{fontSize:".9em", paddingLeft:"1em"}}className="pi pi-external-link"></i></Button>
            <Button color="primary" onClick={()=>signOutFreightBill('Receiver')} >Sign Out Dump  <i style={{fontSize:".9em", paddingLeft:"1em"}}className="pi pi-external-link"></i></Button>
        </Dialog>
        <Steps model={items} activeIndex={activeIndex}  readOnly={freightBill.dSubmitted} />
        <div className="mbsc-grid mbsc-justify-content-center" style={{padding:0}}>
         
            <div className="mbsc-col-xl-8 mbsc-offset-xl-2  mbsc-col-lg-10 mbsc-offset-lg-1 mbsc-col-md-12" style={{padding:0}}>
                <Card  >  
                    {submitStatus==='Entry' && freightBill.Material ? ( 
                        <React.Fragment>
                          <mobiscroll.CardHeader>
                          <mobiscroll.CardTitle style={{ textAlign: 'center',fontSize: '30px'}}>Freight Bill</mobiscroll.CardTitle>
                        </mobiscroll.CardHeader>
                        <div className="mbsc-form-group" style={{ paddingLeft:'1em'}}>
                            <div className="mbsc-row">
                                <div className="mbsc-col-lg-6 mbsc-col-12" style={{padding:".25em"}}>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label"  >Driver:</span> 
                                        <Input  className="disabledLabel" value={freightBill.driverName} disabled={true}  />
                                    </div>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label"  >Job #:</span>    
                                        <Input  className="disabledLabel" value={freightBill.jobNO} disabled={true}  />
                                    </div>
                               
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label"  >Material:</span> 
                                        <Input className="disabledLabel" value={freightBill.Material.Name} disabled={true}  />
                                    </div>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-load-order-label" style={{width: "61%"}} >Load Order:</span> 
                                        <Input className="disabledLabel" value={freightBill.loadOrder} disabled={true}  />
                                        <Button style={{width: "10%", margin:0, paddingLeft:".2em"}} color="primary" onClick={navToPaperlessLoadOrders} ><i style={{fontSize:".9em"}}className="pi pi-external-link"></i></Button>
                                    </div>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label" >Truck Type:</span> 
                                        <Input className="disabledLabel" value={freightBill.TruckType.Name} disabled={true}  /> 
                                    </div>
                                </div>
                                <div className="mbsc-col-lg-6 mbsc-col-12" style={{padding:".25em"}}>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label"  >FB #:</span> 
                                        <Input className="disabledLabel" value={freightBill.FBNO} disabled={true}  />   
                                    </div>
                                  
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label"  >Date:</span> 
                                        <Input  className="disabledLabel" value={freightBill.JobDate} disabled={true}  />
                                    </div>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label"  >Rate Type:</span> 
                                        <Input className="disabledLabel" value={freightBill.PayType} disabled={true}  />   
                                    </div>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label"  >Truck</span> 
                                      
                                        <Dropdown  onChange={(event) => changeFreightBillSelectField("Truck",  event.target.value, trucks)} value={freightBill.Truck.Name}   >
                                            {trucks.map((item) => (
                                                <option key={item.ID} value={item.Name}>{item.Name}</option>
                                            ))}
                                        </Dropdown>
                                    </div>    
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label"  >Trailer</span> 
                                        <Dropdown  onChange={(event) => changeFreightBillSelectField("Trailer", event.target.value, trailers)} value={freightBill.Trailer.Name}  >
                                            {trailers.map((item) => (
                                                <option key={item.ID} value={item.Name}>{item.Name}</option>
                                            ))}
                                        </Dropdown>
                                    </div>            
                                </div>
                            </div>  
                            <div className="mbsc-row">
                                <div className="mbsc-col-6-lg mbsc-col-12" style={{padding:".25em"}}>
                                <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label"  >Shipper:</span> 
                                        <Input className="disabledLabel" value={freightBill.Shipper.Name} disabled={true}  />
                                    </div>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label"  >Origin:</span> 
                                        <Input  className="disabledLabel" value={freightBill.LoadSite.Name} disabled={true}  ></Input>
                                       

                                    </div>
                                    <div className="p-inputgroup" >
                                        <span   className="p-inputgroup-addon for-freight-label"  >Address:</span> 
                                        <Textarea className="disabledLabel" value={freightBill.LoadSite.fullAddress} disabled={true} />
                                        {freightBill.loadAddressOK && ( <Button style={{width: "5%", margin:0}} color="primary" onClick={navigateToLoadSite} ><i className="pi pi-send"></i></Button>)}
                                    </div>
                                </div>
                                <div className="mbsc-col-6-lg mbsc-col-12"style={{padding:".25em"}}>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label"  >Receiver:</span> 
                                        <Input  className="disabledLabel" value={freightBill.Receiver.Name} disabled={true}  />
                                    </div>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label "  >Destination:</span> 
                                        <Input  className="disabledLabel" value={freightBill.DumpSite.Name} disabled={true}  />
                                      
                                    </div>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon for-freight-label"  >Address:</span> 
                                        <Textarea  className="disabledLabel" value={freightBill.DumpSite.fullAddress} disabled={true} />
                                        {freightBill.loadAddressOK && ( <Button style={{width: "5%", margin:0}} color="primary" onClick={navigateToDumpSite} ><i className="pi pi-send"></i></Button>)}

                                    </div>
                                </div>
                            </div> 

                            <div className="mbsc-row mbsc-justify-content-center" style={{width:"100%"}}>
                            {!freightBill.onSiteMode ? (    
                            <div>
                                {freightBill.Weights.map((item,index) => (
                                    <PaperlessWeight 
                                        key={item.loadNumber}  
                                        weight={{item}} 
                                        index={{index}} 
                                        formatTime={formatTime} 
                                        calcExcessStandBy ={calcExcessStandBy}  
                                        getDifferenceInMinutes ={getDifferenceInMinutes}  
                                        openTimePicker={openTimePicker} 
                                        calcRunningTime={calcRunningTime}
                                        changeFreightTime={changeFreightTime}
                                        calcTime ={calcTime}
                                        
                                        >
                                    </PaperlessWeight>
                                ))}
                            </div>):(  
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon for-freight-label"   ># of Loads:</span> 
                                    <Input className="disabledLabel" value={freightBill.loads} disabled={true}  />
                                </div>)}
                                {!freightBill.dSubmitted ? (  
                                <div className="mbsc-button-group-block">
                                    <Button color="primary" onClick={addLoad} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Add Load</Button>
                                    {freightBill.onSiteMode ? ( <Button color="primary" onClick={deleteLoad} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Delete Load</Button>  ):( <div></div>)}
                                </div>):( <div></div>)}
                                <div  className="mbsc-form-group mbsc-justify-content-center"  style={{ margin: 0}}>
                                    <div className="mbsc-row" style={{ margin: 0}} >
                                        <div className="mbsc-col-sm-12 mbsc-col-md-6 "  padding="0" >
                                            <div className="p-inputgroup">
                                                <span className="p-inputgroup-addon for-freight-label" > Total Weight: </span>
                                                <InputNumber  minFractionDigits={2} maxFractionDigits={2}    value={freightBill.tWeight}  disabled={true} className="disabledLabel"  />
                                            </div>
                                            <div className="p-inputgroup">
                                                <span className="p-inputgroup-addon for-freight-label" > # of Loads: </span>
                                                <InputNumber  minFractionDigits={0} maxFractionDigits={0}   value={freightBill.loads} disabled={true} className="disabledLabel"  />
                                            </div>
                                        
                                            <div className="p-inputgroup">
                                                <span className="p-inputgroup-addon for-freight-label" style={{ textWrap:'revert'}} > Total Load Stand By: </span>
                                                <InputNumber   value={freightBill.totalExcessLoad}  disabled={true} suffix=" min"  className="disabledLabel"  />
                                            </div>
                                            <div className="p-inputgroup">
                                                <span className="p-inputgroup-addon for-freight-label" style={{ textWrap:'revert'}} >Total Dump Stand By: </span>
                                                <InputNumber  maxFractionDigits={0}    value={freightBill.totalExcessDump} suffix=" min"  disabled={true} className="disabledLabel"  />
                                            </div>
                                            <div className="p-inputgroup">
                                                <span  className="p-inputgroup-addon for-freight-time-label" style={{ textWrap:'revert'}}  > Depart Load: </span> 
                                                <Datepicker   inputStyle="outline"   onChange={(event) => changeFreightTime('departRoundTrip','mobileDepartRoundTrip', event.value)}  onOpen={(event,inst) => openTimePicker(inst)} value ={freightBill.departRoundTrip} timeFormat="HH:mm" dateFormat='' stepSecond={0}  disabled={freightBill.dSubmitted}  controls={['time']} display="center" touchUi={true}/> 
                                            </div>
                                            <div className="p-inputgroup">
                                                <span  className="p-inputgroup-addon for-freight-time-label" style={{ textWrap:'revert'}}> Arrive Dump: </span> 
                                                <Datepicker   inputStyle="outline"  onChange={(event) => changeFreightTime('arriveRoundTrip','mobileArriveRoundTrip', event.value)}   onOpen={(event,inst) => openTimePicker(inst)} value ={freightBill.arriveRoundTrip} timeFormat="HH:mm" dateFormat='' stepSecond={0}  disabled={freightBill.dSubmitted}  controls={['time']} display="center" touchUi={true}/> 
                                            </div>
                                            <div className="p-inputgroup">
                                                <span  className="p-inputgroup-addon  for-freight-label"  style={{ textWrap:'revert'}}> Running Time: </span> 
                                                <InputNumber className='disabledLabel'   useGrouping={false} minFractionDigits={1} suffix=" hours"  maxFractionDigits={1} value={freightBill.runningTime} disabled={true}  />
                                            </div>
                                        </div>
                                        <div className="mbsc-col-sm-12 mbsc-col-md-6 " padding="0">
                                            <div className="p-inputgroup">
                                                <span className="p-inputgroup-addon for-freight-label" style={{ textWrap:'revert'}} >Avg Round Trip: </span>
                                                <InputNumber     value={freightBill.AverageRoundTrip}  disabled={true} suffix=" min"  className="disabledLabel"  />
                                            </div>
                                            <div className="p-inputgroup"> 
                                                <span className="p-inputgroup-addon for-freight-label" style={{ textWrap:'revert'}}  >Avg Load Time: </span>
                                                <InputNumber     value={freightBill.AverageLoadTime}  disabled={true} suffix=" min"  className="disabledLabel"  />
                                            </div>
                                            <div className="p-inputgroup">
                                                <span className="p-inputgroup-addon for-freight-label" style={{ textWrap:'revert'}}>Avg Dump Time: </span>
                                                <InputNumber     value={freightBill.AverageDumpTime}  disabled={true} suffix=" min"  className="disabledLabel"  />
                                            </div>
                                            <div className="p-inputgroup">
                                                <span  className="p-inputgroup-addon for-freight-time-label" style={{ textWrap:'revert'}}  > Start Time: </span> 
                                                <Datepicker   inputStyle="outline"  onChange={(event) => changeFreightTime('startTime', 'mobileStartTime', event.value)}  onOpen={(event,inst) => openTimePicker(inst)} value ={freightBill.startTime} timeFormat="HH:mm" dateFormat='' stepSecond={0}   disabled={freightBill.dSubmitted} controls={['time']} display="center" touchUi={true}/> 
                                            </div>
                                            <div className="p-inputgroup">
                                                <span  className="p-inputgroup-addon for-freight-time-label" style={{ textWrap:'revert'}}> End Time: </span> 
                                                <Datepicker   inputStyle="outline"  onChange={(event) => changeFreightTime('endTime', 'mobileendTime', event.value)}   onOpen={(event,inst) => openTimePicker(inst)} value ={freightBill.endTime} timeFormat="HH:mm" dateFormat='' stepSecond={0}  disabled={freightBill.dSubmitted}  controls={['time']} display="center" touchUi={true}/> 
                                            </div>
                                            <div className="p-inputgroup">
                                                <span className="p-inputgroup-addon  for-freight-label"  > Deduction: </span>
                                                <InputNumber   useGrouping={false} maxFractionDigits={0}   onChange={(event) => changeFreightLunch(event.value)} value={freightBill.lunch} uffix=" min"  disabled={freightBill.dSubmitted} />
                                            </div>
                                            <div className="p-inputgroup">
                                                <span className="p-inputgroup-addon  for-freight-label"  > Total Time: </span>
                                                <InputNumber className='disabledLabel'  useGrouping={false} minFractionDigits={1} suffix=" hours" maxFractionDigits={1} value={freightBill.tHours} disabled={true}  />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                              
                                <div className="mbsc-button-group-block">
                                <Button  color="primary" onClick={(event) => createPDF('download')} style={{ paddingBottom: "1em", paddingTop: "1em"}}>View PDF</Button>
                                {!freightBill.ShipperApproved ? (<Button id="signOutDump" color="primary" onClick={(event) => checkWeightTags('Shipper')} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Sign Out Load Site</Button>):(<div></div>)}
                                {!freightBill.ReceiverApproved ? (<Button id="signOutLoad" color="primary"  onClick={(event) => checkWeightTags('Receiver')}style={{ paddingBottom: "1em", paddingTop: "1em"}}>Sign Out Dump Site</Button>):(<div></div>)}   
                                {!freightBill.dSubmitted ?  ( 
                                    <div>
                                        {freightBill.Subhauler ?  ( 
                                            <Button id="submitButton" color="primary" onClick={submitFreightBill} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Final Submission</Button>
                                        ):(<Button id="submitButton" color="primary" onClick={submitFreightBill} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Clock Out</Button>)} 
                                    </div> 
                                ):(<Button id="unsubmitButton" color="primary" onClick={unsubmitFreightBill} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Unsubmit</Button>)} 
                                <div className="mbsc-row" style={{ margin:0}}>
                                    <div className="p-inputgroup" style={{  width:"50%"}}>
                                        <FileUpload  chooseLabel={'Upload Freight Bill'} ref={(ref) => fileUploadRefs.current[0] = ref} id={'freightUpload'} mode="basic"  name="demo[]"  url={freightBill.Picture} accept="image/*"  onSelect={(event) => onTemplateSelect(event, fileUploadRef.current)} disabled={freightBill.dSubmitted} />
                                    </div>
                                    <div className="p-inputgroup" style={{ marginLeft:"1em", width:"45%"}}>
                                        <Image src={freightBill.Picture} alt="Image" zoomSrc={freightBill.Picture} height="100"  style={{margin:0, width:100}}  preview/>
                                    </div>   
                                </div>  
                                </div>
                            </div>
                        </div>   
                        </React.Fragment>
                        ):(<div></div>)}
                    {submitStatus==='Clock-In' ? (
                        <div className="mbsc-form-group-content" style={{ paddingLeft:'1em'}}>
                        {!freightBill.Subhauler ? (
                        <div className=" mbsc-row">
                            <div className="p-inputgroup">
                                <span  className="p-inputgroup-addon" > Clock in: </span> 

                                <Datepicker   inputStyle="outline" onChange={(event) => changeFreightTime('startTimePaid', 'mobileStartTimePaid', event.value)}  onOpen={(event,inst) => openTimePicker(inst)} value = {freightBill.startTimePaid}  timeFormat="HH:mm" dateFormat='' stepSecond={0} disabled={freightBill.dSubmitted} controls={['time']}  display="center" touchUi={true}/>
                                

                            </div>
                        </div>
                        ):<div></div>}
                        <div className="mbsc-row mbsc-justify-content-center">
                            <div className="mbsc-col-3"> <Button id="clearSignIn"  color="primary"  style={{height: '100%',margin:0}}  onClick={clearSignIn}>Clear</Button>   </div>
                            <div className="mbsc-col-9"> 
                                <SignatureCanvas onEnd={saveSignIn} ref={signInPadRef}  canvasProps={{  height: 300, className: 'signatureCanvas'}} />
                            </div>
                        </div>

                        <div className="mbsc-button-group-block">      
                            <Button id="SignInButton"  color="primary" onClick={clockInFB} style={{ paddingBottom: "1em", paddingTop: "1em"}}> Sign In</Button>
                        </div>
                    </div>
                    ): (  <div></div>  )}
                    {submitStatus==='View PDF' ? (
                        <div className="mbsc-form-group-content" style={{ marginLeft:'-1em'}}>	
                            <Document onLoadSuccess={onDocumentLoadSuccess} style={{width:"100% !important"}} file={pdfUrl}>
                                <Page pageNumber={pageNumber} />
                            </Document>
                            <p> Page {pageNumber} of {numPages} </p>
                            <Button id="signOutDump" color="primary" onClick={(event) => reviewAndSubmit()} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Continue to Sign Out</Button>
                            <Button id="cancelViewButton"  color="primary"  onClick={enterFreightBill} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Cancel</Button>   
                        </div>
                        )  : (  <div></div>  )}
                    {submitStatus==='Sign-Out' ? (
                       
                        <div className="mbsc-form-group-content" style={{ marginLeft:'-1em'}}>		
                            
                       
                            {/*<div className="mbsc-row">
                                <div className="mbsc-col-3 ">
                                <div className="p-inputgroup">
                                    <span  className="p-inputgroup-addon " style={{width:"50%"}}> Text FB: </span> 
                                    <Checkbox onChange={e => changeTextForeman(e.checked)} checked={freightBill.textForeman}></Checkbox>
                                </div>
                                </div>
                                <div className="mbsc-col-9 ">
                                {freightBill.textForeman ? (
                                    <div className="p-inputgroup">
                                        <span  className="p-inputgroup-addon "  > Text Number: </span> 
                                        <InputNumber  id="foremanText" onChange={(event) => changeTextPhoneNumber(event.value)} useGrouping={false} value ={freightBill.textPhoneNumber} /> 
                                    </div>):(<div></div>)}
                                </div> 
                                </div>*/}
               
                            
                            <div className="mbsc-row mbsc-justify-content-center" style={{ paddingLeft:'1em'}}>
                                <div className="mbsc-col-2">     <span  className="p-inputgroup-addon " style={{ textWrap:'revert', height:"100%", width:"100%" }} >Approver Sign: </span> </div>
                         
                                <div className="mbsc-col-8"> 
                                    <SignatureCanvas onEnd={saveSignature} ref={signaturePadRef}  canvasProps={{  height: 250, className: 'signatureCanvas'}} />
                                </div>
                                <div className="mbsc-col-2"> <Button id="clearSig"  color="primary"  style={{height:"90%"}}  onClick={clearSignature}>Clear</Button>   </div>
                            </div>
                           
                            <div className="mbsc-row mbsc-justify-content-center" style={{ paddingLeft:'1em'}}>
                            <div className="p-inputgroup">
                                <span  className="p-inputgroup-addon " style={{ textWrap:'revert' }} > Approver Comments: </span> 
                                <Editor  headerTemplate={header} text={freightBill.approverComments} value={freightBill.QuillApproverNotes} ref={approverNotesRef} onTextChange={(event) => saveApproverNotes(event)} style={{ height: '320px' }} />
                            </div>
                            </div>
                            <div className="mbsc-row mbsc-justify-content-start">
                                <div ></div>
                                <div id="ApproverNote" name="noEnterButton"  className="mbsc-col-12" ></div> 
                            </div> 
                    
                            <div className="mbsc-button-group-block">
                            
                                <Button id="finishSignButton"  color="primary" onClick={finishSignature} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Approve Sign Out</Button>
                                <Button id="cancelSignButton"  color="primary"  onClick={enterFreightBill} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Cancel</Button>   
                            </div>
                        </div>
                    ): (<div></div>)}

                    {submitStatus==='Clock-Out' ? (
                        <div className="mbsc-form-group-content"  style={{ paddingLeft:'1em'}}>
                            <div className=" mbsc-row">
                                <div className="p-inputgroup">
                                    <span  className="p-inputgroup-addon" > CLock out: </span> 
                                    <Datepicker   inputStyle="outline"  onChange={(event) => changeFreightTime('endTimePaid', 'mobileendTimePaid', event.value)}  onOpen={(event,inst) => openTimePicker(inst)} value ={freightBill.endTimePaid} timeFormat="HH:mm" dateFormat='' stepSecond={0}    controls={['time']} display="center" touchUi={true}/> 
                                </div>
                            </div>
                    
                            <div className="mbsc-button-group-block">      
                                <Button id="SignOutButton" color="primary" style={{ paddingBottom: "1em", paddingTop: "1em"}} onClick={finishClockOut}>Clock Out</Button>
                                <Button  color="primary"  onClick={enterFreightBill} >Cancel Submit</Button>
                            </div>
                        </div>
                    ):(<div></div>)}
                </Card>
            </div>
        </div>
    </React.Fragment>

  
  )
}

export default PaperlessFreightBill