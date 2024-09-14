import React, {  useEffect} from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {  faSort, faTrailer, faTruck } from '@fortawesome/free-solid-svg-icons'
const TruckDriverLine = (props) => {
    const driver= props.driver.item;
    const index = props.index.index;
    const onClick= props.onClick;
    
    if(driver.Type==='Dedicated') driver.Name= driver.DriverName;
    if(!driver){
        return null;
    }
    if(driver.OnDispatch) return null;
  // console.log('we got a subhauler  =' , driver)
   // <div className="mbsc-col-3" style={{fontSize:".9em"}}><span style={{fontWeight:"bold"}}>{driver.Trucks.length}</span>  </div>
   //     <div className="mbsc-col-5 font-weight-bold text-secondary" style={{fontSize:".75em"}}>{driver.DriverName}</div> 
    return (
        <React.Fragment>       
            <li className="listItem"  onClick={() => onClick(driver)}style={driver.Style}>
         
                <div className="mbsc-grid" style={{padding:"0px"}} >
                    
                    <div className="mbsc-row" style={{padding:"0", fontSize:".75em", fontFamily: "arial, verdana, sans-serif"}}> 
                        {driver.Type!=="Subhauler"?(<div className="mbsc-col-1" >  
                              <FontAwesomeIcon className="fas" icon={faSort} style={{  width:"1em"}}/>
                              <span style={{fontWeight:"bolder"}}>{driver.Priority}</span>
                        </div>):(<div></div>)}
                        {driver.Type!=="Subhauler"?( <div className="mbsc-col-3" >  {driver.Name}</div>):(<div className="mbsc-col-5" >{driver.DriverName}</div>)}
                        {driver.Type!=="Subhauler"?(<div className="mbsc-col-3" > 
                            <div className="mbsc-row" >  
                                <div className="mbsc-col-12 mbsc-col-md-6" style={{padding:"0px"}}>  
                                <FontAwesomeIcon className="fas" icon={faTruck} style={{  width:"1em", paddingRight:".25em"}}/>
                                {driver.Type==="Dedicated"?(<span >{driver.Truck} </span>):(<div style={{display:"inline"}}>
                                    {driver.Truck.Name!=="No Truck"?(<span >{driver.Truck.Name} </span>):(<div style={{display:"none"}}></div>) } </div>)}
                                </div>
                                <div className="mbsc-col-12 mbsc-col-md-6" style={{padding:"0px"}}>  
                                <FontAwesomeIcon className="fas" icon={faTrailer} style={{  width:"1em", paddingRight:".25em"}}/>
                                    {driver.Trailer.Name!=="No Trailer"?(<span >{driver.Trailer.Name}   </span>):(<div style={{display:"none"}}></div>) } 
                                </div>
                            </div>
                        </div>):(<div style={{display:"none"}}></div>)}
                        <div className="mbsc-col-4" >
                            {driver.displayCapabilities.map((item, capIndex) => (
                                <span style={{fontWeight: "bold"}} key={capIndex}>
                                    {item}{capIndex < driver.displayCapabilities.length - 1 && ', '}
                                </span>
                            ))}
                        
                                  
                            
                        </div>
                        {driver.Type!=="Subhauler"?(<div className="mbsc-col-1" style={{ textAlign:"right"}}> <i  className="fas fa-map" ></i><span style={{fontWeight:"bold"}}>{driver.DispatchNum}</span></div>):(
                        <div className="mbsc-col-3" ><span style={{fontWeight:"bold"}}>{driver.Trucks.length}</span>  </div>)}
                    </div>
                </div>
            </li>  

          
             
        </React.Fragment>
    )
  }
  
  export default TruckDriverLine