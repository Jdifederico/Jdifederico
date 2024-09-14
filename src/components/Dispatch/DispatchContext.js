import React,{useState,useContext,createContext, useRef,  useCallback} from 'react'

import { db } from '../../firebase';
import { doc,  writeBatch,  query,  updateDoc, collection, addDoc, setDoc, onSnapshot, where } from 'firebase/firestore';
import { UserAuth } from '../../context/AuthContext';
import { isEqual } from 'lodash'; 

const DispatchContext = createContext();

export const DispatchContextProvider = ({ children }) => {

    const { gearedUser } = UserAuth();
    const [homeDate, setHomeDate]= useState(formatDate(new Date(), '/', 'YYYY/MM/DD')); 
    const [homeDispatches, setHomeDispatches] = useState([]);
    const [homeFreightBills, setHomeFreightBills] = useState([]);
    const [dispatch, setDispatch] = useState(null);
    const unsubscribeFreightBillsRef = useRef(null); // Store the unsubscribe function
    const unsubscribeDispatchesRef = useRef(null); // Store the unsubscribe function
    const firstCallRef = useRef(true);
    const [dispatchState, setDispatchState] = useState(null);
    const [assigning, setAssigning]=useState(false);
    console.log('does disptach context provider run over and ove?' , dispatch)
    

    const fetchDispatch = async (id) => {
        return new Promise((resolve, reject) => {
          if(dispatch){
           if (id === dispatch.ID) {
                console.log('THIS SHOULD NOT FIRE!!!');
                return resolve(dispatch);
            }
          }
            const docRef = doc(db, `Organizations/${gearedUser.selectedOrgName}/Dispatches`, id);
            onSnapshot(docRef, async (docSnap) => {
         
                const source = docSnap.metadata.hasPendingWrites ? "Local" : "Server";
                console.log('source =' +source)
                if (docSnap.exists() && source === "Server") {
             
                    let tempDispatch = docSnap.data();
                    tempDispatch.ID=docSnap.id;
                    setDispatch({ ...tempDispatch });
                    console.log('firstCall = ' + firstCallRef.current);
                    console.log("set dispy: ",{ ...tempDispatch });
                    if (firstCallRef.current) {
                      firstCallRef.current = false;
                      setHomeDate(tempDispatch.QueryDate);
                      queryFreightBills(tempDispatch.QueryDate,tempDispatch.QueryDate)
                    }
                    return resolve(tempDispatch);
                }
            });
        });
    };

    const queryFreightBills = useCallback((startDate, endDate) => {
        const freightBills = [];
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
                    console.log('we are getting a new freightbill like dis = ', tempFB)
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
            setHomeFreightBills( tempFreightBills);
        });
    }, [gearedUser]);
    const queryDispatches = useCallback((startDate, endDate) => {
      let dispatches = [];
      if (unsubscribeDispatchesRef.current) unsubscribeDispatchesRef.current();
      console.log('starting to run the query dispatches', startDate, endDate);
      console.log('gearedUser.selectedOrgName', gearedUser.selectedOrgName);
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
    }, [gearedUser]);
  


    const updateFreightBill = (index, updatedFreightBill) => {
      console.log('we are UPDATING the frieghtbill for ' + updatedFreightBill.driverName +' and the new load order = '+ updatedFreightBill.loadOrder)
      setHomeFreightBills(prevHomeFreightBills => {
          const newHomeFreightBills = [...prevHomeFreightBills];
          newHomeFreightBills[index] = { ...newHomeFreightBills[index], ...updatedFreightBill };
          return newHomeFreightBills;
      });
   };
   const handleUpdateFreightBills = async (Dispatch, updatedFreightBills) => {
      try {
        const batch = writeBatch(db);
        console.log('Disaptch -= ', Dispatch)
   
        let newDispatch = { ...Dispatch };
        let newFreightBills = [...updatedFreightBills];
        let loadOrder = 1;
        let realLoadOrder = 0;
        let count = 0;
 
          newDispatch.LoadOrders=[];
          if(!newDispatch.SimLoad )newDispatch.SimLoad=1;
          if(!newDispatch.MinBetLoad) newDispatch.MinBetLoad =''; 
          console.log('newFreightBills = ',newFreightBills);
          for (var i = 0; i < updatedFreightBills.length; i++) {
            let minDifference = realLoadOrder * Number(newDispatch.MinBetLoad);
            var oldDispatchTime= updatedFreightBills[i].dispatchTime;
            if(!updatedFreightBills[i].SetManual)updatedFreightBills[i].dispatchTime = formatDriverDispatchTime(minDifference, updatedFreightBills[i].dispatchTime, newDispatch);
     
            if(oldDispatchTime!==updatedFreightBills[i].dispatchTime || updatedFreightBills[i].loadOrder !== loadOrder){
                updatedFreightBills[i].loadOrder = loadOrder;
                const homeIndex =  newFreightBills.findIndex(f => f.ID == updatedFreightBills[i].ID);
                if(homeIndex!==-1){
                  newFreightBills[homeIndex].loadOrder=loadOrder;
                  newFreightBills[homeIndex].dispatchTime=updatedFreightBills[i].dispatchTime;
                  let freightRef = doc(db, 'Organizations/'+ gearedUser.selectedOrgName +'/FreightBills',   updatedFreightBills[i].ID);
                  let driverFreightRef = doc(db, 'Organizations/'+ gearedUser.selectedOrgName +'/DriverFreightBills',   updatedFreightBills[i].ID);
        
                batch.update(freightRef, { "timestamp": Date.now(), loadOrder:  updatedFreightBills[i].loadOrder,  dispatchTime:  updatedFreightBills[i].dispatchTime  });
                batch.update(driverFreightRef, { "timestamp": Date.now(), loadOrder:  updatedFreightBills[i].loadOrder,  dispatchTime:  updatedFreightBills[i].dispatchTime  });
              }
            }
            if(!updatedFreightBills[i].SetManual)count++;
            var tempLoad = {
                loadOrder: updatedFreightBills[i].loadOrder,
                Truck: updatedFreightBills[i].Truck,
                dispatchTime: updatedFreightBills[i].dispatchTime,
                Name: updatedFreightBills[i].driverName
            } 
            newDispatch.LoadOrders.push(tempLoad);
            if (count === newDispatch.SimLoad) {
                count = 0;
                realLoadOrder++;
            }
            loadOrder++ 
          }
         // setHomeFreightBills(newFreightBills);
  
      
        await batch.commit();
      } catch (error) {
        console.error("Error updating freight bills: ", error);
      }
    };
    const changeLoadOrder =  (newFreight, Dispatch, freightBills) => {
      console.log('RUNNING CHANGE LOAD ORDERRRR!!', newFreight);
      let simLoad = 1;
      const updates = [];

      if (Dispatch.SimLoad) simLoad = Dispatch.SimLoad;
      let count = 0;
      let realLoadOrder = 1;
  
      for (let i = 0; i < freightBills.length; i++) {
     
          if (count === Dispatch.SimLoad) {
              count = 0;
              realLoadOrder++;
          } 
   
          if (freightBills[i].loadOrder >= newFreight.loadOrder) {
              freightBills[i].loadOrder++;
              const minDifference = Number((realLoadOrder) * Number(Dispatch.MinBetLoad));
              if (!freightBills[i].SetManual) {
                  freightBills[i].dispatchTime = formatDriverDispatchTime(minDifference, freightBills[i].dispatchTime, Dispatch);
              }
          
              
              updates.push({
                  index: homeFreightBills.findIndex(f => f.ID === freightBills[i].ID),
                  updatedFreightBill: { ...freightBills[i] }
              });
  
              const freightRef = doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/FreightBills', freightBills[i].ID);
              const driverFreightRef = doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/DriverFreightBills', freightBills[i].ID);
  
              updateDoc(freightRef, { "timestamp": Date.now(), loadOrder: freightBills[i].loadOrder, dispatchTime: freightBills[i].dispatchTime });
              updateDoc(driverFreightRef, { "timestamp": Date.now(), loadOrder: freightBills[i].loadOrder, dispatchTime: freightBills[i].dispatchTime });
          }
          if (!freightBills[i].SetManual)   count++;
      }
  


      // Batch update state
      setHomeFreightBills(prevHomeFreightBills => {
          const newHomeFreightBills = [...prevHomeFreightBills];
          updates.forEach(({ index, updatedFreightBill }) => {
              newHomeFreightBills[index] = updatedFreightBill;
          });
          return newHomeFreightBills;
      });
  
      setAssigning(false);
  };

    const formatDriverDispatchTime = (minuteDifference, oldStartTime,  Dispatch) => {
      let startHour;
      if (Dispatch.StartTime) {
          let startMinute = Number(Dispatch.StartTime.substr(3)) + minuteDifference;
          if (startMinute < 60) startHour = Number(Dispatch.StartTime.substr(0, 2));
          else {
              var hourDifference = Math.floor(startMinute / 60);
              startHour = Number(Dispatch.StartTime.substr(0, 2)) + hourDifference;
              startMinute = startMinute - (hourDifference * 60);
          }
          if (startMinute < 10) startMinute = '0' + startMinute;
          if (Number(startHour) > 23) {
            var hourDifference = Math.floor(startHour / 24);
              startHour = startHour - Number(hourDifference * 24);
          }
          if (Number(startHour) < 10) startHour = '0' + startHour;
          let driverStartTime = startHour + ':' + startMinute
          return driverStartTime;
      }else return oldStartTime;
    }

    const getDriverLoadOrder = function(Dispatch,FreightBill, freightBills) {
      if (Dispatch.SimLoad == '' || Dispatch.SimLoad < 1) Dispatch.SimLoad = 1;
      let driverLoadOrder = freightBills.length+1;

      console.log('getting top driver load order and maxloadorder= ' + driverLoadOrder);
      console.log('FreightBill.Priority= ' + FreightBill.Priority);
      for (var j = 0; j < freightBills.length; j++) {
          if(freightBills[j].loadOrder <driverLoadOrder){
            console.log('checking priority of freightBill = '+ freightBills[j].Priority + ' against the new FB prio = ' + FreightBill.Priority);
            if (freightBills[j].Subhauler || freightBills[j].Priority>FreightBill.Priority){
            
              driverLoadOrder = freightBills[j].loadOrder
              console.log('priority was greater than the new priority so now we setting driverLoadOrder = ' + driverLoadOrder)
            } 
          }
        }
      console.log('returning this as driver load order = '+driverLoadOrder);
      return driverLoadOrder;
    }

    const getDedicatedLoadOrder = function(Dispatch,FreightBill, freightBills) {
      if (Dispatch.SimLoad == '' || Dispatch.SimLoad < 1) Dispatch.SimLoad = 1;
  
      var newFreightLoadOrder = 1;
      console.log('reightBills.length = '+ freightBills.length)
      for (var j = 0; j < freightBills.length; j++) {
          if (freightBills[j].Subhauler){
            if(!freightBills[j].Dedicated){
              newFreightLoadOrder = freightBills[j].loadOrder;
              break;
          }else{
            if(Number(freightBills[j].Priority) >  Number(FreightBill.Priority)){
              newFreightLoadOrder = freightBills[j].loadOrder;
              break;
            }  else newFreightLoadOrder++;
        }
      } else newFreightLoadOrder++;
       
      }
      console.log('returning this as top driver load order = '+ newFreightLoadOrder);
      return newFreightLoadOrder;
    }

    const convertFreightBill = (freightBill) => {
      const {
        TruckName = '',
        TrailerName = '',
        TruckType: { TruckCode = '' } = {},
        TruckCode: fbTruckCode = '',  
        SetManual = false,
        LoadSite: { Name: LoadSiteName = '' } = {}, 
        DumpSite: { Name: DumpSiteName = '' } = {},  // Provide a default empty object and default name
        Material: { Name: MaterialName = '' } = {},  
        
        ID, loadOrder, FBNO, Driver, JobDate, Cancelled, 
        driverName, QueryDate, Released, Received, Subhauler, textSent,
        fbTurnIn, dispatchTime, dispatchID, ReceivedTime, timestamp, billed, paid,
        dSubmitted, PhoneNumber, displayPhone, phoneNumber,  companyID, Priority, driverNote
      } = freightBill;

      const truckCode = fbTruckCode || TruckCode;
      const tempFreight = {
        ID, loadOrder, FBNO, Driver, JobDate, loadSite:LoadSiteName, dumpSite:DumpSiteName, Cancelled, driverName,
        QueryDate, Released, Received, Subhauler, SetManual, textSent, fbTurnIn, dispatchTime,
        dispatchID, ReceivedTime, timestamp, billed, paid, dSubmitted, PhoneNumber, displayPhone,
        phoneNumber, MaterialName, companyID, Priority, driverNote, TruckName, TrailerName, TruckCode: truckCode
      };
      return tempFreight;
    };
 
  
    const addFreightBill =  (freightBill, Dispatch, freightBills) => {
      setAssigning(true);
  
      let simLoad = 1;
      let minDifference = 0;
  
      if (freightBill.Cancelled) {
          freightBill.Style = { 'background': 'rgb(234, 67, 53)' };
      } else {
          freightBill.Style = { 'background': '#fff' };
      }  
  
      Dispatch.TrucksAssigned = freightBills.length;
  
      if (!freightBill.Subhauler) freightBill.loadOrder = getDriverLoadOrder(Dispatch, freightBill, freightBills);
      else if (freightBill.Dedicated) freightBill.loadOrder = getDedicatedLoadOrder(Dispatch, freightBill, freightBills);
      else  freightBill.loadOrder = Dispatch.TrucksAssigned + 1;
      let unBilledCount =0;
      for(let q=0; q<freightBills.length; q++)if(!freightBills[q].billed)unBilledCount++;
      Dispatch.TrucksAssigned++;
      setDispatch((prev) => ({ ...prev, TrucksAssigned: Dispatch.TrucksAssigned, unBilledFreights:unBilledCount}));
      minDifference = Number((Math.floor(freightBill.loadOrder / simLoad) - 1)) * Number(Dispatch.MinBetLoad);
      freightBill.dispatchTime = formatDriverDispatchTime(minDifference, ' ', Dispatch);

      if (freightBill.loadOrder !== Dispatch.TrucksAssigned) changeLoadOrder(freightBill, Dispatch, freightBills); else  setAssigning(false);
      
  

        addDoc(collection(db, `Organizations/${gearedUser.selectedOrgName}/FreightBills`), freightBill).then(function (docRef) {
          console.log("Document written with ID: ", docRef.id);
          freightBill.ID = docRef.id;
          let driverFBRef = doc(db, `Organizations/${gearedUser.selectedOrgName}/DriverFreightBills`, docRef.id);
          setDoc(driverFBRef, freightBill);
      });
  
      // Update state with new freight bill
   //   setHomeFreightBills(prevHomeFreightBills => [...prevHomeFreightBills, freightBill]);
  };
    const addObjectIfNotExists = (array, object) => {
        const exists = array.some(item => isEqual(item, object));
        if (!exists) {
          array.push(object);
        }
        return array;
    };

    return (
      <DispatchContext.Provider value={{
          setDispatch, setHomeDate,handleUpdateFreightBills, addFreightBill, setHomeFreightBills,convertFreightBill, 
         dispatch, homeFreightBills, homeDate,  homeDispatches, dispatchState, setDispatchState,assigning, setAssigning,
          fetchDispatch, queryFreightBills, formatDate, setHomeDispatches, queryDispatches, addObjectIfNotExists
      }}>
          {children}
      </DispatchContext.Provider>
  );
};
  export const useDispatch= () => {
    return useContext(DispatchContext);
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