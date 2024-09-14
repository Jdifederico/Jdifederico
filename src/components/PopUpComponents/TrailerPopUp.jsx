
import React, {useEffect, useState} from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';


import { useGlobal } from '../../context/GlobalContext'
import { UserAuth } from '../../context/AuthContext'

import ComplianceList from '../ListComponents/ComplianceList';

const TrailerPopUp = (props) => {
    const { trailerVisible, setTrailerVisible, trailer, setTrailer, formatDate} = useGlobal();
    const { updateDocument, addDocument, trailers, trailerComplianceNames, compliances, deleteDocument, gearedUser} = UserAuth();
 
    const [inputValues, setInputValues] = useState({});
    const saveButton = inputValues.ID ? 'Save' : 'Add';

    const trailerCompliances  = trailer?.ID && compliances ? compliances.filter(compliance => compliance.ParentID=== trailer.ID).map((compliance, originalIndex) => ({ compliance, originalIndex })) : [];
    console.log('trailer =' , trailer)
    const closeTrailerPopUp = () => {
        setTrailerVisible(false);
    };
  

    useEffect(() => {
        if (trailer && Object.keys(trailer).length > 0) {
           
            setInputValues({
                Name:trailer.Name,
                ID:trailer.ID,
                License:trailer.License ? trailer.License : '',
                Make:trailer.Make ? trailer.Make : '',
                Model:trailer.Model  ? trailer.Model : ''


            });
           
        }
    }, [trailer]);

     const handleFieldChange = (fieldName, value) => {
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
      
    };

    const handleSaveTrailer = async()=>{


        const trailerName = inputValues.Name?.trim();

        if (!trailerName) {
            alert('Please enter a name before saving.');
            return;
        }
        const trailerExists = trailers.some(
            (trailer) => trailer.Name.toLowerCase() === trailerName.toLowerCase() && trailer.ID!==inputValues.ID
        );

        if (trailerExists) {
            alert('An trailer with this name already exists.');
            return;
        }
        if(trailer.ID){
            updateDocument(inputValues, trailer.ID, 'Trailers');
            closeTrailerPopUp();
        } 
        else {
            try {
                let tempID = await  addDocument(inputValues,  'Trailers');
                setInputValues((prev) => ({ ...prev, ID: tempID }));
                let updatedTrailer = inputValues;
                updatedTrailer.ID=tempID;
                setTrailer(updatedTrailer);
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
            Type:'Trailer',
            Track:false,
            ParentID:trailer.ID,
            Attachment:{},
        };
        console.log('aabout to run add Copmliance for ', Compliance) 
        addDocument(Compliance, 'Compliances');

    }
    const footerContent = (
  
        <div style={{paddingTop:'1em', textAlign:'center'}}  className="flex align-items-center gap-2">
                <Button style= {{fontSize:'1.5em', width:'9em'}} label="Close" icon="pi pi-times"  onClick={() => setTrailerVisible(false)} />
                <Button style= {{fontSize:'1.5em', width:'9em'}} label={saveButton} icon="pi pi-check" onClick={() => handleSaveTrailer()}  />
     
        </div>
    
    );
return(
    <Dialog header="Trailer Details" visible={trailerVisible} style={{ width: '55vw' }} breakpoints={{ '960px': '75vw', '641px': '100vw' }} footer={footerContent} onHide={closeTrailerPopUp}>
        
         
                <div className="p-inputgroup flex-1">
                    <span className="p-inputgroup-addon"> Name:</span>
                    <InputText value={inputValues.Name} onChange={(e) => handleFieldChange('Name', e.target.value)} />
                </div>
                <div className="p-inputgroup flex-1">
                    <span className="p-inputgroup-addon">Make:</span>
                    <InputText value={inputValues.Make} onChange={(e) => handleFieldChange('Make', e.target.value)} />
                </div>
                <div className="p-inputgroup flex-1">
                    <span className="p-inputgroup-addon">Model:</span>
                    <InputText value={inputValues.Model} onChange={(e) => handleFieldChange('Model', e.target.value)} />
                </div>
                <div className="p-inputgroup flex-1">
                    <span className="p-inputgroup-addon">License :</span>
                    <InputText value={inputValues.License} onChange={(e) => handleFieldChange('License', e.target.value)} />
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
                                    {trailerCompliances.map(({ compliance, originalIndex }) => (
                                        <ComplianceList key={originalIndex} complianceNames={trailerComplianceNames} compliance={compliance} formatDate={formatDate} gearedUser={gearedUser} deleteDocument={deleteDocument}  />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                </Panel > )}


                  
    </Dialog>
);
};

export default TrailerPopUp;