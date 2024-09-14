
import React, {useEffect, useState} from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';

import { useGlobal } from '../../context/GlobalContext'
import { UserAuth } from '../../context/AuthContext'

import ComplianceList from '../ListComponents/ComplianceList';
const TruckPopUp = (props) => {
    const { truckVisible, setTruckVisible, truck, setTruck, formatDate} = useGlobal();
    const { updateDocument, addDocument, trucks, truckComplianceNames, compliances, deleteDocument, gearedUser} = UserAuth();
    const [inputValues, setInputValues] = useState({});
    const statuses = [ {text :'Active',value: 'Active'},{text :'Inactive',value: 'Inactive'} ];
    const saveButton = inputValues.ID ? 'Save' : 'Add';

    const truckCompliances  = truck?.ID && compliances ? compliances.filter(compliance => compliance.ParentID=== truck.ID).map((compliance, originalIndex) => ({ compliance, originalIndex })) : [];
   
    const closeTruckPopUp = () => {
        setTruckVisible(false);
    };
  

    useEffect(() => {
        if (truck && Object.keys(truck).length > 0) {
           
            setInputValues({
                Name:truck.Name,
                ID:truck.ID,
                LicensePlate:truck.LicensePlate ? truck.LicensePlate : '',
                VIN:truck.VIN ? truck.VIN : '',
                Make:truck.Make ? truck.Make : '',
                Model:truck.Model ? truck.Model : '',
                Year:truck.Year ? truck.Year : '',
                Status:truck.Status ?truck.Status : 'Active'
            });
           
        }
    }, [truck]);

     const handleFieldChange = (fieldName, value) => {
        console.log('fieldname = ', fieldName);
        console.log('and the value = ', value)
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
      
    };

    const handleSaveTruck = async()=>{


        const truckName = inputValues.Name?.trim();

        if (!truckName) {
            alert('Please enter a name before saving.');
            return;
        }
        const truckExists = trucks.some(
            (truck) => truck.Name.toLowerCase() === truckName.toLowerCase() && truck.ID!==inputValues.ID
        );

        if (truckExists) {
            alert('An truck with this name already exists.');
            return;
        }

        if(truck.ID){
            updateDocument(inputValues, truck.ID, 'Trucks');
            closeTruckPopUp();
        } 
        else {
            try {
                let tempID = await  addDocument(inputValues,  'Trucks');
                setInputValues((prev) => ({ ...prev, ID: tempID }));
                let updatedTruck = inputValues;
                updatedTruck.ID=tempID;
                setTruck(updatedTruck);
            } catch (error) {
                console.error("Error adding document: ", error);
            }
        }
        
      
    
    }
    const handleAddCompliance = (event)=>{
  
        let Compliance = {
            ID:'',
            Name:'DIR',
            tempName:{Name:'DIR'},
            Info:'',
            IssueDate: formatDate(new Date(), '/', 'MM/DD/YYYY'),
            ExpDate: formatDate(new Date(), '/', 'MM/DD/YYYY'),
            Type:'Truck',
            Track:false,
            ParentID:truck.ID,
            Attachment:{},
        };
        console.log('aabout to run add Copmliance for ', Compliance) 
        addDocument(Compliance, 'Compliances');

    }
    const footerContent = (
  
        <div style={{paddingTop:'1em', textAlign:'center'}}  className="flex align-items-center gap-2">
                <Button style= {{fontSize:'1.5em', width:'9em'}} label="Close" icon="pi pi-times"  onClick={() => setTruckVisible(false)} />
                <Button style= {{fontSize:'1.5em', width:'9em'}} label={saveButton} icon="pi pi-check" onClick={() => handleSaveTruck()}  />
     
        </div>
    
    );
return(
    <Dialog header="Truck Details" visible={truckVisible} style={{ width: '55vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} footer={footerContent} onHide={closeTruckPopUp}>
        < div className="mbsc-grid" >
            < div className="mbsc-row" >
                <div className="mbsc-col-lg-6 mbsc-col-12" >
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon"> Name:</span>
                        <InputText value={inputValues.Name} onChange={(e) => handleFieldChange('Name', e.target.value)} />
                    </div>
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon">License Plate:</span>
                        <InputText value={inputValues.LicensePlate} onChange={(e) => handleFieldChange('LicensePlate', e.target.value)} />
                    </div>
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon">VIN:</span>
                        <InputText value={inputValues.VIN} onChange={(e) => handleFieldChange('VIN', e.target.value)} />
                    </div>
                </div>
                <div className="mbsc-col-lg-6 mbsc-col-12" >
                <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon">Make:</span>
                        <InputText value={inputValues.Make} onChange={(e) => handleFieldChange('Make', e.target.value)} />
                    </div>
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon">Model:</span>
                        <InputText value={inputValues.Model} onChange={(e) => handleFieldChange('Model', e.target.value)} />
                    </div>
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon">Year:</span>
                        <InputText value={inputValues.Year} onChange={(e) => handleFieldChange('Year', e.target.value)} />
                    </div>
                    <div className="p-inputgroup flex-1">
                        <span className="p-inputgroup-addon">Status:</span>
                        <Dropdown value={inputValues.Status} onChange={(e) => handleFieldChange('Status', e.value)} options={statuses} optionLabel="text"
                            placeholder="Select a Truck" className="w-full md:w-14rem" />
                    </div>
                </div>
            
            </div>
            {inputValues.ID  && (<Panel header='Compliances' style={{width:"100%"}}>
                    <button style={{ margin: '0', padding: '.5em', width:"15%" }}  onClick={(e) =>handleAddCompliance(e)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     > Add Compliance  </button>
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
                                    {truckCompliances.map(({ compliance, originalIndex }) => (
                                        <ComplianceList key={originalIndex} complianceNames={truckComplianceNames} compliance={compliance} formatDate={formatDate} gearedUser={gearedUser} deleteDocument={deleteDocument}  />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                </Panel > )}
        </div>       
    </Dialog>
);
};

export default TruckPopUp;