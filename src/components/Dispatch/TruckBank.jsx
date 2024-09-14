import React, {  useEffect, useState, useCallback} from 'react';
import { UserAuth } from '../../context/AuthContext'
import {useDispatch  } from './DispatchContext';
import { isEqual } from 'lodash'; 
import { TabView, TabPanel } from 'primereact/tabview';
import { Panel } from 'primereact/panel';
import TruckDriverLine from '../ListComponents/TruckDriverLine';
import DispatchDriverPopUp from './DispatchDriverPopUp';
import { Badge } from 'primereact/badge';

const TruckBank = (props) => {
   
    const { drivers, outsideTrucks, subhaulers, gearedUser, company} = UserAuth();
    const {homeFreightBills, formatDate, homeDate, addObjectIfNotExists,addFreightBill, dispatch, dispatchState, assigning, setAssigning} = useDispatch();
    const [activeIndex, setActiveIndex] = useState(0);
    const [truckBankDrivers, setTruckBankDrivers]=useState([]);
    const [truckBankSubhaulers, setTruckBankSubhaulers]=useState([]);
    const [truckBankDedicated, setTruckBankDedicated]=useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [driver, setDriver] = useState(null);
    const [visible, setVisible] = useState(false);
  
    const driversMap = new Map();
    const dedicatedMap = new Map();
    let truckBankTrucks =[];

    const sortByPriority = (a, b) => a.Priority - b.Priority;
    const sortByName = (a, b) => a.DriverName.localeCompare(b.DriverName);
    const handleSearchChange = (e) => {  setSearchQuery(e.target.value); };
    const doesItemMatchQuery = (item, query) => {
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(query.toLowerCase())
        );
    };
   
    const filterList = (list) => {
        return list.filter(item => doesItemMatchQuery(item, searchQuery));
    };

    const checkAbsence = (truckBankDriver)=>{

        truckBankDriver.Absent = false;
        truckBankDriver.Style = { color: 'black' };
    
        if(truckBankDriver.Notes){
            for(var q=0; q<truckBankDriver.Notes.length; q++){
                if(truckBankDriver.Notes[q].noteType==='Schedule'){
                   
                    var startDate =formatDate(truckBankDriver.Notes[q].StartDate,'/', 'YYYY/MM/DD');
                    var endDate =formatDate(truckBankDriver.Notes[q].EndDate,'/', 'YYYY/MM/DD');
                    if (startDate===homeDate || endDate===homeDate || (startDate<homeDate && endDate>homeDate)){     
                        truckBankDriver.Absent = true;
                        truckBankDriver.Note=truckBankDriver.Notes[q].Note;
                        if(truckBankDriver.Notes[q].Red) truckBankDriver.Style = { color: 'red' };
                        else if(truckBankDriver.Notes[q].Yellow) truckBankDriver.Style= { color: '#ef6c00' };
                        else truckBankDriver.Style = { color: 'red' };
                    
                    }
                }
            }
        }
                 
        return truckBankDriver;
    }

    const checkOutsideAbsence = (truckBankDedicated) =>{
        truckBankDedicated.Style = { color: 'black' };
        truckBankDedicated.Absent = false;
        truckBankDedicated.Notes=[];
     //   console.log('RUNNIG NCHECK OUTSIDE ABSENCES!!!')

        for(var q=0; q<subhaulers.length; q++){
            if(subhaulers[q].NoteList){
                for(var l=0;l<subhaulers[q].NoteList.length; l++){
                    if(subhaulers[q].NoteList[l].noteType==='Schedule'){
                        if(subhaulers[q].NoteList[l].Truck.ID===truckBankDedicated.ID){
                        
                            var startDate =formatDate(subhaulers[q].NoteList[l].StartDate,'/','YYYY/MM/DD');
                            var endDate =formatDate(subhaulers[q].NoteList[l].EndDate,'/','YYYY/MM/DD');
                            if( endDate>=homeDate)   truckBankDedicated.Notes.push(subhaulers[q].NoteList[l]);
                            if (startDate<=homeDate && endDate>=homeDate){ 
                   
                                if(subhaulers[q].NoteList[l].Yellow)truckBankDedicated.Style = { color: '#ef6c00' };  else  truckBankDedicated.Style = { color: 'red' };
                                truckBankDedicated.Note=subhaulers[q].NoteList[l].Note;
                                truckBankDedicated.Absent = true;
                            }
                        }
                    }
                }
            }
        }
        if(truckBankDedicated.Status==='On Leave'){
            truckBankDedicated.Note='On Leave';
            truckBankDedicated.Style = { color: 'red' };
        }
        return truckBankDedicated;
    }
    console.log('homeDate = ', homeDate)
 
    homeFreightBills.forEach(freight => {
        if(freight.QueryDate === homeDate){
            if (!freight.Cancelled) {
                if (freight.Driver) {
                 
                    if (!driversMap.has(freight.Driver)) driversMap.set(freight.Driver, []);
                    driversMap.get(freight.Driver).push(freight.dispatchID);
                }
         
                if (freight.subTruck && freight.subTruck.ID){
                    if (!dedicatedMap.has(freight.subTruck.ID))dedicatedMap.set(freight.subTruck.ID, []);
                    dedicatedMap.get(freight.subTruck.ID).push(freight.dispatchID);
                } 
                if (freight.subTruck && !freight.Dedicated) {
                    addObjectIfNotExists(truckBankTrucks, freight.subTruck);
                }
            }
        }
    });

    // Update tempDrivers using the driversMap
    truckBankDrivers.forEach(driver => {
        driver = checkAbsence(driver);
    
        if (driversMap.has(driver.ID)) {
        
            let dispatchIDs = driversMap.get(driver.ID);
         
            driver.DispatchNum = dispatchIDs.length;
       
            // Check if the dispatchIDs array contains the specific DispatchID
            if (dispatchIDs.includes(dispatch?.ID)) {

                driver.OnDispatch = true; // or any other action you want to perform
            } else {
                driver.OnDispatch = false;
            }
        } else {
            driver.DispatchNum = 0;
            driver.OnDispatch= false;
        }
    });

    // Update tempDedicated using the dedicatedMap
    truckBankDedicated.forEach(dedicated => {
        dedicated= checkOutsideAbsence(dedicated);
        if (dedicatedMap.has(dedicated.ID)) {
            let dispatchIDs = dedicatedMap.get(dedicated.ID);
            dedicated.DispatchNum = dispatchIDs.length;
            if (dispatchIDs.includes(dispatch?.ID))   dedicated.OnDispatch = true; // or any other action you want to perform
            else dedicated.OnDispatch = false;
        } else {
            dedicated.DispatchNum = 0;
            dedicated.OnDispatch= false;
        }
          
    });

    const createFilteredAssignedTrucks = useCallback(() => {
        const result = [];
 
        truckBankTrucks.forEach(truck => {
            const subhauler = truckBankSubhaulers.find(sub => sub.Driver.ID === truck.DriverID);
            if(subhauler) {
                const existingEntry = result.find(entry => entry.SubandCapabilities === truck.SubandCapabilities);
                if(existingEntry)  existingEntry.Trucks.push(truck);
                else {
                    const newEntry = {
                        ...subhauler, 
                        displayCapabilities: truck.displayCapabilities, 
                        SubandCapabilities: truck.SubandCapabilities, 
                        Trucks: [truck] 
                    };
                    result.push(newEntry);
                }
            }
        });
    
        return result;
    }, [truckBankTrucks, truckBankSubhaulers]);

    let  assignedTrucks = createFilteredAssignedTrucks();
    const unassignedDrivers =  truckBankDrivers.filter(driver => driver.DispatchNum === 0 && driver.Status==='Active').sort(sortByPriority)
    const assignedDrivers =  truckBankDrivers.filter(driver => driver.DispatchNum > 0 && driver.Status==='Active').sort(sortByPriority);
    const unassignedDedicated = truckBankDedicated.filter(dedicated => dedicated.DispatchNum === 0 && dedicated.Status==='Active').sort(sortByPriority);
    const assignedDedicated = truckBankDedicated.filter(dedicated => dedicated.DispatchNum > 0 && dedicated.Status==='Active').sort(sortByPriority);

    const filteredUnassignedDrivers = filterList(unassignedDrivers);
    const filteredAssignedDrivers = filterList(assignedDrivers);
    const filteredUnassignedDedicated = filterList(unassignedDedicated);
    const filteredAssignedDedicated = filterList(assignedDedicated);
    const filteredAssignedTrucks = filterList(assignedTrucks);
    const filteredTruckBankSubhaulers = filterList(truckBankSubhaulers);
    const backgroundColor = assigning ? 'lightGrey' : 'white';
    const cursorType = assigning ? 'wait' : 'pointer';

