import React, {  useState, useEffect, useRef, useCallback} from 'react';

import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { db } from '../../firebase';
import { updateDoc, doc,  deleteDoc} from 'firebase/firestore';
import debounce from 'lodash/debounce';

const DedicatedTruck = ({outsideTruck, capabilities, truckTypes, gearedUser, trailers}) => {

    const [inputValues, setInputValues] = useState({}); // State to handle input values
    const statuses = [ {text :'Active',value: 'Active'},{text :'Inactive',value: 'Inactive'} ];
    const [phoneObject, setPhoneObject] = useState({ Phone1: '', Phone2: '', Phone3: '' });
    const [selectedTruckTypes, setSelectedTruckTypes]=useState([]);
    const [selectedTrailer, setSelectedTrailer] = useState(null);

    const filteredTrailers = trailers.filter(trailer => trailer.Name !== 'No Trailer');
    const panelHeaderTemplate = () => {  return <div className="py-2 px-3"> </div>; };
    const inputRef2 = useRef(null);
    const inputRef3 = useRef(null);

    console.log('wtf outside truck = ', outsideTruck)
    let outsideTruckRef;
    if (outsideTruck)  outsideTruckRef= doc(db, 'Organizations/' + gearedUser.selectedOrgName + '/OutsideTrucks', outsideTruck.ID);

    const handleFieldChange = (fieldName, value) => {
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
        debouncedUpdateComplianceField(fieldName, value);
    };

    const updateComplianceField= useCallback(async (fieldName, value) => {
        await updateDoc(outsideTruckRef, { [fieldName]: value }).then(() => {}).catch((error) => { console.log('error updating outsideTruck =', error);   });   
    },  [outsideTruck] );

    const debouncedUpdateComplianceField = useCallback(debounce(updateComplianceField, 500), [updateComplianceField]);

    const handlePhoneChange = (field, value, nextRef) => {
        const maxLength = field === 'Phone3' ? 4 : 3;
        if (value.length <= maxLength) {
            setPhoneObject((prev) => ({ ...prev, [field]: value }));
            if (value.length === maxLength && nextRef)  nextRef.current.focus();
        }
    };
    const handleCapabilitiesChange = (selected) => {
        console.log('selected = ', selected);
        let displayCapabilities = [];
        for (var i = 0; i < outsideTruck.TruckTypes.length; i++) displayCapabilities.push(outsideTruck.TruckTypes[i].TruckCode);
        for (var j = 0; j < selected.length; j++) displayCapabilities.push(selected[j]);
        setInputValues((prev) => ({ ...prev, Capabilities: selected, displayCapabilities:displayCapabilities }));
        updateDoc(outsideTruckRef, { Capabilities: selected, displayCapabilities:displayCapabilities}).then(() => {}).catch((error) => { console.log('error updating outsideTruck =', error);   }); 
    };
    const handleTruckTypesChange = (selected) => {
     
        let displayCapabilities = [];
        let tempTruckTypes = [];
        setSelectedTruckTypes(selected);
        outsideTruck.TruckTypes = [];
        for (var q = 0; q < truckTypes.length; q++) {
            for (var j = 0; j < selected.length; j++) {
                if (selected[j] === truckTypes[q].ID) {
                    tempTruckTypes.push( truckTypes[q]);
                    displayCapabilities.push(truckTypes[q].TruckCode);
                }
            }
        }
        for (var i = 0; i < outsideTruck.Capabilities.length; i++) displayCapabilities.push(outsideTruck.Capabilities[i]);
        console.log('displayCapabilities = ', displayCapabilities);
        setInputValues((prev) => ({ ...prev, TruckTypes: tempTruckTypes, displayCapabilities:displayCapabilities }));
        updateDoc(outsideTruckRef, {TruckTypes: tempTruckTypes, displayCapabilities:displayCapabilities }).then(() => {}).catch((error) => { console.log('error updating outsideTruck =', error);   }); 
    };

           
    const findObjectById = (objectList, Id) => {
        for (let i = 0; i < objectList.length; i++)
            if (objectList[i].ID === Id) return objectList[i];
    };
    const handleTrailerChange = (trailerID) => {
        console.log('trailerID= ', trailerID);
        let newTrailer = findObjectById(trailers, trailerID);
        handleFieldChange('Trailer', newTrailer)
    };
    const handleDeleteTruck = async(truck)=>{
        try {
            await deleteDoc(doc(db, `Organizations/${gearedUser.selectedOrgName}/OutsideTrucks`, truck.ID));
        } catch (error) {  console.error("Error removing truck: ", error);  }
    
    }
    useEffect(() => {
        if (outsideTruck) {
            console.log('outsideTruck = ', outsideTruck)
            setPhoneObject({...outsideTruck.PhoneObject})
            setInputValues({
                Capabilities:outsideTruck.Capabilities,
                DriverName:outsideTruck.DriverName,
                Status:outsideTruck.Status,
                Truck: outsideTruck.Truck,
                Trailer:outsideTruck.Trailer,
                TruckTypes:outsideTruck.TruckTypes,
                TrailerFee:outsideTruck.TrailerFee
            });
              let ids = outsideTruck.TruckTypes.map(truckType => truckType.ID);
            setSelectedTruckTypes(ids);
            if (outsideTruck.Trailer) setSelectedTrailer(outsideTruck.Trailer.ID);
 
        }
    }, [outsideTruck]);


    return (
        <tr className="mbsc-row" style={{ width: '100%', marginLeft: '1.1em',borderBottom:'1px solid #dee2e6'}}>
            <td style={{ width: '10%', padding: '0',   borderRight:'1px solid #dee2e6' }}>
                <button style={{ margin: '0', padding: '.5em', width:"95%" }}     className="mbsc-ios mbsc-btn-primary mbsc-btn"    onClick={(e) => handleDeleteTruck(outsideTruck)}   >  Delete  </button>
            </td>
            <td style={{ width: '15%', padding: '0',  borderRight:'1px solid #dee2e6' }}>
            <MultiSelect panelHeaderTemplate={panelHeaderTemplate} value={selectedTruckTypes} onChange={(e) => handleTruckTypesChange(e.value)} options={truckTypes} optionLabel="Name"
                    style={{width:"100%"}}    placeholder="Truck Types" maxSelectedLabels={3} className="w-full md:w-20rem" />
            </td>
            <td style={{ width: '15%', padding: '0', paddingLeft:'1em',  borderRight:'1px solid #dee2e6' }}> 
            <MultiSelect panelHeaderTemplate={panelHeaderTemplate} value={inputValues.Capabilities} onChange={(e) => handleCapabilitiesChange(e.value)} options={capabilities} optionLabel="Name"
                 style={{width:"100%"}}   placeholder="Capabilities" maxSelectedLabels={3} className="w-full md:w-20rem" />
            </td>
            <td style={{ width: '10%', padding: '0',paddingLeft:'1em',  borderRight:'1px solid #dee2e6' }}>   <InputText value={inputValues.DriverName} style={{width:"100%"}} onChange={(e) =>handleFieldChange( 'DriverName', e.target.value)}/> </td>
            <td style={{ width: '10%', padding: '0',paddingLeft:'1em',  borderRight:'1px solid #dee2e6' }}>   <InputText value={inputValues.Truck} style={{width:"100%"}} onChange={(e) =>handleFieldChange( 'Truck', e.target.value)}/> </td>
            <td style={{ width: '10%', padding: '0',paddingLeft:'1em',  borderRight:'1px solid #dee2e6' }}>   
                <Dropdown value={selectedTrailer} onChange={(e) => handleTrailerChange(e.value)}  options={filteredTrailers} optionLabel="Name"
                     style={{width:"100%"}} placeholder="Select a Trailer" className="w-full md:w-14rem" />
                </td>
            <td style={{ width: '5%', padding: '0', paddingLeft:'1em', borderRight:'1px solid #dee2e6' }}>    <InputNumber  style={{width:"100%"}}  value={inputValues.TrailerFee} onChange={(e) => handleFieldChange('TrailerFee', e.value)} /> </td>
            <td style={{ width: '15%', padding: '0', paddingLeft:'1em',  borderRight:'1px solid #dee2e6' }}>
                    <InputText style={{width:"30%"}} maxLength={3} value={phoneObject.Phone1} onChange={(e) => handlePhoneChange('Phone1', e.target.value, inputRef2)}  />
                    <InputText style={{width:"30%"}} ref={inputRef2} maxLength={3} value={phoneObject.Phone2} onChange={(e) => handlePhoneChange('Phone2', e.target.value, inputRef3)}  />
                    <InputText style={{width:"40%"}} ref={inputRef3} maxLength={4} value={phoneObject.Phone3} onChange={(e) => handlePhoneChange('Phone3', e.target.value, null)} />
                </td>

            <td style={{ width: '10%', padding: '0', paddingLeft:'1em', borderRight:'1px solid #dee2e6' }}> 
                <Dropdown value={inputValues.Status} onChange={(e) => handleFieldChange('Status', e.value)} options={statuses} optionLabel="text"  style={{width:"100%"}} placeholder="Select a Status" className="w-full md:w-14rem" /> 
                    
                </td>
        </tr>
    );
}

export default DedicatedTruck