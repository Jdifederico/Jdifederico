import React from 'react';


const NumberCell = ({ number }) => {
  //  console.log(' NOTE ON LAOD = ', note);


    return (
        <React.Fragment>
            {(number || number===0) && (<span style={{display:'block', textAlign:'right', paddingRight:'1em'}}>${Number(number).toFixed(2)}</span>)}
           
        </React.Fragment>
    );
};

export default NumberCell;