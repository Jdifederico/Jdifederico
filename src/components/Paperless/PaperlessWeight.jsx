import React, {  useEffect} from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Image } from 'primereact/image';
import  { Input, Button, Datepicker, Dropdown } from '@mobiscroll/react';
import {usePaperless } from './PaperlessContext';
import { UserAuth } from '../../context/AuthContext'
import { useDebounce } from "@uidotdev/usehooks";

const PaperlessWeight = (props) => {

    const { freightBill,updateFreightBillWeights,uploadWeightFile, checkGearedTime, setFreightBill} = usePaperless();
    const { materials} = UserAuth();

 

    const weight = props.weight.item;
    const formatTime = props.formatTime;
    const openTimePicker= props.openTimePicker;

    const calcExcessStandBy = props.calcExcessStandBy;
    const getDifferenceInMinutes = props.getDifferenceInMinutes;
    const calcRunningTime = props.calcRunningTime;
    const  changeFreightTime = props.changeFreightTime
    const weightValue = useDebounce(weight.weight, 400);   
    
    function calcWeightTotal(e,weight){
        console.log('e target= '+ e.target.value);
      
       weight.weight=Number(e.target.value);
        console.log('weight length = '+ weight.weight.toString().length);
        if(weight.weight.toString().length>5 || weight.weight>99)alert('Warning you are entering a weight that is not valid. Please check the amount.')
        else{
            freightBill.tWeight=0;
            freightBill.progressTons =0
            freightBill.deliveredTons =0

            for(var i=0; i<freightBill.Weights.length; i++){
                console.log(' freightBill.Weights[i].weight = ' + freightBill.Weights[i].weight);
                if(checkGearedTime(freightBill.Weights[i].dumpEnd)) freightBill.deliveredTons+=Number(freightBill.Weights[i].weight)
                else freightBill.progressTons+=Number(freightBill.Weights[i].weight)
            
                freightBill.tWeight+=Number(freightBill.Weights[i].weight);
            }
            freightBill.tWeight =parseFloat(Math.round((Number(freightBill.tWeight))*100)/100);
            if (freightBill.BillType === 'Ton') freightBill.billedQty = Number(freightBill.tWeight);
            if (freightBill.PayType === 'Ton' || freightBill.PayType === 'Ton/Percent') freightBill.paidQty = Number(freightBill.tWeight);
            console.log(' freightBill.tWeight = ' +  freightBill.tWeight);
            setFreightBill(prevState => ({...prevState, 'Weights': freightBill.Weights}));
        
        }
    }


    function changeFreightBillWeightField(e, weightFieldName, weight) {
        weight[weightFieldName] = e.value;
        updateFreightBillWeights();
       
     }
     const findObjectById = (objectList, name) =>{
        for(let i=0; i<objectList.length; i++)if(objectList[i].Name===name)return objectList[i];
    }
    const changeWeightMaterial = (weight,newValue) => {
        weight.Material   = findObjectById (materials,newValue);
        weight.materialName=newValue;
        console.log(' weight.Material = ',  weight.Material);
        updateFreightBillWeights();
     }
 
  
    const changeWeightTime = (timeName, weight,newValue) => {
        console.log('newValue =' , weight);
      //  newValue=newValue.setDate(new Date().getDate());
        weight['mobile'+timeName] = new Date(newValue);
        weight[timeName]= new Date(newValue);
      //  console.log('new date ='  +new Date());
      //  console.log('new date  day='  +new Date().getDate());
     //   console.log('weight.loadNumber ='  + freightBill.Company.CalcRunningTime);

        if(weight.loadNumber===1){
            if(weight.loadStart){
                freightBill.startTime=weight.loadStart;
                if(freightBill.Subhauler)freightBill.startTimePaid = freightBill.startTime;
                changeFreightTime('startTime', 'mobileStartTime', freightBill.startTime)
            }
            if(freightBill.Company.CalcRunningTime==='First Load' ) {
                freightBill.departRoundTrip=weight.loadEnd;
                freightBill.arriveRoundTrip=weight.dumpStart;
                console.log('about to calc runnign time ')
                calcRunningTime(); 
            }
        }
      


        if(checkGearedTime(weight.loadStart) && checkGearedTime(weight.loadEnd)) {
            weight.fullExcessLoad = getDifferenceInMinutes( weight.loadStart,weight.loadEnd);
           
            if(weight.fullExcessLoad < 0)weight.fullExcessLoad = 1440 + weight.fullExcessLoad;
            if(freightBill.standLA>0 && freightBill.standLA!==''){
                if( weight.fullExcessLoad>freightBill.standLA) weight.excessLoad =Number(weight.fullExcessLoad)- Number(freightBill.standLA); else weight.excessLoad=0;

            }  else weight.excessLoad=weight.fullExcessLoad;
        }else weight.fullExcessLoad=0;

        if(weight.fullExcessLoad>600 && (timeName==='loadStart' || timeName==='loadEnd'))alert('Warning, time entered is over 600 minutes. Please review')

        if (checkGearedTime(weight.dumpStart) && checkGearedTime(weight.dumpEnd)) {
            weight.fullExcessDump = getDifferenceInMinutes( weight.dumpStart,weight.dumpEnd);
            if(weight.fullExcessDump < 0) weight.fullExcessDump = 1440 + weight.fullExcessDump;
          
            if(freightBill.standDA>0 && freightBill.standDA!==''){
                if(weight.fullExcessDump>freightBill.standDA)weight.excessDump = Number(weight.fullExcessDump)-Number(freightBill.standDA); else weight.excessDump=0;
            }else weight.excessDump=weight.fullExcessDump;
         
        }else weight.fullExcessDump=0;
        console.log('fullexcexss dump = ' + weight.fullExcessDump)
        console.log('newValue= ' +timeName)
        if(weight.fullExcessDump>600 && (timeName==='dumpStart' || timeName==='dumpEnd'))alert('Warning, time entered is over 600 minutes. Please review')

        let countedTrips = 0;
        let countedLoadStandBy =0;
        let countedDumpStandBy = 0 ;

        freightBill.totalExcessLoad=0;
        freightBill.totalExcessDump=0;
        freightBill.totalRoundTrip=0; 
        freightBill.fullExcessDump=0;
        freightBill.fullExcessLoad=0;
        freightBill.deliveredLoads=0;
        freightBill.progressLoads=0;
        freightBill.deliveredTons=0;
        freightBill.progressTons=0;

        for(var j=0; j<freightBill.Weights.length; j++){
            var calcWeight = freightBill.Weights[j];
            calcWeight.roundTrip=0;
            calcWeight.loadTrip=0;
            calcWeight.dumpTrip=0;

            if(checkGearedTime(calcWeight.loadEnd) && checkGearedTime(calcWeight.dumpStart)) calcWeight.dumpTrip= getDifferenceInMinutes(calcWeight.loadEnd, calcWeight.dumpStart);
            if( j>0 && checkGearedTime(calcWeight.loadStart) && checkGearedTime(freightBill.Weights[j-1].dumpEnd)) calcWeight.loadTrip= getDifferenceInMinutes(freightBill.Weights[j-1].dumpEnd, calcWeight.loadStart);
         
           
            if( j>0 && checkGearedTime(calcWeight.loadStart)) calcWeight.roundTrip = getDifferenceInMinutes(freightBill.Weights[j-1].loadStart, calcWeight.loadStart);
            if( calcWeight.roundTrip< 0) calcWeight.roundTrip= 1440 + calcWeight.roundTrip;
            console.log('calcWeight.roundTrip= ' + calcWeight.roundTrip);
            if(calcWeight.loadNumber=== weight.loadNumber && calcWeight.roundTrip>600 && newValue==='loadStart')alert('Warning, time entered is over 600 minutes. Please review')
            freightBill.totalExcessLoad+=Number(calcWeight.excessLoad);
            freightBill.totalExcessDump+=Number(calcWeight.excessDump);
            freightBill.fullExcessLoad+=Number(calcWeight.fullExcessLoad);
            freightBill.fullExcessDump+=Number(calcWeight.fullExcessDump);
            if( checkGearedTime(calcWeight.dumpEnd)){
                freightBill.deliveredLoads++; 
                freightBill.deliveredTons+=Number(calcWeight.weight)
            }else{
                freightBill.progressLoads++;
                freightBill.progressTons+=Number(calcWeight.weight)
            } 
            console.log('cfreightBill.progressLoads=  ' + freightBill.progressLoads);
            if(calcWeight.fullExcessLoad !==0 )countedLoadStandBy++;
            if(calcWeight.fullExcessDump !==0 )countedDumpStandBy++;
            if(calcWeight.roundTrip){
                if(calcWeight.roundTrip !==0){
                    countedTrips++;
                    freightBill.totalRoundTrip+=Number(calcWeight.roundTrip);

                }
                
            }
        }
        console.log('countedTrips = ' + countedTrips);
        console.log('freightBill.totalRoundTrip = ' + freightBill.totalRoundTrip); 
 
        if(countedTrips>0) freightBill.AverageRoundTrip = Math.round(freightBill.totalRoundTrip/countedTrips);
        if(countedLoadStandBy>0) freightBill.AverageLoadTime = Math.round(freightBill.fullExcessLoad/countedLoadStandBy); else freightBill.AverageLoadTime=0;
        if(countedDumpStandBy>0) freightBill.AverageDumpTime = Math.round(freightBill.fullExcessDump/countedDumpStandBy); else  freightBill.AverageDumpTime=0;
        //     if(countedTrips>0) freightBill.AverageRoundTrip +=freightBill.AverageDumpTime +freightBill.AverageLoadTime ;
        console.log('freightBill.AverageLoadTime  = ' + freightBill.AverageLoadTime );
        console.log('freightBill = ' , freightBill); 
        if(weight.loadNumber>=freightBill.Weights.length){
            if(weight.loadStart){
                freightBill.Status = 'Arrived Load';
                freightBill.StatusTime = weight.loadStart;
            }
            if(weight.loadEnd){
                freightBill.Status = 'Departed Load'; 
                freightBill.StatusTime = weight.loadEnd;
            }
            if(weight.dumpStart){
                freightBill.Status = 'Arrived Dump'; 
                freightBill.StatusTime = weight.dumpStart;
            }
            if(weight.dumpEnd){
                freightBill.realEndTime=weight.dumpEnd;
                console.log('setting end time to dump end and weight.dumpend = ', weight.dumpEnd)
                freightBill.endTime=weight.dumpEnd;
                changeFreightTime('endTime', 'mobileendTime', freightBill.endTime)
                freightBill.Status = 'Departed Dump';
                freightBill.StatusTime = weight.dumpEnd;
            } 
           
            if(freightBill.Company.CalcRunningTime){
                if(freightBill.Company.CalcRunningTime==='Last Load' && weight.loadEnd && weight.dumpStart) {
                    freightBill.departRoundTrip=weight.loadEnd;
                    freightBill.arriveRoundTrip=weight.dumpStart;

                    console.log('eight.loadEnd= ',weight.loadEnd)
                    
                    console.log('eight.dumpStart= ',weight.dumpStart)
                    changeFreightTime('departRoundTrip','mobileDepartRoundTrip', freightBill.departRoundTrip)
                    changeFreightTime('arriveRoundTrip','mobileArriveRoundTrip', freightBill.arriveRoundTrip)
                   calcRunningTime();
                 if(checkGearedTime(freightBill.endTime))    changeFreightTime('endTime', 'mobileendTime', freightBill.endTime)
                  
                }
            }
           
        }
 
       
      
    
      
   
    
        console.log('  freightBill.Status ='  +   freightBill.Status);
        calcExcessStandBy();
        formatTime();
        updateFreightBillWeights();
    }
    const deleteLoad = (weight) => {
        console.log('UMM WTF DELETING LOAD = ', weight)
   
        if (window.confirm("Are you sure you want to delete load?")) {
            freightBill.loads--;
            freightBill.Weights.splice(freightBill.Weights.indexOf(weight),1); 
            for(var i=0; i<freightBill.Weights.length; i++) freightBill.Weights[i].loadNumber=i+1;
            updateFreightBillWeights();
        }
      
    }


    const whatKindaVariableWeGetting = ( e, weight) => {
        console.log('wat is going on here e= ',e.target.files[0] )
        console.log('wtf weight = ', weight)
        uploadWeightFile(e.target.files[0],weight)
   
    };
  



            useEffect (() => {
                console.log('udpating weight value w ith the weight.weigt =' + weight.weight);
                updateFreightBillWeights();
            }, [weightValue]);

    return (
 
    <div   className=" mbsc-form-group mbsc-justify-content-center" style={{ margin: 0}}>   
        <div className="mbsc-row" style={{ margin:0}}>
            <div className="p-inputgroup mbsc-col-9 " style={{padding:0}}>
                <span className="p-inputgroup-addon for-load" > Load #: </span>
                <InputText    value={weight.loadNumber}  disabled={true} className="disabledLabel"  />
            </div>
           
            <div  className="mbsc-col-3" style={{padding:0}}>
                <Button id={'weightDelete_'+ weight.loadNumber} color="primary"  onClick={(event) => deleteLoad(weight)} style={{margin:"0", paddingLeft:"1em !important", paddingBottom: ".2em", paddingTop: ".2em", height:"100%"}}>Delete Load</Button>
            </div>
        </div>
        <div className="p-inputgroup">
            <span className="p-inputgroup-addon"  > Scale Tag #: </span>
            <InputNumber   useGrouping={false} value={weight.tagNO} onChange={(event) => changeFreightBillWeightField(event, "tagNO", weight)} disabled={freightBill.dSubmitted}  />
        </div>
        <div className="p-inputgroup">
            <span className="p-inputgroup-addon weight-material" > Weight: </span>
            <Input value={weight.weight} type="number" onChange={(event) => calcWeightTotal(event,weight)} disabled={freightBill.dSubmitted} />
        </div>
        <div className="p-inputgroup">
            <span className="p-inputgroup-addon weight-material" > Material: </span>       
            <Dropdown  disabled={freightBill.dSubmitted}   onChange={(event) => changeWeightMaterial(weight,event.target.value)} value={weight.materialName}  >
                {materials.map((item) => (
                    <option key={item.ID} value={item.Name}>{item.Name}</option>
                ))}
            </Dropdown>
                  
        </div>

        <div className="p-inputgroup">
            <span id={'loadStart'+weight.loadNumber} className="p-inputgroup-addon  for-time-label" > Arrive Load: </span> 
            <Datepicker   inputStyle="outline"  onOpen={(event,inst) => openTimePicker(inst)}  value ={weight.loadStart} timeFormat="HH:mm"  dateFormat='' stepSecond={0} onChange={(event) => changeWeightTime('loadStart', weight,event.value)}  controls={['time']}  disabled={freightBill.dSubmitted} display="center" touchUi={true}/> 
        </div>
        <div className="p-inputgroup ">
            <span id={'loadEnd'+weight.loadNumber} className="p-inputgroup-addon for-time-label" > Depart Load: </span> 
            <Datepicker   inputStyle="outline" onOpen={(event,inst) => openTimePicker(inst)}  value ={weight.loadEnd} timeFormat="HH:mm" dateFormat=''  stepSecond={0} onChange={(event) => changeWeightTime('loadEnd', weight,event.value)}  controls={['time']} disabled={freightBill.dSubmitted} display="center" touchUi={true}/> 
        </div>
        <div className="p-inputgroup">
            <span className="p-inputgroup-addon" > Load Stand By: </span>
            <InputNumber  maxFractionDigits={0} value={weight.excessLoad}  disabled={true} suffix=" min"  className="disabledLabel"  />
        </div>
        <div className="p-inputgroup ">
            <span id={'dumpStart'+weight.loadNumber} className="p-inputgroup-addon for-time-label" > Arrive Dump: </span> 
            <Datepicker   inputStyle="outline"  onOpen={(event,inst) => openTimePicker(inst)} value ={weight.dumpStart} timeFormat="HH:mm" dateFormat='' stepSecond={0}  onChange={(event) => changeWeightTime('dumpStart', weight,event.value)}  controls={['time']} disabled={freightBill.dSubmitted} display="center" touchUi={true}/> 
        </div>
        <div className="p-inputgroup ">
            <span id={'dumpEnd'+weight.loadNumber} className="p-inputgroup-addon  for-time-label" > Depart Dump: </span> 
            <Datepicker   inputStyle="outline"  onOpen={(event,inst) => openTimePicker(inst)} value ={weight.dumpEnd} timeFormat="HH:mm" dateFormat=''  stepSecond={0}  onChange={(event) => changeWeightTime('dumpEnd', weight,event.value)}  controls={['time']} disabled={freightBill.dSubmitted}  display="center" touchUi={true}/> 
        </div>
        <div className="p-inputgroup">
            <span className="p-inputgroup-addon" > Dump Stand By: </span>
            <InputNumber  maxFractionDigits={0} value={weight.excessDump} disabled={true} suffix=" min"  className="disabledLabel"  />
     
        </div>
        <div className="mbsc-row" style={{ margin:0}}>
            <div className="p-inputgroup" style={{  width:"50%"}}>
       
            <Button  color="primary"  onClick={(event) => document.getElementById('weightPic'+weight.loadNumber).click()} style={{margin:"0", paddingLeft:"1em !important", paddingBottom: ".2em", paddingTop: ".2em", height:"100%"}}>Upload Tag # {weight.loadNumber}</Button>

            <input type='file' id={'weightPic'+weight.loadNumber}  accept="image/*" capture="camera"  onChange={(event,inst) => whatKindaVariableWeGetting(event,weight)} style={{display:'none'}} base-sixty-four-input="true"/>

            </div>
            <div className="p-inputgroup" style={{ marginLeft:"1em", width:"45%"}}>
                <Image src={weight.TagUrl} alt="Image" zoomSrc={weight.TagUrl} height="100"  style={{margin:0, width:100}}  preview/>
            </div>   
        </div>    
 </div>  
  )
}

export default PaperlessWeight