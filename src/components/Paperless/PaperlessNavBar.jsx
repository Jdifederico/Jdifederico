import React ,{useRef, useState, useEffect} from 'react';
import '@mobiscroll/react4/dist/css/mobiscroll.min.css';
import mobiscroll from '@mobiscroll/react4';
import { ListBox } from 'primereact/listbox';
import {usePaperless } from './PaperlessContext';
import { OverlayPanel } from 'primereact/overlaypanel';
const PaperlessNavBar = (props) => {
  const popup= useRef(null);
  const { navListItems} = usePaperless();
 
  const logout = props.logout;
  const [visible, setVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);



  const navToPaperlessHome = props.navToPaperlessHome;
  const testOnClick = (event) =>{
    console.log('event = ', event)
    console.log('we testing on clikkku contentu!',popup.current.getContent);
    console.log('we testing on clikkku elementu!',popup.current.getElement);
    //setSelectedCity(eventvalue);
    popup.current.toggle(event);
  } 
  
  useEffect(() => {
    console.log('navListItems= ', navListItems)
  },[navListItems]);
 
  const changeList =(event)=>{
    console.log(popup)
    popup.current.toggle(event);
    if(event.action)event.action.action();  
    
  }

  return (
    <div> 
                  

      <mobiscroll.BottomNav theme="ios"   themeVariant="light"  type="bottom"  layout={3} display="bottom" >
        <mobiscroll.NavItem onClick={navToPaperlessHome}  data-id="1" icon="calendar">Home</mobiscroll.NavItem>
        <mobiscroll.NavItem   id="OptionTab" onClick={(e)=>testOnClick(e)} icon="cogs">Options</mobiscroll.NavItem>
      </mobiscroll.BottomNav> 
    
      <OverlayPanel ref={popup} position='bottom-right'  style={{paddingRight:'1.5em'}}   onHide={() => setVisible(false)}>
          <ListBox value={selectedCity} onChange={(e) => changeList(e.value)} options={navListItems} optionLabel="name" className="w-full md:w-14rem" />
        </OverlayPanel>
      <mobiscroll.Popup  ref={popup} display="bubble"     buttons={[]}  >

      </mobiscroll.Popup>

    </div>
  )
}

export default PaperlessNavBar