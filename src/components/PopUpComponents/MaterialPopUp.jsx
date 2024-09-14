
import React, {useEffect, useState} from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber} from 'primereact/inputnumber';
import { Button } from 'primereact/button';

import { useGlobal } from '../../context/GlobalContext'
import { UserAuth } from '../../context/AuthContext'

const MaterialPopUp = (props) => {
    const { materialVisible, setMaterialVisible, material} = useGlobal();
    const { updateDocument, addDocument, materials} = UserAuth();
    const [inputValues, setInputValues] = useState({});

    console.log('material =' , material)
    const closeMaterialPopUp = () => {
        setMaterialVisible(false);
    };
  

    useEffect(() => {
        if (material && Object.keys(material).length > 0) {
           
            setInputValues({
                Name:material.Name,
                YardsPerTon:material.YardsPerTon
            });
           
        }
    }, [material]);

     const handleFieldChange = (fieldName, value) => {
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
      
    };

    const handleSaveMaterial = ()=>{


        const materialName = inputValues.Name?.trim();

        if (!materialName) {
            alert('Please enter a name before saving.');
            return;
        }
        const materialExists = materials.some(
            (material) => material.Name.toLowerCase() === materialName.toLowerCase() && material.ID!==inputValues.ID
        );

        if (materialExists) {
            alert('An material with this name already exists.');
            return;
        }
    
        if(material.ID) updateDocument(inputValues, material.ID, 'Materials');
        else addDocument(inputValues,  'Materials');
        closeMaterialPopUp();
    }

    const footerContent = (
  
        <div style={{paddingTop:'1em', textAlign:'center'}}  className="flex align-items-center gap-2">
                <Button style= {{fontSize:'1.5em', width:'9em'}} label="Close" icon="pi pi-times"  onClick={() => setMaterialVisible(false)} />
                <Button style= {{fontSize:'1.5em', width:'9em'}} label="Save" icon="pi pi-check" onClick={() => handleSaveMaterial()}  />
     
        </div>
    
    );
return(
    <Dialog header="Material Details" visible={materialVisible} style={{ width: '55vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} footer={footerContent} onHide={closeMaterialPopUp}>
         
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon"> Name:</span>
                <InputText value={inputValues.Name} onChange={(e) => handleFieldChange('Name', e.target.value)} />
            </div>
            <div className="p-inputgroup flex-1">
                <span className="p-inputgroup-addon">Yards Per Ton:</span>
                <InputNumber  useGrouping={false}  value={inputValues.YardsPerTon} onChange={(e) => handleFieldChange('YardsPerTon', e.value)} />
            </div>
          

                  
    </Dialog>
);
};

export default MaterialPopUp;