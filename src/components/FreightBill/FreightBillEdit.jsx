import React, { useEffect, useState, useCallback,useRef } from 'react';
import {useParams } from 'react-router-dom';

import { TabView, TabPanel } from 'primereact/tabview';
import { Panel } from 'primereact/panel';   
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import debounce from 'lodash/debounce';


import { getStorage, ref, uploadBytes,getDownloadURL} from "firebase/storage";



import { useGlobal } from '../../context/GlobalContext';
import { UserAuth } from '../../context/AuthContext';
import { useFreightBill } from './FreightBillContext';
import AutoSelectInputNumber from '../AutoSelectInputNumber'; 
import AutoCompleteInput from '../AutoCompleteInput'; 
import NoteComponent from '../NoteComponent'; 
import LoadList from '../ListComponents/LoadList';
import ExpenseList from '../ListComponents/ExpenseList';


function FreightBillEdit(props) {
    const { id } = useParams();
    const storage = getStorage();
    const { setOptions, options,showImagePopUp, showMaterialPopUp, showTruckPopUp, showTrailerPopUp } = useGlobal();
    const {  expenseNames, addDocument, company, updateDocument, trucks, trailers, materials} = UserAuth();
    const {  freightBill, setFreightBill, setDriverFreightBill, fetchFreightBill, fetchExpenses,expenses,freightBillIDRef, fetchDriverFreightBill, createPDF, driverFreightBill } = useFreightBill();
    const [activeTab, setActiveTab]= useState(1)
    const [subActiveTab, setSubActiveTab]= useState(0)
    const [firstLoad, setFirstLoad]= useState(true)
    const [inputValues, setInputValues] = useState(null);
    const [freightType, setFreightType]= useState('Office');
    const [displayTab, setDisplayTab] = useState('FreightBill');
    const [loadFreightBill, setLoadFreightBill]=useState(true);
    const billTypes=[{text:'Hour', value:'Hour'},{text:'Load', value:'Load'},{text:'Ton', value:'Ton'}]
    const payTypes=[{text:'Hour', value:'Hour'},{text:'Load', value:'Load'},{text:'Ton', value:'Ton'},{text:'Hour/Percent', value:'Hour/Percent'},{text:'Load/Percent', value:'Load/Percent'},{text:'Ton/Percent', value:'Ton/Percent'}]
    const header = freightBill ? "Freight Bill for " + freightBill.driverName + " on " + freightBill.JobDate : '';
    const inputValuesRef = useRef(null);
    const freightTypeRef = useRef(null);
    const optionsRef= useRef(null);
    const expenseDriver = freightBill && {ID:freightBill.Driver, Name:freightBill.driverName};


    if((Object.keys(freightBill).length===0 || !freightBill || freightBill.ID!==id) && id && loadFreightBill){
        console.log('is this what is runnign fetch??')
        freightBillIDRef.current=id;
        setLoadFreightBill(false);
        fetchFreightBill(id);
        fetchExpenses(id);
        
    }


    const handleFieldChange = (fieldName, value, runCalc) => {
        console.log('doing chang for fieldname = ' + fieldName)
        console.log('trying to set that field to   = ' + value)
     
        if(fieldName==='Material'){
            let tempInputValues={...inputValues}
            for(let q=0; q< tempInputValues.Weights.length; q++) tempInputValues.Weights[q].Material=value;
            setInputValues((prev) => ({ ...prev, [fieldName]: value, Weights:tempInputValues.Weights })); 
        }else    setInputValues((prev) => ({ ...prev, [fieldName]: value })); 

        if(runCalc && !inputValues.billingOverride){
            let tempInputValues = {...inputValues};
            tempInputValues[fieldName]=value;
       
            setQtyandCalc({...tempInputValues});
        }
    };

    const calcExcessStandBy = function(freight){
        freight.totalExcessLoad=0;
        freight.totalExcessDump=0;
        freight.totalRoundTrip=0; 
        freight.fullExcessDump=0;
        freight.fullExcessLoad=0;
        var countedTrips=0;
        var countedLoadStandBy=0;
        var countedDumpStandBy=0;
     
        for (let i = 0; i < freight.Weights.length; i++) {
            let calcWeight =freight.Weights[i];
          
            calcWeight.roundTrip=0;
            calcWeight.loadTrip=0;
            calcWeight.dumpTrip=0;
            calcWeight.loadTrip=0;
     
            if( i>0 && calcWeight.loadStart && freight.Weights[i-1].dumpEnd) calcWeight.loadTrip =getDifferenceInMinutes(freight.Weights[i-1].dumpEnd,  calcWeight.loadStart);
            if(calcWeight.loadEnd && calcWeight.dumpStart)calcWeight.dumpTrip =getDifferenceInMinutes(calcWeight.loadEnd, calcWeight.dumpStart);
            console.log(' freight.standDA inside load componenet = '+ freight.standDA);
            if(!freight.standLA)freight.standLA=0;

           // calculate the raw standby
           if(calcWeight.loadStart && calcWeight.loadEnd)  calcWeight.fullExcessLoad= getDifferenceInMinutes( calcWeight.loadStart,   calcWeight.loadEnd ); else  calcWeight.fullExcessLoad=0;
           if(calcWeight.dumpStart && calcWeight.dumpEnd)  calcWeight.fullExcessDump=getDifferenceInMinutes( calcWeight.dumpStart,  calcWeight.dumpEnd ); else  calcWeight.fullExcessDump=0;
         

            if (calcWeight.fullExcessLoad <= freight.standLA) calcWeight.excessLoad = 0;
            if (calcWeight.fullExcessLoad > freight.standLA) calcWeight.excessLoad = calcWeight.fullExcessLoad- freight.standLA;
            freight.totalExcessLoad = parseFloat(Number(freight.totalExcessLoad + calcWeight.excessLoad));

            if (calcWeight.fullExcessDump <= freight.standDA ) calcWeight.excessDump = 0;
            if (calcWeight.fullExcessDump > freight.standDA) calcWeight.excessDump = calcWeight.fullExcessDump - freight.standDA;
            freight.totalExcessDump = parseFloat(Number(freight.totalExcessDump + calcWeight.excessDump));
  
            calcWeight.roundTrip=calcWeight.loadTrip + calcWeight.dumpTrip;
  
            freight.fullExcessLoad+=Number(calcWeight.fullExcessLoad);
            freight.fullExcessDump+=Number(calcWeight.fullExcessDump);

            if(calcWeight.fullExcessLoad !==0 )countedLoadStandBy++;
            if(calcWeight.fullExcessDump !==0 )countedDumpStandBy++;
         
            if(calcWeight.loadTrip !==0 && calcWeight.dumpTrip!==0){
                countedTrips++;
                freight.totalRoundTrip+=Number(calcWeight.roundTrip);   
            }
            delete calcWeight['LoadSite'];
            delete calcWeight['DumpSite'];
        
        }
        if(countedTrips>0) freight.AverageRoundTrip = Math.round(freight.totalRoundTrip/countedTrips);
        if(countedLoadStandBy>0) freight.AverageLoadTime = Math.round(freight.fullExcessLoad/countedLoadStandBy); else freight.AverageLoadTime=0;
        if(countedDumpStandBy>0) freight.AverageDumpTime = Math.round(freight.fullExcessDump/countedDumpStandBy); else  freight.AverageDumpTime=0;
      
        calcStandBy(freight);
    }


    const changeStandByField =(fieldName, value, calcExcess)=>{
        setInputValues((prev) => ({ ...prev, [fieldName]: value })); 
       
        let tempInputValues = {...inputValues};
        tempInputValues[fieldName]=value;
        for(let q=0; q<tempInputValues.Weights.length; q++){

        }
       if( calcExcess) calcExcessStandBy({...tempInputValues});
       else     calcStandBy({...tempInputValues});
    
    }
    const updateLoadsField = useCallback((FreightBill)=>{

        if (FreightBill.loads) {
            if (FreightBill.Weights.length < FreightBill.loads) {
                let difference = FreightBill.loads - FreightBill.Weights.length;
                for (var i = 0; i < difference; i++) FreightBill.Weights.push({TagUrl:'', tagNO:'', Material:FreightBill.Material, loadStart:'', loadEnd:'', dumpStart:'', dumpEnd:'', FBNO: FreightBill.ID, loadNumber:Number(FreightBill.Weights.length+1), weight:'' });
            }
            if (FreightBill.Weights.length > FreightBill.loads) {
                let difference = FreightBill.Weights.length - FreightBill.loads;
                for (let j = 0; j < difference; j++) {
                    let tempPosition = FreightBill.Weights.length - 1;
                    FreightBill.Weights.splice(FreightBill.Weights.indexOf(tempPosition), 1);
                }
            }
            let tempExpenses=[...expenses];
            for(let q=0; q<tempExpenses.length; q++)if(tempExpenses[q].Name.Name==='Dump Fee'){
                tempExpenses[q].qty=FreightBill.loads;
                tempExpenses[q].total=Number( tempExpenses[q].qty) * Number( tempExpenses[q].rate);

                updateDocument(  tempExpenses[q],   tempExpenses[q].ID, "Expenses");
            }
         
            setQtyandCalc(FreightBill);
            setInputValues((prev) => ({ ...FreightBill}));
            console.log('UPDATING LOADS FIELD!! ', FreightBill.Weights);
    }
   
    },[freightBill]);
    const debouncedUpdateLoads = useCallback(debounce(updateLoadsField, 500), [updateLoadsField]);
    const changeLoads = (value)=>{
        setInputValues((prev) => ({ ...prev, loads: value })); 
        let tempInputValues = {...inputValues};
        tempInputValues.loads=value;
        debouncedUpdateLoads({...tempInputValues});
    }
  
    const updateFreightBillFields=(fields, values)=>{
        setInputValues(prevState => {
            let newState = { ...prevState };
            for (let i = 0; i < fields.length; i++) newState[fields[i]] = values[i]; 
            return newState;
          });
    }
    const setFreightWeights = (Weights)=>{
        let tempInputValues = {...inputValues};
        tempInputValues.Weights=[...Weights];
        setInputValues((prev) => (  tempInputValues)); 
   
    }
    const formatTime =useCallback(async  (copyInputValues,time, timeName) =>{

        time= time.replace(/\./g,':');
        if (/^([01][0-9]|2[0-3])[0-5][0-9]$/.test(time)) time = time.substr(0, 2) + ':' + time.substr(2);
        else if (/^([0-9]|[0-3])[0-5][0-9]$/.test(time)) time= '0' + time.substr(0, 1) + ':' + time.substr(1);
        else if (/^([0-9]|[0-3]):[0-5][0-9]$/.test(time)) time = '0' + time.substr(0, 1) + ':' + time.substr(2, 3);

        setInputValues((prev) => ({ ...prev, [timeName]: time }));
    
        
        if(timeName!=='dispatchTime'){
            let tempInputValues ={...copyInputValues};
            tempInputValues[timeName] = time;
            changeFreightTime({...tempInputValues});
        }
    },[freightBill]);

    const debouncedFormatTime = useCallback(debounce(formatTime, 500), [formatTime]);
    const debouncedUpdateFreightBillFields = useCallback(debounce(updateFreightBillFields, 500), [updateFreightBillFields]);

    const handleNoteChange =(noteField, text, quillNoteField, quill)=>{
        
    
        let fields =[noteField,quillNoteField];
        let values = [text,quill];
        console.log('fields = ', fields);
        console.log('values = ', values)
       if(noteField==='Notes') debouncedUpdateFreightBillFields(fields, values ); else debouncedUpdateFreightBillFields(fields, values )
     
    }

    const roundTimeToNearestTenth = ( timeValue,  minuteDifference) => {
       
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
       return Number(timeValue);
      
    }

    const checkGearedTime = (time) => {
        // Check if time matches HH:MM format and is a valid time
        return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
    };

    const getDifferenceInMinutes = (start, end) =>{
        console.log('start = ',start)
        console.log('enbd= ',end)
        if(checkGearedTime(start) && checkGearedTime(end)){
            const [startHour, startMinute] = start.split(':').map(Number);
            const [endHour, endMinute] = end.split(':').map(Number);
            const startTotalMinutes = startHour * 60 + startMinute;
            const endTotalMinutes = endHour * 60 + endMinute;
    
            // Calculate the difference in minutes
            let differenceMinutes = endTotalMinutes - startTotalMinutes;
    
            // Adjust for negative differences (e.g., crossing midnight)
            if (differenceMinutes < 0) {
                differenceMinutes += 1440; // Add 24 hours (1440 minutes)
            }
       
          return differenceMinutes;
        }else return 0;
    }


    const changeFreightTime = (FreightBill) => {
   
        FreightBill.totalTravelMinutes = 0;
        let travelHour= 0;
        let extraTravelMinutes=0
        console.log('startTimePaid = '+FreightBill.startTimePaid)
        console.log('FreightBill.WEights = ',FreightBill.Weights)
        if(FreightBill.startTime && FreightBill.startTimePaid){
            FreightBill.startTravelTime= calcTime(FreightBill.startTimePaid, FreightBill.startTime);
            FreightBill.travelTime = FreightBill.startTravelTime;
            FreightBill.totalTravelMinutes =getDifferenceInMinutes(FreightBill.startTimePaid,FreightBill.startTime);
            travelHour= Math.floor(Number( FreightBill.totalTravelMinutes) / 60);
            extraTravelMinutes= Number( FreightBill.totalTravelMinutes) % 60;
            FreightBill.travelTime =roundTimeToNearestTenth( travelHour, extraTravelMinutes);
        }else FreightBill.startTravelTime =0;


        if(FreightBill.endTime && FreightBill.endTimePaid){
            FreightBill.totalTravelMinutes+=getDifferenceInMinutes(FreightBill.endTime,FreightBill.endTimePaid);
            travelHour= Math.floor(Number( FreightBill.totalTravelMinutes) / 60);
            extraTravelMinutes= Number( FreightBill.totalTravelMinutes) % 60;
            FreightBill.travelTime =roundTimeToNearestTenth( travelHour, extraTravelMinutes);
        }else FreightBill.endTravelTime = 0;


      if(FreightBill.startTimePaid && FreightBill.endTimePaid) FreightBill.totalYardHours = calcTime( FreightBill.startTimePaid, FreightBill.endTimePaid);

        FreightBill.grossHours = calcTime(FreightBill.startTime, FreightBill.endTime );
        FreightBill.tHours = calcTime(FreightBill.startTime, FreightBill.endTime );
        console.log('FFreightBill.startTime,= ' +FreightBill.startTime);
            console.log('eightBill.lunc ' + FreightBill.lunch);
            if (FreightBill.lunch && FreightBill.lunch !== '') {
                if (Number(FreightBill.lunch) >= 60) {
                    FreightBill.lunchHours = Math.floor(Number(FreightBill.lunch) / 60);
                    FreightBill.lunchRemainder = Number(FreightBill.lunch) % 60;
                } 
                else {
                    FreightBill.lunchHours = 0;
                    FreightBill.lunchRemainder = Number(FreightBill.lunch);
                }
              
                FreightBill.lunchHours = roundTimeToNearestTenth(FreightBill.lunchHours,  FreightBill.lunchRemainder);
                FreightBill.tHours = Number(Number(FreightBill.tHours) - Number(FreightBill.lunchHours));
             
            }else FreightBill.lunchHours = 0;
        
    
        if (FreightBill.tHours > 8 && FreightBill.BillType === 'Hour') FreightBill.OverTimeAmount = -1 * (8 - FreightBill.tHours);
    
        // FreightBill.tHours=  Number(FreightBill.tHours * 10) / 10;
        if (FreightBill.Company.payByJobHours || FreightBill.Subhauler) FreightBill.tHoursPaid = FreightBill.tHours;
        else FreightBill.tHoursPaid = FreightBill.totalYardHours;
        FreightBill.hoursWorked = FreightBill.tHours;
        FreightBill.paidHoursWorked = FreightBill.tHoursPaid;

        setQtyandCalc(FreightBill);

       
    }

    const calcTime = (start, end) => {
        if (checkGearedTime(start) && checkGearedTime(end)) {
            // Split the time strings into hours and minutes
            const [startHour, startMinute] = start.split(':').map(Number);
            const [endHour, endMinute] = end.split(':').map(Number);
    
            // Convert hours and minutes into total minutes
            const startTotalMinutes = startHour * 60 + startMinute;
            const endTotalMinutes = endHour * 60 + endMinute;
    
            // Calculate the difference in minutes
            let differenceMinutes = endTotalMinutes - startTotalMinutes;
    
            // Adjust for negative differences (e.g., crossing midnight)
            if (differenceMinutes < 0) {
                differenceMinutes += 1440; // Add 24 hours (1440 minutes)
            }
    
            // Convert total minutes to hours and minutes for rounding
            const totalHours = Math.floor(differenceMinutes / 60);
            const remainingMinutes = differenceMinutes % 60;
    
            // Return the time rounded to the nearest tenth
            return roundTimeToNearestTenth(totalHours, remainingMinutes);
        }
    
        // Return 0 if the time strings are not valid
        return 0;
    };

    const calcTotal = (FreightBill) =>{
        if(!FreightBill)FreightBill ={...inputValues};
        console.log('running Calc Total for freight Bill = ', FreightBill)
    
        FreightBill.matTotal = 0; 

          //Calculate odometer difference
        FreightBill.odDiff = FreightBill.odEnd - FreightBill.odStart;
          
        FreightBill.JobOvertimeRate=parseFloat(Math.round((Number(FreightBill.PayRate)*1.5)*100)/100);
        FreightBill.TravelOvertimeRate=parseFloat(Math.round((Number(FreightBill.travelRate)*1.5)*100)/100);
        if (Number(FreightBill.billedQty)){
            FreightBill.tBilled = Number(Number(FreightBill.BillRate) * Number(FreightBill.billedQty));
            FreightBill.tBilled=parseFloat(Math.round(FreightBill.tBilled*100)/100);
        }
                  
        if(FreightBill.hoursWorked<FreightBill.tHours){
            FreightBill.hourMinBilledQty=FreightBill.tHours-FreightBill.hoursWorked;
            FreightBill.hourMinBilled = parseFloat(Math.round(Number(FreightBill.BillRate * FreightBill.hourMinBilledQty)*100)/100);
        }else FreightBill.hourMinBilled =0; 
              
        if(FreightBill.paidHoursWorked<FreightBill.tHoursPaid){
            if (FreightBill.PayType.includes('Percent')){
                FreightBill.hourMinPaidQty=FreightBill.tHoursPaid-FreightBill.paidHoursWorked;
                FreightBill.hourMinTotalPaid = parseFloat(Math.round(Number(FreightBill.PayRate * FreightBill.hourMinPaidQty)*100)/100);
                FreightBill.hourMinPaid = parseFloat(Math.round(Number((FreightBill.PayRate * FreightBill.hourMinPaidQty) * Number(FreightBill.driverPercent / 100)))*100)/100;
            }else {
                FreightBill.hourMinPaidQty=FreightBill.tHoursPaid-FreightBill.paidHoursWorked;
                FreightBill.hourMinPaid = parseFloat(Math.round(Number(FreightBill.PayRate * FreightBill.hourMinPaidQty)*100)/100);
                FreightBill.hourMinTotalPaid = FreightBill.hourMinPaid;
            }
        }else{
            FreightBill.hourMinPaid =0;
            FreightBill.hourMinPaidQty =0;
            FreightBill.hourMinTotalPaid =0;
        }
              
          //Calculate paid trucking totals
        FreightBill.overtimeTotal=0;

        if (Number(FreightBill.paidQty)) {
            console.log('FreightBill.PayRate == ' + FreightBill.PayRate);
            FreightBill.totalTruckPay = parseFloat(Math.round(Number(FreightBill.PayRate * FreightBill.paidQty)*100)/100);
            console.log('total truck pay = ' + FreightBill.totalTruckPay);
            if (FreightBill.PayType.includes('Percent')){
        
                var tempdriverpay = Number(FreightBill.totalTruckPay  * Number(FreightBill.driverPercent / 100));
                FreightBill.totalDriverPay= parseFloat(Math.round(Number(FreightBill.totalTruckPay  * Number(FreightBill.driverPercent / 100))*100)/100);
                
            }else if(FreightBill.PayType == 'Hour' && !FreightBill.Subhauler){
                FreightBill.startTravelAndJobTime=Number(FreightBill.paidQty);
                FreightBill.JobOvertimeQty=0;
                FreightBill.TravelOvertimeQty=0;
            
            FreightBill.totalTime=FreightBill.startTravelAndJobTime + FreightBill.endTravelTime;
            if(FreightBill.totalTime>8) FreightBill.TravelOvertimeQty=FreightBill.totalTime-8
            
                FreightBill.JobOvertimeTotal= parseFloat(Math.round(Number(FreightBill.JobOvertimeQty*FreightBill.JobOvertimeRate)*100)/100);
                FreightBill.TravelOvertimeTotal= parseFloat(Math.round(Number(FreightBill.TravelOvertimeQty*FreightBill.TravelOvertimeRate)*100)/100);
                FreightBill.overtimeTotal=parseFloat(Math.round(Number(FreightBill.TravelOvertimeTotal+FreightBill.JobOvertimeTotal)*100)/100);
                if( FreightBill.hourMinPaid>0)FreightBill.truckPaid= FreightBill.truckPaid-FreightBill.hourMinPaid;
                
                FreightBill.totalDriverPay= FreightBill.totalTruckPay;
            }else  FreightBill.totalDriverPay= FreightBill.totalTruckPay;
        }
          


        //Calculate Standby
        if(FreightBill.paidStandExMin){ 
                FreightBill.standPaid = parseFloat(Math.round(Number(FreightBill.paidStandExMin*  FreightBill.standPR)*100)/100);
                FreightBill.totalStandPaid=parseFloat(Math.round(Number(FreightBill.paidStandExMin*  FreightBill.standPR)*100)/100);
                if(FreightBill.PayType.includes("Percent")) FreightBill.standPaid = parseFloat(Math.round(Number(FreightBill.standPaid) *(Number(FreightBill.driverPercent / 100))*100)/100);
        }else FreightBill.standPaid =0;

        FreightBill.standBilled= parseFloat(Math.round(Number(FreightBill.standExMin*  FreightBill.standBR)*100)/100);
        
        if(!FreightBill.UseStandBy) {
            FreightBill.standBilled= 0;
            FreightBill.standPaid= 0;
        }
        //Calculate Total number to use for % based billing charges
        if (FreightBill.UseStandBy && FreightBill.standBilled>0) FreightBill.totalForBilledPercents=Number(FreightBill.standBilled +FreightBill.tBilled);
        else FreightBill.totalForBilledPercents= FreightBill.tBilled;
        
        //Calculate Total number to use for % based paying charges
        if (FreightBill.UseStandBy && FreightBill.standPaid>0)  FreightBill.totalForPaidPercents=Number(FreightBill.standPaid +FreightBill.totalTruckPay );
        else FreightBill.totalForPaidPercents= FreightBill.totalTruckPay ;
    

        //Calculate Fuel Surchage
        if (FreightBill.FuelCharge>0)FreightBill.fuelBilled = Math.round(Number(FreightBill.tBilled  * (FreightBill.FuelCharge / 100))*100)/100;
         else FreightBill.fuelBilled  =0;
          
        //Calculate Billed Broker Fee
        if (FreightBill.billedBrokerPercent>0){
            if(FreightBill.billBrokerFuel)FreightBill.fuelBilled =FreightBill.fuelBilled-  Math.round((Number(FreightBill.fuelBilled  * (FreightBill.billedBrokerPercent / 100)))*100)/100;
            FreightBill.billedTruckingBrokerTotal=   Math.round(-1 * (Number(FreightBill.tBilled  * (FreightBill.billedBrokerPercent / 100)))*100)/100;
            FreightBill.bFee=  Math.round(-1 * (Number(FreightBill.totalForBilledPercents  * (FreightBill.billedBrokerPercent / 100)))*100)/100;
        }else {
            FreightBill.billedTruckingBrokerTotal=0;
            FreightBill.bFee=0;
        }	
        
        //Calculate Paid Broker Fee
        if (FreightBill.paidBrokerPercent>0){
            FreightBill.paidTruckingBrokerTotal=  Math.round(-1 * (Number(FreightBill.totalTruckPay * (FreightBill.paidBrokerPercent / 100)))*100)/100;
            FreightBill.paidBrokerFee = Math.round(-1 * (Number(FreightBill.totalForPaidPercents  * (FreightBill.paidBrokerPercent / 100)))*100)/100;
        }else{
            FreightBill.paidTruckingBrokerTotal=0;
            FreightBill.paidBrokerFee =0;
        } 

        //Calculate Trailer Fees
        if (FreightBill.trailerPercent>0){
            FreightBill.truckingTrailerTotal =  Math.round(-1 * (Number(FreightBill.totalTruckPay* (FreightBill.trailerPercent / 100))*100))/100;
            FreightBill.tFee =   Math.round(-1 * (Number(FreightBill.totalForPaidPercents  * (FreightBill.trailerPercent / 100))*100))/100;
        }else{
            FreightBill.truckingTrailerTotal=0;
            FreightBill.tFee =0;
        }
        
          //Calculate Expenses
        var billedExpenses = 0;
        var paidExpenses = 0;
        for (var i = 0; i < expenses.length; i++) {
            var expenseTotal = 0;
            console.log('bexpenses[i] = ' , expenses[i] );
            if (expenses[i].bill) billedExpenses = parseFloat(Math.round(Number(billedExpenses + expenses[i].total)*100)/100);
            if (expenses[i].pay) {
                expenseTotal = expenses[i].total;
                paidExpenses = parseFloat(Math.round(Number(paidExpenses + expenses[i].total)*100)/100);
                if (expenses[i].applyBrokerFee && FreightBill.paidBrokerPercent > 0) FreightBill.paidBrokerFee -= parseFloat(Math.round(Number(expenseTotal * (FreightBill.paidBrokerPercent / 100))*100)/100);
            }
            console.log('paidExpenses = ' + paidExpenses);
            console.log('billedExpenses = ' + billedExpenses);
        }
        //calculate Travel Pay
        if(FreightBill.travelRate && FreightBill.travelTime && !FreightBill.Subhauler && !FreightBill.PayType.includes('Percent')){
            if(FreightBill.TravelOvertimeQty>0)FreightBill.paidTravelTime=parseFloat(Math.round(Number(FreightBill.travelRate*Number(FreightBill.travelTime-FreightBill.TravelOvertimeQty))*100)/100);
            else FreightBill.paidTravelTime=parseFloat(Math.round(Number(FreightBill.travelRate*FreightBill.travelTime)*100)/100);
        }else FreightBill.paidTravelTime=0;
            
        FreightBill.paidExpenses = paidExpenses;
        FreightBill.billedExpenses = billedExpenses;
        //Calculate final totals and profit
        FreightBill.bTotal = parseFloat(Math.round(Number(Number(FreightBill.tBilled) + Number(FreightBill.matTotal) + Number(FreightBill.fuelBilled) + Number(FreightBill.billedExpenses) + Number(FreightBill.bFee))*100)/100);
        FreightBill.tPaid = parseFloat(Math.round(Number(Number(FreightBill.overtimeTotal) + Number(FreightBill.totalDriverPay) +Number( FreightBill.tFee) +Number( FreightBill.paidBrokerFee) + Number(FreightBill.paidExpenses) +Number(FreightBill.paidTravelTime) )*100)/100);
    
        console.log('p  FreightBill.bTotal= ' +   FreightBill.bTotal);
        console.log('FreightBill.tPaid = ' + FreightBill.tPaid);
    
        if(FreightBill.VNum>1 && FreightBill.truckingPaid)this.findAdjustmentDifference(FreightBill);
        if (FreightBill.UseStandBy) {
            FreightBill.tPaid = parseFloat(Math.round(Number(FreightBill.tPaid + FreightBill.standPaid)*100)/100);
            FreightBill.bTotal = parseFloat(Math.round(Number(FreightBill.bTotal + FreightBill.standBilled)*100)/100);
        }   
        if(FreightBill.SellMaterial && FreightBill.MaterialTotal>0){
            FreightBill.bTotal = parseFloat(Math.round(Number(FreightBill.bTotal + FreightBill.MaterialTotal)*100)/100);
        }
        if(FreightBill.Subhauler)FreightBill.hourlyRate = parseFloat(Math.round(Number(FreightBill.tPaid/FreightBill.tHours)*100)/100); 
        else if(FreightBill.totalYardHours) FreightBill.hourlyRate = parseFloat(Math.round(Number(FreightBill.tPaid/FreightBill.totalYardHours)*100)/100);
        FreightBill.profit = parseFloat(Math.round(Number(FreightBill.bTotal - FreightBill.tPaid)*100)/100);
        if(FreightBill.tPaid!==0 || FreightBill.bTotal!==0){
            FreightBill.missing=false;
            FreightBill.onHold=false;
        }
        console.log(' this is the end and we are setting the inputvalues = ', FreightBill)
        setInputValues((prev) => ({ ...prev, ...FreightBill })); 
    }

    const setQtyandCalc =(FreightBill)=>{
        if (FreightBill.PayType === 'Hour' || FreightBill.PayType === 'Hour/Percent') {
            if (company.payByJobHours || FreightBill.Subhauler){
                FreightBill.paidQty = Number(FreightBill.tHours);
                FreightBill.tHoursPaid= Number(FreightBill.tHours)
            } else FreightBill.paidQty = Number(FreightBill.totalYardHours);
        }
        console.log('SeFreightBill.loads = ' + FreightBill.loads);
        if (FreightBill.PayType === 'Load' || FreightBill.PayType === 'Load/Percent') FreightBill.paidQty = Number(FreightBill.loads);
        if (FreightBill.PayType === 'Ton' || FreightBill.PayType === 'Ton/Percent') FreightBill.paidQty = Number(FreightBill.tWeight);
        if (FreightBill.BillType === 'Hour') FreightBill.billedQty = Number(FreightBill.tHours);
        if (FreightBill.BillType === 'Load') FreightBill.billedQty = Number(FreightBill.loads);
        if (FreightBill.BillType === 'Ton') FreightBill.billedQty = Number(FreightBill.tWeight);
        console.log('Setting QTy for Frieghtbill with billed qty = ' + FreightBill.billedQty);

        if (company.payByJobHours ||FreightBill.Subhauler) FreightBill.tHoursPaid = FreightBill.tHours; else FreightBill.tHoursPaid = FreightBill.totalYardHours;
        FreightBill.hoursWorked = FreightBill.tHours;
        FreightBill.paidHoursWorked = FreightBill.tHoursPaid;

        calcTotal(FreightBill);
    }

    const calcRunningTime = (FreightBill) => {

        var runningMinutes =getDifferenceInMinutes(FreightBill.departRoundTrip,FreightBill.arriveRoundTrip);
        FreightBill.runningTime= calcTime(FreightBill.departRoundTrip, FreightBill.arriveRoundTrip, );
    
        if(checkGearedTime(FreightBill.endTime)) {
            const [endHour, endMinute] = FreightBill.endTime.split(':').map(Number);
           let totalMinutes = endHour* 60 +endMinute + runningMinutes;
         
           let totalHours = Math.floor(totalMinutes / 60);
           let remainingMinutes = totalMinutes % 60;
           if(remainingMinutes<10)remainingMinutes='0'+remainingMinutes.toString();
           FreightBill.endTime= totalHours.toString()+':'+remainingMinutes.toString();
 
            setQtyandCalc(FreightBill);
        }
    }

    const calcStandBy =function(FreightBill){
        // freightBill.standByIsBilled=false; 
     
        FreightBill.loadStandPaid= parseFloat(Number(FreightBill.totalExcessLoad*  FreightBill.standPR));
        FreightBill.loadStandBilled=parseFloat(Number(FreightBill.totalExcessLoad*  FreightBill.standBR));
    
   
        FreightBill.dumpStandPaid=  parseFloat(Number(FreightBill.totalExcessDump*  FreightBill.standPR));
        FreightBill.dumpStandBilled=parseFloat(Number(FreightBill.totalExcessDump*  FreightBill.standBR));

  
        FreightBill.standExMin = parseFloat(Number(FreightBill.totalExcessLoad + FreightBill.totalExcessDump));
        FreightBill.paidStandExMin = parseFloat(Number(FreightBill.totalExcessLoad + FreightBill.totalExcessDump));
  
          
        setQtyandCalc(FreightBill);  
    }
    const saveFreightBill = () => {
        let updateDoc = inputValuesRef.current; // Use ref to get the latest inputValues
        console.log('freightType = ' + freightTypeRef.current)
      if(freightTypeRef.current==='Driver')updateDoc.approved=true;
        updateDocument(updateDoc, updateDoc.ID, "FreightBills");
    };

    const clickUpload = () =>{
        console.log(' document.getElementById(freightUpload) =' , document.getElementById('freightUpload'))
        document.getElementById('freightUpload').click();
    }
    const startUpload=(event)=>{
        console.log('we have started an uplaod and event ', event)
        uploadFile(event.target.files[0])
    }
    const uploadFile = async(file)=>{
        console.log('file = ', file.name)

        let storageRef= ref(storage, 'attachments/' + freightBill.companyID+'/FreightBills/' +freightBill.ID+'/Pictures/'+file.name);

        uploadBytes(storageRef, file).then((snapshot) => {
            getDownloadURL(storageRef).then((url) => {
            
            handleFieldChange( 'Picture', url,false);
            let standByLabel = inputValuesRef.current.UseStandBy ? 'Hide Stand By' : 'Show Stand By';
            setOptions(
                [{
                    label: 'Options',
                    icon: 'pi pi-clock',
                   
                    items: [
                        {label:'Show Picture', function:(e) =>showImagePopUp(inputValuesRef.current.Picture, e)},
                        {label: 'Create PDF', function:startCreatePDF},
                        {label: 'Invoice by Scale Tag'},
                        {label: 'Mark Freight Bill Billed'},
                        {label: 'Mark Freight Bill Paid'},
                        {label: standByLabel, function:toggleStandBy},
                    ]
                },optionsRef.current[1]]
            )
          });
        });
      }
   

    useEffect(() => {
        console.log('freight bill edit usse effect',expenses)
        if (freightBill && Object.keys(freightBill).length > 0 && firstLoad) {
  
            if(freightType==='Office')setInputValues({...freightBill});
            let standByLabel = freightBill.UseStandBy ? 'Hide Stand By' : 'Show Stand By';
            let attachPictureObj = freightBill.Picture ? {label:'Show Picture', function:(e) =>showImagePopUp(freightBill.Picture, e)} :  {label: 'Attach Picture', function:clickUpload};
            setOptions(
                [{
                    label: 'Options',
                    icon: 'pi pi-clock',
                   
                    items: [
                        attachPictureObj,
                        {label: 'Create PDF', function:startCreatePDF},
                        {label: 'Invoice by Scale Tag'},
                        {label: 'Mark Freight Bill Billed'},
                        {label: 'Mark Freight Bill Paid'},
                        {label: standByLabel, function:toggleStandBy},
                    ]
                },{
                    label: 'Save Freight Bill',
                    icon: 'pi pi-save',
                    function:saveFreightBill
                  
                }]
            )
            fetchDriverFreightBill(freightBill.ID);
            setFirstLoad(false);
        }
    }, [freightBill]);
    useEffect(() => {
       optionsRef.current = options;
    }, [options]);
    useEffect(() => {
        inputValuesRef.current = inputValues;
        console.log('inputValues WEHN SETITN THE REF= ', inputValues);
       if(inputValuesRef.current?.Picture) console.log('WE CHANGE DHT EINPUT VALUES AND NOW THE PICTURE = ', inputValuesRef.current.Picture)
    }, [inputValues]);
    useEffect(() => {
        if(expenses.length>0 && inputValues) calcTotal(inputValues);
    }, [expenses]);

    const changeTimeField = (time, timeName) =>{
        setInputValues((prev) => ({ ...prev, [timeName]: time }));
        let copyInputValues ={...inputValues};
        copyInputValues[timeName]=time;
        debouncedFormatTime(copyInputValues,time, timeName);
    }

    const changeDisplayTab = (e) =>{
        if(e.index===0) setDisplayTab('FreightBill');
        if(e.index===1) setDisplayTab('Loads');
        if(e.index===2) setDisplayTab('Expenses');
        setSubActiveTab(e.index)
    }
    function formatTo24HourTime(date) {
            if(!checkGearedTime(date)){
                console.log('wait checkgeared time failed for ', date);
                const tempDate= date.toDate();
                const hours = tempDate.getHours().toString().padStart(2, '0'); // Get hours and pad with leading zero if needed
                const minutes = tempDate.getMinutes().toString().padStart(2, '0'); // Get minutes and pad with leading zero if needed
                console.log('hours = ' + hours)
                return `${hours}:${minutes}`;
            }else return date;
    
    }
    const showDriverFreight = (FreightBill) =>{

        FreightBill.startTime =  formatTo24HourTime(FreightBill.startTime);
        FreightBill.startTimePaid =  formatTo24HourTime(FreightBill.startTimePaid);
        FreightBill.endTime =  formatTo24HourTime(FreightBill.endTime);
        FreightBill.endTimePaid =  formatTo24HourTime(FreightBill.endTimePaid);
    
        FreightBill.arriveRoundTrip =  formatTo24HourTime(FreightBill.arriveRoundTrip);
        FreightBill.departRoundTrip =  formatTo24HourTime(FreightBill.departRoundTrip);

        for(let i=0; i<FreightBill.Weights.length; i++){
            FreightBill.Weights[i].loadStart = formatTo24HourTime(FreightBill.Weights[i].loadStart);
            FreightBill.Weights[i].loadEnd =  formatTo24HourTime(FreightBill.Weights[i].loadEnd);
            FreightBill.Weights[i].dumpStart =  formatTo24HourTime(FreightBill.Weights[i].dumpStart);
            FreightBill.Weights[i].dumpEnd =   formatTo24HourTime(FreightBill.Weights[i].dumpEnd);
       
         
        }
        setInputValues({...FreightBill})
    }

    const startCreatePDF = () =>{
        createPDF(inputValuesRef.current);
    }
    const toggleStandBy =()=>{
        console.log('about to toggle stand by and use stand by = ' + inputValuesRef.current.UseStandBy)
    
        let newArray = [{
            label: 'Options',
            icon: 'pi pi-clock',

            items: [
                {label: 'Attach Picture', function:clickUpload},
                {label: 'Create PDF', function:startCreatePDF},
                {label: 'Invoice by Scale Tag'},
                {label: 'Mark Freight Bill Billed'},
                {label: 'Mark Freight Bill Paid'},
                {label: 'Hide Stand By', function:toggleStandBy},
            ]
        },optionsRef.current[1]];
        console.log('options inside toggle = ',newArray);
        if(inputValuesRef.current.UseStandBy){
            setInputValues((prev) => ({ ...prev,UseStandBy: false})); 
        
            setOptions([{
                label: 'Options',
                icon: 'pi pi-clock',
                items: [
                    {label: 'Attach Picture', function:clickUpload},
                    {label: 'Create PDF', function:startCreatePDF},
                    {label: 'Invoice by Scale Tag'},
                    {label: 'Mark Freight Bill Billed'},
                    {label: 'Mark Freight Bill Paid'},
                    {label: 'Show Stand By', function:toggleStandBy},
                ]
            }, optionsRef.current[1]])
            console.log('seting the fucking options')
            inputValuesRef.current.UseStandBy=false;
            calcTotal(inputValuesRef.current);
         } else{
            setInputValues((prev) => ({ ...prev,UseStandBy: true})); 
                setOptions([{
                    label: 'Options',
                    icon: 'pi pi-clock',
                   
                    items: [
                        {label: 'Attach Picture', function:clickUpload},
                        {label: 'Create PDF', function:startCreatePDF},
                        {label: 'Invoice by Scale Tag'},
                        {label: 'Mark Freight Bill Billed'},
                        {label: 'Mark Freight Bill Paid'},
                        {label: 'Hide Stand By', function:toggleStandBy},
                    ]
                }, optionsRef.current[1]])
                inputValuesRef.current.UseStandBy=true;
                calcTotal(inputValuesRef.current);
            } 
    }
    const changeFreightBill = (e) =>{

        console.log('e.index = =' + e.index)
   
        if(e.index===0 && freightType==='Office') {
            setFreightBill({...inputValues});
            console.log('drsiver freight bill = ', driverFreightBill)
            showDriverFreight({...driverFreightBill})
            setActiveTab(0);
            freightTypeRef.current='Driver';
            setFreightType('Driver');
            setOptions(
                [options[0],{
                    label: 'Approve and Save',
                    icon: 'pi pi-save',
                    function:saveFreightBill
                  
                }]
            )
        }
        if(e.index===1 && freightType==='Driver') {
            setDriverFreightBill({...inputValues});
            setInputValues({...freightBill})
            setActiveTab(1);
            setFreightType('Office');
            freightTypeRef.current='Office';
            setOptions(
                [options[0],{
                    label: 'Save Freight Bill',
                    icon: 'pi pi-save',
                    function:saveFreightBill
                  
                }]
            )
        } 
 
     
    }

    const handleAddExpense = (event)=>{
        let truckName='';
        if(freightBill.Subhauler)truckName=freightBill.Truck; else truckName=freightBill.Truck.Name;
        console.log('freightBill.Truck = ', freightBill.Truck)
        console.log('freightBill.Truck = ', freightBill.Truck)
        var Expense = {
            ID: "",
            Name: expenseNames[0],
            
            description: expenseNames[0].Name,
            qty: Number(0),
            rate: Number(0),
            total: Number(0),
            addToFreights:false,
            FBNO:freightBill.FBNO,
            QueryDate:freightBill.QueryDate,
            JobDate:freightBill.JobDate,
            driverName:freightBill.driverName,
            BillType:freightBill.BillType,
            Truck:truckName,
            Company:freightBill.Company,
            FreightBill:freightBill.ID,
            dispatchID:freightBill.dispatchID,
            reDriver: false,
            bCustomer: false,
            reCustomer: false,
            bDriver: false,
            bill:false,
            billed:false,
            paid:false,
            pay:false,
            onHold:true,
            BillTo:freightBill.Account,
            
            MaterialExpense: false
        };

        if(!freightBill.Subhauler)Expense.PayTo={ID:freightBill.Driver,Name:freightBill.driverName	};
        else Expense.PayTo={ID:freightBill.subhaulerID,Name:freightBill.haulerName	};
        console.log('aabout to run add Expense for ', Expense) 
        addDocument(Expense, 'Expenses');

    }

    return (
        <div>
            {inputValues && (<div>
                <TabView activeIndex={activeTab} onTabChange={(e) => changeFreightBill(e)}   >
                  {inputValues.dSubmitted && (  <TabPanel header="Driver Freight Bill" style={{marginTop:"0", padding:"0"}}  />  )}
                    <TabPanel header="Office Freight Bill" style={{marginTop:"0", padding:"0"}}  />   
                </TabView>
                <TabView   onTabChange={(e) => changeDisplayTab(e)}  activeIndex={subActiveTab}  >
                        <TabPanel header="Freight Bill" style={{marginTop:"0"}}  />
                        <TabPanel header="Loads"  style={{marginTop:"0"}}  />  
                        <TabPanel header="Expenses" style={{marginTop:"0"}}  />   
                </TabView>
                {displayTab==='FreightBill' && (
                    <Panel header={header}>
                        <div  className="mbsc-row" style={{margin:"0"}}> 
                            <div className="mbsc-col-4">
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Driver </span> 
                                    <InputText  value={inputValues.driverName}  onChange={(e) => handleFieldChange('driverName', e.target.value, false)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >FB # </span> 
                                    <InputText  value={inputValues.FBNO}  onChange={(e) => handleFieldChange('FBO', e.target.value, false)} />
                                </div>
                                
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  ># of Loads</span> 
                                    <AutoSelectInputNumber   value={inputValues.loads}   onChange={(e) => changeLoads( e.value)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Dispatch Start</span> 
                                    <InputText  value={inputValues.dispatchTime} maxLength={5} onChange={(e) =>changeTimeField(e.target.value, 'dispatchTime')} />
                                </div> 
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Job Start</span> 
                                    <InputText  value={inputValues.startTime} maxLength={5} onChange={(e) =>changeTimeField(e.target.value, 'startTime')} />
                                </div> 
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Job End</span> 
                                    <InputText  value={inputValues.endTime} maxLength={5} onChange={(e) =>changeTimeField(e.target.value, 'endTime')} />
                                </div> 
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Deduction</span> 
                                    <AutoSelectInputNumber   value={inputValues.lunch}   onChange={(e) => handleFieldChange('lunch', e.value, true)} />
                                </div>
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Running Time</span> 
                                    <AutoSelectInputNumber   value={inputValues.runningTime}   onChange={(e) => handleFieldChange('runningTime', e.value, true)} />
                                </div>
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Total Hours</span> 
                                    <AutoSelectInputNumber   value={inputValues.tHours}   onChange={(e) => handleFieldChange('tHours', e.value, true)} />
                                </div>

                            </div>
                            <div className="mbsc-col-4">
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Turned In </span> 
                                    <InputText  value={inputValues.fbTurnIn}  onChange={(e) => handleFieldChange('fbTurnIn', e.target.value)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Days Late </span> 
                                    <AutoSelectInputNumber   value={inputValues.DaysLate}   onChange={(e) => handleFieldChange('DaysLate', e.value)} />
                                </div>
                                <AutoCompleteInput fieldName="Truck" field="Name" value={inputValues.Truck} suggestions={trucks} setValue={setInputValues} handleFieldChange={handleFieldChange} editClick={() => showTruckPopUp(inputValues.Truck)} databaseList={'Trucks'}/>
                                <AutoCompleteInput fieldName="Trailer" field="Name" value={inputValues.Trailer} suggestions={trailers} setValue={setInputValues} handleFieldChange={handleFieldChange} editClick={() => showTruckPopUp(inputValues.Trailer)} databaseList={'Trailers'}/>

                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Show Up</span> 
                                    <AutoSelectInputNumber   value={inputValues.ShowUp}   onChange={(e) => handleFieldChange('ShowUp', e.value)} />
                                </div>
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Hour Min</span> 
                                    <AutoSelectInputNumber   value={inputValues.HourMin}   onChange={(e) => handleFieldChange('HourMin', e.value, true)} />
                                </div>
                            
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Yard Start </span> 
                                <InputText  value={inputValues.startTimePaid} maxLength={5} onChange={(e) =>changeTimeField(e.target.value, 'startTimePaid')} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Yard End </span> 
                                <InputText  value={inputValues.endTimePaid} maxLength={5} onChange={(e) =>changeTimeField(e.target.value, 'endTimePaid')} />
                                </div>
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Yard Hours</span> 
                                    <AutoSelectInputNumber   value={inputValues.totalYardHours}   onChange={(e) => handleFieldChange('totalYardHours', e.value)} />
                                </div>
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Travel Time</span> 
                                    <AutoSelectInputNumber   value={inputValues.travelTime}   onChange={(e) => handleFieldChange('travelTime', e.value, true)} />
                                </div>

                            </div>
                            <div className="mbsc-col-4">
                                <div className="mbsc-row" >
                                    <div className="p-inputgroup mbsc-col">
                                        <span className="p-inputgroup-addon p-checkbox-label">Missing</span>
                                        <Checkbox style={{ width: '100%' }} onChange={(e) => handleFieldChange('missing', e.checked, false)}  checked={inputValues.missing}  />
                               
                                    </div>   
                                    <div className="p-inputgroup mbsc-col">
                                        <span className="p-inputgroup-addon p-checkbox-label">On Hold</span>
                                        <Checkbox style={{ width: '100%' }} onChange={(e) => handleFieldChange('onHold', e.checked, false)}  checked={inputValues.onHold}  />
                                    </div>
                                </div>
                                <div className="mbsc-row" >
                                    <div className="p-inputgroup mbsc-col">
                                        <span className="p-inputgroup-addon " style={{ width:"60%"}}>Invoice</span>
                                        <Button   >Invoice</Button>
                                    </div>   
                                    <div className="p-inputgroup mbsc-col">
                                        <span className="p-inputgroup-addon " style={{ width:"40%"}}>Pay Statement</span>
                                        <Button   >Pay Statement </Button>
                                    </div>
                                </div>
                                <div className="mbsc-row" >
                                    <div className="p-inputgroup mbsc-col">
                                        <span className="p-inputgroup-addon p-checkbox-label">Submitted</span>
                                        <Checkbox style={{ width: '100%' }} onChange={(e) => handleFieldChange('dSubmitted', e.checked, false)} disabled={true} checked={inputValues.dSubmitted}  />
                                    </div>   
                                    <div className="p-inputgroup mbsc-col">
                                        <span className="p-inputgroup-addon p-checkbox-label">Manual Billing</span>
                                        <Checkbox style={{ width: '100%' }} onChange={(e) => handleFieldChange('billingOverride', e.checked, true)}  checked={inputValues.billingOverride}  />
                                    </div>
                                </div>
                                <div className="mbsc-row" >
                                    <div className="p-inputgroup mbsc-col">
                                        <span className="p-inputgroup-addon p-checkbox-label">Apply Broker Fee to Fuel</span>
                                        <Checkbox style={{ width: '100%' }} onChange={(e) => handleFieldChange('billBrokerFuel', e.checked, true)}  checked={inputValues.billBrokerFuel}  />
                                    </div>   
                                    <div className="p-inputgroup mbsc-col">
                                        <span className="p-inputgroup-addon p-checkbox-label">Billing Approved</span>
                                        <Checkbox style={{ width: '100%' }} disabled={true} onChange={(e) => handleFieldChange('approved', e.checked)}  checked={inputValues.approved}  />
                                    </div>
                                </div>
                                
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Odometer Start</span> 
                                    <AutoSelectInputNumber   value={inputValues.odStart}   onChange={(e) => handleFieldChange('odStart', e.value)} />
                                </div>
                        
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Odometer End</span> 
                                    <AutoSelectInputNumber   value={inputValues.odEnd}   onChange={(e) => handleFieldChange('odEnd', e.value)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Odometer Diff</span> 
                                    <AutoSelectInputNumber   value={inputValues.odDiff}   onChange={(e) => handleFieldChange('odDiff', e.value)} />
                                </div>

                                <AutoCompleteInput fieldName="Material" field="Name" value={inputValues.Material} suggestions={materials} setValue={setInputValues} handleFieldChange={handleFieldChange} editClick={() => showMaterialPopUp(inputValues.Material)} databaseList={'Materials'}/>

                            </div>
                        </div>
                        <div className='mbsc-row'>
                            <Panel className='mbsc-col' header="Note to Driver">
                                <NoteComponent parent={inputValues} noteType={'driverNote'} quillName={'FBNoteToDriverQuill'} onNoteChange={handleNoteChange} ></NoteComponent>      
                            </Panel>
                            <Panel className='mbsc-col' header="Comments">
                                <NoteComponent parent={inputValues} noteType={'Comments'} quillName={'QuillFBNotes'} onNoteChange={handleNoteChange} ></NoteComponent>      
                            </Panel>
                        </div>
                    </Panel>
                )}
                   {displayTab==='Loads' && (<Panel header="Loads">
                   
                        <div className="mbsc-row" style={{ height: "100%", width: "100%" }}>
                  
                                <table style={{ marginBottom: "5px", width: "100%" }}>
                                    <thead>
                                        <tr className="mbsc-row" style={{ width: "100%", marginLeft: "1em" }}>
                                            <th style={{ width: "12%" }}>Tag #</th>
                                            <th style={{ width: "13%" }}>Load Start</th>
                                            <th style={{ width: "13%" }}>Load End</th>
                                            <th style={{ width: "13%" }}>Dump Start</th>
                                            <th style={{ width: "13%"}}>Dump End</th>
                                            <th style={{ width: "12%"}}>Weight</th>
                                            <th style={{ width: "12%" }}>Upload Tag</th>
                                            <th style={{ width: "12%" }}>Tag Picture</th>
                                        </tr>
                                    </thead>
                                
                                    <tbody>  
                               
                                   
                                        {inputValues.Weights.map((item, index) => (
                                            <LoadList
                                                key={index}
                                                load={item}
                                                weightIndex={index}
                                                FreightBill={inputValues}
                                                setFreightWeights={setFreightWeights}
                                                setQtyandCalc={setQtyandCalc}
                                                calcStandBy={calcStandBy}
                                                getDifferenceInMinutes={getDifferenceInMinutes}
                                                calcRunningTime={calcRunningTime}
                                                changeFreightTime={changeFreightTime}
                                            />
                                        ))}                                
                                      
                                    </tbody>
                                </table>
                            </div>
                            <div className="mbsc-row" style={{ height: "100%", width: "100%" }}>
                                
                            <div className=" mbsc-col-3 mbsc-offset-9 p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Total Weight</span> 
                                    <AutoSelectInputNumber   value={inputValues.tWeight}   onChange={(e) => handleFieldChange('tWeight', e.value, true)} />
                                </div>
                                </div>
                    </Panel>)}
                    {displayTab==='Expenses' && (<Panel header="Expenses">
                        <button style={{ margin: '0', padding: '.5em', width:"10%" }}  onClick={(e) =>handleAddExpense(e)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     > Add Expense </button>
                        <div className="mbsc-row" style={{ height: "100%", width: "100%" }}>
                           <table style={{ marginBottom: "5px", width: "100%" }}>
                               <thead>
                                   <tr className="mbsc-row" style={{ width: "100%", marginLeft: "1em" }}>
                                       <th style={{ width: "5%" }}>Delete</th>
                                       <th style={{ width: "5%" }}>On Hold</th>
                                       <th style={{ width: "13%" }}>Description</th>
                                       <th style={{ width: "8%" }}>QTY</th>
                                       <th style={{ width: "8%" }}>Rate</th>
                          
                                       <th style={{ width: "5%"}}>Bill</th>
                                       <th style={{ width: "13%" }}>Bill To</th>
                                       <th style={{ width: "8%" }}>Invoice</th>
                                       <th style={{ width: "5%" }}>Pay </th>
                                       <th style={{ width: "13%" }}>Pay To</th>
                                       <th style={{ width: "8%" }}>Pay Statement</th>
                                       <th style={{ width: "8%" }}>Amount</th>
                                   </tr>
                               </thead>
                               <tbody>  
                              
                               {expenses.map((item,index) => (
                                    <ExpenseList key={index} expense={item} showAddToFreights={false}  driver={expenseDriver} customerID={freightBill.Account.ID}  />
                                ))}
                                 
                               </tbody>
                           </table>
                       </div>
               </Panel>)}
                 {(displayTab==='FreightBill' || displayTab==='Loads') && inputValues.UseStandBy && (
                    <Panel header="Stand By">
                        <div  className="mbsc-row" style={{margin:"0"}}> 
                            <div className="mbsc-col-4" style={{padding:"0", paddingRight:"1em"}}> 
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon "  >Load Allowed</span> 
                                    <AutoSelectInputNumber   value={inputValues.standLA}   onChange={(e) =>changeStandByField('standLA', e.value, true)} />
                                </div>
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon "  >Dump Allowed</span> 
                                    <AutoSelectInputNumber   value={inputValues.standDA}   onChange={(e) => changeStandByField('standDA', e.value, true)} />
                                </div>
                            </div>
                        
                            <div className="mbsc-col-4" style={{padding:"0", paddingRight:"1em"}}> 
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon "  >Excess Load Stand By</span> 
                                    <AutoSelectInputNumber   value={inputValues.totalExcessLoad}   onChange={(e) => changeStandByField('totalExcessLoad', e.value, false)} />
                                </div>
                                
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon "  >Excess Dump Stand By</span> 
                                    <AutoSelectInputNumber   value={inputValues.totalExcessDump}   onChange={(e) => changeStandByField('totalExcessDump', e.value, false)} />
                                </div>
                            </div>
                            <div className="mbsc-col-4" style={{padding:"0"}}> 
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon "  >Bill Excess Stand By</span> 
                                    <AutoSelectInputNumber   value={inputValues.standExMin}   onChange={(e) => changeStandByField('standExMin', e.value, false)} />
                                </div>
                                
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon "  >Pay Excess Stand By</span> 
                                    <AutoSelectInputNumber   value={inputValues.paidStandExMin}   onChange={(e) => changeStandByField('paidStandExMin', e.value, false)} />
                                </div>
                            </div>
                        </div>
                    </Panel>
                )}
                
                <input type='file' id={'freightUpload'}    onChange={(event,inst) => startUpload(event)} style={{display:'none'}} base-sixty-four-input="true"/>
                <div  className="mbsc-row" style={{margin:"0"}}> 
                    <Panel header="Billing Totals" className="mbsc-col-6">
                        <div  className="mbsc-row" style={{margin:"0"}}> 
                            <div className="mbsc-col-6" style={{paddingLeft:"0"}}>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Qty </span> 
                                    <AutoSelectInputNumber   value={inputValues.billedQty}   onChange={(e) => handleFieldChange('billedQty', e.value, true)} />
                                </div>
                                <div className="p-inputgroup ">
                                    <span className="p-inputgroup-addon dispatch-inputgroup">Rate Type</span>
                                    <Dropdown value={inputValues.BillType}  onChange={(e) => handleFieldChange('BillType', e.value, true)} options={billTypes} optionLabel="text"
                                        placeholder="Pay Type" className="w-full md:w-14rem" />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Rate </span> 
                                    <AutoSelectInputNumber   value={inputValues.BillRate}   onChange={(e) => handleFieldChange('BillRate', e.value, true)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Stand by Rate </span> 
                                    <AutoSelectInputNumber   value={inputValues.standBR}  isCurrency={true} onChange={(e) => handleFieldChange('standBR', e.value, true)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Fuel Surcharge %</span> 
                                    <AutoSelectInputNumber   value={inputValues.FuelCharge}   onChange={(e) => handleFieldChange('FuelCharge', e.value, true)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Broker Fee % </span> 
                                    <AutoSelectInputNumber   value={inputValues.billedBrokerPercent}   onChange={(e) => handleFieldChange('billedBrokerPercent', e.value, true)} />
                                </div>
                            </div>
                            <div className="mbsc-col-6" style={{paddingLeft:"0"}}>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Trucking </span> 
                                    <AutoSelectInputNumber disabled={!inputValues.billingOverride}  value={inputValues.tBilled}   onChange={(e) => handleFieldChange('tBilled', e.value)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Expenses</span> 
                                    <AutoSelectInputNumber  disabled={!inputValues.billingOverride} isCurrency={true} value={inputValues.billedExpenses}   onChange={(e) => handleFieldChange('billedExpenses', e.value)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Stand by  </span> 
                                    <AutoSelectInputNumber disabled={!inputValues.billingOverride}  isCurrency={true} value={inputValues.standBilled}   onChange={(e) => handleFieldChange('standBilled', e.value)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Fuel </span> 
                                    <AutoSelectInputNumber disabled={!inputValues.billingOverride} isCurrency={true}  value={inputValues.fuelBilled}   onChange={(e) => handleFieldChange('fuelBilled', e.value)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Broker</span> 
                                    <AutoSelectInputNumber disabled={!inputValues.billingOverride} isCurrency={true} value={inputValues.bFee}   onChange={(e) => handleFieldChange('bFee', e.value)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Total</span> 
                                    <AutoSelectInputNumber  disabled={!inputValues.billingOverride} isCurrency={true} value={inputValues.bTotal}   onChange={(e) => handleFieldChange('bTotal', e.value)} />
                                </div>
                            </div>
                        </div>
                    </Panel>
                    <Panel header="Pay Totals" className="mbsc-col-6">
                        <div  className="mbsc-row" style={{margin:"0"}}> 
                            <div className="mbsc-col-6" style={{paddingLeft:"0"}}>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Qty </span> 
                                    <AutoSelectInputNumber   value={inputValues.paidQty}   onChange={(e) => handleFieldChange('paidQty', e.value, true)} />
                                </div>
                                   
                                <div className="p-inputgroup ">
                                    <span className="p-inputgroup-addon dispatch-inputgroup">Rate Type</span>
                                    <Dropdown value={inputValues.PayType}  onChange={(e) => handleFieldChange('PayType', e.value, true)} options={payTypes} optionLabel="text"
                                        placeholder="Pay Type" className="w-full md:w-14rem" />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Rate </span> 
                                    <AutoSelectInputNumber   value={inputValues.PayRate}   onChange={(e) => handleFieldChange('PayRate', e.value, true)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Stand by Rate </span> 
                                    <AutoSelectInputNumber   value={inputValues.standPR} isCurrency={true}   onChange={(e) => handleFieldChange('standPR', e.value, true)} />
                                </div>
                               {!freightBill.Subhauler && !freightBill.PayType.includes('Percent') && (<div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Travel Rate</span> 
                                    <AutoSelectInputNumber   value={inputValues.travelRate}   onChange={(e) => handleFieldChange('travelRate', e.value, true)} />
                                </div>)} 
                              {freightBill.PayType.includes('Percent') && (<div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Percent</span> 
                                    <AutoSelectInputNumber   value={inputValues.driverPercent}   onChange={(e) => handleFieldChange('driverPercent', e.value, true)} />
                                </div>)}
                            </div>
                            <div className="mbsc-col-6" style={{paddingLeft:"0"}}>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Trucking </span> 
                                    <AutoSelectInputNumber disabled={!inputValues.billingOverride}  value={inputValues.totalDriverPay}  isCurrency={true}  onChange={(e) => handleFieldChange('totalDriverPay', e.value)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Expenses</span> 
                                    <AutoSelectInputNumber  disabled={!inputValues.billingOverride} value={inputValues.paidExpenses} isCurrency={true}  onChange={(e) => handleFieldChange('paidExpenses', e.value)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Stand by  </span> 
                                    <AutoSelectInputNumber  disabled={!inputValues.billingOverride} value={inputValues.standPaid} isCurrency={true}  onChange={(e) => handleFieldChange('standPaid', e.value)} />
                                </div>
                                {!freightBill.Subhauler && !freightBill.PayType.includes('Percent') && (<div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Travel  </span> 
                                    <AutoSelectInputNumber  disabled={!inputValues.billingOverride} value={inputValues.paidTravelTime} isCurrency={true}  onChange={(e) => handleFieldChange('paidTravelTime', e.value)} />
                                </div>)}
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Total</span> 
                                    <AutoSelectInputNumber  disabled={!inputValues.billingOverride} isCurrency={true} value={inputValues.tPaid}   onChange={(e) => handleFieldChange('tPaid', e.value)} />
                                </div>
                                <div className="p-inputgroup" >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Net Profit</span> 
                                    <AutoSelectInputNumber disabled={!inputValues.billingOverride} isCurrency={true}  value={inputValues.profit}   onChange={(e) => handleFieldChange('profit', e.value)} />
                                </div>
                            </div>
                        </div>
                    </Panel>
                </div>
            </div>)}
        </div>
    )
}


export default FreightBillEdit