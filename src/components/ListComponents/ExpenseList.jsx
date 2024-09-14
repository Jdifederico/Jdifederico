import React, { useState, useEffect,  useRef, useCallback } from 'react';

import { Checkbox } from 'primereact/checkbox';

import { UserAuth } from '../../context/AuthContext';
import AutoCompleteInput from '../AutoCompleteInput'; 
import AutoSelectInputNumber from '../AutoSelectInputNumber';  
import debounce from 'lodash/debounce';

const ExpenseList = ({ expense, showAddToFreights, driver, customerID}) => {

    const {   deleteDocument,updateDocument,expenseNames, accounts} = UserAuth();
    const [inputValues, setInputValues] = useState({tempName:{Name:''}, Attachment:{}}); 


    const payToSuggestions =[...accounts];
    if(driver)payToSuggestions.push(driver);
    
    useEffect(() => {
        if (expense) {
            console.log('we runnign teh expense use effect', expense);
     
    
            setInputValues({
                Name:expense.Name,
                description:expense.description,
                onHold:expense.onHold,
                qty:expense.qty,
                rate:expense.rate,
                total:expense.total,
                Type:expense.Type,
                reDriver:expense.reDriver,
                bCustomer:expense.bCustomer,
                reCustomer:expense.reCustomer,
                pay:expense.pay,
                bill:expense.bill,
                bDriver:expense.bDriver,
                BillTo:expense.BillTo,
                Invoice:expense.Invoice,
                PayTo:expense.PayTo,
                DPS:expense.DPS,
                MaterialExpense:expense.MaterialExpense,
                addToFreights:expense.addToFreights
            });
         
        }
    }, [expense]);
    const updateExpenseFields= useCallback(async (fieldNames, values) => {
        let updateObject = {};
        fieldNames.forEach((field, index) => {
          updateObject[field] = values[index];
        });
        updateDocument(updateObject, expense.ID, "Expenses");
        
    },  [expense] );
    const updateExpenseField= useCallback(async (fieldName, value) => {
  
        updateDocument({  [fieldName]: value }, expense.ID, "Expenses");
        
    },  [expense] );

    const deleteExpense = ( expense)=>{
        if(window.confirm("Are you sure you want to delete expense?"))
        deleteDocument(expense, 'Expenses')
    }
    const debouncedUpdateExpenseField = useCallback(debounce(updateExpenseField, 500), [updateExpenseField]);
    const  debouncedUpdateExpenseFields= useCallback(debounce(updateExpenseFields, 500), [updateExpenseFields]);
    const handleFieldChange = ( fieldName,value ) => {
       console.log('tryina set fieldname = '+ fieldName + ' equal to value = ', value)
        setInputValues((prev) => ({ ...prev, [fieldName]: value }));
     
        debouncedUpdateExpenseField(fieldName, value);
    };
    const changeBillTo =(fieldName, value)=>{
    
        let floatingBillExpense= false;
        if(customerID!==value.ID)floatingBillExpense=true;
        updateExpenseFields(['floatingBillExpense', fieldName], [floatingBillExpense, value]);
        setInputValues((prev) => ({ ...prev, floatingBillExpense:floatingBillExpense, [fieldName]: value }));
    }
    const changePayTo =(fieldName, value)=>{
    
        let floatingPayExpense= false;
        if(driver.ID!==value.ID)floatingPayExpense=true;
        updateExpenseFields(['floatingPayExpense', fieldName], [floatingPayExpense, value]);
        setInputValues((prev) => ({ ...prev, floatingPayExpense:floatingPayExpense, [fieldName]: value }));
    }
    const handleFieldsChange = (fields, values) => {
        console.log('fieldNames= ',fields)
        console.log('values= ',values)

        setInputValues(prevState => {
            let newState = { ...prevState };
            for (let i = 0; i < fields.length; i++) newState[fields[i]] = values[i]; 
            return newState;
          });

        debouncedUpdateExpenseFields(fields, values);
    };
    const calcTotal = (type, qty, rate) =>{
        let amount = qty*rate;
        if(type==='qty')handleFieldsChange(['qty','total'],[qty, amount]); 
        else handleFieldsChange(['rate','total'],[rate, amount]);
        
    }

    return (
        <tr className="mbsc-row" style={{ width: '100%', marginLeft: '1.1em' }}>
            <td style={{ width: '5%', padding: '0' }}>
                <button style={{ margin: '0', padding: '.5em', width:"95%" }}   onClick={(e) => deleteExpense(expense)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     >  Delete  </button>
            </td>
            <td style={{ width: '5%', paddingRight: '.5em', paddingTop:"0 !important", paddingBottom:"0", paddingLeft: '.5em' }}>
                <Checkbox style={{ width: '100%', paddingTop:"0 !important", }}checked={inputValues.onHold} onChange={(e) => handleFieldChange( 'onHold', e.checked)}/>
            </td>

            {showAddToFreights &&(<td style={{ width: '5%', paddingRight: '.5em', paddingTop:"0 !important", paddingBottom:"0", paddingLeft: '.5em' }}>
                <Checkbox style={{ width: '100%', paddingTop:"0 !important", }}checked={inputValues.addToFreights} onChange={(e) => handleFieldChange( 'addToFreights', e.checked)}/>
            </td>)}
            <td style={{ width: '13%', padding: '0' }}>
                <AutoCompleteInput fieldName="Name" field="Name" value={inputValues.Name} suggestions={expenseNames} setValue={setInputValues} handleFieldChange={handleFieldChange} databaseList={'DefaultNames'} showLabel={false} defaultNameType={'Expense'}/>  
            </td>
            <td style={{ width: '8%', padding: '0' }}>
                <AutoSelectInputNumber   value={inputValues.qty} isCurrency={true}  onChange={(e) =>calcTotal('qty', e.value, inputValues.rate)} />
            </td>
            <td style={{ width: '8%', padding: '0' }}>
                <AutoSelectInputNumber isCurrency={true}  value={inputValues.rate}    onChange={(e) =>calcTotal('rate', inputValues.qty, e.value )} />
            </td>
       
            <td style={{ width: '5%', paddingRight: '.5em', paddingTop:"0 !important", paddingBottom:"0", paddingLeft: '.5em' }}>
                <Checkbox style={{ width: '100%', paddingTop:"0 !important", }}checked={inputValues.bill} onChange={(e) => handleFieldChange( 'bill', e.checked)}/>
            </td>
            <td style={{ width: '13%', padding: '0' }}>
                <AutoCompleteInput fieldName="BillTo" disabled={!inputValues.bill} field="Name" value={inputValues.BillTo} suggestions={accounts} setValue={setInputValues} handleFieldChange={changeBillTo} databaseList={'Accounts'} showLabel={false}/>  
            </td>
            <td style={{ width: '8%', padding: '0' }}>
               {inputValues.Invoice && (<button style={{ margin: '0', padding: '.5em', width:"95%" }}   onClick={(e) => deleteExpense(expense)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     >  Invoice </button>)}
            </td>
            <td style={{ width: '5%', paddingRight: '.5em', paddingTop:"0 !important", paddingBottom:"0", paddingLeft: '.5em' }}>
                <Checkbox style={{ width: '100%', paddingTop:"0 !important", }}checked={inputValues.pay} onChange={(e) => handleFieldChange( 'pay', e.checked)}/>
            </td>
            <td style={{ width: '13%', padding: '0' }}>
                <AutoCompleteInput fieldName="PayTo" field="Name" disabled={!inputValues.pay} value={inputValues.PayTo} suggestions={payToSuggestions} setValue={setInputValues} handleFieldChange={changePayTo} databaseList={'Accounts'} showLabel={false}/>  
            </td>
            <td style={{ width: '8%', padding: '0' }}>
               {inputValues.DPS && (<button style={{ margin: '0', padding: '.5em', width:"95%" }}   onClick={(e) => deleteExpense(expense)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     >  Pay Statement </button>)}
            </td>
            <td style={{ width: '8%', padding: '0' }}>
                <AutoSelectInputNumber   value={inputValues.total} isCurrency={true}  onChange={(e) => handleFieldChange('total', e.value)} />
            </td>
           
         
        
        </tr>
    );
};

export default ExpenseList;