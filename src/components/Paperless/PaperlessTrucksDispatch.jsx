import React, { useEffect} from 'react';
import {  useParams } from 'react-router-dom';
import "@mobiscroll/react/dist/css/mobiscroll.min.css";
import  {  Page } from '@mobiscroll/react';
import '@mobiscroll/react4/dist/css/mobiscroll.min.css';
import {usePaperless } from './PaperlessContext';
import PaperlessDispatch from './PaperlessDispatch';

function PaperlessTrucksDispatch(props) {

    const { id, orgName } = useParams();
    const { fetchFreightBill, fetchTrucksFreightBill,setFreightBill, setTruckFreightBills, truckFreightBills, freightBill, setPaperlessState } = usePaperless();
   

    useEffect(() => {
       const fetchData= async()=> {
         
            console.log('orgName ='+  orgName);
            const response = await fetchFreightBill(id, orgName);
            const tempTruckFreightBills = await fetchTrucksFreightBill(response,orgName,id);
            setTruckFreightBills(tempTruckFreightBills);
            console.log('truckFreightBills = ' , truckFreightBills)
         
        };
        fetchData();
}, [])
useEffect(() => {
    if(truckFreightBills){
        if(freightBill.TrucksAssigned!=truckFreightBills.length)setFreightBill(prevState => ({...prevState,  TrucksAssigned:truckFreightBills.length }));
        console.log('infinite loop');
    }
  }, [freightBill])

    const renderHeader = () => {
        return (
            <div height="0"></div>
        );
    }; 

    const header = renderHeader();
    if (!freightBill) {
        return( <div>Loading...</div>)
    }
    return (
    <Page>
        <div>
            {freightBill.JobDate ? ( 
              <PaperlessDispatch></PaperlessDispatch>
            ): ( <div>Loading...</div> )}
        </div>
    </Page>
    );
}

export default PaperlessTrucksDispatch;