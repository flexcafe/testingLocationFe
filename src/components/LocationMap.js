import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const createColorIcon = (color) => {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
            <path d="M12.5 0C5.6 0 0 5.6 0 12.5C0 21.9 12.5 41 12.5 41S25 21.9 25 12.5C25 5.6 19.4 0 12.5 0z"
                  fill="${color}" stroke="#fff" stroke-width="1.5"/>
            <circle cx="12.5" cy="12.5" r="5.5" fill="#fff"/>
        </svg>`;

    return new L.Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(svg)}`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    });
};

const LocationMap = ({ users, currentLocation, userName, avatarColor }) => {
    const mapRef = useRef(null);

    useEffect(() => {
        if (currentLocation && mapRef.current) {
            mapRef.current.setView([currentLocation.latitude, currentLocation.longitude], 15);
        }
    }, [currentLocation]);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    };

    const defaultCenter = [20.5937, 78.9629];
    const myColor = avatarColor || '#667eea';
    const myIcon = createColorIcon(myColor);

    return (
        <MapContainer
            center={currentLocation ? [currentLocation.latitude, currentLocation.longitude] : defaultCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            ref={mapRef}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <ZoomControl position="bottomright" />

            {currentLocation && (
                <>
                    <Circle
                        center={[currentLocation.latitude, currentLocation.longitude]}
                        radius={currentLocation.accuracy || 50}
                        pathOptions={{
                            color: myColor,
                            fillColor: myColor,
                            fillOpacity: 0.1,
                            weight: 2
                        }}
                    />
                    <Marker
                        position={[currentLocation.latitude, currentLocation.longitude]}
                        icon={myIcon}
                    >
                        <Popup>
                            <div style={{ minWidth: '150px' }}>
                                <strong style={{ color: myColor }}>{userName}</strong>
                                <br />
                                <em>You are here</em><br />
                                Accuracy: ±{(currentLocation.accuracy || 0).toFixed(0)}m<br />
                                <small>Updated: {new Date().toLocaleTimeString()}</small>
                            </div>
                        </Popup>
                    </Marker>
                </>
            )}

            {users.map(user => {
                const uColor = user.users?.avatar_color || user.avatarColor || '#ef4444';
                const uName = user.users?.display_name || user.user_name;
                const uEmail = user.users?.email || '';
                const uIcon = createColorIcon(uColor);

                return (
                    <React.Fragment key={user.user_id}>
                        <Circle
                            center={[user.latitude, user.longitude]}
                            radius={user.accuracy || 50}
                            pathOptions={{
                                color: uColor,
                                fillColor: uColor,
                                fillOpacity: 0.1,
                                weight: 2
                            }}
                        />
                        <Marker
                            position={[user.latitude, user.longitude]}
                            icon={uIcon}
                        >
                            <Popup>
                                <div style={{ minWidth: '180px' }}>
                                    <strong style={{ color: uColor }}>{uName}</strong>
                                    {uEmail && (
                                        <><br /><small style={{ color: '#6b7280' }}>{uEmail}</small></>
                                    )}
                                    <br />
                                    Last seen: {new Date(user.last_update).toLocaleTimeString()}<br />
                                    Accuracy: ±{(user.accuracy || 0).toFixed(0)}m
                                    {currentLocation && (
                                        <>
                                            <br />
                                            <strong>Distance:</strong> {calculateDistance(
                                                currentLocation.latitude,
                                                currentLocation.longitude,
                                                user.latitude,
                                                user.longitude
                                            ).toFixed(1)} km
                                        </>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    </React.Fragment>
                );
            })}
        </MapContainer>
    );
};

export default LocationMap;
