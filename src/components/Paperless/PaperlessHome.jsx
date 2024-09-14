import React from 'react'
import {useEffect,  useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext'


import { Eventcalendar, getJson } from '@mobiscroll/react';
import { db } from '../../firebase';
import { doc, query, setDoc, collection,  onSnapshot, where} from 'firebase/firestore'
import {usePaperless  } from './PaperlessContext';

 
export default function PaperlessHome() {


  const { setHomeDate, homeDate, setPaperlessState,setNavListItems,updateFreightBillField,setFreightBill } = usePaperless();
  const {updateGearedUser, gearedUser, logout, organizationNames} = UserAuth();
  const [events, setEvents] = useState([]);
  const [count, setCount] = useState(1);
  const [homeStartDate, setHomeStartDate] = useState('');
  const [homeEndDate, setHomeEndDate] = useState('');
  const [homeGearedUser, setHomeGearedUser] = useState(null);
  const [homeSubscribe, setHomeSubscribe] = useState(() => () => console.log("default ooops"));
  const navigate = useNavigate();
  var unsubscribe = null;
 console.log('wehn does this run?!!?!?!')
  const responsive = React.useMemo(() => {
        return {
          small: {
            view: {
                calendar: {
                    type: 'week',
                },
                agenda: {
                    type: 'day'
                }
            }
        }
    },
       {large: {
                view: {calendar: {type: 'week',  }, agenda: { type: 'day'  } }
            }
        };
  }, []);

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
  
  const  startQueryDriverFreightBills = async (event,inst)=> {

    var d = new Date(event.firstDay);
    const startDate =  formatDate(d.setDate(d.getDate()), '/', 'YYYY/MM/DD');
    const endDate = formatDate(d.setDate(d.getDate()+7), '/', 'YYYY/MM/DD')

    setHomeEndDate(endDate);
    setHomeStartDate(startDate)
    console.log('start date =', startDate)
    console.log('end date =', endDate)
    queryDriverFreightBills(startDate,endDate);
  }

 
  const  queryDriverFreightBills = async (startDate, endDate)=> {
     
     
      if(gearedUser){
        console.log('phone number = ' ,gearedUser.PhoneNumber)
        
        let phoneNumber = "+1"+gearedUser.PhoneNumber;
        console.log('phone number = ' , organizationNames.length)
        let dispatches = [];
        for(var i=0; i<organizationNames.length; i++){
        
          let queryName = "Organizations/"+ organizationNames[i] + "/DriverFreightBills";
         
          const q = query(collection(db, queryName),where("phoneNumber", "==", phoneNumber),where("QueryDate", ">=", startDate),where("QueryDate", "<=", endDate),where("Released", "==", true),where("billed", "==", false));

          let firstRun = true;
          let foundFreights=[];
      
          onSnapshot(q, (querySnapshot) => {
         
          if(firstRun){
            firstRun=false;
         
            querySnapshot.docChanges().forEach((change) => {
              const source = change.doc.metadata.hasPendingWrites ? "Local" : "Server";
            
                let tempFB = change.doc.data();
                console.log('we found tempFB= ', tempFB);
                if (change.type === "added") {
                  let tempDate = new Date( change.doc.data().JobDate);
                 
                  console.log('newest disp', tempFB );
                  let dispatchEventText=     '<div class="mbsc-grid" style="padding-left:2em;" >' +       
                  '<div class="mbsc-row">' + tempFB.Company.CompanyName + '</div>'+
                  '<div class="mbsc-row">' + tempFB.dispatchTime + '</div>'+
                  '<div class="mbsc-row">' + tempFB.LoadSite.Name + '</div>'+
                  '<div class="mbsc-row">' + tempFB.DumpSite.Name+ '</div>';

                  let freightColor = 'red';

                  if(tempFB.Received)freightColor ='green';
                  if(tempFB.dSubmitted)freightColor='blue';
                  let  foundTruckFreight =false;
                  tempFB.TrucksAssigned=1;
                  for(let l=0;l<foundFreights.length; l++){
                    if(foundFreights[l].phoneNumber===tempFB.phoneNumber && foundFreights[l].Driver===tempFB.Driver && foundFreights[l].dispatchID===tempFB.dispatchID){
                      let  foundEvent = false;
                  
                        for(let j=0; j<dispatches.length; j++){
                            if(dispatches[j].FreightBill.ID===foundFreights[l].ID){
                              console.log('how many dispatch events am I for looping through= ' +dispatches.length)
                              if(tempFB.dispatchTime<foundFreights[l].dispatchTime){
                                    console.log('iM CHANGING THE FRONT FB AND ITS TRUCKS ASSIGNED BEFORE  = ' + foundFreights[l].TrucksAssigned);
                                    tempFB.TrucksAssigned=foundFreights[l].TrucksAssigned+1;
                                    setFreightBill(tempFB);
                                   // updateFreightBillField('TrucksAssigned', foundFreights[l].TrucksAssigned);    
                                    console.log('IM DELETEING THIS EVENT = ',  dispatches[j].FreightBill);
                                    dispatches.splice(j,1);
                                    foundFreights.splice(l,1);
                                
                                }else{
                                    console.log('tempFB.TrucksAssigned before we add one= ' + foundFreights[l].TrucksAssigned);
                                    dispatchEventText=     '<div class="mbsc-grid" style="padding-left:2em;" >' +       
                                    '<div class="mbsc-row">' +     foundFreights[l].Company.CompanyName + '</div>'+
                                    '<div class="mbsc-row">' +    foundFreights[l].dispatchTime + '</div>'+
                                    '<div class="mbsc-row">' + foundFreights[l].LoadSite.Name + '</div>'+
                                    '<div class="mbsc-row">' +  foundFreights[l].DumpSite.Name + '</div>';
                                    dispatches[j].FreightBill.TrucksAssigned++;
                                    setFreightBill( dispatches[j].FreightBill);
                                  //  updateFreightBillField('TrucksAssigned', dispatches[j].FreightBill.TrucksAssigned);    
                                    console.log('tempFB.TrucksAssigned AFTER we add one= ' + foundFreights[l].TrucksAssigned);
                                    if(foundFreights[l].TrucksAssigned)if(foundFreights[l].TrucksAssigned>1)dispatchEventText+= '<div class="mbsc-row">  ' + foundFreights[l].TrucksAssigned + '</div>';
                                    dispatches[j].text=dispatchEventText;
                                    foundTruckFreight=true;

                                }
                            }
                        }

                        console.log('and now after the effect found event should be TRUE OR FALLALSLSE ' + foundEvent);
                  
                      }
                  }

        
                if(!foundTruckFreight){      
                  foundFreights.push(tempFB);
                  if(tempFB.Cancelled)  dispatchEventText+='<img  class="md-cancelled" src="https://firebasestorage.googleapis.com/v0/b/alianza-47fa6.appspot.com/o/Cancelled.png?alt=media&token=57d5f24e-e280-4083-b21e-e1505b5cb430"></img>';

                  dispatches.push({
                      start:new Date(tempDate.getFullYear(), tempDate.getMonth(),tempDate.getDate(),tempFB.dispatchTime.substr(0, 2),tempFB.dispatchTime.substr(3)),
                      text:dispatchEventText ,
                      FreightBill:tempFB,
                      color: freightColor
                  });
                  setEvents(dispatches);
                }
              }
              if (change.type === "modified") {
          
                for(var l=0; l<dispatches.length; l++){
                  if(dispatches[l].FreightBill.ID==tempFB.ID){
                    let dispatchEventText=     '<div class="mbsc-grid" style="padding-left:2em;" >' +       
                    '<div class="mbsc-row">' + tempFB.Company.CompanyName + '</div>'+
                    '<div class="mbsc-row">' + tempFB.dispatchTime + '</div>'+
                    '<div class="mbsc-row">' + tempFB.LoadSite.Name + '</div>'+
                    '<div class="mbsc-row">' + tempFB.DumpSite.Name+ '</div>';
                    dispatches[l].text=dispatchEventText;
                    let freightColor = 'red';
                    if(tempFB.Received)freightColor ='green';
                    if(tempFB.dSubmitted)freightColor='blue';  
                    dispatches[l].color=freightColor;
                    dispatches[l].FreightBill=tempFB;
                  }
                }
                setEvents(dispatches);
              }
              if (change.type === "removed") {
              }
            
          }); 
      
   
        
      
        
         
        }
          });
      }
   
    }
 


  }
  
  const updateHomeDate = (event,inst) =>{
 
    if(event.events)setHomeDate(event.events[0]);
    console.log('homeDate= ', homeDate);
  }

  const initCalendar = (event,inst)=>{
    if(homeDate)inst.navigateToEvent(homeDate);
    console.log('initizliaing and homeDate =', homeDate);
    console.log('event = ', event);
    console.log('inst =', inst);
    setCount(count+1);
  }

  const openFreightBill =(event,inst) => {
      const id  = event.event.FreightBill.ID;
      console.log(' id = ' , event);
      console.log('gearedUser when opening ==d2 =', gearedUser);
      const orgName = event.event.FreightBill.companyID;
      let markedFreightRead= false;
      
      let tempdate = new Date;
      let tempGearedUser= {Name:event.event.FreightBill.driverName,selectedOrgName:event.event.FreightBill.companyID }
      if(gearedUser) updateGearedUser(tempGearedUser);
      if(!event.event.FreightBill.Received){
        let realTempDate=  formatDate(tempdate.setDate(tempdate.getDate()), '/', 'MM/DD/YYYY');
        if (Number(tempdate.getMinutes()) < 10) realTempDate = realTempDate + ' ' + tempdate.getHours() + ':' + '0' + tempdate.getMinutes();
        else realTempDate = realTempDate + ' ' + tempdate.getHours() + ':' + tempdate.getMinutes();
        console.log('trealTempDate= ', realTempDate);
        event.event.FreightBill.Received = true;
        event.event.color='green';
        markedFreightRead = true;
        var newReceivedFreight = { FreightID:  event.event.FreightBill.ID, Received: true, ReceivedTime: realTempDate };
        let receivedFreightRef = doc(db, 'Organizations/'+ event.event.FreightBill.companyID+'/ReceivedFreightBills', event.event.FreightBill.ID);
  
        setDoc(receivedFreightRef,  newReceivedFreight);
      
      }
      if(event.event.FreightBill.TrucksAssigned>1)navigate(`/trucksdispatch/${orgName}/${id}`);else navigate(`/dispatch/${orgName}/${id}`);
 
  }
   
  useEffect(() => {
    
    console.log('runnign the use effect and we doin thisss !!' + homeStartDate)
    if(gearedUser)  queryDriverFreightBills(homeStartDate, homeEndDate);
    console.log('runnign the use effect and we doin thisss !!' ,gearedUser)
    },[gearedUser]);
    useEffect(() => {
    
      console.log('runnign the use effect and we doin thisss !!' + homeStartDate)
      if( organizationNames)  queryDriverFreightBills(homeStartDate, homeEndDate);
      console.log('runnign the use effect and we doin thisss !!' , organizationNames)
      },[ organizationNames]);
    useEffect(() => {
    setNavListItems([  {id:'navBar3', name:'Logout', key:'navBarKey3' , action:{action:logout}}]) 
    setPaperlessState('home');
    
    
  }, []);


  return (
    <div className='max-w-[600px] mx-auto my-16 p-4'>
      <h1 className='text-2xl font-bold py-4'>
      {gearedUser && gearedUser.Name} - Dispatches
      </h1>
      
  
      <Eventcalendar
        theme="ios" 
        themeVariant="light"
        clickToCreate={false}
        eventText='Dispatch'
        eventsText='Dispatches'
        onInit={  (event,inst) =>  initCalendar(event,inst) }
        onCellClick={  (event,inst) =>  updateHomeDate(event,inst) }
       
        onPageLoading={  (event,inst) =>  startQueryDriverFreightBills(event,inst) }
        dragToCreate={false}
        dragToMove={false}
        dragToResize={false}
        eventDelete={false}
        data={events}
        view={{calendar: { popover: false, count:true,  type: 'week',  }, agenda: { type: 'day'  } }}
        onEventClick={  (event,inst) =>  openFreightBill(event,inst) }
      />
   
    </div>
    )
     


} 


