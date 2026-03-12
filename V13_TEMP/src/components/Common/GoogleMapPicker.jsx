import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import css from './GoogleMapPicker.module.css';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function LocationMarker({ onLocationSelect }) {
    const [position, setPosition] = useState(null);

    const map = useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition(e.latlng);
            onLocationSelect(lat, lng);
        },
    });

    return position === null ? null : <Marker position={position} />;
}

const LeafletMapPicker = ({ onLocationSelect }) => {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState(null);
    const [address, setAddress] = useState('');

    // Mahalingapura center coordinates
    const townCenter = { lat: 16.3833, lng: 75.1167 };

    const handleMapClick = async (lat, lng) => {
        setSelectedLocation({ lat, lng });
        setError(null);

        // Reverse geocode using Nominatim (OpenStreetMap - Free!)
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );
            const data = await response.json();

            if (data.display_name) {
                setAddress(data.display_name);
            }
        } catch (err) {
            console.error('Reverse geocoding error:', err);
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    handleMapClick(lat, lng);
                },
                (error) => {
                    setError('Unable to get your location. Please click on the map to select manually.');
                }
            );
        } else {
            setError('Geolocation is not supported by your browser.');
        }
    };

    const validateAndConfirm = async () => {
        if (!selectedLocation) {
            setError('Please select a location on the map');
            return;
        }

        setIsValidating(true);
        setError(null);

        try {
            const response = await fetch('/api/address/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    addressType: 'google_map',
                    latitude: selectedLocation.lat,
                    longitude: selectedLocation.lng,
                    googleFormattedAddress: address
                })
            });

            const result = await response.json();

            if (result.valid) {
                onLocationSelect(result.address);
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError('Validation failed. Please try again.');
        } finally {
            setIsValidating(false);
        }
    };

    return (
        <div className={css.mapPicker}>
            <div className={css.mapControls}>
                <button onClick={getCurrentLocation} className={css.currentLocationBtn}>
                    📍 Use My Current Location
                </button>
                <p className={css.hint}>💡 Click anywhere on the map to select your delivery location</p>
            </div>

            <div className={css.mapContainer}>
                <MapContainer
                    key="google-map-picker"
                    center={[townCenter.lat, townCenter.lng]}
                    zoom={14}
                    style={{ height: '400px', width: '100%', borderRadius: '8px' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker onLocationSelect={handleMapClick} />
                </MapContainer>
            </div>

            {selectedLocation && (
                <div className={css.selectedLocationInfo}>
                    <p><strong>📍 Selected Location:</strong></p>
                    <p className={css.addressText}>{address || 'Loading address...'}</p>
                    <small>Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</small>
                </div>
            )}

            {error && (
                <div className={css.errorMessage}>
                    ⚠️ {error}
                </div>
            )}

            <button
                onClick={validateAndConfirm}
                disabled={!selectedLocation || isValidating}
                className={css.confirmBtn}
            >
                {isValidating ? (
                    <>
                        <span className={css.spinner}></span>
                        Validating...
                    </>
                ) : (
                    '✓ Confirm This Location'
                )}
            </button>

            <div className={css.mapInfo}>
                <p><strong>🗺️ Using OpenStreetMap</strong></p>
                <p>Free, open-source mapping - No API key needed!</p>
            </div>
        </div>
    );
};

export default LeafletMapPicker;
