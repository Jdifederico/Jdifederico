import React,{useState, useEffect, useCallback} from 'react';
import { InputText } from 'primereact/inputtext';

import { getStorage, ref, uploadBytes,getDownloadURL} from "firebase/storage";
import { useGlobal } from '../../context/GlobalContext';
import debounce from 'lodash/debounce';
const LoadList = ({ load, changeFreightTime, calcRunningTime, getDifferenceInMinutes,setQtyandCalc, setFreightWeights, calcStandBy, weightIndex,  FreightBill}) => {
    const storage = getStorage();
    const {   showImagePopUp } = useGlobal();
    const [inputValues, setInputValues] = useState(null); 
    let freightBill={...FreightBill};
    console.log(' inputValues  for load = ', inputValues);
    useEffect(() => {
        console.log('load b4= '+ load.TagUrl)
        if (load) {
            setInputValues({...load});
            console.log('i dont understand I set the load tagurl top' + load.TagUrl)
        } 
    }, [load]);

    const handleFieldChange = (value, fieldName, calc)=>{
        setInputValues((prev) => ({ ...prev, [fieldName]: value })); 
        let tempInputValues={...inputValues};
        tempInputValues[fieldName]= value;
        console.log('setting ' + fieldName +' to ' + value)
        freightBill.Weights[weightIndex]=tempInputValues;

        if(calc){
            freightBill.tWeight=0;
            for (let i = 0; i < freightBill.Weights.length; i++) {
                freightBill.tWeight+=Number(freightBill.Weights[i].weight);
                console.log('adding weight = ' + Number(freightBill.Weights[i].weight))
            }  
            
   
            setQtyandCalc(freightBill)
        }else setFreightWeights(freightBill.Weights)
        
    }

    const formatTime =( time, timeName) =>{

        time= time.replace(/\./g,':');
        if (/^([01][0-9]|2[0-3])[0-5][0-9]$/.test(time)) time = time.substr(0, 2) + ':' + time.substr(2);
        else if (/^([0-9]|[0-3])[0-5][0-9]$/.test(time)) time= '0' + time.substr(0, 1) + ':' + time.substr(1);
        else if (/^([0-9]|[0-3]):[0-5][0-9]$/.test(time)) time = '0' + time.substr(0, 1) + ':' + time.substr(2, 3);
        setInputValues((prev) => ({ ...prev, [timeName]: time }));
        let weight = {...inputValues};
        let freight ={...freightBill};
        weight[timeName]=time;
        changeWeightTime(freight, {...weight})
    }
    const debouncedFormatTime = useCallback(debounce(formatTime, 1000), [formatTime]);

    const changeTimeField = (  time, timeName) =>{
        setInputValues((prev) => ({ ...prev, [timeName]: time }));
       
    }

    const calcExcessStandBy = function(freight){
        freight.totalExcessLoad=0;
        freight.totalExcessDump=0;
        freight.totalRoundTrip=0; 
        freight.fullExcessDump=0;
        freight.fullExcessLoad=0;
        var countedTrips=0;
        var countedLoadStandBy=0;
        var countedDumpStandBy=0;
     
        for (let i = 0; i < freight.Weights.length; i++) {
            let calcWeight =freight.Weights[i];
          
            calcWeight.roundTrip=0;
            calcWeight.loadTrip=0;
            calcWeight.dumpTrip=0;
            calcWeight.loadTrip=0;
     
            if( i>0 && calcWeight.loadStart && freight.Weights[i-1].dumpEnd) calcWeight.loadTrip =getDifferenceInMinutes(freight.Weights[i-1].dumpEnd,  calcWeight.loadStart);
            if(calcWeight.loadEnd && calcWeight.dumpStart)calcWeight.dumpTrip =getDifferenceInMinutes(calcWeight.loadEnd, calcWeight.dumpStart);
            console.log(' freight.standDA inside load componenet = '+ freight.standDA);
            if(!freight.standLA)freight.standLA=0;

           // calculate the raw standby
           if(calcWeight.loadStart && calcWeight.loadEnd)  calcWeight.fullExcessLoad= getDifferenceInMinutes( calcWeight.loadStart,   calcWeight.loadEnd ); else  calcWeight.fullExcessLoad=0;
           if(calcWeight.dumpStart && calcWeight.dumpEnd)  calcWeight.fullExcessDump=getDifferenceInMinutes( calcWeight.dumpStart,  calcWeight.dumpEnd ); else  calcWeight.fullExcessDump=0;
         

            if (calcWeight.fullExcessLoad <= freight.standLA) calcWeight.excessLoad = 0;
            if (calcWeight.fullExcessLoad > freight.standLA) calcWeight.excessLoad = calcWeight.fullExcessLoad- freight.standLA;
            freight.totalExcessLoad = parseFloat(Number(freight.totalExcessLoad + calcWeight.excessLoad));

            if (calcWeight.fullExcessDump <= freight.standDA ) calcWeight.excessDump = 0;
            if (calcWeight.fullExcessDump > freight.standDA) calcWeight.excessDump = calcWeight.fullExcessDump - freight.standDA;
            freight.totalExcessDump = parseFloat(Number(freight.totalExcessDump + calcWeight.excessDump));
  
            calcWeight.roundTrip=calcWeight.loadTrip + calcWeight.dumpTrip;
  
            freight.fullExcessLoad+=Number(calcWeight.fullExcessLoad);
            freight.fullExcessDump+=Number(calcWeight.fullExcessDump);

            if(calcWeight.fullExcessLoad !==0 )countedLoadStandBy++;
            if(calcWeight.fullExcessDump !==0 )countedDumpStandBy++;
         
            if(calcWeight.loadTrip !==0 && calcWeight.dumpTrip!==0){
                countedTrips++;
                freight.totalRoundTrip+=Number(calcWeight.roundTrip);   
            }
            delete calcWeight['LoadSite'];
            delete calcWeight['DumpSite'];
        
        }
        if(countedTrips>0) freight.AverageRoundTrip = Math.round(freight.totalRoundTrip/countedTrips);
        if(countedLoadStandBy>0) freight.AverageLoadTime = Math.round(freight.fullExcessLoad/countedLoadStandBy); else freight.AverageLoadTime=0;
        if(countedDumpStandBy>0) freight.AverageDumpTime = Math.round(freight.fullExcessDump/countedDumpStandBy); else  freight.AverageDumpTime=0;
      
        calcStandBy(freight);
    }
    const changeWeightTime = (freight, weight) => {
        console.log('newValue =' , weight);
       freight.Weights[weightIndex]={...weight};
        if(weight.loadNumber===1){
            if(weight.loadStart){
                freight.startTime=weight.loadStart;
                if(freight.Subhauler)freight.startTimePaid = freight.startTime;
               
            }
            if(freight.Company.CalcRunningTime==='First Load' ) {
                freight.departRoundTrip=weight.loadEnd;
                freight.arriveRoundTrip=weight.dumpStart;
                console.log('about to calc runnign time ')
           
                calcRunningTime(freight); 
            }
        }

        if(weight.loadNumber>=freight.Weights.length){
            if(weight.dumpEnd){
                freight.realEndTime=weight.dumpEnd;
                freight.endTime=weight.dumpEnd;
            } 
           
            if(freight.Company.CalcRunningTime){
                if(freight.Company.CalcRunningTime==='Last Load' && weight.loadEnd && weight.dumpStart) {
                    freight.departRoundTrip=weight.loadEnd;
                    freight.arriveRoundTrip=weight.dumpStart;
                    calcRunningTime(freight);
                }
            } 
        }
        console.log('about to calc stand by and weights = ', freight.Weights)
        calcExcessStandBy(freight);
        changeFreightTime(freight);
    
    }

    const startUpload=(event)=>{
        console.log('we have started an uplaod and event ', event)
        uploadFile(event.target.files[0])
    }
    const uploadFile = async(file)=>{
        console.log('file = ', file.name)

        let storageRef= ref(storage, 'attachments/' + freightBill.companyID+'/FreightBills/' +freightBill.ID+'/Weights/'+file.name);

        uploadBytes(storageRef, file).then((snapshot) => {
            getDownloadURL(storageRef).then((url) => {
            
            handleFieldChange( url,'TagUrl' ,false)
          });
        });
      }
      if(!inputValues) return( <React.Fragment></React.Fragment>)
    return (
        <React.Fragment>
            {inputValues && (
        <tr className="mbsc-row" style={{ width: '100%', marginLeft: '1.1em',borderBottom:'1px solid #dee2e6'}}>
            
            <td style={{ width: '12%', padding: '0' }}> <InputText  value={inputValues.tagNO}  type="text" onChange={(e) => handleFieldChange( e.target.value, 'tagNO', false)} className="tableInput" /></td> 
           
    
            <td style={{ width: '13%', padding: '0' }}> <InputText  value={inputValues.loadStart} maxLength={5} onChange={(e) =>changeTimeField(e.target.value, 'loadStart')} onBlur={(e) =>formatTime(e.target.value, 'loadStart')} className="tableInput" /></td> 
            <td style={{ width: '13%', padding: '0' }}> <InputText  value={inputValues.loadEnd} maxLength={5} onChange={(e) =>changeTimeField(e.target.value, 'loadEnd')} onBlur={(e) =>formatTime(e.target.value, 'loadEnd')} className="tableInput" /></td> 
            <td style={{ width: '13%', padding: '0' }}> <InputText  value={inputValues.dumpStart} maxLength={5} onChange={(e) =>changeTimeField(e.target.value, 'dumpStart')} onBlur={(e) =>formatTime(e.target.value, 'dumpStart')} className="tableInput" /></td> 
            <td style={{ width: '13%', padding: '0' }}> <InputText  value={inputValues.dumpEnd} maxLength={5} onChange={(e) =>changeTimeField(e.target.value, 'dumpEnd')}  onBlur={(e) =>formatTime(e.target.value, 'dumpEnd')} className="tableInput" /></td> 
    
            <td style={{ width: '12%', padding: '0' }}> <InputText  value={inputValues.weight}  type="text" onChange={(e) => handleFieldChange( e.target.value, 'weight', true)} className="tableInput" /></td> 
            <td style={{ width: '12%', padding: '0' }}> 
                {inputValues.TagUrl ? ( <button style={{ margin: '0', padding: '.5em', width:"95%" }} onClick={(e) =>   handleFieldChange('','TagUrl' ,false)}    className="mbsc-ios mbsc-btn-primary mbsc-btn"     >  Delete Attach </button>):
                (<div>   
                    <button style={{ margin: '0', padding: '.5em', width:"95%" }}      className="mbsc-ios mbsc-btn-primary mbsc-btn"   onClick={(event) => document.getElementById('weightUpload'+load.loadNumber).click()} >Upload File</button>
                    <input type='file' id={'weightUpload'+load.loadNumber}    onChange={(event,inst) => startUpload(event)} style={{display:'none'}} base-sixty-four-input="true"/>
                </div> )} 
            </td> 
            {inputValues.TagUrl && ( <td style={{ width: '12%', padding: '0' }}>  <button style={{ margin: '0', padding: '.5em', width:"95%" }}   onClick={(e) => showImagePopUp(inputValues.TagUrl, e)}   className="mbsc-ios mbsc-btn-primary mbsc-btn"     >  Show Tag </button></td> )}
        </tr>)}
        </React.Fragment>
    );
};

export default LoadList;