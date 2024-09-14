import React, { useState } from 'react';

import mobiscroll from '@mobiscroll/react4';
import {useNavigate } from 'react-router-dom'
const DispatchList = ({ dispatch, homeFreightBills, homeExpenses,freightBillIDRef }) => {
    const [isHovered, setIsHovered] = useState(false);
    const navigate = useNavigate();

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    dispatch = dispatch.item;
    const dispatchFreightBills = homeFreightBills.filter(freightBill => freightBill.dispatchID === dispatch.ID);
    const dispatchExpenses = homeExpenses.filter(expense => expense.dispatchID === dispatch.ID);
    dispatch.NeedsApproval = 0;
    dispatch.OnHold = 0;
    dispatch.Missing = 0;
    dispatch.NotBilled = 0;
    dispatch.NotPaid = 0;
    dispatch.dSubmitted = 0;

    let missingFBs=[];
    let onHoldFBs=[];
    let notPaidFBs=[];
    let notBilledFBs =[];

    for (const fb of dispatchFreightBills) {
        if (fb.dSubmitted) {
            dispatch.dSubmitted++;
            if (!fb.approved) dispatch.NeedsApproval++;
        }
        if (fb.OnHold){
            onHoldFBs.push(fb.ID)
            dispatch.OnHold++;
        } 
        if (fb.missing){
            missingFBs.push(fb.ID)
            dispatch.Missing++;
        } 
        if (!fb.billed){
            notBilledFBs.push(fb.ID)
            dispatch.NotBilled++;
        } 
        if (!fb.paid){
            notPaidFBs.push(fb.ID)
            dispatch.NotPaid++;
        } 
    }

    
    for (const e of dispatchExpenses) {
    
        if (e.onHold  && !onHoldFBs.includes(e?.FreightBill))dispatch.OnHold++;
        
        if (e.missing && !missingFBs.includes(e?.FreightBill)) dispatch.Missing++;
        
        if (!e.billed && !notBilledFBs.includes(e?.FreightBill))dispatch.NotBilled++;
        
        if (!e.paid && !notPaidFBs.includes(e?.FreightBill)) dispatch.NotPaid++;
        
    }
    console.log('dispatchExpenses = ', dispatchExpenses)
    const handleClick = () =>{
        console.log('handling click for disapthc iid = ' + dispatch.ID)
        console.log(`/FreightBill/freights/${dispatch.ID}`)
        navigate(`/FreightBill/freights/${dispatch.ID}`);
  
    }
    return (
        <div  onClick={() => handleClick()}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={{
                backgroundColor: isHovered ? '#f2f2f2' : 'transparent',
                cursor: isHovered ? 'pointer' : 'default',
                transition: 'background-color 0.3s ease'
            }}
        >
            {dispatch?.Account && (
                <div className="mbsc-grid" style={{ borderTop: "1px solid black", paddingBottom: "1em", paddingTop: ".5em", fontSize: ".8em" }}>
                    <div className="mbsc-row">
                        <div className="mbsc-col-6">{dispatch.Account.Name}</div>
                        <div className={`mbsc-col-3 ${dispatch.Missing > 0 ? 'text-danger' : ''}`} style={{ paddingLeft: "10px" }}>Missing: {dispatch.Missing}</div>
                        <div className={`mbsc-col-3 ${dispatch.OnHold > 0 ? 'text-danger' : ''}`} style={{ paddingLeft: "10px" }}>On Hold: {dispatch.OnHold}</div>
                    </div>
                    <div className="mbsc-row">
                        <div className="mbsc-col-6">{dispatch.LoadSite.Name}</div>
                        <div className="mbsc-col-3" style={{ paddingLeft: "10px" }}>Driver Submitted: {dispatch.dSubmitted}</div>
                        <div className={`mbsc-col-3 ${dispatch.NeedsApproval > 0 ? 'text-danger' : ''}`} style={{ paddingLeft: "10px" }}>Needs Approval: {dispatch.NeedsApproval}</div>
                    </div>
                    <div className="mbsc-row">
                        <div className="mbsc-col-6">{dispatch.DumpSite.Name}</div>
                        <div className={`mbsc-col-3`} style={{ paddingLeft: "10px", color: dispatch.NotBilled > 0 ? "#ef6c00" : "inherit" }}>Not Billed: {dispatch.NotBilled}</div>
                        <div className={`mbsc-col-3`} style={{ paddingLeft: "10px", color: dispatch.NotPaid > 0 ? "#ef6c00" : "inherit" }}>Not Paid: {dispatch.NotPaid}</div>
                    </div>
                    <div className="mbsc-row">
                        <div className="mbsc-col-6">Trucks Assigned: {dispatch.TrucksAssigned}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DispatchList;
