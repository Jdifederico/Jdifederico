
import React, {useEffect, useState} from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber} from 'primereact/inputnumber';
import { Button } from 'primereact/button';

import { useGlobal } from '../../context/GlobalContext'
import { UserAuth } from '../../context/AuthContext'

const LocationPopUp = (props) => {
    const { locationVisible, setLocationVisible, location} = useGlobal();
    const { updateDocument, locations, addDocument} = UserAuth();
    const [inputValues, setInputValues] = useState({});


    const closeLocationPopUp = () => {
        setLocationVisible(false);
    };
  

    useEffect(() => {
        if (location && Object.keys(location).length > 0) {
           
            setInputValues({
                Name:location.Name,
                Address:location.Address,
                City:location.City,
                State:location.State,
                ZipCode:location.ZipCode,
            });
           
        }
    }, [location]);

     const handleFieldChange = (fieldName, value) => {
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
      
    };

    const handleSaveLocation = ()=>{
        const locationName = inputValues.Name?.trim();
        let updatedObject ={...inputValues};
        updatedObject.fullAddress= updatedObject.Address + ', ' + updatedObject.City + ', ' +updatedObject.State + ', ' +updatedObject.ZipCode;
        if (!locationName) {
            alert('Please enter a name before saving.');
            return;
        }
    
        const locationExists = locations.some(
            (location) => location.Name.toLowerCase() === locationName.toLowerCase() && location.ID!==inputValues.ID
        );

        if (locationExists) {
            alert('An location with this name already exists.');
            return;
        }
    
        if(location.ID)updateDocument( updatedObject, location.ID, 'Locations');
        else addDocument( updatedObject,  'Locations');
        closeLocationPopUp();
    }
  const footerContent = (
  
        <div style={{paddingTop:'1em', textAlign:'center'}}  className="flex align-items-center gap-2">
                <Button style= {{fontSize:'1.5em', width:'9em'}} label="Close" icon="pi pi-times"  onClick={() => setLocationVisible(false)} />
                <Button style= {{fontSize:'1.5em', width:'9em'}} label="Save" icon="pi pi-check" onClick={() => handleSaveLocation()}  />
     
        </div>
    
    );
return(
    <Dialog header="Location Details" visible={locationVisible} style={{ width: '55vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} footer={footerContent} onHide={closeLocationPopUp}>
         
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon"> Name:</span>
                <InputText value={inputValues.Name} onChange={(e) => handleFieldChange('Name', e.target.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon"> Address:</span>
                <InputText value={inputValues.Address} onChange={(e) => handleFieldChange('Address', e.target.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon"> City:</span>
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
          

                  
    </Dialog>
);
};

export default LocationPopUp;