console.log('filteredUnassignedDrivers  = ', filteredUnassignedDrivers )

    const convertOutsideTrucks = async() =>{
        return new Promise(function(resolve,reject){
            if (outsideTrucks.length) {
         
                for (var j = 0; j < drivers.length; j++) {
                    if(drivers[j].Name!=='' ){
                        const newOutsideTrucks = outsideTrucks.map(outsideTruck=> convertOutsideTruck(outsideTruck));
                        if (!isEqual(newOutsideTrucks, truckBankDedicated)) {
                            return setTruckBankDedicated(newOutsideTrucks);
                        }
                    }
                }
            } 
        })
    }
    const convertOutsideTruck =(OutsideTruck) =>{
        OutsideTruck.OnDispatch = false;
        OutsideTruck.TotalAssigned = 0;
        OutsideTruck.DispatchNum = 0; 
        OutsideTruck.Assigned = false;
        OutsideTruck.Style = { color: 'black' };
        OutsideTruck.Absent = false;
     
        OutsideTruck.fullID= OutsideTruck.ID.toString()+OutsideTruck.AccountID;
        //console.log('running add truck bank dedicated with ', OutsideTruck);
        OutsideTruck.Type='Dedicated';
        OutsideTruck.displayCapabilities = [];
        if(!OutsideTruck.TruckTypes)OutsideTruck.TruckTypes=[]; 
        OutsideTruck.TruckTypeSelect=[];
        for(var l=0; l<OutsideTruck.TruckTypes.length; l++){
            OutsideTruck.TruckTypeSelect.push(OutsideTruck.TruckTypes[l].Name)
            OutsideTruck.displayCapabilities.push(OutsideTruck.TruckTypes[l].TruckCode)
       
        }

        if(OutsideTruck.Capabilities){
            for(var k=0; k<OutsideTruck.Capabilities.length; k++)OutsideTruck.displayCapabilities.push(OutsideTruck.Capabilities[k])
        } 

       return checkOutsideAbsence(OutsideTruck); 
    }
    const convertDrivers = ()=> {
        console.log('running CONVERT DRIVERS!!!!!!', drivers);
        return new Promise(function(resolve,reject){
            if (drivers.length) {
                for (var j = 0; j < drivers.length; j++) {
                    if(drivers[j].Name!=='' ){
                        const newDrivers = drivers.map(driver=> convertDriver(driver));
                        if (!isEqual(newDrivers, truckBankDrivers)) {
                            return setTruckBankDrivers(newDrivers);
                        }
                    }
                }
            }
        })
    }
    const convertDriver = (Driver) =>{
       
        Driver.added = false;
        Driver.DispatchNum = 0;
        Driver.OnDispatch = false;
        let mobiscrollDriver = {
            ID: Driver.ID,
            FirstName:Driver.FirstName,
            LastName:Driver.LastName,
            Name: Driver.Name,
            Truck: Driver.Truck,
            TruckName:Driver.Truck.Name,
            TrailerName:Driver.Trailer.Name,
            DispatchNum: Driver.DispatchNum,
            PayType: Driver.PayType,
            PayRate: Driver.PayRate,
            Compliances: [],
            PhoneObject:Driver.PhoneObject,
            oldPhoneObject:Driver.PhoneObject,
            MobilePhone: Driver.MobilePhone,
            displayPhone: Driver.displayPhone,
            Phone: Driver.Phone,
            oldPhone:Driver.Phone,
            Absent:false,
            editPhone:false,
            OnDispatch: Driver.OnDispatch,
            Status:Driver.Status,
            Type:'Driver'
        };
    
        if(Driver.TruckTypes)mobiscrollDriver.TruckTypes=Driver.TruckTypes;else mobiscrollDriver.TruckTypes=[];
    
        mobiscrollDriver.displayCapabilities = [];
        mobiscrollDriver.TruckTypeSelect=[];

        for(var j=0; j<mobiscrollDriver.TruckTypes.length; j++){
            mobiscrollDriver.TruckTypeSelect.push(mobiscrollDriver.TruckTypes[j].Name)
            mobiscrollDriver.displayCapabilities.push(mobiscrollDriver.TruckTypes[j].TruckCode)
        }
        if(Driver.Capabilities){
            mobiscrollDriver.Capabilities = Driver.Capabilities;
            for(var j=0; j<Driver.Capabilities.length; j++)mobiscrollDriver.displayCapabilities.push(Driver.Capabilities[j])
        } else    mobiscrollDriver.Capabilities = [];
    
    
        if(!Driver.TruckTypes)mobiscrollDriver.TruckTypes=[]; else mobiscrollDriver.TruckTypes = Driver.TruckTypes;
        if(!Driver.Priority)mobiscrollDriver.Priority= 9999; else mobiscrollDriver.Priority=Driver.Priority;
        if(!Driver.Trailer)mobiscrollDriver.Trailer = ''; else mobiscrollDriver.Trailer =Driver.Trailer;
        if(!Driver.deviceID) mobiscrollDriver.deviceID = '';  else  mobiscrollDriver.deviceID = Driver.deviceID;

        if(!Driver.Initials) mobiscrollDriver.Initials= 'N/A';else mobiscrollDriver.Initials= Driver.Initials;
        if(!Driver.uid) mobiscrollDriver.uid = '';else mobiscrollDriver.uid = Driver.uid;
        if(!Driver.Phone) mobiscrollDriver.Phone = '';else mobiscrollDriver.Phone = Driver.Phone;
        if(!Driver.Email) mobiscrollDriver.Email = '';else mobiscrollDriver.Email = Driver.Email;
        if(!Driver.TravelRate) mobiscrollDriver.TravelRate = '';else mobiscrollDriver.TravelRate = Driver.TravelRate;

        if (Driver.driverImageURL) mobiscrollDriver.driverImage = Driver.driverImageURL;else mobiscrollDriver.driverImage = '';
        if (Driver.driverImageRef) mobiscrollDriver.driverRef = Driver.driverImageRef;else mobiscrollDriver.driverRef = '';
        if (Driver.uid) mobiscrollDriver.uid = Driver.uid;else mobiscrollDriver.uid = '';

        for (var q = 0; q < Driver.Compliances.length; q++) mobiscrollDriver.Compliances.push({ Description: Driver.Compliances[q] });
        //console.log('running convert driver and now diver look like this =' , mobiscrollDriver);
        if(!homeDate)var tempDate = formatDate(new Date(),'/', 'YYYY/MM/DD'); else var tempDate =homeDate;

        mobiscrollDriver.Absent=false
        mobiscrollDriver.Note=''
        if(!Driver.Notes)Driver.Notes=[];
        if(Driver.Status==='On Leave'){
            mobiscrollDriver.Style = { color: 'red' };
            mobiscrollDriver.Note='On Leave';
        } else  mobiscrollDriver.Style = { color: 'black' };

        mobiscrollDriver.Notes=Driver.Notes;
    
        return checkAbsence(mobiscrollDriver);
    }

    const convertSubhaulers = function(){
    
        return new Promise(function(resolve,reject){
            if (subhaulers.length) {
                console.log('RUNNING CONVERT SUBHAULERS!!', subhaulers)
                for (var j = 0; j < subhaulers.length; j++) {
                      const updatedSubhaulers = subhaulers.filter(subhauler => subhauler.Name !== '').map(subhauler => convertSubhauler(subhauler)).filter(subhauler => subhauler.Status === 'Active').sort(sortByName);
                      if (!isEqual(updatedSubhaulers, truckBankSubhaulers)) {
                        setTruckBankSubhaulers(updatedSubhaulers);
                        return updatedSubhaulers;
                      }
                    
                  }
            }
        })
       
       
        
                 
              
    }
    const convertSubhauler = (Subhauler)=>{
        //  console.log('CONVERTING SUBHAULER  = ' ,Subhauler );
          if(!Subhauler.TruckType)Subhauler.TruckType={Name:'No Truck Type', ID:'', TruckCode:''};
          if(!Subhauler.Capabilities)Subhauler.Capabilities=[];
          if(!Subhauler.PaidFuelCharge)Subhauler.PaidFuelCharge='';
         // Subhauler.Capabilities.push(Subhauler.TruckType.TruckCode);
           var mobiscrollSubhauler = {                                            
               ID: Subhauler.ID,
               Name:Subhauler.Name,
               DriverName:Subhauler.DriverName,
               Driver: {
                   ID: Subhauler.Driver.ID,
                   Name: Subhauler.Driver.Name,
                   Truck: Subhauler.Driver.Truck,
                   Trailer: Subhauler.Driver.Trailer
               },
               Assign: 0,
               Remove: 0, 
               DedicatedSubhauler:Subhauler.DedicatedSubhauler,
               Assigned: true,
               TotalAssigned: 0,
               Phone: Subhauler.Phone,
               PhoneObject: Subhauler.PhoneObject,
               Puller:Subhauler.Puller,
           

               Priority: Subhauler.Priority,
               FullyAssigned: true,
               PaidBrokerFee:Subhauler.PaidBrokerFee,
               PaidFuelCharge:Subhauler.PaidFuelCharge,
               DispatchAssigned: 0,
               Unassigned: 0,
               BusyTrucks: 0,
               TotalTrucks:0,
               OrgName:Subhauler.OrgName,
               TruckType:Subhauler.TruckType,
               Capabilities:Subhauler.Capabilities,
               Compliances: [],
               Trucks: [],
               dailyCapabilities:[],
               OnDispatch: false,
               Style: { color: 'black' },
               Status:Subhauler.Status,
               
               Type:'Subhauler'
           };
           if(Subhauler.Compliances)for(var q=0; q<Subhauler.Compliances.length; q++)mobiscrollSubhauler.Compliances.push({Description:Subhauler.Compliances[q].Description});
  
           mobiscrollSubhauler.displayCapabilities = [];
           if(!Subhauler.TruckTypes)mobiscrollSubhauler.TruckTypes=[]; else mobiscrollSubhauler.TruckTypes = Subhauler.TruckTypes;
           mobiscrollSubhauler.TruckTypeSelect=[];
           for(let j=0; j<mobiscrollSubhauler.TruckTypes.length; j++){
              mobiscrollSubhauler.TruckTypeSelect.push(mobiscrollSubhauler.TruckTypes[j].Name)
              mobiscrollSubhauler.displayCapabilities.push(mobiscrollSubhauler.TruckTypes[j].TruckCode)
  
           }
           if(Subhauler.Capabilities){
              for(let j=0; j<Subhauler.Capabilities.length; j++)mobiscrollSubhauler.displayCapabilities.push(Subhauler.Capabilities[j])
           } 
           copyStringVariable(Subhauler.Driver.Name,mobiscrollSubhauler.Driver.Name);
           copyStringVariable(Subhauler.Driver.Email,mobiscrollSubhauler.Driver.Email);
           copyStringVariable(Subhauler.displayPhone, mobiscrollSubhauler.displayPhone);
           copyStringVariable(Subhauler.OrgName,mobiscrollSubhauler.OrgName);
           copyStringVariable(Subhauler.Driver.uid, mobiscrollSubhauler.Driver.uid);
           copyStringVariable(Subhauler.Driver.Phone,mobiscrollSubhauler.Driver.Phone);
           copyStringVariable(Subhauler.Driver.driverImageURL,mobiscrollSubhauler.Driver.driverImageURL);
           copyStringVariable(Subhauler.Driver.driverImageRef,mobiscrollSubhauler.Driver.driverImageRef);
     
       //    mobiscrollSubhauler.Trucks = $filter('filter')(truckBankDedicated , $scope.filterSubhaulerTrucks(mobiscrollSubhauler));
           return mobiscrollSubhauler;
  
    }
    const copyStringVariable =function(variableToCopy, variableCopiedTo){
        if(variableToCopy)variableCopiedTo = variableToCopy; else variableCopiedTo='';
    }

    const assignDriver = (driver, dispatch, freightBills, tempTruck)=>{

       
        let payType, driverPercent, payRate, FBNO, contEmail;
        let brokerFee =0;
        let hideMapTab = false;
        let calcByLoad = false;
        let paidFuelCharge = 0;
        if(driver.PaidFuelCharge)paidFuelCharge=driver.PaidFuelCharge;
        if(dispatch.Account){
            if(dispatch.Account.BillTonBy==='Scale Tag')calcByLoad=true;
            if(dispatch.Account.Broker && dispatch.BrokerFee) brokerFee = dispatch.BrokerFee;
        }

        if(dispatch.hideMapTab)hideMapTab = dispatch.hideMapTab;
        if(!driver.TravelRate)driver.TravelRate='';
        if(!driver.PayType)driver.PayType='';
        if(!driver.uid)driver.uid='';
        if(!driver.deviceID)driver.deviceID='';
        if(!driver.Initials)driver.Initials='';
        if(!driver.Truck)driver.Truck='';
        if(!driver.Trailer)driver.Trailer='';
        if(!driver.displayPhone) driver.displayPhone= driver.Phone;
        if(driver.Type==='Driver'){
            if (driver.PayType.includes("Percent")) {
                payType = dispatch.PayType + '/Percent';
                driverPercent = driver.PayRate;
                payRate = dispatch.PayRate;
            }else {
                payRate = driver.PayRate;
                payType = driver.PayType;
                driverPercent = 100;
            }
        }else{
            payRate =  dispatch.OutsidePayRate;
            payType =  dispatch.PayType;
            driverPercent = 100;
        } 

        if(company.UseAutoFBNum){
            company.CurrentFBNumber++;
            FBNO= company.CurrentFBNumber.toString();
            console.log('fb no = '+ FBNO)
        } else  FBNO='';

        let newFreight = {
            ID: '',
            Driver: driver.ID,
            FBNO: FBNO,
            Cancelled:false,
            fbTurnIn: '',
            runningTime:'',
            arriveRoundTrip: '',
            departRoundTrip: '',
            startTime: '',
            endTime: '',
            startTimePaid: '',
            endTimePaid: '',
            lunch: '',
            ParentFreight: '',
            lunchPaid: '',
            deviceID:driver.deviceID,
            loads: '',
            progressLoads:0,
            deliveredLoads:0,
            JobID:dispatch.JobID,
            Truck: driver.Truck,
            Trailer: driver.Trailer,
            TruckType: dispatch.TruckType,
            TrucksAssigned: 1,
            haulerName: gearedUser.selectedOrgName,
            driverName: driver.Name,
            odStart: '',
            odEnd: '',
            mainCompanyID:company.ID,
            companyID:dispatch.Company.ID,
            OrgName:gearedUser.selectedOrgName,
            BillType: dispatch.BillType,
            billedQty: '',
            paidQty: '',
            travelRate:driver.TravelRate,
            paidTravelTime:'',
            BillRate: dispatch.BillRate,
            driverPercent: driverPercent,
            PayType: payType,
            PayRate: payRate,
            HourMin: dispatch.HourMin,
            ShowUp: dispatch.ShowUp,
            calcByLoad:calcByLoad,
            hideMapTab:hideMapTab,
            tFee: '',
            tBilled: '',
            matTotal: '',
            billedFees: '',
            bTotal: '',
            totalDriverPay:'',
            totalTruckPay:'',
            profit: '',
            tHours: '',
            hoursWorked:0,
            grossHours:'',
            tHoursPaid: '',
            grossHoursPaid:'',
            tWeight: '',
            truckPaid: '',
            bFee: '',
            pFees: '',
            tPaid: '',
            FuelCharge: dispatch.FuelCharge,
            paidFuelPercent: paidFuelCharge,
            JobDate: dispatch.JobDate,
            QueryDate: formatDate(dispatch.JobDate,'/', 'YYYY/MM/DD'),
            JobNumber: dispatch.JobNumber,
            fuelBilled: '',
            fuelPaid: '',
            amountPaid:0,
            truckingAmountPaid:0,
            standByAmountPaid:0,
            expenseAmountPaid:0,
            Invoice: '',
            PayStatement: '',
            loadResults:dispatch.loadResults,
            dumpResults:dispatch.dumpResults,
            calcQtyDelivered:0,
            standLA: dispatch.StandBy.LoadAllowed,
            standDA:dispatch.StandBy.DumpAllowed,
            standBR: dispatch.StandBy.BillStandByRate,
            standPR:dispatch.StandBy.PaidStandByRate,
            standExMin: '',
            standBilled: '',
            standPaid: '',
            accName: dispatch.Account.Name,
            billBrokerFuel:true,
            emailCustomer:false,
            emailForeman:false,
            Status:'Loading',
            DirectionsOK:dispatch.DirectionsOK,
            Initials:driver.Initials,	
            Shipper:{
               Name:'No Shipper',
               ID:''
            },	
            Receiver:{
               Name:'No Receiver',
               ID:''
            },		
            LoadSite:{
                Name:dispatch.LoadSite.Name,
                fullAddress:dispatch.LoadSite.fullAddress,
                ID:dispatch.LoadSite.ID,
                Address:dispatch.LoadSite.Address,
                City:dispatch.LoadSite.City,
                ZipCode:dispatch.LoadSite.ZipCode
            },
            loadSite: dispatch.LoadSite.Name,
            loadAddress:dispatch.LoadSite.fullAddress,
            DumpSite:{
                Name:dispatch.DumpSite.Name,
                fullAddress:dispatch.DumpSite.fullAddress,
                ID:dispatch.DumpSite.ID,
                Address:dispatch.DumpSite.Address,
                City:dispatch.DumpSite.City,
                ZipCode:dispatch.DumpSite.ZipCode
            },
            Material:dispatch.Material,
            dumpSite: dispatch.DumpSite.Name,
            dumpAddress: dispatch.DumpSite.fullAddress,
            Received: false,
            onHold: false,
            missing: true,
            dSubmitted: false,
            approved:false,
            billed: false,
            paid: false,
            SellMaterial:false,
            MaterialTaxable:false,
            MaterialRate:'',
            MaterialQty:'',
            MaterialRateType:'Ton',
            materialBilled:false,
            standByIsPaid: false,
            hourMinIsPaid:false,
            standByIsBilled: false,
            hourMinIsBilled:false,
            truckingPaid:false,
            truckingBilled:false,
            Subhauler: false,
            Dedicated:false,
            Puller:false,
            textSent:false,
            driverNote: '',
            jobNO: dispatch.JobNumber,
            Contractor: '',
            StandBy: '',
            lastModified: '',
            signature: '',
            dispatchTime: '',
            UseStandBy: true,
            ReceivedTime: '',
            trailerPercent: '',
            uid: driver.uid,
            billedBrokerPercent: brokerFee,
            paidBrokerPercent: '',
            paidBrokerFee: '',
            prevLoadOrder: '',
            loadOrder: '',
            backLoadOrder: '',
            dispatchID: dispatch.ID,
            signatureName: '',
            displayPhone:driver.displayPhone,
            PhoneNumber:driver.Phone,
            phoneNumber:'+1' +driver.Phone,
            Priority:driver.Priority,
            billingOverride: '',
            Notes:dispatch.Notes,
            Comments:'', 
            Released:dispatch.Released,
            timestamp:Date.now(),
            dispatchNote: dispatch.InternalNotes,
            Weights: [],
            Expenses: []
          
        };
        
   
     
        if(driver.Type==='Dedicated'){
            newFreight.subTruck={ID:driver.ID, Dedicated:true, fullID: driver.ID+driver.AccountID};
            newFreight.Dedicated=true;
            newFreight.Subhauler=true;
        }else if(driver.Type==='Subhauler'){
            newFreight.subTruck=tempTruck;
            newFreight.Dedicated=false;
            newFreight.Subhauler=true;
            if(tempTruck.TruckType.ID)newFreight.TruckType = tempTruck.TruckType;
           
        }
        console.log('new freight = ', newFreight)
        if (dispatch.Contact) {
            if (dispatch.Contact.Email) contEmail = dispatch.Contact.Email;
            else if (dispatch.Account.DriverEmail) contEmail = dispatch.Account.DriverEmail; else contEmail = '';
        }else if (dispatch.Account.DriverEmail) contEmail = dispatch.Account.DriverEmail;  else contEmail = '';
        newFreight.Account = {
            ID:dispatch.Account.ID,
            Name:dispatch.Account.Name,
            Address: dispatch.Account.Address,
            City: dispatch.Account.City,
            State: dispatch.Account.State,
            Email: contEmail
        }

        newFreight.Company = {
            ID: dispatch.Company.ID,
            dispatch: gearedUser.selectedOrgName,
            CompanyName: dispatch.Company.CompanyName,
            Address: dispatch.Company.Address,
            address2: dispatch.Company.address2,
            CompanyPhone: dispatch.Company.CompanyPhone,
            Fax: dispatch.Company.Fax,
            changeFBLoc: dispatch.Company.changeFBLoc,
            CalcRunningTime: company.CalcRunningTime,
            realmID: dispatch.Company.realmID

        }

      addFreightBill(newFreight, dispatch, freightBills);
    }

    const handleDriverClick = (driver) => {
        console.log('driver = ', driver);
        if(!assigning){
            setDriver(driver);
         
       
            if(dispatchState==='DispatchEdit') {
                setAssigning(true);
                let tempFreightBills =  homeFreightBills.filter(freightBill => freightBill.dispatchID === dispatch.ID);
                let freightBills = tempFreightBills.sort((a, b) => a.loadOrder - b.loadOrder);
                assignDriver(driver,dispatch, freightBills,{});
            }else setVisible(true);
        }
    };
    const truckBankHeader = (options) => {
     
        const className = `${options.className} justify-content-space-between`;
       
        return (
            <div className={className} style={{ background:"white", padding:".5em"}}>
                <div className="mbsc-row" style={{width:"100%", margin:"0"}}>
                    <h6 className="m-0 font-weight-bold text-secondary mbsc-col-5" style={{ paddingLeft:".5em", fontSize:"1.5em",margin:"0"}}>Truck Bank</h6>
                    <input className="mbsc-col-7"  placeholder="Search"  style={{margin: "0px", fontSize: "1.5em", width: "100%", border: "2px solid grey"}}  id="searchTruckBankDrivers"  type="text" value={searchQuery}  onChange={handleSearchChange} />
                </div>
            </div>
        );
    };

    const driverHeader = (options,headerText,showTextButton) => {
        const className = `${options.className} justify-content-space-between`;

        return (
            <div className={className}style={{padding:".5em", paddingLeft:"1.5em"}} >
                <div className="mbsc-row" style={{width:"100%"}}>
                    <h6 className="m-0 font-weight-bold text-secondary mbsc-col-5" style={{ paddingLeft:".5em", fontSize:"1em",margin:"0", fontWeight:"700"}}>{headerText}</h6>
                    <div  className="mbsc-col-4"></div>
                    {showTextButton?(<button   className="md-btn  mbsc-col-2" id="TruckBankText" >Text Drivers</button>):(<div></div>) }  

                </div>
            </div>
        );
    };

    const createHeaderTemplate = (headerText,showTextButton) => (options) => driverHeader(options, headerText, showTextButton);
    const updateDriver = ( updatedDriver) => {
        // Copy the list to avoid direct mutation
        let newList;
        console.log('updatedDriver= ', updatedDriver);
   
        setDriver(updatedDriver);

        if(updatedDriver.Type==='Dedicated'){
            newList = [...truckBankDedicated];
            updatedDriver = checkOutsideAbsence(updatedDriver)
        } else if(updatedDriver.Type==='Driver'){
            newList = [...truckBankDrivers];
            updatedDriver = checkAbsence(updatedDriver)
        } else if(updatedDriver.Type==='Subhauler')newList = [...truckBankSubhaulers];
    
        // Check if the object at driverIndex has the same ID as updatedDriver
        for(var i=0; i<newList.length; i++){
            if (newList[i].ID === updatedDriver.ID) newList[i] = updatedDriver;
        }

        if(updatedDriver.Type==='Dedicated') setTruckBankDedicated(newList);
        else if(updatedDriver.Type==='Driver')setTruckBankDrivers(newList); 
        else if(updatedDriver.Type==='Subhauler') setTruckBankSubhaulers(newList);

      
    };

    const companyDriversTemplate = (options) =>{
        const countNotAbsent =filteredUnassignedDrivers.filter(obj => !obj.Absent).length;
        return tabHeaderTemplate('Company Drivers', countNotAbsent, options)
    }
    const dedicatedDriversTemplate = (options) =>{
        const countNotAbsent =filteredUnassignedDedicated.filter(obj => !obj.Absent).length;
        return tabHeaderTemplate('Dedicated', countNotAbsent, options)
    }
    const outsideTrucksTemplate = (options) =>{
        return tabHeaderTemplate('Outside Trucks', 0, options)
    }
    const tabHeaderTemplate = ( text, value, options) => {
        return (
            <div className="flex align-items-center gap-2 p-3" style={{ cursor: 'pointer' }} onClick={options.onClick} >
                 <a className="p-tabview-nav-link">{text}  {value>0 && ( <Badge style={{backgroundColor:"red"}} value={value} />)} </a>
            
            </div>
        );
    };
   
    useEffect(() => { convertDrivers(); }, [drivers]);
    useEffect(() => { convertOutsideTrucks();}, [outsideTrucks]);
    useEffect(() => { convertSubhaulers(); }, [subhaulers]);

  
    return (
        <React.Fragment>       
            <Panel headerTemplate={truckBankHeader} >
                <TabView  style={{margin:"0"}} activeIndex={activeIndex}  >
                    <TabPanel header="Company Drivers" style={{marginTop:"0"}}  headerTemplate={companyDriversTemplate}>   
                        <Panel headerTemplate={createHeaderTemplate("Unassigned Drivers", true)}>   
                        <ul id ="UnassignedTruckBankDriversList"   className="tableList" style={{backgroundColor:backgroundColor, cursor:cursorType}} > 
                                {filteredUnassignedDrivers.map((item,index) => (
                                    <TruckDriverLine key={item.ID}   driver={{item}}   index={{index}}  onClick={handleDriverClick}  >  </TruckDriverLine>
                                ))}   
                            </ul>
                        </Panel>
                        <Panel headerTemplate={createHeaderTemplate("Assigned Drivers",false)}>
                            <ul id ="AssignedTruckBankDriversList"   className="tableList" style={{backgroundColor:backgroundColor, cursor:cursorType}}> 
                                {filteredAssignedDrivers.map((item,index) => (
                                    <TruckDriverLine key={item.ID}   driver={{item}}   index={{index}} onClick={handleDriverClick}  >  </TruckDriverLine>
                                ))}   
                            </ul>
                        </Panel>
                    </TabPanel>
              
                    <TabPanel header="Dedicated" headerTemplate={dedicatedDriversTemplate} style={{marginTop:"0"}}>
                        <Panel headerTemplate={createHeaderTemplate("Unassigned Trucks", true)}>
                            <ul id ="UnassignedTruckBankOutsideTrucksList"   className="tableList" style={{backgroundColor:backgroundColor, cursor:cursorType}}>
                                {filteredUnassignedDedicated.map((item,index) => (
                                        <TruckDriverLine key={item.ID}   driver={{item}}   index={{index}}  onClick={handleDriverClick}>  </TruckDriverLine>
                                ))}  
                            </ul>   
                        </Panel>
                        <Panel headerTemplate={createHeaderTemplate("Assigned Trucks",false)}>
                            <ul id ="AssignedTruckBankOutsideTrucksList"   className="tableList" style={{backgroundColor:backgroundColor, cursor:cursorType}}>
                                {filteredAssignedDedicated.map((item,index) => (
                                        <TruckDriverLine key={item.ID}   driver={{item}}   index={{index}}  onClick={handleDriverClick}    >  </TruckDriverLine>
                                    ))}     
                            </ul>   
                        </Panel>
                    </TabPanel>
   
                    <TabPanel header="Outside Trucks" headerTemplate={outsideTrucksTemplate} style={{marginTop:"0"}}>
                        <Panel headerTemplate={createHeaderTemplate("Assigned Trucks", false)}>
                             <ul  className="tableList" > 
                                {filteredAssignedTrucks.map((item,index) => (
                                    <TruckDriverLine key={item.SubandCapabilities}   driver={{item}}   index={{index}}  onClick={handleDriverClick} >  </TruckDriverLine>
                                ))} 
                            </ul>
                        </Panel>
                        <Panel headerTemplate={createHeaderTemplate("Carriers",false)}>
                            <ul  className="tableList" > 
                                {filteredTruckBankSubhaulers.map((item,index) => (
                                    <TruckDriverLine key={item.ID}   driver={{item}}   index={{index}}  onClick={handleDriverClick} >  </TruckDriverLine>
                                ))} 
                            </ul>  
                        </Panel> 
                       
                    </TabPanel>
                </TabView>          
            </Panel>
            {driver && ( 
                <div>
                    <DispatchDriverPopUp driver={driver}  visible={visible}  setVisible={setVisible}   onAssignDriver={assignDriver}   assignedTrucks={assignedTrucks} homeDate={homeDate} onDriverUpdate={(updatedDriver) => updateDriver(updatedDriver)}/>
                </div>)}
        </React.Fragment>
    )
  }
  
  export default TruckBank