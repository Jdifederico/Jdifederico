import React, {useMemo,useCallback,useEffect }  from 'react';
import {useDispatch  } from './DispatchContext';
import { Eventcalendar} from '@mobiscroll/react';


const DispatchCalendar = () => {

    const { homeDate, setHomeDate, queryDispatches, queryFreightBills, formatDate, homeDispatches,homeFreightBills } = useDispatch();

   
  
    const myView = useMemo(() => ({ calendar: {  type: 'week', labels: true } }), []);
    const orderMyEvents = useCallback((a, b) => {return a.order - b.order; }, []);
    const newLabels={};

    homeDispatches.forEach(dispatch => {
        const date = dispatch.QueryDate;
        if (!newLabels[date]) {
        newLabels[date] = { calendarFreightBills: 0, unreadFreightBills: 0, dispatchCount: 0 };
        }
        newLabels[date].dispatchCount += 1;

        // Check if any dispatch for this date has Released === false
        if (dispatch.Released === false) {
        newLabels[date].hasUnreleased = true;  // flag to check for coloring
        }

        // Check if any dispatch for this date has TrucksOrdered !== TrucksAssigned
        if (dispatch.TrucksOrdered!==0 && dispatch.TrucksOrdered !== dispatch.TrucksAssigned) {
        newLabels[date].hasUnassignedTrucks = true;  // flag to check for coloring
        }
    });
    if(homeFreightBills.length){
        homeFreightBills.forEach(fb => {
        const date = fb.QueryDate;
        if (!newLabels[date]) {
            newLabels[date] = { calendarFreightBills: 0, unreadFreightBills: 0, dispatchCount: 0 };
        }
        newLabels[date].calendarFreightBills += 1;
        if (!fb.Received) {
            newLabels[date].unreadFreightBills += 1;
        }
        });
    }
    const labelsArray = Object.keys(newLabels).flatMap(date => {
        const { calendarFreightBills, unreadFreightBills, dispatchCount, hasUnreleased, hasUnassignedTrucks } = newLabels[date];
        let tempLabels =  [ 
        {  start: new Date(date),  end: new Date(date),    text: `<div style="display: flex; justify-content: center; ">Disp: ${dispatchCount}</div>`, order:1, color: hasUnreleased ? 'orange' : 'green'  },
        {start: new Date(date), end: new Date(date),  text: `<div style="display: flex; justify-content: center; ">Assign: ${calendarFreightBills}</div>`, order:2, color: hasUnassignedTrucks ? 'orange' : 'green'  }
        ];
        if(unreadFreightBills>0)tempLabels.push( { start: new Date(date),  end: new Date(date), text: `<div style="display: flex; justify-content: center; ">Unread: ${unreadFreightBills}</div>`, order:3, color: 'red'  })

        return tempLabels;
    });
    console.log('dispatch calendar re rendering!f')

  
    const labels = labelsArray;
    const updateHomeDate = (event,inst) =>{
        console.log('event  = ', event);
        if(event.date){
          let tempDate=  formatDate(event.date, '/', 'YYYY/MM/DD');
          setHomeDate(tempDate);
        }
        console.log('homeDate= ', homeDate);
      }
      const startWeekQuery = (startDate, endDate)=>{
        queryDispatches(startDate, endDate);
        queryFreightBills(startDate, endDate);
      }
      const setWeekDates = (event, inst)=>{
        const startDate = formatDate(event.firstDay, '/', 'YYYY/MM/DD');
        const endDate = formatDate(event.lastDay, '/', 'YYYY/MM/DD');
        startWeekQuery(startDate, endDate)
      }
      const initCalendar = (event,inst)=>{
        if(homeDate)inst.navigateToEvent(homeDate);
        let todaysDate = new Date();
        todaysDate =  formatDate(todaysDate, '/', 'YYYY/MM/DD');
      
        const d = new Date(inst._firstDay);
        const startDate = formatDate(d, '/', 'YYYY/MM/DD');
        const endDate = formatDate(d.setDate(d.getDate() + 7), '/', 'YYYY/MM/DD');
        startWeekQuery(startDate, endDate)
        setHomeDate(todaysDate);
        
      }
    
    
    return (
        <div style={{paddingLeft:"1em", zIndex:1}}>
    
        <Eventcalendar
          theme="ios" 
          themeVariant="light"
          clickToCreate={false}
          height={200}
          onInit={  (event,inst) =>  initCalendar(event,inst) }
          onPageChange = { (event, inst) => setWeekDates(event, inst) }
          onSelectedDateChange={  (event,inst) =>  updateHomeDate(event,inst) }
        
        
          dragToCreate={false}
          dragToMove={false}
          dragToResize={false}
          eventDelete={false}
          data={labels}
          eventOrder={orderMyEvents}
          view={myView}
          style={{ zIndex: 1 }} /* Ensure a lower z-index */
        
        />
    
    </div>  
    )
  }
  
  export default  DispatchCalendar