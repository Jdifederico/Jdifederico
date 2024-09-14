import React, {  useEffect} from 'react';

import TruckDriverLine from './TruckDriverLine';

const TruckBankList = (props) => {
    const truckBankList= props.list;
    console.log('truckBankList re rendering = ' , truckBankList)
    const openDriverPopUp= props.openDriverPopUp;
 

    if(!truckBankList){
        return null;
    }
    return (
        <React.Fragment> 
            <ul id ="UnassignedTruckBankDriversList"    className="tableList"  > 
                {truckBankList.map((item,index) => (
                    <TruckDriverLine key={item.ID}   driver={{item}}   index={{index}} openDriverPopUp={openDriverPopUp}      ></TruckDriverLine>
                ))}   
            </ul>    
        </React.Fragment>
    )
  }
  
  export default TruckBankList