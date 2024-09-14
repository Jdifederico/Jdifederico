import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMinusCircle, faSort, faTrailer, faTruck } from '@fortawesome/free-solid-svg-icons';

const FreightSummaryLine = ({ freight, index, onDelete }) => {
    const freightItem = freight.item;
    const itemIndex = index.index;
    let backgroundColor = '';

    if (freightItem.Received === true) {
        backgroundColor = '#c9e7ca';
    } else if (freightItem.textSent === true && freightItem.Received !== true) {
        backgroundColor = '#fcf1d0';
    }

    return (
        <div>
            <li className='listItem' style={{ ...itemIndex === 0 ? { borderTop: 'none' } : {}, backgroundColor }}>
                <div className="mbsc-grid " style={{padding:"0px",fontSize:".75em"}}>
                    <div className="mbsc-row mbsc-justify-content-between"> 
                        <div className="mbsc-col-1" style={{paddingLeft:"1em !important", paddingRight:"0px"}}>
                            <FontAwesomeIcon className="fas" icon={faSort} style={{  width:"1em"}}/>
                            {freightItem.loadOrder}
                        </div>
                        <div className="mbsc-col-2"  style={{paddingLeft:"0px",paddingRight:"0px" ,fontWeight: "700",fontSize:".9em"}}>{freightItem.driverName}</div>
                        <div className="mbsc-col-1"  style={{paddingLeft:"0px",paddingRight:"0px" }}><span >{freightItem.TruckType.TruckCode}</span></div> 
                        <div className="mbsc-col-1"  style={{paddingLeft:"0px",paddingRight:"0px"}}> 
                            <FontAwesomeIcon className="fas" icon={faTruck} style={{  width:"1em", paddingRight:".2em"}}/>
                            {freightItem.Truck.Name && freightItem.Truck.Name!=='No Truck'?(  <span >{freightItem.Truck.Name} </span>  ):(<span> </span>)}
                        </div>
                        <div className="mbsc-col-1" style={{paddingLeft:"0px",paddingRight:"0px"}}>
                            <FontAwesomeIcon className="fas" icon={faTrailer} style={{  width:"1em"}}/>
                            {freightItem.Trailer.Name && freightItem.Trailer.Name!=='No Trailer'?( <span >{freightItem.Trailer.Name} </span> ):(<span></span>)}
                        </div>
                        <div className="mbsc-col-3" style={{paddingLeft:"0px",paddingRight:"0px"}} > {freightItem.Material.Name && freightItem.Material.Name!=='No Material'?( <span >{freightItem.Material.Name}</span> ):(<span></span>)}</div>
        
                        <div className="mbsc-col-1"  style={{paddingLeft:"0px",paddingRight:"0px"}}>{freightItem.dispatchTime}</div>
                        <div className="mbsc-col-1 "  style={{paddingLeft:"0px",paddingRight:"0px",textAlign: "right"}}> 
                            <span  style={{cursor:"pointer"}} onClick={() => onDelete(freightItem.ID)}>   
                                <FontAwesomeIcon className="fas" icon={faMinusCircle} style={{color:"red", height:"1.25em", width:"1.25em !important"}}/> 
                            </span>
                        </div>
                    </div>
                    
                </div>
            </li>                 
        </div>    
    )
}

export default FreightSummaryLine;