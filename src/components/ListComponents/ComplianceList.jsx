import React, { useState, useEffect,  useRef, useCallback } from 'react';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import  { Button} from '@mobiscroll/react';
import { db } from '../../firebase';
import { updateDoc, doc} from 'firebase/firestore';
import { getStorage, ref, uploadBytes,getDownloadURL} from "firebase/storage";
import AutoCompleteInput from '../AutoCompleteInput'; 
import debounce from 'lodash/debounce';

const ComplianceList = ({ compliance, complianceNames, gearedUser, formatDate, deleteDocument}) => {

    const storage = getStorage();
    const [inputValues, setInputValues] = useState({tempName:{Name:''}, Attachment:{}}); 

    let complianceRef;
    if (compliance)  complianceRef = doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/Compliances', compliance.ID);
    
     
    
    useEffect(() => {
        if (compliance) {
            console.log('we runnign teh compliance use effect', compliance);
      
            setInputValues({
                Name:compliance.tempName,
                tempName:compliance.tempName,
                IssueDateValue:new Date(compliance.IssueDate),
                ExpDateValue: new Date(compliance.ExpDate),
                Type:compliance.Type,
                Info:compliance.Info,
                Attachment:compliance.Attachment
            });
         
        }
    }, [compliance]);

    const updateComplianceField= useCallback(async (fieldName, value) => {
            await updateDoc(complianceRef, { [fieldName]: value }).then(() => {}).catch((error) => { console.log('error updating driver =', error);   });   
            console.log('running teh update compliance boioii!!')  
    },  [compliance] );

    const deleteCompliance = ( compliance)=>{
        deleteDocument(compliance, 'Compliances')
    }
    const debouncedUpdateComplianceField = useCallback(debounce(updateComplianceField, 500), [updateComplianceField]);

    const handleFieldChange = ( fieldName,value ) => {
       console.log('tryina set fieldname = '+ fieldName + ' equal to value = ', value)
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
        if(fieldName==='Name')fieldName='tempName';
        debouncedUpdateComplianceField(fieldName, value);
    };
    const handleDateChange = ( fieldName, value) => {
        let formattedDate= formatDate(value, '/', 'MM/DD/YYYY');
        console.log('formattedDate = ', formattedDate)
        
        setInputValues((prev) => ({ ...prev,[fieldName]: formattedDate, [fieldName+'Value']: value }));
        debouncedUpdateComplianceField(fieldName, formattedDate);
    };

    const startUpload=(event)=>{
        console.log('we have started an uplaod and event ', event)
        uploadFile(event.target.files[0])
    }
    const uploadFile = async(file)=>{
        console.log('file = ', file.name)
        let attachment ={
            Name:file.name,
            fileType:file.type,
        };

       let storageRef = ref(storage, 'attachments/'+gearedUser.selectedOrgName+'/Compliances/' + compliance.ID+file.name);
       console.log('storage Ref = ' ,storageRef);
        uploadBytes(storageRef, file).then((snapshot) => {
          getDownloadURL(storageRef).then((url) => {
    
            attachment.url=url;
            console.log(' attachment!', attachment);
            handleFieldChange( 'Attachment', attachment)
          });
        });
      }
 

    return (
        <tr className="mbsc-row" style={{ width: '100%', marginLeft: '1.1em' }}>
            <td style={{ width: '10%', padding: '0' }}>
                <button style={{ margin: '0', padding: '.5em', width:"95%" }}   onClick={(e) => deleteCompliance(compliance)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     >  Delete  </button>
            </td>
            <td style={{ width: '20%', padding: '0' }}>
                <AutoCompleteInput fieldName="Name" field="Name" value={inputValues.Name} suggestions={complianceNames} setValue={setInputValues} handleFieldChange={handleFieldChange} databaseList={'DefaultNames'} showLabel={false} defaultNameType={compliance.Type+'Compliance'}/>  
            </td>
            <td style={{ width: '15%', padding: '0' }}>
                <InputText value={inputValues.Info} style={{width:"100%"}} onChange={(e) =>handleFieldChange( 'Info', e.target.value)}/>
            </td>
            <td style={{ width: '10%', padding: '0' }}>
                <Calendar value={inputValues.IssueDateValue} style={{width:"100%"}} onChange={(e) => handleDateChange( 'IssueDate',e.value )} />
            </td>
            <td style={{ width: '10%', padding: '0' }}>
                <Calendar value={inputValues.ExpDateValue} style={{width:"100%"}} onChange={(e) => handleDateChange('ExpDate',e.value)} />
            </td>
            <td style={{ width: '5%', paddingRight: '.5em', paddingTop:"0 !important", paddingBottom:"0", paddingLeft: '.5em' }}>
                <Checkbox style={{ width: '100%', paddingTop:"0 !important", }}checked={inputValues.Track} onChange={(e) => handleFieldChange( 'Track', e.checked)}/>
            </td>
            <td style={{ width: '20%', padding: '0' }}>
                {inputValues.Attachment.url && (
                    <div> 
                        <a className="mbsc-ios mbsc-btn-primary mbsc-btn" href={inputValues.Attachment.url} target="_blank">{inputValues.Attachment.Name}</a>
                   </div>)}
               
            </td>
            <td style={{ width: '10%', padding: '0' }}>
          
                <Button  color="primary"  onClick={(event) => document.getElementById('complianceUpload'+compliance.ID).click()} style={{margin:"0", paddingLeft:"1em !important", paddingBottom: ".2em", paddingTop: ".2em", height:"100%"}}>Upload File</Button>
                <input type='file' id={'complianceUpload'+compliance.ID}    onChange={(event,inst) => startUpload(event)} style={{display:'none'}} base-sixty-four-input="true"/>
          </td>
           
         
        
        </tr>
    );
};

export default ComplianceList;