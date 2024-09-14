import React, { useState, useEffect, useCallback, useRef } from 'react';
import { InputText } from 'primereact/inputtext';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import debounce from 'lodash/debounce';

const NoteList = ({ note, onDeleteNote, onUpdateNote, formatDate, truckList}) => {
  //  console.log(' NOTE ON LAOD = ', note);
 
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const [truckDropDown, setTruckDropDown]= useState(null);
    const inputRef = useRef(null); // Ref for the input field
    const [inputValues, setInputValues] = useState({}); 
    
    let infoWidth='20%';
    let createdByWidth='30%';
    console.log('truckList =- ', truckList )
    const truckOptions = truckList ? truckList.map(({ outsideTruck }) => ({text: outsideTruck.DriverName, value: outsideTruck.ID})) : [];
  
    console.log('truckOptions =- ', truckOptions )
    if (truckList){
        infoWidth='15%';
        createdByWidth='20%';      
    }  
    useEffect(() => {
        if (note) {
           
            setStartDate(new Date(note.StartDate));
            setEndDate(new Date(note.EndDate));
            setInputValues({
                Red: note.Red,
                Yellow:note.Yellow,
                Note:note.Note
            });
            setTruckDropDown(note.Truck?.ID);
      
        }
    }, [note]);

    const debouncedUpdateNote = useCallback( debounce((updatedNote) => { onUpdateNote(updatedNote); }, 500), [onUpdateNote]   );

    const handleChangeDate = (value, dateName) => {
        console.log('value = ', formatDate(value, '/', 'MM/DD/YYYY'));
        const updatedNote = { ...note, [dateName]: formatDate(value, '/', 'MM/DD/YYYY') };
        debouncedUpdateNote(updatedNote);
    };

    const handleChangeNote = (value, fieldName) => {
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
        const updatedNote = { ...note, [fieldName]: value };
        debouncedUpdateNote(updatedNote);

    
    };

    const handleSelectTruck = (value)=>{
        for(let i=0; i<truckList.length; i++)if(truckList[i].outsideTruck.ID==value)onUpdateNote({ ...note, Truck: truckList[i].outsideTruck});
        console.log('value for truck -=' , value)
    }
    const setNoteColor = (value, note, color) => {

        setInputValues((prev) => ({ ...prev,  [color]: value}));
        const updatedNote = { ...note, [color]: value };
        debouncedUpdateNote(updatedNote);
    };

    const deleteNote = (note) => {
        onDeleteNote(note);
    };

    return (
        <tr className="mbsc-row" style={{ width: '100%', marginLeft: '1.1em' }}>
            <td style={{ width: '10%', padding: '0' }}>
                <button style={{ margin: '0', padding: '.5em', width:"95%" }}   onClick={(e) => deleteNote(note)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     >  Delete  </button>
            </td>
            <td style={{ width: '15%', padding: '0' }}>
                <Calendar value={startDate} onChange={(e) => handleChangeDate(e.value, 'StartDate')} />
            </td>
            <td style={{ width: '15%', padding: '0' }}>
                <Calendar value={endDate} onChange={(e) => handleChangeDate(e.value, 'EndDate')} />
            </td>
            {truckList && (<td style={{ width: '15%', padding: '0', paddingLeft:'1em', borderRight:'1px solid #dee2e6' }}> 
                <Dropdown value={truckDropDown} onChange={(e) =>  handleSelectTruck( e.value)} options={truckOptions} optionLabel="text"  style={{width:"100%"}} placeholder="Select a Truck" className="w-full md:w-14rem" /> 
                    
                </td>)}
            <td style={{ width: infoWidth, padding: '0' }}>
                <InputText ref={inputRef}   value={inputValues.Note}  type="text" onChange={(e) => handleChangeNote(e.target.value, 'Note')} className="tableInput" />
            </td>
       
            <td style={{ width: '5%', padding: '0' }}>
                <Checkbox style={{ width: '100%' }}checked={inputValues.Red} onChange={(e) => setNoteColor(e.checked, note, 'Red')}/>
            </td>
            <td style={{ width: '5%', padding: '0' }}>
                <Checkbox style={{ width: '100%' }} checked={inputValues.Yellow}  onChange={(e) => setNoteColor(e.checked, note, 'Yellow')}  />
            </td>
            <td style={{ width: createdByWidth, padding: '0' }}>
                <input type="text"  value={note.createdBy} disabled={true}  className="tableInput" style={{ backgroundColor: 'lightgrey' }}  />
            </td>
        </tr>
    );
};

export default NoteList;