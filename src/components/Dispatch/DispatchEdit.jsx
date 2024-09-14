import React, { useEffect, useState, useRef, useCallback } from 'react';
import {useParams } from 'react-router-dom';

import "@mobiscroll/react/dist/css/mobiscroll.min.css";
import  {  Page, Textarea} from '@mobiscroll/react';
import '@mobiscroll/react4/dist/css/mobiscroll.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTruck } from '@fortawesome/free-solid-svg-icons';  
import { Panel } from 'primereact/panel';      
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';

import { UserAuth } from '../../context/AuthContext';
import { useGlobal } from '../../context/GlobalContext';
import {useDispatch } from './DispatchContext';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { db } from '../../firebase';
import { doc, deleteDoc, writeBatch} from 'firebase/firestore';

import AutoCompleteInput from '../AutoCompleteInput'; 
import AutoSelectInputNumber from '../AutoSelectInputNumber'; 
import MapComponent from '../MapComponent'; 
import NoteComponent from '../NoteComponent'; 
import FreightSummaryLine from '../ListComponents/FreightSummaryLine';

import debounce from 'lodash/debounce';


function DispatchEdit(props) {
    const { id } = useParams();
    const { showAccountPopUp, showMaterialPopUp, showTruckTypePopUp,showContactPopUp, showLocationPopUp} = useGlobal();
    const { gearedUser, locations, contacts, materials,truckTypes, accounts,companies} = UserAuth();
    const { fetchDispatch,dispatch, handleUpdateFreightBills, setDispatch, homeFreightBills, setHomeDispatches, setDispatchState} = useDispatch();
    const [inputValues, setInputValues] = useState(null);
    const dispatchFreightBills = homeFreightBills.filter(freightBill => freightBill.dispatchID === dispatch.ID);


    let freightBills = dispatchFreightBills.sort((a, b) => a.loadOrder - b.loadOrder);
    console.log('reloaidng teh dispatch edit component and freightbils =', freightBills)
    let dispatchRef;
    if(dispatch?.ID)  dispatchRef = doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/Dispatches', dispatch.ID);
    const foremanContacts  = inputValues && contacts ? contacts.filter(contact => contact.Account?.ID === inputValues.Shipper?.ID).map((contact) => (contact)) : [];
    const receiverForemanContacts  =  inputValues && contacts ? contacts.filter(contact => contact.Account?.ID === inputValues.Receiver?.ID).map((contact) => (contact)) : [];
    const billTypes=[{text:'Hour', value:'Hour'},{text:'Load', value:'Load'},{text:'Ton', value:'Ton'}]

    const onDragEnd = (result) => {
        if (!result.destination) return;  
        let tempHomeDispArray =[];
        tempHomeDispArray.push(dispatch);
        setHomeDispatches(tempHomeDispArray);
        const reorderedItems = Array.from(dispatchFreightBills);
        const [removed] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, removed);
        handleUpdateFreightBills(dispatch, reorderedItems)
 
    };

    const updateDispatchField = useCallback(async (fieldName, value, updateFreightBills) => {

        setDispatch((prev) => ({ ...prev,  [fieldName]:  value }));
        console.log('updating the disaptch field = ' + fieldName + ' and value = ' , value );
        const batch = writeBatch(db);
        batch.update(dispatchRef, { [fieldName]: value });
        if(updateFreightBills){
            for(var i=0; i<freightBills.length; i++){
                let freightRef = doc(db, 'Organizations/'+ gearedUser.selectedOrgName +'/FreightBills',   freightBills[i].ID);
                let driverFreightRef = doc(db, 'Organizations/'+ gearedUser.selectedOrgName +'/DriverFreightBills',  freightBills[i].ID);
                batch.update(freightRef, { "timestamp": Date.now(), [fieldName]: value  });
                batch.update(driverFreightRef, { "timestamp": Date.now(),[fieldName]: value  });
            }
        }
        await batch.commit();
    
       
    },  [dispatch] );


  

    const updateDispatchFields = useCallback(async (fields, values, updateFreightBills) => {

        setDispatch(prevState => {
            let newState = { ...prevState };
            for (let i = 0; i < fields.length; i++) newState[fields[i]] = values[i]; 
            return newState;
          });
          const updateObject = {};
          fields.forEach((field, index) => {
            updateObject[field] = values[index];
          });

          updateObject.timestamp=Date.now();
          const batch = writeBatch(db);
          batch.update(dispatchRef, updateObject);
          if(updateFreightBills){
              for(var i=0; i<freightBills.length; i++){
                  let freightRef = doc(db, 'Organizations/'+ gearedUser.selectedOrgName +'/FreightBills',   freightBills[i].ID);
                  let driverFreightRef = doc(db, 'Organizations/'+ gearedUser.selectedOrgName +'/DriverFreightBills',  freightBills[i].ID);
                  batch.update(freightRef,  updateObject);
                  batch.update(driverFreightRef, updateObject);
              }
          }
          await batch.commit();
     
       
       
    },  [dispatch] );
    const formatStartTime =useCallback(async  (starttime) =>{

         starttime= starttime.replace(/\./g,':');
         if (/^([01][0-9]|2[0-3])[0-5][0-9]$/.test(starttime)) starttime = starttime.substr(0, 2) + ':' + starttime.substr(2);
         else if (/^([0-9]|[0-3])[0-5][0-9]$/.test(starttime)) starttime= '0' + starttime.substr(0, 1) + ':' + starttime.substr(1);
         else if (/^([0-9]|[0-3]):[0-5][0-9]$/.test(starttime)) starttime = '0' + starttime.substr(0, 1) + ':' + starttime.substr(2, 3);
        assignLoadOrders('StartTime', starttime);
     },[dispatch]);
    const debouncedUpdateDispatchField = useCallback(debounce(updateDispatchField, 500), [updateDispatchField]);
    const debouncedUpdateDispatchFields = useCallback(debounce(updateDispatchFields, 500), [updateDispatchFields]);
    const debouncedFormatTime = useCallback(debounce(formatStartTime, 500), [formatStartTime]);
   
    const handleFieldsChange = (fields, values, updateFreightBills) => {
        console.log('fieldNames= ',fields)
        console.log('values= ',values)

        setInputValues(prevState => {
            let newState = { ...prevState };
            for (let i = 0; i < fields.length; i++) newState[fields[i]] = values[i]; 
            return newState;
          });

        debouncedUpdateDispatchFields(fields, values, updateFreightBills);
    };
    const handleFieldChange = (fieldName, value, updateFreightBills) => {
        console.log('fieldName= '+fieldName)
        console.log('value= ',value)
      
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
        debouncedUpdateDispatchField(fieldName, value, updateFreightBills);
    };

    const handlePayTypeChange = async(payType)=>{
        handleFieldChange('PayType', payType, false)
        const batch = writeBatch(db);
        for (var i = 0; i < freightBills.length; i++) {
            if (freightBills[i].Subhauler) freightBills[i].PayType = payType;
            else if (freightBills[i].PayType.includes("Percent")) freightBills[i].PayType = payType + '/Percent';
            let freightRef = doc(db, 'Organizations/'+ gearedUser.selectedOrgName +'/FreightBills',   freightBills[i].ID);
            let driverFreightRef = doc(db, 'Organizations/'+ gearedUser.selectedOrgName +'/DriverFreightBills',  freightBills[i].ID);
            batch.update(freightRef, { "timestamp": Date.now(), PayType:payType });
            batch.update(driverFreightRef, { "timestamp": Date.now(),PayType: payType });
        }
        await batch.commit();
     
    }
    
    const handleOutsidePayRateChange = useCallback(debounce(async(outsidePayRate)=>{
        console.log('changing the outside pay rateeeee!!')
        handleFieldChange('OutsidePayRate', outsidePayRate, false)
        const batch = writeBatch(db);
        for (var i = 0; i < freightBills.length; i++) {
            if (freightBills[i].Subhauler){
                 freightBills[i].PayRate = outsidePayRate;
                let freightRef = doc(db, 'Organizations/'+ gearedUser.selectedOrgName +'/FreightBills',   freightBills[i].ID);
                let driverFreightRef = doc(db, 'Organizations/'+ gearedUser.selectedOrgName +'/DriverFreightBills',  freightBills[i].ID);
                batch.update(freightRef, { "timestamp": Date.now(), PayRate:outsidePayRate });
                batch.update(driverFreightRef, { "timestamp": Date.now(),PayRate: outsidePayRate });
            }
        }
        await batch.commit();
     
    },500),[])
    
    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, `Organizations/${gearedUser.selectedOrgName}/FreightBills`, id));
           let updatedfreightBills = dispatchFreightBills.filter(fb => fb.ID !== id);
           let tempHomeDispArray =[];
           tempHomeDispArray.push(dispatch);
           setHomeDispatches(tempHomeDispArray);
           updateDispatchField('TrucksAssigned',updatedfreightBills.length, false )
       
           handleUpdateFreightBills(dispatch, updatedfreightBills)
        } catch (error) {  console.error("Error removing document: ", error);  }
    };
    const handleNoteChange =(noteField, text, quillNoteField, quill)=>{
 
        let fields =[noteField,quillNoteField];
        let values = [text,quill];
       if(noteField==='Notes') debouncedUpdateDispatchFields(fields, values, true ); else debouncedUpdateDispatchFields(fields, values, false )
        //  updateDoc(dispatchRef, { [noteField]: text, [quillNoteField]:quill }).then(() => {}).catch((error) => { console.log('error updating driver =', error);   });
    }
    const changeStartTime = (starttime) =>{
        setInputValues((prev) => ({ ...prev, StartTime: starttime }));
        debouncedFormatTime(starttime);
    }
   
    const assignLoadOrders = (fieldName, value) =>{
        console.log('fifty fifth shtreet', dispatch)
        if(dispatch){
            let updatedDispatch = { ...dispatch, [fieldName]: value };   
            handleUpdateFreightBills(updatedDispatch,freightBills)
            updateDispatchField(fieldName,value, false);
        }
    }

    const panelHeader = (headerText) => (options) => {
        const className = `${options.className} justify-content-space-between`;

        return (
            <div className={className}style={{padding:".5em", paddingLeft:"1.5em"}} >
                <div className="mbsc-row" style={{width:"100%"}}>
                    <h6 className="m-0 font-weight-bold text-secondary mbsc-col-7" style={{ paddingLeft:"1.5em", fontSize:"1.1em",margin:"0", fontWeight:"700"}}>{headerText}</h6>
                    <div  className="mbsc-col-4"></div>
             
                </div>
            </div>
        );
    };
   


  
    useEffect(() => {
      
        if (dispatch) {
            setInputValues((prev) => ({ ...prev, ...dispatch}));
         
        }
    }, [dispatch]);

    useEffect(() => {
        setDispatchState('DispatchEdit');
        const getData = async () => {
            console.log('id = ' + id);
            if(!dispatch) await fetchDispatch(id);
            else if(dispatch.ID!==id)   await fetchDispatch(id);
        };
        getData();
    }, []);

    if (!inputValues ) {
        return <div>Loading...</div>;
    }

    return (
    <Page>
        <div className="mbsc-grid" style={{padding:"0"}}> 
            <div className="mbsc-row"  style={{margin:"0"}}>
                <div className="mbsc-col-lg-6 mbsc-md-12" style={{padding:"0"}}>
                    {dispatch.Cancelled  && (
                        <img  style={{top:"200px ",left:"0px", position:"absolute",zIndex:"9999" }}   src="https://firebasestorage.googleapis.com/v0/b/alianza-47fa6.appspot.com/o/Cancelled.png?alt=media&token=57d5f24e-e280-4083-b21e-e1505b5cb430"></img>
                    )}
                    <Panel headerTemplate={panelHeader("Dispatch Details")}>
                        <div  className="mbsc-form-group" style={{margin:"0"}}> 
                            <div className="p-inputgroup" >
                                <span className="p-inputgroup-addon dispatch-inputgroup"  >Job Date</span> 
                                    <InputText  value={inputValues.JobDate} onChange={(e) => handleFieldChange('JobDate', e.target.value, false)} id="jobDate" />
                            </div>
                            <AutoCompleteInput label="Customer" fieldName="Account" field="Name" value={inputValues.Account} suggestions={accounts} setValue={setInputValues} handleFieldChange={handleFieldChange}  databaseList={'Accounts'} disabled={true} />

                            <div className="p-inputgroup" >
                                <span className="p-inputgroup-addon dispatch-inputgroup"  >Job # </span> 
                                    <InputText  value={inputValues.JobNumber}  onChange={(e) => handleFieldChange('JobNumber', e.target.value, true)} />
                            </div>
                            <div className="p-inputgroup" >
                                <span className="p-inputgroup-addon dispatch-inputgroup"  >Job Type </span> 
                                    <InputText  value={inputValues.JobType}  onChange={(e) => handleFieldChange('JobType', e.target.value, false)} />
                            </div>
                            <AutoCompleteInput fieldName="Company" field="CompanyName" value={inputValues.Company} suggestions={companies}  setValue={setInputValues}  handleFieldChange={handleFieldChange}   />
                            <AutoCompleteInput label="Truck Type" fieldName="TruckType" field="Name" value={inputValues.TruckType} suggestions={truckTypes}   setValue={setInputValues} handleFieldChange={handleFieldChange} editClick={() => showTruckTypePopUp(inputValues.TruckType)}  databaseList={'TruckTypes'}/>
                            <AutoCompleteInput label="Load Site" fieldName="LoadSite" field="Name" value={inputValues.LoadSite} suggestions={locations} setValue={setInputValues} handleFieldChange={handleFieldChange}  editClick={() => showLocationPopUp(inputValues.LoadSite)}  databaseList={'Locations'}/>
                            <div className="p-inputgroup" >
                                <span className="p-inputgroup-addon " style={{width:"12em"}}>Address</span> 
                                <Textarea disabled={true}  style={{border:".5px solid #d1d5db", borderBottomRightRadius:"6px", borderTopRightRadius:"6px", width:"116%"}} value={inputValues.LoadSite.fullAddress}  id="loadSite"  />
                            </div>
                
                            <AutoCompleteInput label="Dump Site" fieldName="DumpSite" field="Name" value={inputValues.DumpSite} suggestions={locations} setValue={setInputValues} handleFieldChange={handleFieldChange} editClick={() => showLocationPopUp(inputValues.DumpSite)}   databaseList={'Locations'} />
 
                            <div className="p-inputgroup" >
                                <span className="p-inputgroup-addon" style={{width:"12em"}}  >Address:</span> 
                                <Textarea disabled={true}  style={{border:".5px solid #d1d5db", borderBottomRightRadius:"6px", borderTopRightRadius:"6px", width:"116%"}} value={inputValues.DumpSite.fullAddress}  id="dumpSite"  />
                            </div>
                            <AutoCompleteInput fieldName="Material" field="Name" value={inputValues.Material} suggestions={materials} setValue={setInputValues} handleFieldChange={handleFieldChange} editClick={() => showMaterialPopUp(inputValues.Material)} databaseList={'Materials'}/>

                            <AutoCompleteInput fieldName="Shipper" field="Name" value={inputValues.Shipper} suggestions={accounts} setValue={setInputValues} handleFieldChange={handleFieldChange}  editClick={() => showAccountPopUp(inputValues.Shipper)}  databaseList={'Accounts'}/>
                            <AutoCompleteInput fieldName="Receiver" field="Name" value={inputValues.Receiver} suggestions={accounts} setValue={setInputValues} handleFieldChange={handleFieldChange} editClick={() => showAccountPopUp(inputValues.Receiver)}   databaseList={'Accounts'}/>
                            
                            {foremanContacts.length!==0 && (<AutoCompleteInput label="Shipper Foreman" fieldName="Foreman" field="Name" value={inputValues.Foreman} suggestions={foremanContacts} setValue={setInputValues} handleFieldChange={handleFieldChange} editClick={() => showContactPopUp(inputValues.Foreman)}   databaseList={'Contacts'}/>)}
                            {inputValues.Foreman.displayPhone && ( 
                                
                                <div className="p-inputgroup " >
                                <span className="p-inputgroup-addon dispatch-inputgroup"  >Ship. Foreman Phone</span> 
                                    <InputText  value={inputValues.Foreman.displayPhone}   disabled={true} />
                                </div>
                            )}
                            {receiverForemanContacts.length!==0 && (<AutoCompleteInput label="Receiver Foreman" fieldName="ReceiverForeman" field="Name" value={inputValues.ReceiverForeman} suggestions={receiverForemanContacts} setValue={setInputValues} handleFieldChange={handleFieldChange} editClick={() => showContactPopUp(inputValues.ReceiverForeman)}   databaseList={'Contacts'}/>)}
                            {inputValues.ReceiverForeman.displayPhone && ( 
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon dispatch-inputgroup"  >Rec. Foreman Phone</span> 
                                    <InputText  value={inputValues.ReceiverForeman.displayPhone}   disabled={true}  />
                                </div>
                                )}
                            
                            <div className="mbsc-row" style={{ margin: "0px" }}>
                                <div className="mbsc-col-lg-6 mbsc-col-12" style={{padding:"0"}}> 
                                <div className="p-inputgroup ">
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup">Bill Type</span>
                                        <Dropdown value={inputValues.BillType} onChange={(e) => handleFieldChange('BillType', e.value, true)}  options={billTypes} optionLabel="text"
                                            placeholder="Bill Type" className="w-full md:w-14rem" />
                                    </div>
                                    <div className="p-inputgroup " >
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup"  >Bill Rate</span> 
                                        <AutoSelectInputNumber  isCurrency={true}  placeholder="Enter a number" value={inputValues.BillRate}   onChange={(e) => handleFieldChange('BillRate', e.value, true)} />
                                    </div>
                                    
   
                                    <div className="p-inputgroup ">
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup">Pay Type</span>
                                        <Dropdown value={inputValues.PayType} onChange={(e) => handlePayTypeChange( e.value)} options={billTypes} optionLabel="text"
                                            placeholder="Pay Type" className="w-full md:w-14rem" />
                                    </div>
                              
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup"  >Pay Rate</span> 
                                        <AutoSelectInputNumber isCurrency={true} value={inputValues.PayRate}   onChange={(e) => handleFieldsChange(['PayRate', 'OutsidePayRate'], [e.value, e.value], true)} />
                                    </div>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup"  >Outside Pay Rate</span> 
                                        <AutoSelectInputNumber  isCurrency={true}  value={inputValues.OutsidePayRate}   onChange={(e) => handleOutsidePayRateChange(e.value)} />
                                    </div>
                                    
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup"  >Start Time</span> 
                                        <InputText  value={inputValues.StartTime} maxLength={5} onChange={(e) =>changeStartTime(e.target.value)} />
                                    </div> 
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup"  >Min Between Load</span> 
                                        <AutoSelectInputNumber   value={inputValues.MinBetLoad}  onChange={(e) => assignLoadOrders('MinBetLoad', e.value)} />
                                    </div> 
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup"  >
                                            <FontAwesomeIcon className="fas" icon={faTruck} style={{  width:"1em", paddingRight:".2em"}}/>
                                            Per Load
                                        </span> 
                                        <AutoSelectInputNumber    value={inputValues.SimLoad}  onChange={(e) => assignLoadOrders('SimLoad', e.value)} />
                                    </div> 

                                    <div className="p-inputgroup ">
                                        <span className="p-inputgroup-addon p-checkbox-label" style={{width:"145%"}}>Hide Map</span>
                                        <Checkbox style={{ width: '100%' }} onChange={(e) => handleFieldChange('hideMapTab', e.checked, true)}  checked={inputValues.hideMapTab}  />
                                    </div> 
                                </div>
                                <div className="mbsc-col-lg-6 mbsc-col-12" style={{padding:"0"}}> 
                                    <div className="p-inputgroup " >
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup"  >Broker Fee %</span> 
                                        <AutoSelectInputNumber    value={inputValues.BrokerFee}   onChange={(e) => handleFieldChange('BrokerFee', e.value, true)} />
                                    </div>
                                    <div className="p-inputgroup " >
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup"  >Fuel Charge %</span> 
                                        <AutoSelectInputNumber   value={inputValues.FuelCharge}   onChange={(e) => handleFieldChange('FuelCharge', e.value, true)} />
                                    </div>
                                    <div className="p-inputgroup ">
                                        <span className="p-inputgroup-addon p-checkbox-label" >Apply Broker Fee to Fuel Charge</span>
                                        <Checkbox style={{ width: '100%' }} onChange={(e) => handleFieldChange('billBrokerFuel', e.checked, true)}  checked={inputValues.billBrokerFuel}  />
                                    </div> 
                                    <div className="p-inputgroup " >
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup"  >Hour Min</span> 
                                        <AutoSelectInputNumber   value={inputValues.HourMin}   onChange={(e) => handleFieldChange('HourMin', e.value, true)} />
                                    </div>
                                    <div className="p-inputgroup " >
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup"  >Show Up</span> 
                                        <AutoSelectInputNumber   value={inputValues.ShowUp}   onChange={(e) => handleFieldChange('ShowUp', e.value, true)} />
                                    </div>
                                    <div className="p-inputgroup " >
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup"  >
                                        <FontAwesomeIcon className="fas" icon={faTruck} style={{  width:"1em", paddingRight:".2em"}}/>
                                            Ordered
                                            </span> 
                                        <AutoSelectInputNumber   autoFocus={true} value={inputValues.TrucksOrdered}   onChange={(e) => handleFieldChange('TrucksOrdered', e.value, false)} />
                                    </div>
                                    <div className="p-inputgroup " >
                                        <span className="p-inputgroup-addon dispatch-small-inputgroup"  > <FontAwesomeIcon className="fas" icon={faTruck} style={{  width:"1em", paddingRight:".2em"}}/> Assigned  </span> 
                                        <AutoSelectInputNumber  autoFocus={true} value={inputValues.TrucksAssigned}  disabled={true} onChange={(e) => handleFieldChange('TrucksAssigned', e.value, false)} />
                                    </div>
                                    <div className="p-inputgroup ">
                                        <span className="p-inputgroup-addon p-checkbox-label" style={{width:"145%"}}>On Site</span>
                                        <Checkbox style={{ width: '100%' }} onChange={(e) => handleFieldChange('OnSite', e.checked, true)}  checked={inputValues.OnSite}  />
                                    </div>  
                                    <div className="p-inputgroup ">
                                        <span className="p-inputgroup-addon p-checkbox-label" style={{width:"145%"}}>On Hold</span>
                                        <Checkbox style={{ width: '100%' }} onChange={(e) => handleFieldChange('OnHold', e.checked, true)}  checked={inputValues.OnHold}  />
                                    </div> 
                                </div>   
                            </div>     
                        </div>
                    </Panel>
                    <Panel headerTemplate={panelHeader("Stand By")}>
                        <div  className="mbsc-form-group mbsc-row" style={{margin:"0"}}> 
                            <div className="mbsc-col-lg-6 mbsc-col-12" style={{padding:"0"}}> 
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon dispatch-small-inputgroup"  >Load Allowed</span> 
                                    <AutoSelectInputNumber   value={inputValues.standLA}   onChange={(e) => handleFieldChange('standLA', e.value, true)} />
                                </div>
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon dispatch-small-inputgroup"  >Dump Allowed</span> 
                                    <AutoSelectInputNumber   value={inputValues.standDA}   onChange={(e) => handleFieldChange('standDA', e.value, true)} />
                                </div>
                            </div>
                            <div className="mbsc-col-lg-6 mbsc-col-12" style={{padding:"0"}}> 
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon dispatch-small-inputgroup"  >Bill Rate</span> 
                                    <AutoSelectInputNumber   value={inputValues.standBR}   onChange={(e) => handleFieldChange('standBR', e.value, true)} />
                                </div>
                              
                                <div className="p-inputgroup " >
                                    <span className="p-inputgroup-addon dispatch-small-inputgroup"  >Pay Rate</span> 
                                    <AutoSelectInputNumber   value={inputValues.standPR}   onChange={(e) => handleFieldChange('standPR', e.value, true)} />
                                </div>
                            </div>
                        </div>
                    </Panel>
                </div> 
              
                <div className="mbsc-col-lg-6 mbsc-md-12" style={{padding:"0"}}>
                    <Panel headerTemplate={panelHeader("Assigned Drivers")}>
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
                    </Panel>
                     <Panel headerTemplate={panelHeader("Driver Notes")}>
                        <NoteComponent parent={dispatch} noteType={'Notes'} quillName={'QuillDriverNotes'} onNoteChange={handleNoteChange} ></NoteComponent>      
                    </Panel>
                    <Panel headerTemplate={panelHeader("Internal Notes")}>
                        <NoteComponent parent={dispatch} noteType={'InternalNotes'} quillName={'QuillInternalNotes'} onNoteChange={handleNoteChange} ></NoteComponent>      
                    </Panel>
                    <Panel headerTemplate={panelHeader("Map")}>
                        <MapComponent dispatch={dispatch}></MapComponent>      
                    </Panel>
                   
                </div>
               
            </div>
        </div>
    </Page>
    );
}

export default DispatchEdit;