import React, { useEffect, useRef, useState, useCallback } from 'react';
import GoogleMapReact from 'google-map-react';

const AnyReactComponent = ({ text }) => <div>{text}</div>;

const MapComponent = ({ dispatch }) => {
    const mapRef = useRef(null);
    const mapsRef = useRef(null);
    const directionsServiceRef = useRef(null);
    const directionsRendererRef = useRef(null);
    const [center, setCenter] = useState({ lat: 39.8283, lng: -98.5795 }); // Default to center of the US

    const handleApiLoaded = useCallback(async (map, maps) => {
        mapRef.current = map;
        mapsRef.current = maps;

        directionsServiceRef.current = new maps.DirectionsService();
        directionsRendererRef.current = new maps.DirectionsRenderer();

        directionsRendererRef.current.setMap(map);

        // Now get the real latitude and longitude
        try {
            const loadSiteLatLng = await getLatLng(dispatch.LoadSite.fullAddress);
            setCenter(loadSiteLatLng); // Update the center of the map

            const dumpSiteLatLng = await getLatLng(dispatch.DumpSite.fullAddress);

            dispatch.loadResults = loadSiteLatLng;

            const directionsRequest = {
                origin: loadSiteLatLng,
                destination: dumpSiteLatLng,
                travelMode: 'DRIVING',
            };

            directionsServiceRef.current.route(directionsRequest, (result, status) => {
                if (status === mapsRef.current.DirectionsStatus.OK) {
                    directionsRendererRef.current.setDirections(result);
                }
            });
        } catch (error) {
            console.error("Error getting latitude and longitude:", error);
        }
    }, [dispatch]);

    const getLatLng = useCallback((address) => {
        return new Promise((resolve, reject) => {
            const geocoder = new mapsRef.current.Geocoder();
            geocoder.geocode({ address }, (results, status) => {
                if (status === mapsRef.current.GeocoderStatus.OK) {
                    const location = results[0].geometry.location;
                    resolve({
                        lat: location.lat(),
                        lng: location.lng()
                    });
                } else {
                    reject(`Geocode was not successful for the following reason: ${status}`);
                }
            });
        });
    }, []);

    return (
        <div style={{ height: '400px', width: '100%' }}>
            <GoogleMapReact
                yesIWantToUseGoogleMapApiInternals
                onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}
                bootstrapURLKeys={{ key: 'YOUR_GOOGLE_MAPS_API_KEY' }}
                center={center}
                defaultZoom={10}
            >
                <AnyReactComponent lat={center.lat} lng={center.lng} text="My Marker" />
            </GoogleMapReact>
        </div>
    );
};

export default MapComponent;
