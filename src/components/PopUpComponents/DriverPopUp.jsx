import React,  {useState, useEffect, useRef, useCallback} from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber} from 'primereact/inputnumber';
import { Panel } from 'primereact/panel';
import { TabView, TabPanel } from 'primereact/tabview';
import {Textarea} from '@mobiscroll/react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';

import { UserAuth } from '../../context/AuthContext'
import { useGlobal } from '../../context/GlobalContext'


import NoteList from '../ListComponents/NoteList';
import ComplianceList from '../ListComponents/ComplianceList';



const DriverPopUp = (props) => {
    const [phoneObject, setPhoneObject] = useState({ Phone1: '', Phone2: '', Phone3: '' });
    const [inputValues, setInputValues] = useState({});
    const [selectedTruckTypes, setSelectedTruckTypes]=useState([]);
    const [selectedTrailer, setSelectedTrailer] = useState(null);
    const [selectedTruck, setSelectedTruck] = useState(null);

    const { gearedUser, addDocument, updateDocument, deleteDocument, compliances, trucks, trailers, truckTypes, drivers, capabilities, driverComplianceNames, outsideTrucks} = UserAuth();
    const { driver, setDriver, driverVisible, setDriverVisible,  formatDate} = useGlobal();
    const statuses = [ {text :'Active',value: 'Active'},{text :'Inactive',value: 'Inactive'}, {text:'Terminated', value:'Terminated'} ];
    const payTypes = [{text :'Hour',value: 'Hour'},{text :'Percent',value: 'Percent'}, ]
    const federalStatuses = [ {text :'Married',value: 'Married'},{text :'Single',value: 'Single'}, {text:'HH', value:'HH'}, {text:'Exempt', value:'Exempt'}  ];
    const payFrequencies = [ {text :'Weekly',value: 'Weekly'},{text :'Bi-Weekly',value: 'Bi-Weekly'},{text :'Monthly',value: 'Monthly'},{text :'Semi-Monthly',value: 'Semi-Monthly'} ];

    const [activeTab, setActiveTab]= useState(0);
   
    const inputRef2 = useRef(null);
    const inputRef3 = useRef(null);

    
    const saveButton = inputValues.ID ? 'Save' : 'Add';


    const driverCompliances  = driver.Driver && compliances ? compliances.filter(compliance => compliance.ParentID=== driver.Driver.ID).map((compliance, originalIndex) => ({ compliance, originalIndex })) : [];
    const driverTrucks = driver &&  outsideTrucks ?  outsideTrucks.map((outsideTruck, index) => ({outsideTruck, originalIndex: index })).filter(({ outsideTruck }) =>outsideTruck.DriverID === driver.ID) : [];

    // Mapping to maintain original index
    const driverNotes = driver?.Notes ? driver.Notes.map((note, index) => ({ note, originalIndex: index })).filter(({ note }) => note.noteType !== 'Schedule') : [];
    const driverScheduleNotes = driver?.Notes ? driver.Notes.map((note, index) => ({ note, originalIndex: index })).filter(({ note }) => note.noteType === 'Schedule') : [];
 
    const filteredTrailers = trailers.filter(trailer => trailer.Name !== 'No Trailer');
    const filteredTrucks = trucks.filter(truck => truck.Name !== 'No Truck');
    const handlePhoneChange = (field, value, nextRef) => {
        const maxLength = field === 'Phone3' ? 4 : 3;
        
        if (value.length <= maxLength) {
            const updatedPhoneObject = { ...phoneObject, [field]: value };
            
            // Update the phone object state
            setPhoneObject(updatedPhoneObject);
    
            // Focus on the next field if the current one is fully filled
            if (value.length === maxLength && nextRef) {
                nextRef.current.focus();
            }
    
            // Check if all phone fields are filled to their max lengths
            const phoneOK = updatedPhoneObject.Phone1.length === 3 &&
                            updatedPhoneObject.Phone2.length === 3 &&
                            updatedPhoneObject.Phone3.length === 4;
    
            // Update the inputValues state with the phoneOK status
            setInputValues((prev) => ({ ...prev, phoneOK }));
        }
    };



    const handleCapabilitiesChange = (selected) => {
        console.log('selected = ', selected);
        let displayCapabilities = [];
        for (var i = 0; i < driver.TruckTypes.length; i++) displayCapabilities.push(driver.TruckTypes[i].TruckCode);
        for (var j = 0; j < selected.length; j++) displayCapabilities.push(selected[j]);
        setInputValues((prev) => ({ ...prev, Capabilities: selected, displayCapabilities:displayCapabilities }));
    };

    const handleFieldChange = (fieldName, value) => {
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
      
    };
    const closeDriverPopUp = () => {
        setDriverVisible(false);
    };
    const findObjectById = (objectList, Id) => {
        for (let i = 0; i < objectList.length; i++)
            if (objectList[i].ID === Id) return objectList[i];
    };
    
    useEffect(() => {
        if (driver && Object.keys(driver).length > 0) {
            let tempInputValues={...driver};
            tempInputValues.BirthDateValue=new Date(tempInputValues.BirthDate);
            tempInputValues.HiredDateValue=new Date(tempInputValues.HiredDate);
            tempInputValues.TerminatedDateValue=new Date(tempInputValues.TerminatedDate);
            setInputValues( tempInputValues);

            if (driver?.PhoneObject) setPhoneObject({ ...driver.PhoneObject });
     
            if (driver.Truck) setSelectedTruck(driver.Truck.ID);
            if (driver.Trailer) setSelectedTrailer(driver.Trailer.ID);
            let ids = driver.TruckTypes ? driver.TruckTypes.map(truckType => truckType.ID) : [];
            console.log('driver = ', driver)
            setSelectedTruckTypes(ids);

        }
    }, [driver]);
    const handleTruckTypesChange = (selected) => {
        console.log('selected = ', selected);
        let displayCapabilities = [];
        let tempTruckTypes = [];
        setSelectedTruckTypes(selected);
        driver.TruckTypes = [];
        for (var q = 0; q < truckTypes.length; q++) {
            for (var j = 0; j < selected.length; j++) {
                if (selected[j] === truckTypes[q].ID) {
                    tempTruckTypes.push( truckTypes[q]);
                    displayCapabilities.push(truckTypes[q].TruckCode);
                }
            }
        }
        for (var i = 0; i < driver.Capabilities.length; i++) displayCapabilities.push(driver.Capabilities[i]);
        console.log('displayCapabilities = ', displayCapabilities);
        setInputValues((prev) => ({ ...prev, TruckTypes: tempTruckTypes, displayCapabilities:displayCapabilities }));
    };

    const handleTrailerChange = (trailerID) => {
        console.log('trailerID= ', trailerID);
        let newTrailer = findObjectById(trailers, trailerID);
       handleFieldChange('Trailer', newTrailer)
    };

    const handleTruckChange = (truckID) => {
        console.log('truckID= ', truckID);
        let newTruck = findObjectById(trucks, truckID);
        handleFieldChange('Truck', newTruck)
  
    };

    const handleAddCompliance = (event)=>{
  
        let Compliance = {
            ID:'',
            Name:'DIR',
            tempName:{Name:'DIR'},
            Info:'',
            IssueDate: formatDate(new Date(), '/', 'MM/DD/YYYY'),
            ExpDate: formatDate(new Date(), '/', 'MM/DD/YYYY'),
            Type:'Driver',
            Track:false,
            ParentID:driver.ID,
            Attachment:{},
        };
        console.log('aabout to run add Copmliance for ', Compliance) 
        addDocument(Compliance, 'Compliances');

    }



    const panelHeaderTemplate = () => {
        return <div className="py-2 px-3"> </div>;
    };
    const handleDateChange = ( fieldName, value) => {
        let formattedDate= formatDate(value, '/', 'MM/DD/YYYY');
        console.log('formattedDate = ', formattedDate)
        
        setInputValues((prev) => ({ ...prev,[fieldName]: formattedDate, [fieldName+'Value']: value }));
       
    };

    const handleAddNote = function (noteType) {
      //  if (!driver.Notes) driver.Notes = [];
        let updatedNotes = [...driver.NoteList];
        let Note = {};
        Note.ID =updatedNotes.length;
        Note.Note = '';
        Note.noteType = noteType;
        Note.Red = true;
        Note.Yellow = false;
        Note.EndDate = formatDate(new Date(), '/', 'MM/DD/YYYY');
        Note.Date = formatDate(new Date(), '/', 'MM/DD/YYYY');
        Note.StartDate = formatDate(new Date(), '/', 'MM/DD/YYYY');
        Note.createdBy = gearedUser.Email;
        Note.Truck = {ID:'',DriverName:'No Truck'};
        updatedNotes.push(Note);
        console.log('driver before add = ', driver)
        updateDocument({ NoteList: updatedNotes }, driver.ID, 'Drivers')
      
        setDriver((prev) => ({ ...prev, 'NoteList': updatedNotes}));

    };
    
    const handleDeleteNote = useCallback((index, note) => {
        const updatedNotes = [...driver.NoteList];
        updatedNotes.splice(index,1);
        updateDocument({ NoteList: updatedNotes }, driver.ID, 'Drivers')
        setDriver((prev) => ({ ...prev, 'NoteList': updatedNotes}));
       
    }, [driver]);

    const handleUpdateNote = useCallback((index, note) => {
        const updatedNotes = [...driver.NoteList];
        updatedNotes[index]=note;
        console.log('updateNoteds = ', updatedNotes);
        updateDocument({ NoteList: updatedNotes }, driver.ID, 'Drivers')
        setDriver((prev) => ({ ...prev, 'NoteList': updatedNotes}));
    }, [driver]);


    const checkDriver = () => {
        const driverName = inputValues.Name?.trim();
        const isSubhauler = inputValues.Subhauler;
    
        // Check 1: Driver must have a name
        if (!driverName) {
            alert('Please enter an driver name before saving.');
            return;
        }
    
        // Check 2: Driver name must be unique (case-insensitive)
        const driverExists = drivers.some(
            (driver) => driver.Name.toLowerCase() === driverName.toLowerCase() && driver.ID!==inputValues.ID
        );
        if (driverExists) {
            alert('An driver with this name already exists.');
            return;
        }
    
        // Check 3: Subhauler must have a Driver Name and valid Phone Number
        if (isSubhauler) {
            const driverName = inputValues.DriverName?.trim();
            const phoneOK = inputValues.phoneOK;
    
            if (!driverName || !phoneOK) {
                alert('Please enter a Driver Name and Phone Number before saving a Subhauler.');
                return;
            }
        }
        if(saveButton==='Add') handleAddDriver();
        else if(saveButton==='Save')handleSaveDriver();
    
    }
    const handleAddDriver = async () => {
        let updatedObject = { ...inputValues };
        updatedObject.PhoneObject = { ...phoneObject };
        updatedObject.displayPhone = `${updatedObject.PhoneObject.Phone1}-${updatedObject.PhoneObject.Phone2}-${updatedObject.PhoneObject.Phone3}`;
    
        try {
            let tempID = await addDocument(updatedObject, "Drivers");
            setInputValues((prev) => ({ ...prev, ID: tempID }));
            updatedObject.ID=tempID;
            console.log('setting driver = ', updatedObject)
          
            if(updatedObject.Subhauler)handleAddDriver(updatedObject);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    }
 
    const handleSaveDriver = () => {
     
        // If all checks pass, proceed to save the driver
        let updatedObject = { ...inputValues };
        updatedObject.PhoneObject = { ...phoneObject };
        updatedObject.displayPhone = `${updatedObject.PhoneObject.Phone1}-${updatedObject.PhoneObject.Phone2}-${updatedObject.PhoneObject.Phone3}`;
   
        updateDocument(updatedObject, driver.ID, "Drivers");
        closeDriverPopUp();
    };


    const footerContent = (
  
        <div style={{paddingTop:'1em', textAlign:'center'}}  className="flex align-items-center gap-2">
            <Button style= {{fontSize:'1.5em', width:'9em'}} label="Close" icon="pi pi-times"  onClick={() => setDriverVisible(false)} />
            <Button style= {{fontSize:'1.5em', width:'9em'}} label={saveButton} icon="pi pi-check" onClick={() => checkDriver()}  />
        </div>
    
    );
    return (
        <Dialog header="Driver Details" visible={driverVisible} style={{ width: '95vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} footer={footerContent} onHide={closeDriverPopUp}>

        <TabView  style={{margin:"0"}} activeIndex={activeTab}  >
            <TabPanel header="Driver" style={{marginTop:"0"}}  >   
                <div className="mbsc-row" >   
                    <div className="mbsc-col-4" style={{paddingRight:".5em"}}>   
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Name:</span>
                            <InputText value={inputValues.Name} onChange={(e) => handleFieldChange('Name', e.target.value)} />
                        </div>
                 
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Email:</span>
                            <InputText value={inputValues.Email} onChange={(e) => handleFieldChange('Email', e.target.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Address:</span>
                            <InputText value={inputValues.Address} onChange={(e) => handleFieldChange('Address', e.target.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">City:</span>
                            <InputText value={inputValues.City} onChange={(e) => handleFieldChange('City', e.target.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">State:</span>
                            <InputText value={inputValues.State} onChange={(e) => handleFieldChange('State', e.target.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Zip Code:</span>
                            <InputNumber  useGrouping={false}  value={inputValues.ZipCode} onChange={(e) => handleFieldChange('ZipCode', e.value)} />
                        </div>

                    
                    </div>
                    <div className="mbsc-col-4 " style={{paddingLeft:".25em"}} > 
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Phone:</span>
                            <InputText maxLength={3} value={phoneObject.Phone1} onChange={(e) => handlePhoneChange('Phone1', e.target.value, inputRef2)}  />-
                            <InputText ref={inputRef2} maxLength={3} value={phoneObject.Phone2} onChange={(e) => handlePhoneChange('Phone2', e.target.value, inputRef3)}  />-
                            <InputText ref={inputRef3} maxLength={4} value={phoneObject.Phone3} onChange={(e) => handlePhoneChange('Phone3', e.target.value, null)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Truck Types:</span>
                            <MultiSelect panelHeaderTemplate={panelHeaderTemplate} value={selectedTruckTypes} onChange={(e) => handleTruckTypesChange(e.value)} options={truckTypes} optionLabel="Name"
                                placeholder="Truck Types" maxSelectedLabels={3} className="w-full md:w-20rem" />
                            <Button startIcon="tag" style={{ color: "blue", margin: "0" }}></Button>
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Truck:</span>
                            <Dropdown value={selectedTruck} onChange={(e) => handleTruckChange(e.value)} options={filteredTrucks} optionLabel="Name"
                                placeholder="Select a Truck" className="w-full md:w-14rem" />
                            <Button startIcon="tag" style={{ color: "blue", margin: "0" }}></Button>
                        </div> 
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Trailer:</span>
                            <Dropdown value={selectedTrailer} onChange={(e) => handleTrailerChange(e.value)} options={filteredTrailers} optionLabel="Name"
                                placeholder="Select a Trailer" className="w-full md:w-14rem" />
                            <Button startIcon="tag" style={{ color: "blue", margin: "0" }}></Button>
                        </div>      
                        <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Capabilities:</span>
                                <MultiSelect panelHeaderTemplate={panelHeaderTemplate} value={inputValues.Capabilities} onChange={(e) => handleCapabilitiesChange(e.value)} options={capabilities} optionLabel="Name"
                                    placeholder="Capabilities" maxSelectedLabels={3} className="w-full md:w-20rem" />
                                <button  className="mbsc-reset mbsc-font mbsc-button mbsc-windows mbsc-ltr mbsc-button-standard"  startIcon="tag" style={{ color: "blue", margin: "0" }}>
                                    <span className='mbsc-button-icon mbsc-ltr mbsc-button-icon-start mbsc-icon mbsc-windows mbsc-font-icon mbsc-icon-tag'></span>
                                </button>
                            </div>
                        <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">License #:</span>
                                <InputText value={inputValues.DriversLicense} onChange={(e) => handleFieldChange('DriversLicense', e.target.value)} />
                            </div>
                            <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Hired Date:</span>
                                 <Calendar value={inputValues.HiredDateValue} onChange={(e) => handleDateChange('HiredDate',e.value)} />
                            </div> 
                            <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Date of Birth:</span>
                                 <Calendar value={inputValues.BirthDateValue} onChange={(e) => handleDateChange('BirthDate',e.value)} />
                            </div> 
                    </div>
                    <div className="mbsc-col-4" style={{paddingLeft:".25em"}}>  
                        
                    <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Pay Frequency:</span>
                                <Dropdown value={inputValues.PayFrequency} onChange={(e) => handleFieldChange('PayFrequency', e.value)} options={payFrequencies} optionLabel="text"
                                    placeholder="Pay Frequency" className="w-full md:w-14rem" />
                        </div>
                        <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Pay Type:</span>
                                <Dropdown value={inputValues.PayType} onChange={(e) => handleFieldChange('PayType', e.value)} options={payTypes} optionLabel="text"
                                    placeholder="Pay Type" className="w-full md:w-14rem" />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Pay Rate:</span>
                            <InputNumber  useGrouping={false}  value={inputValues.PayRate} onChange={(e) => handleFieldChange('PayRate', e.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Travel Time Rate:</span>
                            <InputNumber  useGrouping={false}  value={inputValues.TravelRate} onChange={(e) => handleFieldChange('TravelRate', e.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">SSN/Tax ID:</span>
                            <InputNumber  useGrouping={false}  value={inputValues.SSN} onChange={(e) => handleFieldChange('SSN', e.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Dependents:</span>
                            <InputNumber  useGrouping={false}  value={inputValues.Dependents} onChange={(e) => handleFieldChange('Dependents', e.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Federal Filing Status:</span>
                                <Dropdown value={inputValues.FederalStatus} onChange={(e) => handleFieldChange('FederalStatus', e.value)} options={federalStatuses} optionLabel="text"
                                    placeholder="Pay Type" className="w-full md:w-14rem" />
                        </div>
                        <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Pay Type:</span>
                                <Dropdown value={inputValues.Status} onChange={(e) => handleFieldChange('Status', e.value)} options={statuses} optionLabel="text"
                                    placeholder="Pay Type" className="w-full md:w-14rem" />
                        </div>
                        {inputValues.Status==='Terminated' && (<div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Terminated Date:</span>
                                 <Calendar value={inputValues.TerminatedDateValue} onChange={(e) => handleDateChange('TerminatedDate',e.value)} />
                            </div> )}
            

                    </div>
                </div>
                <div className="mbsc-row">
                    <div className="p-inputgroup mbsc-col-6 ">
                        <span className="p-inputgroup-addon " >Internal Notes</span> 
                        <Textarea  style={{border:".5px solid #d1d5db", borderBottomRightRadius:"6px", borderTopRightRadius:"6px"}} value={inputValues.Note}  onChange={(e) => handleFieldChange('Notes', e.target.value)} />
                    </div>
                  
                    
                </div>
                {inputValues.ID  && (<Panel header='Compliances' style={{width:"100%"}}>
                    <button style={{ margin: '0', padding: '.5em', width:"10%" }}  onClick={(e) =>handleAddCompliance(e)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     > Add Compliance  </button>
                    <div className="mbsc-row" style={{ height: "100%", width: "100%" }}>
                        <table style={{ marginBottom: "5px", width: "100%" }}>
                            <thead>
                                <tr className="mbsc-row" style={{ width: "100%", marginLeft: "1em" }}>
                                    <th style={{ width: "10%" }}>Delete</th>
                                    <th style={{ width: "20%" }}>Name</th>
                                    <th style={{ width: "15%" }}>Info</th>
                                    <th style={{ width: "10%" }}>Issue Date</th>
                                    <th style={{ width: "10%" }}>Expiration Date</th>
                                    <th style={{ width: "5%"}}>Track</th>
                                    <th style={{ width: "20%"}}>Download</th>
                                    <th style={{ width: "10%"}}>Upload</th>
                            
                                </tr>
                            </thead>
                            <tbody>
                                {driverCompliances.map(({ compliance, originalIndex }) => (
                                    <ComplianceList key={originalIndex} complianceNames={driverComplianceNames} compliance={compliance} formatDate={formatDate} gearedUser={gearedUser} deleteDocument={deleteDocument}  />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel > )}
            </TabPanel> 
     
        
            {inputValues.ID &&(
                <TabPanel header="Schedule" style={{marginTop:"0"}}  > 
                    <div className="mbsc-row" style={{ width: "100%" }}>
                        <div className="mbsc-col-md-2 mbsc-col-4"><button id="addNoteButton" className="mbsc-ios mbsc-btn-primary mbsc-btn" type="button"  onClick={(e) =>handleAddNote('Schedule')}    >Add Schedule</button></div>
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
                                {driverScheduleNotes.map(({ note, originalIndex }) => (
                                    <NoteList key={originalIndex} note={note} formatDate={formatDate} onDeleteNote={(deletedNote) => handleDeleteNote(originalIndex,deletedNote)}   onUpdateNote={(updatedNote) => handleUpdateNote(originalIndex, updatedNote)}   />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabPanel>    
            )}    
            
            {inputValues.ID && ( <TabPanel header="Notes" style={{marginTop:"0"}}  > 
                <div className="mbsc-row" style={{ width: "100%" }}>
                        <div className="mbsc-col-md-2 mbsc-col-4"><button id="addNoteButton" className="mbsc-ios mbsc-btn-primary mbsc-btn" type="button"  onClick={(e) =>handleAddNote('Notes')}   >Add Note</button></div>
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
                                {driverNotes.map(({ note, originalIndex }) => (
                                    <NoteList key={originalIndex} note={note} formatDate={formatDate} onDeleteNote={(deletedNote) => handleDeleteNote(originalIndex,deletedNote)}   onUpdateNote={(updatedNote) => handleUpdateNote(originalIndex, updatedNote)} />
                                ))}
                            </tbody>
                        </table>
                    </div>
            </TabPanel>   )} 
            
        </TabView> 
     
                
        </Dialog>
    );
};

export default DriverPopUp;