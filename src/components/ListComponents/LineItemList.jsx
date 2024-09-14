import React,{useEffect,useState} from 'react';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import  TableCell  from './TableCell';

const LineItemLine = ({ lineItem, toggleOnHold }) => {
    const [inputValues, setInputValues]= useState(null);


    useEffect(() => {
        if (lineItem) {
            setInputValues({...lineItem});
           if(lineItem.Type==='Scale Tag') console.log('setting the input Values of fb #  = ' +lineItem.FBNO +' to this onhold value= '+ lineItem.onHold)
        }
    }, [lineItem]);

    const handleFieldChange = ( fieldName,value ) => {
        console.log('tryina set fieldname = '+ fieldName + ' equal to value = ', value)
         setInputValues((prev) => ({ ...prev, [fieldName]: value }));
         let tempLineItem={...inputValues};
         tempLineItem[fieldName]=value;
        toggleOnHold(tempLineItem);
     };
    const openFreightBill = (lineitem)=>{
        var win = window.open('/freightbill/freightbill/'+lineitem.FreightID, '_blank');
        win.focus();
        console.log('line item = ', lineItem)
    }
    let borderStyle; 
    if(lineItem.Type==='Scale Tag' ){
        if(lineItem.firstWeight) borderStyle='1px 1px 0px 1px';
        else if(lineItem.lastWeight && !lineItem.hasStandBy)borderStyle = '0px 1px 1px 1px';
        else borderStyle = '0px 1px 0px 1px';
    }else if(lineItem.Type==='Stand By' && lineItem.hideFBNO) borderStyle = '0px 1px 1px 1px';
    else if(lineItem.Type==='Freight Bill' && lineItem.hasStandBy)borderStyle='1px 1px 0px 1px';
    else borderStyle='1px 1px 1px 1px';


    return (
        <React.Fragment>

           {inputValues && !inputValues.FreightHold && (<tr className="mbsc-row" style={{ width: '100%', marginLeft: '1.1em' }}>
                <td style={{ width: '8%', padding: '0', borderWidth: borderStyle, borderColor:'#bcbcd1', borderStyle:'solid' }}>
                   {!lineItem.hideFBNO &&  (lineItem.Type==='Freight Bill' || lineItem.firstWeight || lineItem.Type==='Expense') &&(<button style={{ margin: '0', padding: '.4em', width:"95%" }}   onClick={(e) => openFreightBill(lineItem)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     > {inputValues.FBNO} </button>)} 
                </td>
                <TableCell width='10%' isNumber={false} value={inputValues.truck} borderStyle={borderStyle}/>
                <TableCell width='15%' isNumber={false} value={inputValues.Driver} borderStyle={borderStyle}/>
                <td style={{ width: '6%', padding: '0', borderWidth: borderStyle, borderColor:'#bcbcd1', borderStyle:'solid' }}>
                    <Checkbox style={{height:"2em ", padding:"0 ", paddingLeft:"2em" }}checked={inputValues.missing} disabled={true} onChange={(e) => handleFieldChange( 'missing', e.checked)}/>
                </td>
            
                <td style={{ width: '8%', paddingRight: '.5em', padding:"0 ", paddingBottom:"0", paddingLeft: '.5em', borderWidth: borderStyle, borderColor:'#bcbcd1', borderStyle:'solid' }}>
                    <Checkbox style={{ height:"2em", width: '100%', padding:"0 ", paddingLeft:"2.5em" }} disabled={lineItem.Type==='Scale Tag' && lineItem.hideFBNO} checked={inputValues.onHold} onChange={(e) => handleFieldChange( 'onHold', e.checked)}/>
                </td>
         
                <TableCell width='10%' isNumber={false} value={inputValues.RateType} borderStyle={borderStyle} />
                <TableCell width='5%' isNumber={true} value={inputValues.Qty} borderStyle={borderStyle}/>
                <TableCell width='8%' isNumber={true} value={inputValues.Rate} borderStyle={borderStyle}/>
                <TableCell width='10%' isNumber={true} value={inputValues.FuelCharge} borderStyle={borderStyle}/>
                <TableCell width='10%' isNumber={true} value={inputValues.BrokerTotal} borderStyle={borderStyle}/>
                <TableCell width='10%' isNumber={true} value={inputValues.Total} borderStyle={borderStyle}/>
             
            
            
            </tr>  )}            
        </React.Fragment>
    )
}

export default LineItemLine;