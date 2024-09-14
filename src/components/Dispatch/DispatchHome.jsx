import React, {useEffect} from 'react'
import { useNavigate } from 'react-router-dom';
import { UserAuth } from '../../context/AuthContext'
import DispatchCalendar from './DispatchCalendar';
import DispatchCard from './DispatchCard';
import {useDispatch  } from './DispatchContext';



export default function DispatchHome() {


  const {  homeDate, homeDispatches, homeFreightBills,  handleUpdateFreightBills,setDispatch, setDispatchState } = useDispatch();
  const { gearedUser} = UserAuth();

  const tempDriver = {TruckType:{Name:'No Truck Type'}}
  const navigate = useNavigate();
  console.log('Re-rendering DispatchHome State', homeDispatches)



  const openDispatch =(event,inst) => {
    console.log(' id = ' , event);
    setDispatch(event);
    navigate(`/dispatch/${event.ID}`);
 
  }
  useEffect(() => {
    setDispatchState('DispatchHome');
  }, []);

  if (!gearedUser) { 
    return <div>Loading...</div>;
  }else if(gearedUser.selectedOrgName) return (
    <div >                          
      <DispatchCalendar/>
      {homeDispatches.length>0 && (
      <div className="mbsc-row" style={{paddingLeft:".5em",  width:"100%"}}>
        {homeDispatches.filter(item => item.QueryDate === homeDate).map((item, index) => {
            const originalIndex = homeDispatches.findIndex(dispatch => dispatch.ID === item.ID);
        
            return (
                <DispatchCard
                    key={item.ID}
                    dispatch={{item }}
                    originalIndex={originalIndex} // Pass the original index
                    homeFreightBills={homeFreightBills}
                 
                    onUpdateFreightBills={(updatedFreightBills) => handleUpdateFreightBills(item, updatedFreightBills)}
                    showDrivers={true}
                    showAssign={false}
                    onClick={openDispatch}
                    driver={tempDriver}
                />
            );
        })}
   
      </div>)}
    </div>
    )
     


} 


