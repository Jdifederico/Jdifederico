import React, { useRef } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { useGlobal } from '../../context/GlobalContext'
const ImagePopUp = (props)=> {

    const {imageURL, setImageVisible,imageRef}= useGlobal();

    console.log('imageURL= ', imageURL)
    const adjustPosition = () => {
        if (imageRef.current) {
            // Get the current left position from the overlay panel
            console.log('imageRef.current = ', imageRef.current)
            const overlayElement = imageRef.current.getElement();
            if (overlayElement) {
                const currentLeft = parseInt(overlayElement.style.left, 10);
                // Adjust the position 500px to the left
                overlayElement.style.left = `${currentLeft - 200}px`;
            }
        }
    };
    return (
 
     
        <OverlayPanel id="imagePanel" ref={imageRef} onShow={adjustPosition}>
                <img style={{width:"55em", height:"55em"}} src={imageURL} ></img>
            </OverlayPanel>
   
    );
}
export default ImagePopUp;