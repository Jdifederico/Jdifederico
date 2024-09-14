import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AutoComplete } from 'primereact/autocomplete';
import { Button } from '@mobiscroll/react';
import { UserAuth } from '../context/AuthContext'


const AutoCompleteInput = ({ fieldName, field, label, value, suggestions, handleFieldChange,  setValue, disabled = false, databaseList, editClick ,showLabel, compLabel, defaultNameType}) => {
    const [filteredSuggestions, setFilteredSuggestions] = useState([]);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
   
    const { addNewAccount, addNewMaterial, addNewTruckType, autocompleteService, addNewLocation, addNewDefaultName } = UserAuth();
    const autoCompleteRef = useRef(null);
    const realLabel = label ? label: fieldName;
  
    useEffect(() => {
        if (autoCompleteRef.current) {
            const inputElement = autoCompleteRef.current.getInput();
            if (inputElement) {
                inputElement.autocomplete = "new-password"; // Change the name attribute
            }
        }
    }, []);

 
    if (showLabel === null || showLabel === undefined)  showLabel=true;
    const doesItemMatchQuery = (item, query) => {
        return Object.values(item).some(value => 
          String(value).toLowerCase().includes(query.toLowerCase())
        );
    };

    const filterList = (event, list) => {
        console.log('list = ', list)
        return list.filter(item => doesItemMatchQuery(item, event.query));
    };

    const handleFilter = useCallback((event) => {
        const filtered = filterList(event, suggestions);
        let customName= 'Add Custom ' + fieldName;
     
        if (databaseList==='Locations' && autocompleteService && event.query.length > 0) {
            autocompleteService.getPlacePredictions(
              { input: event.query },
              (predictions, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
           
                  const suggestionList = predictions.map((prediction) => ({
                   Name: prediction.description,
                    place_id: prediction.place_id,
                    Address: (prediction.terms[0] ? prediction.terms[0].value : '') + ' ' + (prediction.terms[1] ? prediction.terms[1].value : ''),
                    City: prediction.terms[2] ? prediction.terms[2].value : '',
                    State: prediction.terms[3] ? prediction.terms[3].value : '',
                    googleMapsLoc:true
                  }));
              
                  filtered.push(...suggestionList);
                 
                }
                filtered.push({ID:customName, value:customName, Name:customName})
                setFilteredSuggestions(filtered);
                setHighlightedIndex(filtered.length > 0 ? 0 : -1); 
              }
            );
          }else {
            filtered.push({ID:customName, value:customName, Name:customName})
            setFilteredSuggestions(filtered);
            setHighlightedIndex(filtered.length > 0 ? 0 : -1); 
          }
         
    
    }, [filterList, suggestions]);

    const handleFocus = (event) => {
        event.target.select(); 
    };
    const deepEqual = (obj1, obj2) => {
        if (obj1 === obj2) return true;
        if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) return false;
        
        let keys1 = Object.keys(obj1);
        let keys2 = Object.keys(obj2);
        
        if (keys1.length !== keys2.length) return false;
        
        for (let key of keys1) {
            if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false;
        }
        
        return true;
    };
    const selectItem = ( selectValue)=>{

        if(databaseList==='Locations' && selectValue.googleMapsLoc) addNewLocation(fieldName , selectValue, handleFieldChange);
        else if(selectValue.ID==='Add Custom ' + fieldName){
            if(databaseList==='Accounts') addNewAccount(value, fieldName, handleFieldChange);
            if(databaseList==='Materials') addNewMaterial(value, handleFieldChange);
            if(databaseList==='TruckTypes') addNewTruckType(value, handleFieldChange);
            if(databaseList==='DefaultNames') addNewDefaultName(value,handleFieldChange,defaultNameType);
        }else if(databaseList==='Accounts' && fieldName!=='PayTo'){
            let accountSummary ={
                ID:selectValue.ID,
                Name:selectValue.Name, 
                Address:selectValue.Address,
                City:selectValue.City,
                State:selectValue.State,
                ZipCode:selectValue.ZipCode,
                Broker:selectValue.Broker,
                BrokerFee:selectValue.BrokerFee,
                DriverEmail:selectValue.DriverEmail,
            }
            handleFieldChange(fieldName, accountSummary, true)
        }else  handleFieldChange(fieldName, selectValue, true)
    }
    const handleKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            setHighlightedIndex(prevIndex => (prevIndex + 1) % filteredSuggestions.length);
            event.preventDefault();
        } else if (event.key === 'ArrowUp') {
            setHighlightedIndex(prevIndex => (prevIndex - 1 +filteredSuggestions.length) % filteredSuggestions.length);
            event.preventDefault();
        } else if (event.key === 'Enter' && highlightedIndex !== -1) {
            console.log('about to set value = ', event)
            selectItem( filteredSuggestions[highlightedIndex])
            if(autoCompleteRef.current)autoCompleteRef.current.hide();
            focusNextElement(event.target);
            event.preventDefault();
        }
    };

    const focusNextElement = (currentElement) => {
        const focusableElements = 'button, [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';
        const elements = Array.from(document.querySelectorAll(focusableElements));
        const currentIndex = elements.indexOf(currentElement);
        if (currentIndex > -1 && currentIndex < elements.length - 1) {
            elements[currentIndex + 1].focus();
        }
    };

    const passThroughOptions = {

        item: {
            className: 'custom-item-class',
            'aria-selected': false,
            role: 'option'
        }
    };

    useEffect(() => {
   
        if (value?.ID && suggestions) {
            console.log()
            const matchingSuggestion = suggestions.find(suggestion => suggestion.ID === value.ID);
            if (matchingSuggestion){
                if(databaseList==='Accounts' && fieldName!=='PayTo'){
                    let accountSummary ={
                        ID:matchingSuggestion.ID,
                        Name:matchingSuggestion.Name, 
                        Address:matchingSuggestion.Address,
                        City:matchingSuggestion.City,
                        State:matchingSuggestion.State,
                        ZipCode:matchingSuggestion.ZipCode,
                        Broker:matchingSuggestion.Broker,
                        BrokerFee:matchingSuggestion.BrokerFee,
                        DriverEmail:matchingSuggestion.DriverEmail,
                }
                if(!deepEqual(accountSummary, value))  selectItem(accountSummary);
                }else if (!deepEqual(matchingSuggestion, value) && fieldName!=='Company' )  selectItem(matchingSuggestion);
            }
        }
    }, [suggestions, value]);


    const itemTemplate = (suggestion, index) => {
        const isHighlighted = index === highlightedIndex;
        let fontWeight = 'normal';
        if(suggestion.ID === 'Add Custom ' + fieldName || suggestion.locSelect) fontWeight='bold'
       
        return (
            <div className={`p-autocomplete-item ${isHighlighted ? 'p-highlight' : ''}`} style={{ padding: '10px', cursor: 'pointer'}} role="option"  aria-selected={isHighlighted} >
                <div style={{ fontWeight:fontWeight }}>  {suggestion[field]}</div>
                {suggestion.locSelect && (<div>{suggestion.fullAddress} </div>)}
            </div>

        );
    };




    return (
       <div className="p-inputgroup ">
        {showLabel && ( <span className="p-inputgroup-addon dispatch-inputgroup">{realLabel}</span> )}
        {compLabel && ( <span className="p-inputgroup-addon" style={{width:'29.5%'}}>{realLabel}:</span> )}
            <AutoComplete
                ref={autoCompleteRef}
                field={field}
                value={value}
                suggestions={filteredSuggestions}
                completeMethod={handleFilter}
                onChange={(e) => setValue((prev) => ({ ...prev, [fieldName]: e.value }))}
                onSelect={(e)=>selectItem(e.value)}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                minLength={0}
           
                itemTemplate={itemTemplate}
                autoHighlight={true}
                disabled={disabled}
       
                pt={passThroughOptions}
                delay={10}
            />
             {editClick && value.ID && value.ID!=='default' && (<Button startIcon="tag" type="button" style={{ color: "blue", margin: "0" }} onClick={editClick} ></Button>)}
        </div>
    );
};

export default AutoCompleteInput;