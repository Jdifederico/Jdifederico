import React from 'react';

import  TableCell  from './TableCell';

const TotalItemLine = ({ totalItem }) => {
   


    return (
        <React.Fragment>
           {totalItem?.Total!==0 && (
            <tr className="mbsc-row" style={{ width: '100%', marginLeft: '1.1em' }}>
                <TableCell width='33%' isNumber={false} value={totalItem.Type} />
                {totalItem?.Qty!=='N/A' ? ( <TableCell width='33%' isNumber={true} value={totalItem.Qty} />):(<TableCell width='33%' isNumber={false} value={totalItem.Qty} />)}
                <TableCell width='33%' isNumber={true} value={totalItem.Total} />
            </tr>  )}            
        </React.Fragment>
    )
}

export default TotalItemLine;