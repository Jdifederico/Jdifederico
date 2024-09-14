
import React, {useEffect, useRef, useState} from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputNumber} from 'primereact/inputnumber';
import { Button } from 'primereact/button';

import { useGlobal } from '../../context/GlobalContext'
import { UserAuth } from '../../context/AuthContext'

const ContactPopUp = (props) => {
    const { contactVisible, setContactVisible, contact} = useGlobal();
    
    const { updateDocument, addDocument} = UserAuth();
    const [phoneObject, setPhoneObject] = useState({ Phone1: '', Phone2: '', Phone3: '' });
    const [inputValues, setInputValues] = useState({});
    const departments = [ {text :'Admin',value: 'Admin'},{text :'Dispatch',value: 'Dispatch'},{text :'Foreman',value: 'Foreman'},{text :'Billing',value: 'Billing'},{text :'Estimating',value: 'Estimating'} ];

    const inputRef2 = useRef(null);
    const inputRef3 = useRef(null);

    const closeContactPopUp = () => {
        setContactVisible(false);
    };
    console.log('contact pop up boi=' , contact)

    useEffect(() => {
        if (contact && Object.keys(contact).length > 0) {
           
            setInputValues({
                FirstName:contact.FirstName,
                LastName:contact.LastName,
                Name: contact.Name,
                Fax:contact.Fax,
                Email:contact.Email,
                Department:contact.Department
            });
            setPhoneObject({...contact.PhoneObject})
            console.log('contact = ', contact)
        }
    }, [contact]);

     const handleFieldChange = (fieldName, value) => {
        let updateObject ={ [fieldName]: value };
        if (fieldName === 'FirstName' || fieldName === 'LastName') {
            const newFirstName = fieldName === 'FirstName' ? value : inputValues.FirstName;
            const newLastName = fieldName === 'LastName' ? value : inputValues.LastName;
            updateObject.Name = `${newFirstName} ${newLastName}`;
        }
     
        setInputValues((prev) => ({ ...prev,...updateObject}));
      
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
    const handleSaveContact = ()=>{

        let updatedObject ={...inputValues};
        updatedObject.PhoneObject = {...phoneObject};
        updatedObject.displayPhone =updatedObject.PhoneObject.Phone1+'-'+updatedObject.PhoneObject.Phone2+'-'+ updatedObject.PhoneObject.Phone3;
        if(contact.ID) updateDocument( updatedObject, contact.ID, 'Contacts');
        else{
            updatedObject ={...contact};
            updatedObject.PhoneObject = {...phoneObject};
            updatedObject.displayPhone =updatedObject.PhoneObject.Phone1+'-'+updatedObject.PhoneObject.Phone2+'-'+ updatedObject.PhoneObject.Phone3;
            for (let key in inputValues) {
                if (inputValues.hasOwnProperty(key)) {
                    updatedObject[key] = inputValues[key];
                }
            }
         
            addDocument(updatedObject, 'Contacts')
        } 
       

        closeContactPopUp();
    }
  const footerContent = (
  
        <div style={{paddingTop:'1em', textAlign:'center'}}  className="flex align-items-center gap-2">
                       <Button style= {{fontSize:'1.5em', width:'9em'}} label="Close" icon="pi pi-times"  onClick={() => setContactVisible(false)} />
                <Button style= {{fontSize:'1.5em', width:'9em'}} label="Save" icon="pi pi-check" onClick={() => handleSaveContact()}  />
     
        </div>
    
    );
return(
    <Dialog header="Contact Details" visible={contactVisible} style={{ width: '55vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} footer={footerContent} onHide={closeContactPopUp}>
         
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon"> First Name:</span>
                <InputText value={inputValues.FirstName} onChange={(e) => handleFieldChange('FirstName', e.target.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon">Last Name:</span>
                <InputText value={inputValues.LastName} onChange={(e) => handleFieldChange('LastName', e.target.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                    <span className="p-inputgroup-addon">Dispatch Phone:</span>
                    <InputText maxLength={3} value={phoneObject.Phone1} onChange={(e) => handlePhoneChange('Phone1', e.target.value, inputRef2)}  />-
                    <InputText ref={inputRef2} maxLength={3} value={phoneObject.Phone2} onChange={(e) => handlePhoneChange('Phone2', e.target.value, inputRef3)}  />-
                    <InputText ref={inputRef3} maxLength={4} value={phoneObject.Phone3} onChange={(e) => handlePhoneChange('Phone3', e.target.value, null)} />
                </div>
                
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon">Fax:</span>
                <InputNumber  useGrouping={false}  value={inputValues.Fax} onChange={(e) => handleFieldChange('Fax', e.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon">Email:</span>
                <InputText value={inputValues.Email} onChange={(e) => handleFieldChange('Email', e.target.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon">Department:</span>
                <Dropdown value={inputValues.Department} onChange={(e) => handleFieldChange('Department', e.value)} options={departments} optionLabel="text"
                        placeholder="Select a Department" className="w-full md:w-14rem" />
            </div>

                  
    </Dialog>
);
};

export default ContactPopUp;