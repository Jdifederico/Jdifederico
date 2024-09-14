import React, {useMemo,useCallback,useState }  from 'react';
import { useFreightBill  } from './FreightBillContext';
import { Eventcalendar} from '@mobiscroll/react';


const FreightBillCalendar = () => {

    const { homeDate, setHomeDate,  queryFreightBills, queryDispatches, formatDate, homeFreightBills, queryExpenses, homeExpenses } = useFreightBill();
    
    const myView = useMemo(() => ({ calendar: {  type: 'month', labels: true }}), []);

    const newLabels={};
    const orderMyEvents = useCallback((a, b) => {return a.order - b.order; }, []);
    let missingFBs=[];
    let notPaidFBs=[];
    let notBilledFBs =[];
    if(homeFreightBills.length){
        homeFreightBills.forEach(fb => {
        const date = fb.QueryDate;
        if (!newLabels[date]) {
            newLabels[date] = { missing: 0, notBilled: 0, notPaid: 0, needsApproval: 0, freightBillCount: 0 };
        }
        newLabels[date].freightBillCount += 1;
        if (fb.missing || fb.onHold){
          missingFBs.push(fb.ID);
          newLabels[date].missing += 1;
        } 
        if (fb.dSubmitted && !fb.approved) newLabels[date].needsApproval += 1;
        if (!fb.paid) {
          notPaidFBs.push(fb.ID);
          newLabels[date].notPaid += 1;
        }
        if (!fb.billed){
          notBilledFBs.push(fb.ID);
          newLabels[date].notBilled += 1;
        } 

        });
    } 

    if(homeExpenses.length){
      homeExpenses.forEach(e => {
      const date = e.QueryDate;
      if (!newLabels[date]) {
          newLabels[date] = { missing: 0, notBilled: 0, notPaid: 0, needsApproval: 0, freightBillCount: 0 };
      }
     
      if ((e.missing || e.onHold) && !missingFBs.includes(e?.FreightBill))newLabels[date].missing += 1;
      if (!e.paid && !notPaidFBs.includes(e?.FreightBill))  newLabels[date].notPaid += 1;
      if (!e.billed && !notBilledFBs.includes(e?.FreightBill))newLabels[date].notBilled += 1;

      });
  } 
    const labelsArray = Object.keys(newLabels).flatMap(date => {
        const { missing, notBilled, notPaid, needsApproval, freightBillCount } = newLabels[date];
        let tempLabels =  [ 
        {start: new Date(date),  end: new Date(date),  text: `<div style="display: flex; justify-content: center; ">Total: ${freightBillCount}</div>`, order:1, color: '#1976d2'  },
        {start: new Date(date), end: new Date(date),  text: `<div style="display: flex; justify-content: center; ">Missing/On Hold: ${missing}</div>`, order:2, color: missing>0 ? 'red' : 'green'  },
        {start: new Date(date), end: new Date(date),  text: `<div style="display: flex; justify-content: center; ">Needs Approval: ${needsApproval}</div>`, order:3, color: needsApproval>0 ? '#ef6c00' : 'green'  },
        {start: new Date(date), end: new Date(date),  text: `<div style="display: flex; justify-content: center; ">Not Billed: ${notBilled}</div>`, order:4, color: notBilled>0 ? '#ef6c00' : 'green'  },
        {start: new Date(date), end: new Date(date),  text: `<div style="display: flex; justify-content: center; ">Not Paid: ${notPaid}</div>`, order:5, color: notPaid>0 ? '#ef6c00' : 'green'  },
        ];

        return tempLabels;
    });
 
  
    const labels = labelsArray;

      const updateHomeDate = (event,inst) =>{
        console.log('event  = ', event);
        if(event.date){
          let tempDate=  formatDate(event.date, '/', 'YYYY/MM/DD');
          setHomeDate(tempDate);
        }
        console.log('homeDate= ', homeDate);
      }
      const startMonthQuery = (startDate, endDate)=>{
        console.log('STARTING MONT HQUERY!!')
        queryDispatches(startDate, endDate);
        queryFreightBills(startDate, endDate);
        queryExpenses(startDate, endDate);
       
      }
      const setMonthDates = (event, inst)=>{
        console.log('SETTING MONTH DATES')
        const startDate = formatDate(event.firstDay, '/', 'YYYY/MM/DD');
        const endDate = formatDate(event.lastDay, '/', 'YYYY/MM/DD');
        startMonthQuery(startDate, endDate)
      }
      const initCalendar = (event,inst)=>{
        if(homeDate)inst.navigateToEvent(homeDate);
        let todaysDate = new Date();
        todaysDate =  formatDate(todaysDate, '/', 'YYYY/MM/DD');
      
        const d = new Date(inst._firstDay);
        const startDate = formatDate(d, '/', 'YYYY/MM/DD');
        const endDate = formatDate(d.setDate(d.getDate() + 31), '/', 'YYYY/MM/DD');
        startMonthQuery(startDate, endDate)
        setHomeDate(todaysDate);
        
      }
    
    
    return (
        <div style={{paddingLeft:"1em", zIndex:1}}>
    
        <Eventcalendar
          theme="ios" 
          themeVariant="light"
          clickToCreate={false}
          height={900}
          onInit={  (event,inst) =>  initCalendar(event,inst) }
          onPageChange = { (event, inst) => setMonthDates(event, inst) }
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
  
  export default  FreightBillCalendar