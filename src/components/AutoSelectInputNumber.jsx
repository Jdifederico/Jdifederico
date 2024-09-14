import React from 'react';
import { InputNumber } from 'primereact/inputnumber';

const AutoSelectInputNumber = ({ onFocus, isCurrency,  ...props }) => {

    const minFractionDigits = isCurrency ? 2 : 0;
    const handleFocus = (e) => {
        e.target.select();
        if (onFocus) {
            onFocus(e); // Call any existing onFocus if provided
        }
    };

    return <InputNumber {...props}  minFractionDigits={minFractionDigits} onFocus={handleFocus} />;
};

export default AutoSelectInputNumber;