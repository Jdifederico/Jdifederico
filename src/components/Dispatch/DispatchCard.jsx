import React, {useEffect, useState} from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import FreightSummaryLine from '../ListComponents/FreightSummaryLine';
import { Card } from 'primereact/card';
import mobiscroll from '@mobiscroll/react4';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers } from '@fortawesome/free-solid-svg-icons';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserAuth } from '../../context/AuthContext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';

const DispatchCard = ({ dispatch,homeFreightBills, onUpdateFreightBills, showDrivers, showAssign, onClick, assignTrucks ,driver}) => {
    dispatch = dispatch.item;
    const { gearedUser,truckTypes } = UserAuth();
    const [assign, setAssign] = useState(1);
    const [selectedTruckTypeID, setSelectedTruckTypeID] = useState(driver.TruckTypes?.[0]?.ID || '');
    const [selectedTruckType, setSelectedTruckType] = useState(driver.TruckTypes?.[0] || {})

    const dispatchFreightBills = homeFreightBills.filter(freightBill => freightBill.dispatchID === dispatch.ID);
    let freightBills = dispatchFreightBills.sort((a, b) => a.loadOrder - b.loadOrder);

    dispatch.TrucksAssigned = 0;
    dispatch.UnreadFreights =0;
  
    for (const fb of  freightBills)  if(!fb.Received) dispatch.UnreadFreights++;
    freightBills.sort((a, b) => a.loadOrder - b.loadOrder);

    dispatch.TrucksAssigned =freightBills.length;
    dispatch.TrucksOrdered = dispatch.TrucksOrdered || 0;
    dispatch.AccountName = dispatch.Account.Name || 'No Account';
    dispatch.LoadSiteName = dispatch.LoadSite.Name || 'No Load Site';
    dispatch.DumpSiteName = dispatch.DumpSite.Name || 'No Dump Site';

    const borderColor = dispatch.Released ? "3px solid rgb(67, 160, 71)" : "3px solid rgb(239, 108, 0)";
    let assignedColor = '';
    let unreadColor = "#43a047"
    if (dispatch.TrucksOrdered===0 || dispatch.TrucksAssigned=== dispatch.TrucksOrdered)  assignedColor = "#43a047"; else assignedColor = "#ef6c00";
    if(dispatch.UnreadFreights!==0)unreadColor = "red";

    useEffect(() => { 
           if(driver.Trucks?.[0]) {
            setSelectedTruckTypeID(driver.Trucks[0].TruckType?.ID || '')
            setSelectedTruckType(driver.Trucks[0].TruckType || '')
           }
          
        
        }, []);

    const onDragEnd = (result) => {
        if (!result.destination) return;  
        const reorderedItems = Array.from(freightBills);
        const [removed] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, removed);
        onUpdateFreightBills(reorderedItems);
        freightBills=reorderedItems;   
    };
    const assignBulkTrucks = () =>{
        console.log('selectedTruckType = ', selectedTruckType)
        assignTrucks(freightBills, dispatch, assign, selectedTruckType)
    }

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, `Organizations/${gearedUser.selectedOrgName}/FreightBills`, id));
            const updatedFreightBills =freightBills.filter(fb => fb.ID !== id);
         
            onUpdateFreightBills(updatedFreightBills);
        } catch (error) {  console.error("Error removing document: ", error);  }
    };

    const handleTruckTypeChange = (value)=>{
        console.log('value of truck tyhep = ', value)
        setSelectedTruckTypeID(value);
        for (let i = 0; i < truckTypes.length; i++)
            if (truckTypes[i].ID === value) setSelectedTruckType(truckTypes[i])
                
    }
    const columnClass =  'mbsc-col-md-6 mbsc-col-12';
    const parentStyle = showDrivers ? { padding: "0", paddingRight: ".5em", paddingBottom: ".5em", margin: "0", border: "4px solid #bcbcd1" } : { padding: "0", paddingRight: "0", paddingBottom: ".5em", margin: "0", border: "4px solid #bcbcd1" };
    const fromGroupStyle = showDrivers ? { marginLeft: ".5em", marginRight: ".5em" } : { marginLeft: ".3em", marginRight: "0" }
    return (
        <div className={columnClass} style={parentStyle} >
            <div className="mbsc-form-group-content mbsc-row" style={fromGroupStyle}>
                <Card style={{ width: "100%", paddingTop: "0px !important", borderRadius: "3em", border: borderColor }}>
                    <div className="mbsc-grid" style={{ padding: "0px", cursor: "pointer" }}>
                        <div className="mbsc-row" style={{width:"104%"}} onClick={() => onClick(dispatch, freightBills)}>
                            <div className="mbsc-col-12" style={{ padding: "0px", paddingLeft: "2em" }}>
                                <div className="mbsc-row mbsc-justify-content-between" >
                                    <div className="mbsc-col-6" style={{ fontWeight: "bold" }}>{dispatch.AccountName}</div>
                                    <div className="mbsc-col-6 mbsc-row" style={{padding:"0"}}>
                                        <div className="mbsc-col-7" style={{ padding: "0", fontWeight: "bold" }}>#{dispatch.JobNumber}</div>
                                        <div className="mbsc-col-5" style={{ padding: "0" }}>
                                            {dispatch.Released ? ( <button className="md-btn" style={{ backgroundColor: "#43a047 !important" }}>Released</button>
                                            ) : ( <button className="md-btn md-no-highlight" style={{ backgroundColor: "rgb(239, 108, 0)" }}>Unreleased</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mbsc-row mbsc-justify-content-between" style={{ paddingLeft: "1em", fontSize: ".8em" }}>{dispatch.LoadSiteName}</div>
                                <div className="mbsc-row" style={{ paddingLeft: "1em", fontSize: ".8em" }}>{dispatch.DumpSiteName}</div>
                               
                                {showAssign && (<div>
                                     <div className="mbsc-col-10 mbsc-justify-content-between" style={{ paddingLeft: "12px", paddingRight: "16px" }}>
                                        <div className="mbsc-row">    
                                            <div className="p-inputgroup mbsc-col-9" style={{height:"2em"}}>
                                                <span className="p-inputgroup-addon for-freight-label mbsc-col-5" > Assign: </span>
                                                <InputNumber  className='mbsc-col-5' style={{padding:"0"}} inFractionDigits={0} maxFractionDigits={0}  value={assign}  onChange={(e) => setAssign(e.value)}  />
                                                <button className="md-btn mbsc-col-2" onClick={assignBulkTrucks}>Assign</button> 
                                            </div>
                                         
                                        </div>
                                        <div className="mbsc-row">  
                                            <div className="p-inputgroup  mbsc-col-9"  style={{height:"2em"}}>
                                            <span className="p-inputgroup-addon mbsc-col-5">Truck Type:</span>
                                            <Dropdown  value={selectedTruckTypeID} onChange={(e) => handleTruckTypeChange(e.value)} options={truckTypes} optionLabel="Name"
                                                placeholder="Truck Type" className="w-full md:w-20rem" />
                                    
                                        </div>
                                        </div>
                                     </div>
                                    <div className="mbsc-row mbsc-justify-content-start" style={{ padding: "0", paddingLeft: "12px" }}></div>
                                </div>)}
                            </div> 
                        </div>
                        <mobiscroll.CardHeader style={{ borderTop: "1px solid #cccccc", borderBottom: "1px solid #cccccc", cursor: "pointer", fontSize: "1em !important", marginTop: "5px", marginBottom: "5px", padding: "6px", color: "#1976d2" }}>
                            <div className="mbsc-row mbsc-justify-content-between" style={{  paddingLeft: "12px", paddingRight: "16px" }}>
                                <span style={{ fontWeight: "700" }}> {showDrivers ? (<span>Assigned</span>):(<div></div>)} Drivers</span>
                                {dispatch.TrucksOrdered > 0 && dispatch.TrucksAssigned !== dispatch.TrucksOrdered &&  ( 
                                    <button className=" md-btn md-no-highlight" disabled={true} style={{ backgroundColor: assignedColor, margin: "0 !important", cursor: "default" }}>Ordered: {dispatch.TrucksOrdered}</button>
                                )}
                                <div className='mbsc-justify-content-end mytooltip' tooltip="Assigned">
                                    <FontAwesomeIcon  icon={faUsers} style={{ color: assignedColor, paddingRight:".1em"}}/>
                                    <div style={{ color:assignedColor, fontSize: "1em", display:"inline"}}>{dispatch.TrucksAssigned}</div>
                                </div>  
                                <div className="mytooltip" tooltip="Unread" style={{textAlign:'right'}}>
                                    <div className="mbsc-ic mbsc-ic-eye-blocked" style={{ color: unreadColor, fontSize: "1em" }}>{dispatch.UnreadFreights}</div>
                                </div>
                            </div>
                        </mobiscroll.CardHeader>
                        {showDrivers && (
                        <div className="mbsc-row" style={{ width: "100%", marginLeft: ".1em"}}>
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="freightBills">
                                    {(provided) => (
                                        <ul className='tableList' style={{width:"100%"}} ref={provided.innerRef} {...provided.droppableProps}>
                                            {freightBills.map((item, index) => (
                                                <Draggable key={item.ID} draggableId={item.ID} index={index}>
                                                    {(provided) => (
                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                            <FreightSummaryLine freight={{ item }} index={{ index }} onDelete={handleDelete} />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </ul>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </div>)}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default DispatchCard;