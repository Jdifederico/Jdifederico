import React from 'react';
import NumberCell from './NumberCell';

const TableCell = ({ width, isNumber, value, borderStyle }) => {
    if(!borderStyle)borderStyle='1px 1px 1px 1px ';

  return (
    <td style={{ width: width, padding: '0', borderWidth: borderStyle, borderColor:'#bcbcd1', borderStyle:'solid' }}>
      {isNumber ? <NumberCell number={value} /> : <span style={{textAlign:'right', float:'right', paddingRight:'2em'}}>{value}</span>}
    </td>
  );
};

export default TableCell;