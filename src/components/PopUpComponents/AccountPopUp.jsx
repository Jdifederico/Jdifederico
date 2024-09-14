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

import { UserAuth } from '../../context/AuthContext'
import { useGlobal } from '../../context/GlobalContext'

import ContactList from '../ListComponents/ContactList';
import DedicatedTruck from '../ListComponents/DedicatedTruck';
import ComplianceList from '../ListComponents/ComplianceList';
import NoteList from '../ListComponents/NoteList';




const AccountPopUp = (props) => {
    const [phoneObject, setPhoneObject] = useState({ Phone1: '', Phone2: '', Phone3: '' });
    const [officePhoneObject, setOfficePhoneObject] = useState({ Phone1: '', Phone2: '', Phone3: '' });
    const [inputValues, setInputValues] = useState({});
    const [selectedTruckTypes, setSelectedTruckTypes]=useState([]);
 
    const { gearedUser, addDocument, updateDocument, deleteDocument, compliances, truckTypes, capabilities, contacts, accounts, driverComplianceNames, outsideTrucks, trailers} = UserAuth();
    const { account, setAccount, accountVisible, setAccountVisible, showContactPopUp} = useGlobal();
    const statuses = [ {text :'Active',value: 'Active'},{text :'Inactive',value: 'Inactive'} ];
    const payFrequencies = [ {text :'Weekly',value: 'Weekly'},{text :'Bi-Weekly',value: 'Bi-Weekly'},{text :'Monthly',value: 'Monthly'},{text :'Semi-Monthly',value: 'Semi-Monthly'} ];
    const [activeTab, setActiveTab]= useState(0);
    const inputRef2 = useRef(null);
    const inputRef3 = useRef(null);
    const inputRef4 = useRef(null);
    const inputRef5 = useRef(null);
    
    const saveButton = inputValues.ID ? 'Save' : 'Add';

    const accountContacts  = account && contacts ? contacts.filter(contact => contact.Account.ID === account?.ID).map((contact, originalIndex) => ({ contact, originalIndex })) : [];
    const accountCompliances  = account.Driver && compliances ? compliances.filter(compliance => compliance.ParentID=== account.Driver.ID).map((compliance, originalIndex) => ({ compliance, originalIndex })) : [];
    const accountTrucks = account &&  outsideTrucks ?  outsideTrucks.map((outsideTruck, index) => ({outsideTruck, originalIndex: index })).filter(({ outsideTruck }) =>outsideTruck.AccountID === account.ID) : [];

    // Mapping to maintain original index
    const accountNotes = account?.NoteList ? account.NoteList.map((note, index) => ({ note, originalIndex: index })).filter(({ note }) => note.noteType !== 'Schedule') : [];
    const accountScheduleNotes = account?.NoteList ? account.NoteList.map((note, index) => ({ note, originalIndex: index })).filter(({ note }) => note.noteType === 'Schedule') : [];
 
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
    const handleOfficePhoneChange = (field, value, nextRef) => {
        const maxLength = field === 'Phone3' ? 4 : 3;
        if (value.length <= maxLength) {
            setOfficePhoneObject((prev) => ({ ...prev, [field]: value }));
            if (value.length === maxLength && nextRef) {
                nextRef.current.focus();
            }
        }
    };

    const handleTruckTypesChange = (selected) => {
        console.log('selected = ', selected);
        let displayCapabilities = [];
        let tempTruckTypes = [];
        setSelectedTruckTypes(selected);
        account.TruckTypes = [];
        for (var q = 0; q < truckTypes.length; q++) {
            for (var j = 0; j < selected.length; j++) {
                if (selected[j] === truckTypes[q].ID) {
                    tempTruckTypes.push( truckTypes[q]);
                    displayCapabilities.push(truckTypes[q].TruckCode);
                }
            }
        }
        for (var i = 0; i < account.Capabilities.length; i++) displayCapabilities.push(account.Capabilities[i]);
        console.log('displayCapabilities = ', displayCapabilities);
        setInputValues((prev) => ({ ...prev, TruckTypes: tempTruckTypes, displayCapabilities:displayCapabilities }));
    };

    const handleCapabilitiesChange = (selected) => {
        console.log('selected = ', selected);
        let displayCapabilities = [];
        for (var i = 0; i < account.TruckTypes.length; i++) displayCapabilities.push(account.TruckTypes[i].TruckCode);
        for (var j = 0; j < selected.length; j++) displayCapabilities.push(selected[j]);
        setInputValues((prev) => ({ ...prev, Capabilities: selected, displayCapabilities:displayCapabilities }));
    };

    const handleFieldChange = (fieldName, value) => {
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
      
    };
    const closeAccountPopUp = () => {
        setAccountVisible(false);
    };

    useEffect(() => {
        if (account && Object.keys(account).length > 0) {
            setInputValues({...account});
            setOfficePhoneObject({...account.OfficePhoneObject})
            setPhoneObject({...account.PhoneObject})
            console.log('account = ', account)
            let ids = account.TruckTypes.map(truckType => truckType.ID);
            setSelectedTruckTypes(ids);
        }
    }, [account]);

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
            ParentID:account.Driver.ID,
            Attachment:{},
        };
        console.log('aabout to run add Copmliance for ', Compliance) 
        addDocument(Compliance, 'Compliances');

    }

    
    const handleAddContact= (event)=>{
      
        let newContact = {
            ID: '',
            officeAccount:false,
            Account: {
                ID: account.ID,
                Name: inputValues.Name,
                OrgName:inputValues.Name
            },
            Name: '',
            FirstName: '',
            LastName: '',
            PhoneObject:{
                Phone1:'',
                Phone2:'',
                Phone3:'',
                Phone4:''
            },
            phoneOK:false,
            Phone: '',
            Email: '',
            Department: 'Foreman',
            Fax: '',
            createLogIn:false
        }
        console.log('aabout to run add Contact for ', newContact) 
        showContactPopUp(newContact);
        //addDocument(newContact, 'Contacts');
    }
    const handleDeleteContact = (index, contact)=>{
      deleteDocument(contact, 'Contacts')
    }
    const handleEditContact = (index, contact)=>{
        showContactPopUp(contact);
        console.log('cointact to edit = ', contact)
    }

    const panelHeaderTemplate = () => {
        return <div className="py-2 px-3"> </div>;
    };

    const handleAddNote = function (noteType) {
      //  if (!account.Notes) account.Notes = [];
        let updatedNotes = [...account.NoteList];
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
        console.log('account before add = ', account)
        updateDocument({ NoteList: updatedNotes }, account.ID, 'Accounts')
      
        setAccount((prev) => ({ ...prev, 'NoteList': updatedNotes}));

    };
    
    const handleDeleteNote = useCallback((index, note) => {
        const updatedNotes = [...account.NoteList];
        updatedNotes.splice(index,1);
        updateDocument({ NoteList: updatedNotes }, account.ID, 'Accounts')
       setAccount((prev) => ({ ...prev, 'NoteList': updatedNotes}));
       
    }, [account]);

    const handleUpdateNote = useCallback((index, note) => {
        const updatedNotes = [...account.NoteList];
        updatedNotes[index]=note;
        console.log('updateNoteds = ', updatedNotes);
        updateDocument({ NoteList: updatedNotes }, account.ID, 'Accounts')
        setAccount((prev) => ({ ...prev, 'NoteList': updatedNotes}));
    }, [account]);

    const handleAddTruck = ()=>{
        let newTruck={
            ID:'',
            AccountID: account.ID,
            TruckType:truckTypes[0],
            DriverID:account.Driver.ID,
            Dedicated:true,
            SubhaulerName:account.Name,
            DriverName:account.DriverName,
            Phone:account.Phone,
            Trailer:{ID:'',Name:'No Trailer'},
            Truck:'',
            TruckTypes:[],
            Capabilities:[],
            PhoneObject:account.PhoneObject,
            TrailerFee:account.TrailerFee,
            Priority:outsideTrucks.length+1,
            uid:account.Driver.uid,
            Status:'Active'
        }
        console.log('adding new truck look like dis = ', newTruck)

        addDocument(newTruck, 'OutsideTrucks');
      
    }
    const updateDriver =() =>{
        let updatedDriver ={
            ID:account.Driver.ID,
            LastName: inputValues.DriverName,
            Nickname:inputValues.DriverName,
            Name:inputValues.DriverName,
            Address:inputValues.Address,
            City:inputValues.City,
            State:inputValues. State,
            ZipCode:inputValues.ZipCode,
            PhoneObject:phoneObject,
            Email:inputValues.DriverEmail,
            Status:inputValues.Status,
            Subhauler:true,
            AccountID:account.ID,
            OrgName: inputValues.Name
        };
      /*  let updatedUser={
            ID: account.Driver.uid, 
            selectedOrgName: updatedDriver.OrgName, 
            Type:"Subhauler", 
            Email: updatedDriver.Email, 
            role: "Subhauler" 
        }*/
      //  updateDocument(updatedUser,account.Driver.uid, "users" );
        updateDocument(updatedDriver ,updatedDriver.ID, "Drivers" )
    }

    const checkAccount = () => {
        const accountName = inputValues.Name?.trim();
        const isSubhauler = inputValues.Subhauler;
    
        // Check 1: Account must have a name
        if (!accountName) {
            alert('Please enter an account name before saving.');
            return;
        }
    
        // Check 2: Account name must be unique (case-insensitive)
        const accountExists = accounts.some(
            (account) => account.Name.toLowerCase() === accountName.toLowerCase() && account.ID!==inputValues.ID
        );
        if (accountExists) {
            alert('An account with this name already exists.');
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
        if(saveButton==='Add') handleAddAccount();
        else if(saveButton==='Save')handleSaveAccount();
    
    }
    const handleAddAccount = async () => {
        let updatedObject = { ...inputValues };
        updatedObject.PhoneObject = { ...phoneObject };
        updatedObject.displayPhone = `${updatedObject.PhoneObject.Phone1}-${updatedObject.PhoneObject.Phone2}-${updatedObject.PhoneObject.Phone3}`;
    
        try {
            let tempID = await addDocument(updatedObject, "Accounts");
            setInputValues((prev) => ({ ...prev, ID: tempID }));
            updatedObject.ID=tempID;
            console.log('setting account = ', updatedObject)
          
            if(updatedObject.Subhauler)handleAddDriver(updatedObject);
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    }
    const handleAddDriver = async(updatedAccount) =>{
        let newDriver ={
            ID:'',
            LastName: inputValues.DriverName,
            Nickname:inputValues.DriverName,
            Name:inputValues.DriverName,
            Address:inputValues.Address,
            City:inputValues.City,
            State:inputValues. State,
            ZipCode:inputValues.ZipCode,
            PhoneObject:phoneObject,
            Email:inputValues.DriverEmail,
            Status:inputValues.Status,
            Subhauler:true,
            Truck: { ID: '',  Name: 'No Truck' },
            Trailer: { ID: '', Name: 'No Trailer' },
            AccountID:updatedAccount.ID,
            OrgName: inputValues.Name
        };
        try {
            let tempID = await addDocument(newDriver, "Drivers");
            setInputValues((prev) => ({ ...prev, Driver: {ID:tempID} })); 
            updatedAccount.Driver={ID:tempID};
            setAccount(updatedAccount);
            updateDocument({Driver:{ID:tempID}},updatedAccount.ID, "Accounts");
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    }
    const handleSaveAccount = () => {
     
        // If all checks pass, proceed to save the account
        let updatedObject = { ...inputValues };
        updatedObject.PhoneObject = { ...phoneObject };
        updatedObject.displayPhone = `${updatedObject.PhoneObject.Phone1}-${updatedObject.PhoneObject.Phone2}-${updatedObject.PhoneObject.Phone3}`;
    
        if (updatedObject.Subhauler) updateDriver();

        updateDocument(updatedObject, account.ID, "Accounts");
        closeAccountPopUp();
    };

    function formatDate(date, divider, format) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1), 
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2)  month = '0' + month;
        if (day.length < 2)  day = '0' + day;
    
        if(format==='YYYY/MM/DD')return [year, month, day].join(divider);
        else return [month, day,year].join(divider);
    }
    const footerContent = (
  
        <div style={{paddingTop:'1em', textAlign:'center'}}  className="flex align-items-center gap-2">
            <Button style= {{fontSize:'1.5em', width:'9em'}} label="Close" icon="pi pi-times"  onClick={() => setAccountVisible(false)} />
            <Button style= {{fontSize:'1.5em', width:'9em'}} label={saveButton} icon="pi pi-check" onClick={() => checkAccount()}  />
        </div>
    
    );
    return (
        <Dialog header="Account Details" visible={accountVisible} style={{ width: '95vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} footer={footerContent} onHide={closeAccountPopUp}>

        <TabView  style={{margin:"0"}} activeIndex={activeTab}  >
            <TabPanel header="Account" style={{marginTop:"0"}}  >   
                <div className="mbsc-row" >   
                    <div className="mbsc-col-4" style={{paddingRight:".5em"}}>   
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Name:</span>
                            <InputText value={inputValues.Name} onChange={(e) => handleFieldChange('Name', e.target.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Nickname:</span>
                            <InputText value={inputValues.Nickname} onChange={(e) => handleFieldChange('Nickname', e.target.value)} />
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

                        <div className="mbsc-row" >
                            <div className="p-inputgroup mbsc-col">
                                <span className="p-inputgroup-addon p-checkbox-label">Show Physical Address:</span>
                                <Checkbox style={{ width: '100%' }} onChange={e => setInputValues((prev) => ({ ...prev, ShowPhysical: e.checked}))}   checked={inputValues.ShowPhysical}  />
                            </div>   
                            <div className="p-inputgroup mbsc-col">
                                <span className="p-inputgroup-addon p-checkbox-label">Track Prelim:</span>
                                <Checkbox style={{ width: '100%' }} onChange={e => setInputValues((prev) => ({ ...prev, TrackPrelim: e.checked}))}  checked={inputValues.TrackPrelim}  />
                            </div>
                        </div>
                    </div>
                    <div className="mbsc-col-4 " style={{paddingLeft:".25em"}} > 
                        {inputValues.ShowPhysical && (
                        <Panel header='Physical Address' style={{width:"100%"}}>
                                <div className="p-inputgroup flex-1">
                                    <span className="p-inputgroup-addon">Address:</span>
                                    <InputText value={inputValues.PhysAddress} onChange={(e) => handleFieldChange('PhysAddress', e.target.value)} />
                                </div>
                                <div className="p-inputgroup flex-1">
                                    <span className="p-inputgroup-addon">City:</span>
                                    <InputText value={inputValues.PhysCity} onChange={(e) => handleFieldChange('PhysCity', e.target.value)} />
                                </div>
                                <div className="p-inputgroup flex-1">
                                    <span className="p-inputgroup-addon">State:</span>
                                    <InputText value={inputValues.PhysState} onChange={(e) => handleFieldChange('PhysState', e.target.value)} />
                                </div>
                                <div className="p-inputgroup flex-1">
                                    <span className="p-inputgroup-addon">Zip Code:</span>
                                    <InputNumber  useGrouping={false}  value={inputValues.PhysZipCode} onChange={(e) => handleFieldChange('PhysZipCode', e.value)} />
                                </div>
                            </Panel>
                            
                        )}
                        <Panel header='Stand By' style={{width:"100%"}}>
                            <div className="mbsc-row" style={{margin:"0"}}>
                                <div className="mbsc-col-6" style={{padding:".25em"}}>   
                                    <div className="p-inputgroup flex-1">
                                        <span className="p-inputgroup-addon">Load Allowed:</span>
                                        <InputNumber  useGrouping={false}  value={inputValues.standLA} onChange={(e) => handleFieldChange('standLA', e.value)} />
                                    </div>
                                    <div className="p-inputgroup flex-1">
                                        <span className="p-inputgroup-addon">Dump Allowed:</span>
                                        <InputNumber  useGrouping={false}  value={inputValues.standDA} onChange={(e) => handleFieldChange('standDA', e.value)} />
                                    </div>
                                </div>
                                <div className="mbsc-col-6" style={{padding:".25em"}}>   
                                    <div className="p-inputgroup flex-1">
                                        <span className="p-inputgroup-addon">Bill Rate:</span>
                                        <InputNumber  useGrouping={false}  value={inputValues.standBR} onChange={(e) => handleFieldChange('standBR', e.value)} />
                                    </div>
                                    <div className="p-inputgroup flex-1">
                                        <span className="p-inputgroup-addon">Pay Rate:</span>
                                        <InputNumber  useGrouping={false}  value={inputValues.standPR} onChange={(e) => handleFieldChange('standPR', e.value)} />
                                    </div>
                                </div>
                            </div>
                        </Panel>
                    </div>
                    <div className="mbsc-col-4" style={{paddingLeft:".25em"}}>  
                        <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Dispatch Phone:</span>
                                <InputText maxLength={3} value={phoneObject.Phone1} onChange={(e) => handlePhoneChange('Phone1', e.target.value, inputRef2)}  />-
                                <InputText ref={inputRef2} maxLength={3} value={phoneObject.Phone2} onChange={(e) => handlePhoneChange('Phone2', e.target.value, inputRef3)}  />-
                                <InputText ref={inputRef3} maxLength={4} value={phoneObject.Phone3} onChange={(e) => handlePhoneChange('Phone3', e.target.value, null)} />
                            </div>
                            <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Office Phone:</span>
                                <InputText maxLength={3} value={officePhoneObject.Phone1} onChange={(e) => handleOfficePhoneChange('Phone1', e.target.value, inputRef4)} />-
                                <InputText ref={inputRef4} maxLength={3} value={officePhoneObject.Phone2} onChange={(e) => handleOfficePhoneChange('Phone2', e.target.value, inputRef5)}  />-
                                <InputText ref={inputRef5} maxLength={4} value={officePhoneObject.Phone3} onChange={(e) => handleOfficePhoneChange('Phone3', e.target.value, null)}  />
                            </div>
                            <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">E-Mail:</span>
                                <InputText value={inputValues.Email} onChange={(e) => handleFieldChange('City', e.target.value)} />
                            </div>
                            <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Fax:</span>
                                <InputNumber  useGrouping={false}  value={inputValues.Fax} onChange={(e) => handleFieldChange('Fax', e.value)} />
                            </div>
                            <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Website:</span>
                                <InputText value={inputValues.Website} onChange={(e) => handleFieldChange('Website', e.target.value)} />
                            </div>
                            
                        <div className="mbsc-row" >
                            <div className="p-inputgroup mbsc-col-6">
                                <span className="p-inputgroup-addon p-checkbox-label" >Broker:</span>
                                <Checkbox style={{ width: '100%' }} onChange={e => setInputValues((prev) => ({ ...prev, Broker: e.checked}))}   checked={inputValues.Broker}  />
                            </div> 
                            {inputValues.Broker && (  
                            <div className="p-inputgroup mbsc-col">
                                <span className="p-inputgroup-addon">Broker Fee:</span>
                                <InputNumber  useGrouping={false}  value={inputValues.BrokerFee} onChange={(e) => handleFieldChange('BrokerFee', e.value)} />
                            </div>)}
                        </div>
                        <div className="mbsc-row" >
                            <div className="p-inputgroup mbsc-col">
                                <span className="p-inputgroup-addon p-checkbox-label" >Subhauler:</span>
                                <Checkbox style={{ width: '100%' }} onChange={e => setInputValues((prev) => ({ ...prev, Subhauler: e.checked, DriverName:inputValues?.Name}))}   checked={inputValues.Subhauler}  />
                            </div>   
                            <div className="p-inputgroup mbsc-col">
                                <span className="p-inputgroup-addon p-checkbox-label" >Contractor:</span>
                                <Checkbox style={{ width: '100%' }} onChange={e => setInputValues((prev) => ({ ...prev, Contractor: e.checked}))}  checked={inputValues.Contractor}  />
                            </div>
                        </div>
                        <div className="mbsc-row" >
                            <div className="p-inputgroup flex-1 mbsc-col">
                                <span className="p-inputgroup-addon">Status:</span>
                                <Dropdown value={inputValues.Status} onChange={(e) => handleFieldChange('Status', e.value)} options={statuses} optionLabel="text"
                                    placeholder="Select a Truck" className="w-full md:w-14rem" />
                            
                            </div>
                            <div className="p-inputgroup mbsc-col">
                                <span className="p-inputgroup-addon p-checkbox-label">Vendor:</span>
                                <Checkbox style={{ width: '100%' }} onChange={e => setInputValues((prev) => ({ ...prev, Vendor: e.checked}))}  checked={inputValues.Vendor}  />
                            </div>
                        </div>
                        
            

                    </div>
                </div>
                <div className="mbsc-row">
                    <div className="p-inputgroup mbsc-col-6 ">
                        <span className="p-inputgroup-addon " >Internal Notes</span> 
                        <Textarea  style={{border:".5px solid #d1d5db", borderBottomRightRadius:"6px", borderTopRightRadius:"6px"}} value={inputValues.Notes}  onChange={(e) => handleFieldChange('Notes', e.target.value)} />
                    </div>
                    <div className="p-inputgroup mbsc-col-6 ">
                        <span className="p-inputgroup-addon " >Note on Invoice</span> 
                        <Textarea  style={{border:".5px solid #d1d5db", borderBottomRightRadius:"6px", borderTopRightRadius:"6px"}} value={inputValues.InvoiceNotes}   onChange={(e) => handleFieldChange('InvoiceNotes', e.target.value)} />
                    </div>
                    
                </div>
                {inputValues.ID  && (<Panel header='Contacts' style={{width:"100%"}}>
                    <div className="mbsc-row" style={{ height: "100%", width: "100%" }}>
                    <button style={{ margin: '0', padding: '.5em', width:"10%" }}  onClick={(e) =>handleAddContact(e)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     > Add Contact  </button>
                        <table style={{ marginBottom: "5px", width: "100%" }}>
                            <thead>
                                <tr className="mbsc-row" style={{ width: "100%", marginLeft: "1em" }}>
                                    <th style={{ width: "10%" }}>Delete</th>
                                    <th style={{ width: "10%" }}>Edit</th>
                                    <th style={{ width: "15%" }}>Name</th>
                                    <th style={{ width: "15%" }}>Phone</th>
                                    <th style={{ width: "25%" }}>Email</th>
                                    <th style={{ width: "25%"}}>Department</th>
                            
                                </tr>
                            </thead>
                            <tbody>
                                {accountContacts.map(({ contact, originalIndex }) => (
                                    <ContactList key={originalIndex} contact={contact}  onDeleteContact={(deletedContact) => handleDeleteContact(originalIndex,deletedContact)}   onEditContact={(contact) => handleEditContact(originalIndex, contact)} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel >  )}  
            </TabPanel> 
            {inputValues.Subhauler && (
            <TabPanel header="Subhauler" style={{marginTop:"0"}}  > 
                <div className="mbsc-row" >   
                    <div className="mbsc-col-6" style={{paddingRight:".5em"}}>   
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Driver Name:</span>
                            <InputText value={inputValues.DriverName} onChange={(e) => handleFieldChange('DriverName', e.target.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Report Name:</span>
                            <InputText value={inputValues.ReportName} onChange={(e) => handleFieldChange('ReportName', e.target.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Equip #:</span>
                            <InputText value={inputValues.EquipNo} onChange={(e) => handleFieldChange('EquipNo', e.target.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">SSN/TaxID:</span>
                            <InputText value={inputValues.SSN} onChange={(e) => handleFieldChange('SSN', e.target.value)} />
                        </div>
                        <div className="p-inputgroup">
                                <span className="p-inputgroup-addon" style={{width:"65%", height:"2.2em"}}>Track 1099:</span>
                                <Checkbox style={{ width: '100%' }} onChange={e => setInputValues((prev) => ({ ...prev, Track1099: e.checked}))}   checked={inputValues.Track1099}  />
                            </div> 
                            <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Capabilities:</span>
                                <MultiSelect panelHeaderTemplate={panelHeaderTemplate} value={inputValues.Capabilities} onChange={(e) => handleCapabilitiesChange(e.value)} options={capabilities} optionLabel="Name"
                                    placeholder="Capabilities" maxSelectedLabels={3} className="w-full md:w-20rem" />
                                <button  className="mbsc-reset mbsc-font mbsc-button mbsc-windows mbsc-ltr mbsc-button-standard"  startIcon="tag" style={{ color: "blue", margin: "0" }}>
                                    <span className='mbsc-button-icon mbsc-ltr mbsc-button-icon-start mbsc-icon mbsc-windows mbsc-font-icon mbsc-icon-tag'></span>
                                </button>
                            </div>

                  
                    </div>
                    <div className="mbsc-col-6" >   
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Broker Fee %:</span>
                            <InputNumber  useGrouping={false}  value={inputValues.PaidBrokerFee} onChange={(e) => handleFieldChange('PaidBrokerFee', e.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Fuel %:</span>
                            <InputNumber  useGrouping={false}  value={inputValues.PaidBrokerFee} onChange={(e) => handleFieldChange('PaidFuelCharge', e.value)} />
                        </div>
                        <div className="p-inputgroup flex-1">
                                <span className="p-inputgroup-addon">Pay Frequency:</span>
                                <Dropdown value={inputValues.PayFrequency} onChange={(e) => handleFieldChange('PayFrequency', e.value)} options={payFrequencies} optionLabel="text"
                                    placeholder="Pay Frequency" className="w-full md:w-14rem" />
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">SSN/TaxID:</span>
                            <InputText value={inputValues.SSN} onChange={(e) => handleFieldChange('SSN', e.target.value)} />
                        </div>
                      
                        <div className="mbsc-row" >
                            <div className="p-inputgroup mbsc-col-6">
                                <span className="p-inputgroup-addon p-checkbox-label">Dedicated Subhauler:</span>
                                <Checkbox style={{ width: '100%' }} onChange={e => setInputValues((prev) => ({ ...prev, DedicatedSubhauler: e.checked}))}   checked={inputValues.DedicatedSubhauler}  />
                            </div>   
                            {inputValues.DedicatedSubhauler && (  
                            <div className="p-inputgroup mbsc-col">
                                <span className="p-inputgroup-addon">Priority:</span>
                                <InputNumber  useGrouping={false}  value={inputValues.Priority} onChange={(e) => handleFieldChange('Priority', e.value)} />
                            </div>)}
                        </div>
                        <div className="p-inputgroup flex-1">
                            <span className="p-inputgroup-addon">Truck Types:</span>
                            <MultiSelect panelHeaderTemplate={panelHeaderTemplate} value={selectedTruckTypes} onChange={(e) => handleTruckTypesChange(e.value)} options={truckTypes} optionLabel="Name"
                                placeholder="Truck Types" maxSelectedLabels={3} className="w-full md:w-20rem" />
                            <button  className="mbsc-reset mbsc-font mbsc-button mbsc-windows mbsc-ltr mbsc-button-standard"  startIcon="tag" style={{ color: "blue", margin: "0" }}>
                                <span className='mbsc-button-icon mbsc-ltr mbsc-button-icon-start mbsc-icon mbsc-windows mbsc-font-icon mbsc-icon-tag'></span>
                            </button>
                        </div>
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
                                {accountCompliances.map(({ compliance, originalIndex }) => (
                                    <ComplianceList key={originalIndex} complianceNames={driverComplianceNames} compliance={compliance} formatDate={formatDate} gearedUser={gearedUser} deleteDocument={deleteDocument}  />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Panel > )}
            </TabPanel>    
            )}  
            
            {inputValues.Subhauler && inputValues.DedicatedSubhauler && inputValues.ID && (
                <TabPanel header="Trucks" style={{marginTop:"0"}}  > 
                    <div className="mbsc-row" style={{ width: "100%" }}>
                        <div className="mbsc-col-md-2 mbsc-col-4"><button id="addNoteButton" className="mbsc-ios mbsc-btn-primary mbsc-btn" type="button"  onClick={(e) =>handleAddTruck()}    >Add Truck</button></div>
                    </div>
                    <div className="mbsc-row" style={{ height: "100%", width: "100%" }}>
                        <table style={{ marginBottom: "5px", width: "100%" }}>
                            <thead>
                                <tr className="mbsc-row" style={{ width: "100%", marginLeft: "1em" }}>
                                    <th style={{ width: "10%" }}>Delete</th>
                                    <th style={{ width: "15%" }}>Truck Types</th>
                                    <th style={{ width: "15%" }}>Capabilities</th>
                                    <th style={{ width: "10%" }}>Driver Name</th>
                                    <th style={{ width: "10%" }}>Truck</th>
                                    <th style={{ width: "10%"  }}> Trailer</th>
                                    <th style={{ width: "5%"}}>Trailer Fee</th>
                                    <th style={{ width: "15%" }}>Phone Number</th>
                                    <th style={{ width: "10%" }}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accountTrucks.map(({ outsideTruck, originalIndex }) => (
                                    <DedicatedTruck key={originalIndex} outsideTruck={outsideTruck} capabilities={capabilities} truckTypes={truckTypes} gearedUser={gearedUser} trailers={trailers} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabPanel>    
            )}   
            {inputValues.Subhauler && inputValues.ID &&(
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
                                    <th style={{ width: "15%" }}>Truck</th>
                                    <th style={{ width: "15%" }}>Note</th>
                                 
                                    <th style={{ width: "5%", background: "red" }}></th>
                                    <th style={{ width: "5%", background: "#ef6c00" }}></th>
                                    <th style={{ width: "20%" }}>Created By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accountScheduleNotes.map(({ note, originalIndex }) => (
                                    <NoteList key={originalIndex} note={note} formatDate={formatDate} onDeleteNote={(deletedNote) => handleDeleteNote(originalIndex,deletedNote)}  truckList={accountTrucks} onUpdateNote={(updatedNote) => handleUpdateNote(originalIndex, updatedNote)}   />
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
                                {accountNotes.map(({ note, originalIndex }) => (
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

export default AccountPopUp;