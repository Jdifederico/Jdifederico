import React, { useCallback, useEffect, useState, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { db } from '../../firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { Dialog } from 'primereact/dialog';
import { Button } from '@mobiscroll/react';
import { MultiSelect } from 'primereact/multiselect';
import { UserAuth } from '../../context/AuthContext';
import { Dropdown } from 'primereact/dropdown';
import NoteList from '../ListComponents/NoteList';
import DispatchCard from './DispatchCard';
import { useDispatch } from './DispatchContext';
import debounce from 'lodash/debounce';

const DispatchDriverPopUp = ({ driver, visible, setVisible, onDriverUpdate,  homeDate, onAssignDriver, assignedTrucks }) => {
    const { capabilities, truckTypes, trucks, trailers, gearedUser, subhaulers} = UserAuth();
    const { homeDispatches, homeFreightBills, formatDate } = useDispatch();
    const [selectedCapabilities, setSelectedCapabilities] = useState(null);
    const [selectedTruckTypes, setSelectedTruckTypes] = useState(null);
    const [selectedTrailer, setSelectedTrailer] = useState(null);
    const [selectedTruck, setSelectedTruck] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [phoneObject, setPhoneObject] = useState({ Phone1: '', Phone2: '', Phone3: '' });
    const [isEditable, setIsEditable] = useState(false);
    const [inputValues, setInputValues] = useState({}); // State to handle input values

    // Refs for input fields to manage focus transitions
    const inputRef2 = useRef(null);
    const inputRef3 = useRef(null);

    const MemoizedNoteList = React.memo(NoteList);

    const filteredTrailers = trailers.filter(trailer => trailer.Name !== 'No Trailer');
    const filteredTrucks = trucks.filter(truck => truck.Name !== 'No Truck');
    const statuses = ['Active', 'Inactive', 'On Leave'];
 
    const closeDriverPopUp = () => {
        setVisible(false);
        console.log('ok we are closing pop up!!');
    };

    let driverRef;
    if (driver) {
      
        if (driver.Type === 'Driver') {
            driverRef = doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/Drivers', driver.ID);
        } else if (driver.Type === 'Dedicated') {
            driverRef = doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/OutsideTrucks', driver.ID);
        } else if (driver.Type === 'Subhauler') {
            driverRef = doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/Accounts', driver.ID);
        }
     
     
    }

    useEffect(() => {
        if (driver) {
            setSelectedCapabilities(driver.Capabilities);
            setInputValues({
                FirstName: driver.FirstName,
                LastName: driver.LastName,
                DriverName: driver.DriverName,
                Truck:driver.Truck
            });
          
            setSelectedStatus(driver.Status);
            if (driver.Truck) setSelectedTruck(driver.Truck.ID);
            if (driver.Trailer) setSelectedTrailer(driver.Trailer.ID);
            let ids = driver.TruckTypes.map(truckType => truckType.ID);
            setSelectedTruckTypes(ids);

            if (driver?.PhoneObject) setPhoneObject({ ...driver.PhoneObject });
        }
    }, [driver]);

    const homeDateObj = new Date(homeDate.replace(/-/g, '/'));
    const notesWithIndex = driver?.Notes ? driver.Notes.map((note, originalIndex) => ({ note, originalIndex })) : [];

    const filteredNotes = notesWithIndex.filter(({ note }) => {
        if (note.EndDate) {
            const endDateParts = note.EndDate.split('/');
            const endDateObj = new Date(endDateParts[2], endDateParts[0] - 1, endDateParts[1]);
            return endDateObj >= homeDateObj;
        } else return 0;
    });

    const handleTrailerChange = (trailerID) => {
        console.log('trailerID= ', trailerID);
        let newTrailer = findObjectById(trailers, trailerID);
        updateDriverField ('Trailer', newTrailer)
    };

    const handleTruckChange = (truckID) => {
        console.log('truckID= ', truckID);
        let newTruck = findObjectById(trucks, truckID);
        updateDriverField ('Truck', newTruck)
  
    };

    const updateDriverField = useCallback(async (fieldName, value) => {
        let updatedDriver = { ...driver, [fieldName]: value };

        if (fieldName === 'FirstName' || fieldName === 'LastName') {
            const newFirstName = fieldName === 'FirstName' ? value : driver.FirstName;
            const newLastName = fieldName === 'LastName' ? value : driver.LastName;
            updatedDriver.Name = `${newFirstName} ${newLastName}`;
            await updateDoc(driverRef, { Name:updatedDriver.Name, [fieldName]: value }).then(() => {}).catch((error) => {  console.log('error updating driver =', error);  });
        }else{
            await updateDoc(driverRef, { [fieldName]: value }).then(() => {}).catch((error) => { console.log('error updating driver =', error);   });
        }
        onDriverUpdate(updatedDriver);
    },  [driver, onDriverUpdate] );

    const debouncedUpdateDriverField = useCallback(debounce(updateDriverField, 500), [updateDriverField]);

    const handleFieldChange = (fieldName, value) => {
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
        debouncedUpdateDriverField(fieldName, value);
    };
 
    const handleUpdateNote = useCallback((index, note) => {
        const updatedNotes = [...driver.Notes];
        updatedNotes[index] = note;
        if(driver.Type==='Dedicated'){
            for(var q=0; q<subhaulers.length; q++){
                if(subhaulers[q].NoteList){
                    for(var l=0;l<subhaulers[q].NoteList.length; l++){
                        if(subhaulers[q].NoteList[l].noteType==='Schedule' && subhaulers[q].NoteList[l].Truck.ID===driver.ID &&  note.ID===subhaulers[q].NoteList[l].ID){
                            let tempSubhaulers =[...subhaulers];
                            tempSubhaulers[q].NoteList[l]=note;
                            console.log('tempSubhaulers[q].NoteList[l] = ',tempSubhaulers[q].NoteList[l])
                            let accountRef = doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/Accounts', driver.AccountID);
                            updateDoc(accountRef, { NoteList: tempSubhaulers[q].NoteList}).then(() => {}).catch((error) => {console.log('error updating acc =', error);  });

                        }
                    }
                }
            }
            let accountRef = doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/Accounts', driver.AccountID);
            updateDoc(accountRef, { NoteList: updatedNotes}).then(() => {}).catch((error) => {console.log('error updating acc =', error);  });
            let updatedDriver = { ...driver, Notes: updatedNotes};
      
            onDriverUpdate(updatedDriver);
        }else updateDriverField('Notes', updatedNotes)
    }, [driver, onDriverUpdate]);

    const handleDeleteNote = useCallback((index, note) => {
        const updatedNotes = [...driver.Notes];
       // updatedNotes.splice(index,1);
        console.log('updatedNotes =  ', updatedNotes)
        if(driver.Type==='Dedicated'){     
            for(var q=0; q<subhaulers.length; q++){
                if(subhaulers[q].NoteList){
                    for(var l=0;l<subhaulers[q].NoteList.length; l++){
                        if(subhaulers[q].NoteList[l].noteType==='Schedule' && subhaulers[q].NoteList[l].Truck.ID===driver.ID &&  note.ID===subhaulers[q].NoteList[l].ID){
                            let tempSubhaulers =[...subhaulers];
                            tempSubhaulers[q].NoteList.splice(l,1);
                            l--;
                            let accountRef = doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/Accounts', driver.AccountID);
                            updateDoc(accountRef, { NoteList: tempSubhaulers[q].NoteList}).then(() => {}).catch((error) => {console.log('error updating acc =', error);  });
                        // let updatedDriver = { ...driver, Notes:  tempSubhaulers[q].NoteList};
                        }
                    }
                }
            }

        }else  updateDriverField('Notes', updatedNotes)
    }, [driver, onDriverUpdate]);

    const handleCapabilitiesChange = (selected) => {
        console.log('selected = ', selected);
        setSelectedCapabilities(selected);
        let displayCapabilities = [];
        for (var i = 0; i < driver.TruckTypes.length; i++) displayCapabilities.push(driver.TruckTypes[i].TruckCode);
        for (var j = 0; j < selected.length; j++) displayCapabilities.push(selected[j]);
        updateDoc(driverRef, {Capabilities: selected, displayCapabilities: displayCapabilities  }).then(() => {}).catch((error) => { console.log('error updating driver =', error); });
        onDriverUpdate({ ...driver, Capabilities: selected, displayCapabilities: displayCapabilities });
    };

    const handleTruckTypesChange = (selected) => {
        console.log('selected = ', selected);
        setSelectedTruckTypes(selected);
        let displayCapabilities = [];
        let tempTruckTypes = [];
        driver.TruckTypes = [];
        for (var q = 0; q < truckTypes.length; q++) {
            for (var j = 0; j < selected.length; j++) {
                if (selected[j] === truckTypes[q].ID) {
                    tempTruckTypes.push(truckTypes[q]);
                    displayCapabilities.push(truckTypes[q].TruckCode);
                }
            }
        }

        for (var i = 0; i < driver.Capabilities.length; i++) displayCapabilities.push(driver.Capabilities[i]);
        console.log('displayCapabilities = ', displayCapabilities);
        updateDoc(driverRef, {TruckTypes: tempTruckTypes, displayCapabilities: displayCapabilities  }).then(() => {}).catch((error) => { console.log('error updating driver =', error); });
        onDriverUpdate({ ...driver, TruckTypes: tempTruckTypes, displayCapabilities: displayCapabilities });
    };

    const handlePhoneChange = (field, value, nextRef) => {
        const maxLength = field === 'Phone3' ? 4 : 3;
        if (value.length <= maxLength) {
            setPhoneObject((prev) => ({ ...prev, [field]: value }));
            if (value.length === maxLength && nextRef) {
                nextRef.current.focus();
            }
        }
    };

    const addSchedule = function () {
        if (!driver.Notes) driver.Notes = [];
        let tempNotes = [...driver.Notes];
        let Note = {};
        Note.ID = tempNotes.length;
        Note.Note = '';
        Note.noteType = 'Schedule';
        Note.Red = true;
        Note.Yellow = false;
        Note.EndDate = formatDate(homeDate, '/', 'MM/DD/YYYY');
        Note.Date = formatDate(homeDate, '/', 'MM/DD/YYYY');
        Note.StartDate = formatDate(homeDate, '/', 'MM/DD/YYYY');
        console.log('adding a note like this = ', Note);
        Note.createdBy = gearedUser.Email;

        if (driver.Type === 'Dedicated'){
            Note.Truck = {ID:driver.ID,Name:driver.Name, DriverName: driver.DriverName};
            for(var q=0; q<subhaulers.length; q++){
                if(driver.AccountID===subhaulers[q].ID){
                    let tempSubhaulers =[...subhaulers];
                    tempSubhaulers[q].NoteList.push(Note)
                    console.log('and the new notelist look like dis = ', tempSubhaulers[q].NoteList)
                    console.log('saving to acocunt = ', driver.AccountID);
                    let accountRef = doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/Accounts', driver.AccountID);
                    updateDoc(accountRef, { NoteList: tempSubhaulers[q].NoteList}).then(() => {}).catch((error) => {console.log('error updating acc =', error);  });
                }    
            }
        } else {
            tempNotes.push(Note);
            updateDriverField("Notes",tempNotes );
        }
    };

    const handlePhoneSave = () => {
        const updatedDriver = { ...driver, PhoneObject: phoneObject, Phone: phoneObject.Phone1 + phoneObject.Phone2 + phoneObject.Phone3 };
        onDriverUpdate(updatedDriver);
        setIsEditable(false);
    };

    const handleDispatchClick = async (selectedDispatch, freightBills) => {
        if(driver.Type!=='Subhauler'){
            onAssignDriver(driver, selectedDispatch, freightBills,{});
            setVisible(false);
        }
    };
    const handleAssignTrucks = (freightBills, selectedDispatch, truckAmount, tempSelectedTruckType)=>{
  
        let tempCapabilities = [];
        let TruckID=0;
        let trucks =[];

        if(tempSelectedTruckType.TruckCode)tempCapabilities.push(tempSelectedTruckType.TruckCode);
        tempCapabilities = tempCapabilities.concat(driver.Capabilities);
   
        console.log('driver.Capabilities ', driver.Capabilities);
        console.log('tempCapabilitie = ', tempCapabilities);
    
        if(driver.Trucks) trucks = [...driver.Trucks];
        for(let q=0; q<assignedTrucks.length; q++){
            if(assignedTrucks[q].SubandCapabilities===driver.Driver.ID+tempCapabilities) trucks = [...assignedTrucks[q].Trucks];
        }
        for(var a =0; a<trucks.length; a++) if(TruckID<=trucks[a].Priority)TruckID=trucks[a].Priority;
        for(var i=0; i<truckAmount; i++){
            let newTruck ={
                ID: TruckID.toString()+driver.ID+tempCapabilities,
                TruckType: tempSelectedTruckType,
                Dedicated:false,
                fullID: TruckID.toString()+driver.ID+tempCapabilities,
                SubandCapabilities:driver.Driver.ID+tempCapabilities,
                DriverID: driver.Driver.ID,
                Assigned:false,
                OnDispatch:false,
                DispatchAssigned:0,
                OrgName:driver.OrgName,
                DriverName:driver.DriverName,
                Phone: driver.Phone,
                tempCapabilities: tempCapabilities,
                displayCapabilities: tempCapabilities,
                Capabilities:tempCapabilities,
                Priority: TruckID + 1
            };
            console.log('we are pushign thsi truck = ', newTruck)
            TruckID++;
            onAssignDriver(driver, selectedDispatch, freightBills,newTruck);
       }
       setVisible(false);
    }
        
    const findObjectById = (objectList, Id) => {
        for (let i = 0; i < objectList.length; i++)
            if (objectList[i].ID === Id) return objectList[i];
    };

    const toggleEditMode = () => {
        if (isEditable) {
            handlePhoneSave();
        } else {
            setIsEditable(true);
        }
    };

    const panelHeaderTemplate = () => {
        return <div className="py-2 px-3"> </div>;
    };

    if (!driver || !driver.Type) {
        return null;
    }

    return (
        <Dialog header={driver.Type !== "Subhauler" ? "Driver Details" : "Profile"} visible={visible} style={{ width: '40vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} onHide={closeDriverPopUp}>
            <div className="mbsc-form-group" style={{margin:".5em"}}>
                {driver.Type === "Subhauler" || driver.Type === 'Dedicated' ? (
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon">Name:</span>
                        <InputText value={inputValues.DriverName} onChange={(e) => handleFieldChange('DriverName', e.target.value)} />
                    </div>
                ) : (
                    <div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">First Name:</span>
                            <InputText value={inputValues.FirstName} onChange={(e) => handleFieldChange('FirstName', e.target.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon" >Last Name:</span>
                            <InputText value={inputValues.LastName} onChange={(e) => handleFieldChange('LastName', e.target.value)} />
                        </div>
                    </div>
                )}
                <div className="p-inputgroup flex-1">
                    <span className="p-inputgroup-addon">Phone:</span>
                    <InputText maxLength={3} value={phoneObject.Phone1} onChange={(e) => handlePhoneChange('Phone1', e.target.value, inputRef2)} disabled={!isEditable} />-
                    <InputText ref={inputRef2} maxLength={3} value={phoneObject.Phone2} onChange={(e) => handlePhoneChange('Phone2', e.target.value, inputRef3)} disabled={!isEditable} />-
                    <InputText ref={inputRef3} maxLength={4} value={phoneObject.Phone3} onChange={(e) => handlePhoneChange('Phone3', e.target.value, null)} disabled={!isEditable} />
                    <Button startIcon="pencil" style={{ margin: "0" }} onClick={toggleEditMode}></Button>
                </div>
                <div className="p-inputgroup flex-1">
                    <span className="p-inputgroup-addon">Capabilities:</span>
                    <MultiSelect panelHeaderTemplate={panelHeaderTemplate} value={selectedCapabilities} onChange={(e) => handleCapabilitiesChange(e.value)} options={capabilities} optionLabel="Name"
                        placeholder="Capabilities" maxSelectedLabels={3} className="w-full md:w-20rem" />
                    <Button startIcon="tag" style={{ color: "blue", margin: "0" }}></Button>
                </div>
                <div className="p-inputgroup flex-1">
                    <span className="p-inputgroup-addon">Truck Type:</span>
                    <MultiSelect panelHeaderTemplate={panelHeaderTemplate} value={selectedTruckTypes} onChange={(e) => handleTruckTypesChange(e.value)} options={truckTypes} optionLabel="Name"
                        placeholder="Truck Types" maxSelectedLabels={3} className="w-full md:w-20rem" />
                    <Button startIcon="tag" style={{ color: "blue", margin: "0" }}></Button>
                </div>
                {driver.Type === "Subhauler" || driver.Type === 'Dedicated' ? (
                    <div className="p-inputgroup flex-1">
                      <span className="p-inputgroup-addon" >Truck:</span>
                      <InputText value={inputValues.Truck} onChange={(e) => handleFieldChange('Truck', e.target.value)} />
                    </div>
                    ):(                    
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon">Truck:</span>
                        <Dropdown value={selectedTruck} onChange={(e) => handleTruckChange(e.value)} options={filteredTrucks} optionLabel="Name"
                            placeholder="Select a Truck" className="w-full md:w-14rem" />
                        <Button startIcon="tag" style={{ color: "blue", margin: "0" }}></Button>
                    </div> )}
                    {driver.Type !== "Subhauler" && (
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon">Trailer:</span>
                        <Dropdown value={selectedTrailer} onChange={(e) => handleTrailerChange(e.value)} options={filteredTrailers} optionLabel="Name"
                            placeholder="Select a Trailer" className="w-full md:w-14rem" />
                        <Button startIcon="tag" style={{ color: "blue", margin: "0" }}></Button>
                    </div> )}

                <div className="p-inputgroup flex-1">
                    <span className="p-inputgroup-addon">Status:</span>
                    <Dropdown value={selectedStatus} onChange={(e) => setSelectedStatus(e.value)} options={statuses}
                        placeholder="Select a Status" className="w-full md:w-14rem" />
                </div>
            </div>

            <div className="mbsc-form-group-content" style={{margin:".25em"}}>
                <div className="mbsc-form-group-inset" style={{ fontSize: ".75em", margin:".25em" }}>
                    {driver.Type === 'Dedicated' || driver.Type === 'Driver' ? (
                        <div>
                            <div className="mbsc-row" style={{ width: "100%" }}>
                                <div className="mbsc-col-md-2 mbsc-col-4"><button id="addNoteButton" className="mbsc-ios mbsc-btn-primary mbsc-btn" type="button" onClick={addSchedule} >Add Schedule</button></div>
                            </div>
                            <div className="mbsc-row" style={{ height: "100%", width: "100%" }}>
                                <table style={{ marginBottom: "5px", width: "100%" }}>
                                    <thead>
                                        <tr className="mbsc-row" style={{ width: "100%", marginLeft: "1em" }}>
                                            <th style={{ width: "10%" }}>Delete</th>
                                            <th style={{ width: "15%" }}>Start Date</th>
                                            <th style={{ width: "15%" }}>End Date</th>
                                            <th style={{ width: "20%" }}>Note</th>
                                            <th style={{ width: "5%", background: "red" }}></th>
                                            <th style={{ width: "5%", background: "#ef6c00" }}></th>
                                            <th style={{ width: "30%" }}>Created By</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredNotes.map(({ note, originalIndex }) => (
                                            <NoteList key={originalIndex} note={note}  formatDate={formatDate} onDeleteNote={(deletedNote) => handleDeleteNote(originalIndex,deletedNote)}   onUpdateNote={(updatedNote) => handleUpdateNote(originalIndex, updatedNote)} />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>) : (<div></div>)}
                </div>
            </div>

       

            <div className="mbsc-form-group-title">
                <span className="font-weight-bold text-secondary" style={{ textTransform: "none" }}>Click Dispatch to Assign</span>
                <span className="font-weight-bold text-secondary" style={{ textTransform: "none" }}>Dispatches</span>
                <input className="login-input" placeholder="Search" style={{ padding: "1em", margin: "0px", fontSize: "1em", width: "80%" }} id="searchDispatchHomes" ng-model="searchTodayDispatches" ng-change="filterSearchDispatches()" type="text"></input>
            </div>
            <div className="mbsc-row" style={{ paddingLeft: ".5em", width: "100%" }}>
                {homeDispatches.filter(item => item.QueryDate === homeDate).map((item, index) => {
                    const originalIndex = homeDispatches.findIndex(dispatch => dispatch.ID === item.ID);
           

                    return (
                        <DispatchCard
                            key={item.ID}
                            dispatch={{ item }}
                            originalIndex={originalIndex} // Pass the original index
                            homeFreightBills={homeFreightBills} // Pass the filtered FreightBills
                            onClick={handleDispatchClick}
                            showDrivers={false}
                            showAssign={driver.Type==='Subhauler'}
                            assignTrucks={handleAssignTrucks}
                            driver={driver}
                        />
                    );
                })}
            </div>
        </Dialog>
    );
};

export default DispatchDriverPopUp;