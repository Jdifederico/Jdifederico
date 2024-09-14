import React,{ useEffect} from 'react'

import { Card } from 'primereact/card';
import "@mobiscroll/react/dist/css/mobiscroll.min.css";
import { Link, useParams } from 'react-router-dom';
import  {  Page } from '@mobiscroll/react';
import '@mobiscroll/react4/dist/css/mobiscroll.min.css';
import mobiscroll from '@mobiscroll/react4';
import {usePaperless } from './PaperlessContext';


function PaperlessNoDispatch(props) {
    const { id, orgName } = useParams();
 
    const { fetchNoDispatch, freightBill } = usePaperless();
    useEffect(() => {
        console.log('trjying tof fetch no dispathc  ');
        const getData = async () => {
            const data = await fetchNoDispatch(id, orgName).then((tempFreight) => {
                console.log('tempfreight thingy running  ',tempFreight);
            });
        
    
        };
        getData();
    }, []);



    if (!freightBill) {
        return( <div>Loading...</div>)
    }
    return (
    <Page>
        <div>
            {freightBill.Date ? ( 
                <div className="mbsc-grid mbsc-justify-content-center" style={{padding:"0"}}> 
                    <div className="mbsc-col-xl-6 mbsc-col-lg-9 mbsc-offset-lg-1 mbsc-offset-xl-3 mbsc-md-12" style={{padding:"0"}}>
                        <Card  >  
                            <mobiscroll.CardHeader>
                                <mobiscroll.CardTitle style={{ textAlign: 'center',fontSize: '30px'}}>You have NO Dispatch for {freightBill.Date}</mobiscroll.CardTitle>
                            </mobiscroll.CardHeader>
                    
                        </Card>
                    </div>   
                </div> 
            ): ( <div>Loading...</div> )}
        </div>
    </Page>
    );
}

export default PaperlessNoDispatch;