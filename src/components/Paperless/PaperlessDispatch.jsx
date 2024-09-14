import React, { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card } from 'primereact/card';
import "@mobiscroll/react/dist/css/mobiscroll.min.css";
import {useNavigate } from 'react-router-dom'
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import  { Input, Page, Textarea, Button } from '@mobiscroll/react';
import '@mobiscroll/react4/dist/css/mobiscroll.min.css';
import mobiscroll from '@mobiscroll/react4';
import {usePaperless } from './PaperlessContext';
import { Editor } from 'primereact/editor';

function PaperlessDispatch(props) {
    const dispatchNotesRef = useRef(null);
    const { id, orgName } = useParams();
    const [driverNotes, setDriverNotes] = useState('');
    const [jobNotes, setJobNotes] = useState('');
    const [test, setTest] = useState(false);
    const { fetchFreightBill,freightBill, setPaperlessState,truckFreightBills,setFreightBill } = usePaperless();
    const navigate = useNavigate();
    const navToPaperlessLoadOrders = props.navToPaperlessLoadOrders;
    const navToPaperlessFreightBill = props.navToPaperlessFreightBill;
    useEffect(() => {
        setPaperlessState('paperlessdispatch');
        const getData = async () => {
            const data = await fetchFreightBill(id, orgName).then((tempFreight) => {
                console.log('tempfreight thingy running  ',tempFreight);
            });
        
    
        };
        getData();
    }, []);
 
   
    useEffect(() => {
        setDriverQuillNotes();
    }, [freightBill.FBNoteToDriverQuill]);
  

    const navigateToLoadOrders = (event,inst) =>{
        navigate(`/loadorders/${freightBill.companyID}/${freightBill.ID}`);  
    }
    const openTruckFreightBill = (event,inst) =>{
       navigate(`/freightbill/${event.data.companyID}/${event.data.ID}`);  

    }
    function mapQuillAttributes( html, ops){
    
        let tag = "";
        let openTags =[];
        ops.forEach((op,index) => {
            const { insert, attributes } = op; 
            if (attributes) {
                Object.keys(attributes).forEach(attr => {
                if (attr === "bold") {
                    tag += "<strong>";
                    openTags.push("</strong>");
                } else if (attr === "italic") {
                    tag += "<em>";
                    openTags.push("</em>");
                } else if (attr === "underline") {
                    tag += "<u>";
                    openTags.push("</u>");
                } else if (attr === "color") {
                    tag += `<span style="color: ${attributes.color}">`;
                    openTags.push('</span>');
                } else if (attr === "background") {
                    tag += `<span style="background-color: ${attributes.background}">`;
                    openTags.push('</span>');
                }
                });
            }
        
            html += `${tag}${insert}${openTags.reverse().join('')}`;
            })
        return html;
        
    }

    function quillOpsToHtml(ops) {
        let html = "<p>";
        let openTags = [];

        ops.forEach((op,index) => {
        const { insert, attributes } = op;

        if (insert.includes('\n')) {
            const insertParts = insert.split('\n');
            insertParts.forEach((part, i) => {
                if (i === 0 && part)   html = `${mapQuillAttributes( html, [{ insert: part }])}`;
                // Add opening and clsoing paragraph tag for new line
                html+=`</p><p>`
                if(i!=0 && part) html = `${mapQuillAttributes( html, [{ insert: part }])}`;
            });
        
        } else {
            html = `${mapQuillAttributes(html, [op])}`;
            if (index === ops.length - 1)  html += "</p>";   
            openTags = [];
        }
        });
        return html;
    }

    const setJobQuillNotes = () =>{
        if(freightBill.QuillDriverNotes){
            console.log('freightBill.QuillDriverNotes = ' , freightBill.QuillDriverNotes);

            setJobNotes(quillOpsToHtml(freightBill.QuillDriverNotes))
            console.log('jobNotes = '+ jobNotes);
        }
    }

    const setDriverQuillNotes = () =>{
        if(freightBill.FBNoteToDriverQuill){
            if(freightBill.FBNoteToDriverQuill.length>0){
                console.log('freightBill.QuillDriverNotes = ' , freightBill.FBNoteToDriverQuill);
                setDriverNotes(quillOpsToHtml(freightBill.FBNoteToDriverQuill))
                console.log('jobNotes = '+ jobNotes);
            }
        }
    }
    const navigateToLoadSite = () =>{
        console.log('freightBill.loadAddress= ' +freightBill.loadAddress )
        window.location.href=" https://www.google.com/maps/dir//"+freightBill.loadAddress;
      }
      const navigateToDumpSite = () =>{
        console.log('freightBill.loadAddress= ' +freightBill.dumpAddress )
        window.location.href=" https://www.google.com/maps/dir//"+freightBill.dumpAddress;
      }
    const renderHeader = () => {
        return (
            <div height="0"></div>
        );
    }; 

    const header = renderHeader();
    if (!freightBill) {
        return( <div>Loading...</div>)
    }
    return (
    <Page>
        <div>
            {freightBill.JobDate ? ( 
                <div className="mbsc-grid mbsc-justify-content-center" style={{padding:"0"}}> 
                    <div className="mbsc-col-xl-6 mbsc-col-lg-9 mbsc-offset-lg-1 mbsc-offset-xl-3 mbsc-md-12" style={{padding:"0"}}>
                        <Card  >  
                            <mobiscroll.CardHeader>
                                <mobiscroll.CardTitle style={{ textAlign: 'center',fontSize: '30px'}}>Dispatch for {freightBill.JobDate}</mobiscroll.CardTitle>
                            </mobiscroll.CardHeader>
                            {freightBill.Cancelled  && (
                                <img  style={{top:"200px ",left:"0px", position:"absolute",zIndex:"9999" }}   src="https://firebasestorage.googleapis.com/v0/b/alianza-47fa6.appspot.com/o/Cancelled.png?alt=media&token=57d5f24e-e280-4083-b21e-e1505b5cb430"></img>
                            )}
                            <div className="mbsc-form-group">
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon"  >Driver Name:</span> 
                                        <Input  className="disabledLabel" value={freightBill.driverName} disabled={true} id="driverName" />
                                    </div>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon"  >Company:</span> 
                                        <Input className="disabledLabel" value={freightBill.Company.CompanyName} disabled={true} id="account2" />
                                    </div>
                                    {freightBill.Shipper.Name!=='No Shipper' && (
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon"  >Shipper:</span> 
                                        <Input className="disabledLabel"  disabled={true}  value={freightBill.Shipper.Name}   id="shipper" />
                                    </div>
                                    )}
                                    {freightBill.Receiver && freightBill.Receiver.Name!=='No Receiver' && (
                                        <div className="p-inputgroup" >
                                            <span className="p-inputgroup-addon"  >Receiver:</span> 
                                            <Input className="disabledLabel"  disabled={true}  value={freightBill.Receiver.Name}   id="receiver" />
                                        </div>
                                    )}
                                    {freightBill.Foreman && (
                                        <div>
                                            {freightBill.Foreman.Name!=='No Foreman' && (
                                                <div className="p-inputgroup" >
                                                    <span className="p-inputgroup-addon"  >Foreman:</span> 
                                                    <Input className="disabledLabel"  disabled={true}  value={freightBill.Foreman.Name}    id="foremanname"  />
                                                </div>
                                            )}
                                            {freightBill.Foreman.Phone && (
                                                <div className="p-inputgroup" >
                                                    <span className="p-inputgroup-addon"  >Foreman Phone:</span> 
                                                    <Input className="disabledLabel"  disabled={true}  value={freightBill.Foreman.Phone}    id="foremanphone"  />
                                                </div>
                                            )}
                                        </div>
                                    )}
                          
                        
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon"  >Job Date:</span> 
                                        <Input  className="disabledLabel" value={freightBill.JobDate} disabled={true} id="jobDate" />
                                    </div>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon"  >Job #: </span> 
                                        <Input   className="disabledLabel" value={freightBill.jobNO} disabled={true} id="account" />
                                    </div>
                                    {freightBill.Material.Name !== 'No Material' && (
                                        <div className="p-inputgroup" >
                                            <span className="p-inputgroup-addon"  >Material:</span> 
                                            <Input className="disabledLabel" value={freightBill.Material.Name} disabled={true}  id="account" />
                                        </div>    
                                    )}
                                    {freightBill.LoadSite.Name !== 'No Location' && ( 
                                        <div className="p-inputgroup" >
                                            <span className="p-inputgroup-addon"  >Load Site:</span> 
                                            <Textarea  className="disabledLabel" value={freightBill.LoadSite.Name} disabled={true} id="loadSite"  />
                                        </div>
                                    )}
                                    {freightBill.LoadSite.fullAddress !== ', , , ' && freightBill.LoadSite.fullAddress !== '' && (
                                        <div className="p-inputgroup" >
                                            <span className="p-inputgroup-addon" style={{width:"42%"}}  >Load Address:</span>  
                                            <Textarea className="disabledLabel" value={freightBill.LoadSite.fullAddress} disabled={true} id="loadSiteAdd" />
                                            {freightBill.loadAddressOK && ( <Button style={{width: "10%", margin:0}} color="primary" onClick={navigateToLoadSite} ><i className="pi pi-send"></i></Button>)}

                                        </div>
                                    )}
                                    {freightBill.standLA !== '' && ( 
                                        <div className="p-inputgroup" >
                                            <span className="p-inputgroup-addon"  >Load Stand By:</span> 
                                            <Input  className="disabledLabel" value={freightBill.standLA} disabled={true} id="standLA"  />
                                        </div>
                                   )}
                                    {freightBill.DumpSite.Name !== 'No Location' && ( 
                                        <div className="p-inputgroup" >
                                            <span className="p-inputgroup-addon"  >Dump Site:</span> 
                                            <Textarea  className="disabledLabel" value={freightBill.DumpSite.Name} disabled={true} id="dumpSite"  />
                                        </div>
                                    )}
                                    {freightBill.DumpSite.fullAddress !== ', , , ' && freightBill.DumpSite.fullAddress !== '' && ( 
                                        <div className="p-inputgroup" >
                                            <span className="p-inputgroup-addon" style={{width:"42%"}} >Dump Address:</span> 
                                            <Textarea  className="disabledLabel" value={freightBill.DumpSite.fullAddress} disabled={true} id="dumpSiteAdd"  />
                                            {freightBill.loadAddressOK && ( <Button style={{width: "10%", margin:0}} color="primary" onClick={navigateToDumpSite} ><i className="pi pi-send"></i></Button>)}

                                        </div>
                                    )}
                                    {freightBill.standDA !== '' && ( 
                                        <div className="p-inputgroup" >
                                            <span className="p-inputgroup-addon"  >Dump Stand By:</span> 
                                            <Input className="disabledLabel" value={freightBill.standDA} disabled={true} id="standDA"  />
                                        </div>
                                    )}
                                    {freightBill.PayRate !== '' && ( 
                                        <div className="p-inputgroup" >
                                            <span className="p-inputgroup-addon"  >Pay Rate:</span> 
                                            <Input  className="disabledLabel" value={freightBill.PayRate} disabled={true}  />
                                        </div>
                                    )}
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon"  >Pay Type:</span> 
                                        <Input className="disabledLabel" value={freightBill.PayType} disabled={true}  />
                                    </div>
                                    <div className="p-inputgroup" >
                                        <span className="p-inputgroup-addon"  >Start Time:</span> 
                                        <Input className="disabledLabel" value={freightBill.dispatchTime} disabled={true} id="startTime"  />
                                    </div>    
                                    {freightBill.TrucksAssigned > 1 && (
                                        <React.Fragment>
                                        <div className="p-inputgroup" >
                                            <span className="p-inputgroup-addon"  >Trucks Ordered:</span> 
                                            <Input className="disabledLabel" value={freightBill.TrucksAssigned} disabled={true} id="trucksordered"  />  
                                        </div>   

                                    <DataTable  className="mbsc-justify-content-center" showGridlines sortField="loadOrder" onRowClick={  (event,inst) =>  openTruckFreightBill(event,inst) } sortOrder={1} value={truckFreightBills} style={{paddingTop:'1em', paddingBottom:'1em'}} tableStyle={{ width: '100%' }}>
                                        <Column style={{ width: '3em' }} field="loadOrder" header="Load Order"></Column>
                                        <Column style={{ width: '2em' }} field="dispatchTime" header="Start Time"></Column>
                                        <Column style={{ width: '3em' }} field="Truck.Name" header="Truck"></Column>
                                   
                                    </DataTable>
                                    </React.Fragment>
                                    )}      
                             
                                    {freightBill.TrucksAssigned===1 && (
                                        <React.Fragment>
                                            <div className="p-inputgroup" >
                                                <span className="p-inputgroup-addon">Load Order:</span> 
                                                <Input className="disabledLabel" value={freightBill.loadOrder} disabled={true}  />
                                            </div>
                                            
                                            {freightBill.TruckType.Name!='Any' && freightBill.TruckType.Name!='No Truck Type' && (  
                                                <div className="p-inputgroup" >
                                                    <span className="p-inputgroup-addon"  >Truck Type:</span>  
                                                    <Input  className="disabledLabel" value={freightBill.TruckType.Name} disabled={true}  />
                                                </div> 
                                            )}  
                                            <div className="p-inputgroup" >
                                                <span className="p-inputgroup-addon"  >Truck #:</span>
                                                <Input  className="disabledLabel" value={freightBill.Truck.Name} disabled={true}  />   
                                            </div> 
                                            {freightBill.Trailer && (
                                                <div className="p-inputgroup" >
                                                    <span className="p-inputgroup-addon"  >Trailer #:</span>
                                                    <Input  className="disabledLabel" value={freightBill.Trailer.Name} disabled={true}  />
                                                </div>     
                                            )}
                                        </React.Fragment>
                                    )}
                                    <div className="p-inputgroup" style={{background: "#0000001c"}}>
                                        <span className="p-inputgroup-addon"  > Job Note: </span>
                                        <Editor  headerTemplate={header} onLoad={setJobQuillNotes} placeholder='No notes' value={jobNotes} readOnly  />
                                    </div> 

                                    <div className="p-inputgroup" style={{background: "#0000001c"}}>
                                        <span className="p-inputgroup-addon"  >Driver Note: </span>
                                        <Editor   headerTemplate={header} onLoad={setDriverQuillNotes} placeholder='No notes' value={driverNotes} readOnly  />
                                    </div> 
                                    <div className="mbsc-button-group-block" style={{ paddingRight: "2em"}}>
                                    {freightBill.TrucksAssigned === 1 && (
                                          <Button color="primary" onClick={navToPaperlessFreightBill} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Enter Freight Bill</Button>
                                          )}   
                                          <Button color="primary" onClick={  (event,inst) =>  navigateToLoadOrders(event,inst) } style={{ paddingBottom: "1em", paddingTop: "1em"}}>Load Order/Map</Button>
                                    </div>
                            
                                    
                            </div>
                        </Card>
                    </div>   
                </div> 
            ): ( <div>Loading...</div> )}
        </div>
    </Page>
    );
}

export default PaperlessDispatch;