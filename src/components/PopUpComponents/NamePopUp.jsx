
import React, {useEffect, useState} from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';

import { Button } from 'primereact/button';

import { useGlobal } from '../../context/GlobalContext'
import { UserAuth } from '../../context/AuthContext'

const NamePopUp = (props) => {
    const { nameVisible, setNameVisible, nameObject, nameType} = useGlobal();
    const { updateDocument, addDocument, driverComplianceNames, truckComplianceNames, trailerComplianceNames, expenseNames, capabilities} = UserAuth();
    const [inputValues, setInputValues] = useState({});

    console.log('name pop  = ', nameObject)
    const nameList = (() => {
        if (nameType === 'Capabilities') {
            return capabilities;
        } else if (nameObject.Type === 'Driver') {
            return driverComplianceNames;
        } else if (nameObject.Type === 'Truck') {
            return truckComplianceNames;
        } else if (nameObject.Type === 'Trailer') {
            return trailerComplianceNames;
        } else if (nameObject.Type === 'Expenses') {
            return expenseNames;
        } else {
            return [];
        }
    })();

    const closeNamePopUp = () => {
        setNameVisible(false);
    };
  

    useEffect(() => {
        if (nameObject && Object.keys(nameObject).length > 0) {
            setInputValues({  Name:nameObject.Name });
           
        }
    }, [nameObject]);

     const handleFieldChange = (fieldName, value) => {
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
      
    };

    const handleSaveName = ()=>{


        const inputName = inputValues.Name?.trim();
        if (!inputName) {
            alert('Please enter a name before saving.');
            return;
        }
        const nameExists = nameList.some(
            (nameObj) => nameObj.Name.toLowerCase() === inputName.toLowerCase() && nameObj.ID!==inputValues.ID
        );

        if (nameExists) {
            alert('An item with this name already exists.');
            return;
        }
        let updatedObject ={...nameObject};
        updatedObject.Name=inputValues.Name;
       if(nameObject.ID)   updateDocument(inputValues, nameObject.ID, nameType);
       else addDocument(updatedObject,  nameType);
        closeNamePopUp();
    }
  const footerContent = (
  
        <div style={{paddingTop:'1em', textAlign:'center'}}  className="flex align-items-center gap-2">
            <Button style= {{fontSize:'1.5em', width:'9em'}} label="Close" icon="pi pi-times"  onClick={() => setNameVisible(false)} />
            <Button style= {{fontSize:'1.5em', width:'9em'}} label="Save" icon="pi pi-check" onClick={() => handleSaveName()}  />
     
        </div>
    
    );
return(
    <Dialog header="Name Details" visible={nameVisible} style={{ width: '55vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} footer={footerContent} onHide={closeNamePopUp}>
         
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon"> Name:</span>
                <InputText value={inputValues.Name} onChange={(e) => handleFieldChange('Name', e.target.value)} />
            </div>
    
          

                  
    </Dialog>
);
};

export default NamePopUp;