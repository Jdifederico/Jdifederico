
import React, {useEffect, useState} from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber} from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';

import { useGlobal } from '../../context/GlobalContext'
import { UserAuth } from '../../context/AuthContext'

const TruckTypePopUp = (props) => {
    const { truckTypeVisible, setTruckTypeVisible, truckType} = useGlobal();
    const { updateDocument, truckTypes, addDocument} = UserAuth();
    const [inputValues, setInputValues] = useState({});


    const closeTruckTypePopUp = () => {
        setTruckTypeVisible(false);
    };
  

    useEffect(() => {
        if (truckType && Object.keys(truckType).length > 0) {
           
            setInputValues({
                Name:truckType.Name,
                TruckCode:truckType.TruckCode,
                NumOfAxles: truckType.NumOfAxles,
                DefaultRate: truckType.DefaultRate,
                NightRate: truckType.NightRate,
                WeekendRate: truckType.WeekendRate,
                CapacityTons: truckType.CapacityTons,
                CapacityYards: truckType.CapacityYards,
                Default:truckType.Default
            });
           
        }
    }, [truckType]);

     const handleFieldChange = (fieldName, value) => {
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
      
    };

    const handleSaveTruckType = ()=>{


        const truckTypeName = inputValues.Name?.trim();
        const truckTypeCode = inputValues.TruckCode?.trim();
        if (!truckTypeName) {
            alert('Please enter a name before saving.');
            return;
        }
        if (!truckTypeCode) {
            alert('Please enter a truck code before saving.');
            return;
        }
        const truckTypeExists = truckTypes.some(
            (truckType) => truckType.Name.toLowerCase() === truckTypeName.toLowerCase() && truckType.ID!==inputValues.ID
        );

        if (truckTypeExists) {
            alert('An Truck Type with this name already exists.');
            return;
        }
    
        if(truckType.ID) updateDocument(inputValues, truckType.ID, 'TruckTypes');
        else addDocument(inputValues,  'TruckTypes');
      
        closeTruckTypePopUp();
    }
  const footerContent = (
  
        <div style={{paddingTop:'1em', textAlign:'center'}}  className="flex align-items-center gap-2">
                <Button style= {{fontSize:'1.5em', width:'9em'}} label="Close" icon="pi pi-times"  onClick={() => setTruckTypeVisible(false)} />
                <Button style= {{fontSize:'1.5em', width:'9em'}} label="Save" icon="pi pi-check" onClick={() => handleSaveTruckType()}  />
     
        </div>
    
    );
return(
    <Dialog header="TruckType Details" visible={truckTypeVisible} style={{ width: '55vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} footer={footerContent} onHide={closeTruckTypePopUp}>
         
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon"> Name:</span>
                <InputText value={inputValues.Name} onChange={(e) => handleFieldChange('Name', e.target.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon"> Truck Code:</span>
                <InputText value={inputValues.TruckCode} onChange={(e) => handleFieldChange('TruckCode', e.target.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon"># of Axles:</span>
                <InputNumber  useGrouping={false}  value={inputValues.NumOfAxles} onChange={(e) => handleFieldChange('NumOfAxles', e.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon">Default Rate:</span>
                <InputNumber  useGrouping={false}  value={inputValues.DefaultRate} onChange={(e) => handleFieldChange('DefaultRate', e.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon">Night Rate:</span>
                <InputNumber  useGrouping={false}  value={inputValues.NightRate} onChange={(e) => handleFieldChange('NightRate', e.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon">Weekend Rate:</span>
                <InputNumber  useGrouping={false}  value={inputValues.weekendRate} onChange={(e) => handleFieldChange('WeekendRate', e.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon">Capacity (Tons):</span>
                <InputNumber  useGrouping={false}  value={inputValues.CapacityTons} onChange={(e) => handleFieldChange('CapacityTons', e.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon">Capacity (Yards):</span>
                <InputNumber  useGrouping={false}  value={inputValues.CapacityYards} onChange={(e) => handleFieldChange('CapacityYards', e.value)} />
            </div>
            <div className="p-inputgroup mbsc-col">
                <span className="p-inputgroup-addon" style={{width:"600%"}}>Default:</span>
                <Checkbox style={{ width: '100%' }} onChange={e => setInputValues((prev) => ({ ...prev, Default: e.checked}))}   checked={inputValues.Default}  />
            </div> 

                  
    </Dialog>
);
};

export default TruckTypePopUp;