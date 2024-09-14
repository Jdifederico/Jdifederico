import React, { useEffect, useState,  useRef} from 'react';
import GoogleMapReact from 'google-map-react';
import  { Button, Page  } from '@mobiscroll/react';
import {  useParams, useNavigate } from 'react-router-dom';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import {usePaperless } from './PaperlessContext';
const AnyReactComponent = ({ text }) => <div>{text}</div>;


const PaperlessLoadOrders = (props) => {
    const { fetchFreightBill,freightBill, loadOrders, setPaperlessState } = usePaperless();
    const { id, orgName } = useParams();
    const navigate = useNavigate();
    const defaultProps = {
        center: {
          lat: 10.99835602,
          lng: 77.01502627
        },
        zoom: 11
      };
    const navToPaperlessTrucksDispatch = props.navToPaperlessTrucksDispatch;
    const navToPaperlessFreightBill = props.navToPaperlessFreightBill;
    const navigateToLoadSite = () =>{
        window.location.href=" https://www.google.com/maps/dir//"+freightBill.loadAddress;
    }
    const navigateToDumpSite = () =>{
        window.location.href=" https://www.google.com/maps/dir//"+freightBill.loadAddress;
    }

    const navigateBackToDispatch = () =>{
      if(freightBill.TrucksAssigned>1)     navigate(`/trucksdispatch/${freightBill.companyID}/${freightBill.ID}`);
      else  navigate(`/dispatch/${freightBill.companyID}/${freightBill.ID}`);
    }
    const handleApiLoaded = (map, maps) => {
      const directionsService = new maps.DirectionsService();

      var directionsRequest = {
          origin: freightBill.loadAddress,
          destination: freightBill.dumpAddress,
          travelMode: maps.DirectionsTravelMode.DRIVING,
          unitSystem: maps.UnitSystem.IMPERIAL
      };
   
      directionsService.route(directionsRequest, function (response, status) {
        if (status == maps.DirectionsStatus.OK ){
            console.log('our status is ok boiiiss!!!')
            console.log('response =, ', response)
            let directionsRenderer= new maps.DirectionsRenderer({ map: map, directions: response });
            directionsRenderer.setDirections(response);
        } else console.log('status = ', status);
      });
    };
     
      useEffect(() => {
        setPaperlessState('paperlessloadorders');
        const getData = async () => {
          await fetchFreightBill(id, orgName).then((tempFreight) => {
              console.log('tempfreight thingy running  ', tempFreight.startTimePaid);     
          });
        };
        console.log('are we doing hte load order thing?= ' + orgName);
        getData();
    }, []);


    return (
      <Page>
        <div className="mbsc-grid mbsc-justify-content-center" >
          {freightBill.loadResults ? ( 

            <div   style={{ paddingTop:'3em', height: '50vh', width: '100%'}}>
            
            <GoogleMapReact yesIWantToUseGoogleMapApiInternals onGoogleApiLoaded={({map, maps}) =>  handleApiLoaded(map, maps)}
                bootstrapURLKeys={{ key: "AIzaSyBLRfT0lk65I2sQ7nJaHVWddKclD6ohiHI" }}
                defaultCenter={freightBill.loadResults}
                defaultZoom={defaultProps.zoom}
            >
                <AnyReactComponent lat={freightBill.loadResults.lat} lng={freightBill.loadResults.lng}  text="My Marker"    />

            </GoogleMapReact>
          </div>
       ): (  <div></div>  )}
        <Button color="primary" onClick={  (event,inst) =>  navigateBackToDispatch(event,inst) } style={{ paddingBottom: "1em", paddingTop: "1em"}}>Back to Dispatch</Button>
        <Button color="primary" onClick={navToPaperlessFreightBill} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Back to FB</Button>
         {freightBill.loadAddressOK && ( <Button color="primary" onClick={navigateToLoadSite} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Navigate To Load</Button>)}
         {freightBill.loadAddressOK && ( <Button color="primary" onClick={navigateToDumpSite} style={{ paddingBottom: "1em", paddingTop: "1em"}}>Navigate To Dump</Button>)}
            <DataTable  className="mbsc-justify-content-center" showGridlines sortField="loadOrder" sortOrder={1} value={loadOrders} style={{paddingTop:'3em'}} tableStyle={{ width: '100%' }}>
                <Column style={{ width: '3em' }} field="loadOrder" header="Load Order"></Column>
                <Column style={{ width: '2em' }} field="dispatchTime" header="Start Time"></Column>
                <Column style={{ width: '3em' }} field="Truck" header="Truck"></Column>
                <Column style={{ width: '2em' }} field="Name" header="Name"></Column>
            </DataTable>
         </div>
     </Page>
    )
}

export default PaperlessLoadOrders