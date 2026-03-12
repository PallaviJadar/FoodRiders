# Frontend Integration Guide - FoodRiders Address System

## Overview
This guide provides React component examples for integrating the address management system into your FoodRiders frontend.

---

## 🎯 Required Frontend Components

### 1. Address Selection Component (Checkout Page)

```jsx
// components/AddressSelection.jsx
import React, { useState, useEffect } from 'react';
import GoogleMapPicker from './GoogleMapPicker';
import ManualAddressForm from './ManualAddressForm';
import SavedAddressesList from './SavedAddressesList';

const AddressSelection = ({ userId, onAddressSelected }) => {
  const [addressMode, setAddressMode] = useState('saved'); // 'saved', 'map', 'manual'
  const [orderingForSomeoneElse, setOrderingForSomeoneElse] = useState(false);
  const [recipientName, setRecipientName] = useState('');
  const [selectedAddress, setSelectedAddress] = useState(null);

  const handleAddressSelect = (address) => {
    const finalAddress = {
      ...address,
      recipientName: orderingForSomeoneElse ? recipientName : null
    };
    setSelectedAddress(finalAddress);
    onAddressSelected(finalAddress);
  };

  return (
    <div className="address-selection">
      <h3>Select Delivery Address</h3>
      
      {/* Address Mode Selection */}
      <div className="address-mode-tabs">
        <button 
          className={addressMode === 'saved' ? 'active' : ''}
          onClick={() => setAddressMode('saved')}
        >
          💾 Saved Addresses
        </button>
        <button 
          className={addressMode === 'map' ? 'active' : ''}
          onClick={() => setAddressMode('map')}
        >
          📍 Use Google Map
        </button>
        <button 
          className={addressMode === 'manual' ? 'active' : ''}
          onClick={() => setAddressMode('manual')}
        >
          ✍️ Enter Manually
        </button>
      </div>

      {/* Order for Someone Else Checkbox */}
      <div className="order-for-someone-else">
        <label>
          <input
            type="checkbox"
            checked={orderingForSomeoneElse}
            onChange={(e) => setOrderingForSomeoneElse(e.target.checked)}
          />
          <span>☑ Ordering for someone else</span>
        </label>
        
        {orderingForSomeoneElse && (
          <div className="recipient-name">
            <input
              type="text"
              placeholder="Recipient Name (Optional)"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
            <small>You can order for family or friends in Mahalingapura.</small>
          </div>
        )}
      </div>

      {/* Address Input Based on Mode */}
      <div className="address-input-area">
        {addressMode === 'saved' && (
          <SavedAddressesList 
            userId={userId}
            onSelect={handleAddressSelect}
          />
        )}
        
        {addressMode === 'map' && (
          <GoogleMapPicker 
            onLocationSelect={handleAddressSelect}
          />
        )}
        
        {addressMode === 'manual' && (
          <ManualAddressForm 
            onSubmit={handleAddressSelect}
          />
        )}
      </div>

      {/* Selected Address Preview */}
      {selectedAddress && (
        <div className="selected-address-preview">
          <h4>Delivery Address:</h4>
          <p>{selectedAddress.fullAddress || selectedAddress.googleFormattedAddress}</p>
          {selectedAddress.recipientName && (
            <p><strong>Recipient:</strong> {selectedAddress.recipientName}</p>
          )}
          <small>📍 {selectedAddress.latitude}, {selectedAddress.longitude}</small>
        </div>
      )}
    </div>
  );
};

export default AddressSelection;
```

---

### 2. Google Map Location Picker

```jsx
// components/GoogleMapPicker.jsx
import React, { useState, useEffect } from 'react';

const GoogleMapPicker = ({ onLocationSelect }) => {
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize Google Map
    const initMap = () => {
      const mapInstance = new window.google.maps.Map(
        document.getElementById('map'),
        {
          center: { lat: 16.3833, lng: 75.1167 }, // Mahalingapura center
          zoom: 14
        }
      );

      // Add click listener
      mapInstance.addListener('click', (e) => {
        handleMapClick(e.latLng);
      });

      setMap(mapInstance);
    };

    if (window.google) {
      initMap();
    }
  }, []);

  const handleMapClick = (latLng) => {
    const lat = latLng.lat();
    const lng = latLng.lng();

    // Update marker
    if (marker) {
      marker.setPosition(latLng);
    } else {
      const newMarker = new window.google.maps.Marker({
        position: latLng,
        map: map,
        draggable: true
      });
      
      newMarker.addListener('dragend', (e) => {
        handleMapClick(e.latLng);
      });
      
      setMarker(newMarker);
    }

    // Reverse geocode to get address
    reverseGeocode(lat, lng);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setSelectedLocation({
            latitude: lat,
            longitude: lng,
            googleFormattedAddress: results[0].formatted_address,
            addressType: 'google_map'
          });
        }
      });
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const latLng = new window.google.maps.LatLng(lat, lng);
          
          map.setCenter(latLng);
          handleMapClick(latLng);
        },
        (error) => {
          alert('Unable to get your location. Please select manually on the map.');
        }
      );
    }
  };

  const validateAndConfirm = async () => {
    if (!selectedLocation) {
      alert('Please select a location on the map');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/address/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedLocation)
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
    <div className="google-map-picker">
      <div className="map-controls">
        <button onClick={getCurrentLocation} className="btn-current-location">
          📍 Use Current Location
        </button>
        <p className="hint">Click on the map to select delivery location</p>
      </div>

      <div id="map" style={{ width: '100%', height: '400px', marginBottom: '1rem' }}></div>

      {selectedLocation && (
        <div className="selected-location-info">
          <p><strong>Selected Location:</strong></p>
          <p>{selectedLocation.googleFormattedAddress}</p>
          <small>📍 {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}</small>
        </div>
      )}

      {error && (
        <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
          ⚠️ {error}
        </div>
      )}

      <button 
        onClick={validateAndConfirm}
        disabled={!selectedLocation || isValidating}
        className="btn-confirm"
      >
        {isValidating ? 'Validating...' : 'Confirm Location'}
      </button>
    </div>
  );
};

export default GoogleMapPicker;
```

---

### 3. Manual Address Form

```jsx
// components/ManualAddressForm.jsx
import React, { useState } from 'react';

const ManualAddressForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    houseStreet: '',
    areaLandmark: '',
    townCity: 'Mahalingapura',
    pinCode: '587312'
  });
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsValidating(true);
    setError(null);

    try {
      // Step 1: Geocode the address
      const geocodeResponse = await fetch('/api/address/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const geocoded = await geocodeResponse.json();

      // Step 2: Validate the geocoded address
      const validateResponse = await fetch('/api/address/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          addressType: 'manual',
          ...formData,
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
          googleFormattedAddress: geocoded.googleFormattedAddress,
          fullAddress: `${formData.houseStreet}, ${formData.areaLandmark}, ${formData.townCity}, ${formData.pinCode}`
        })
      });

      const validation = await validateResponse.json();

      if (validation.valid) {
        onSubmit(validation.address);
      } else {
        setError(validation.message);
      }
    } catch (error) {
      setError('Failed to validate address. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="manual-address-form">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>House / Street *</label>
          <input
            type="text"
            name="houseStreet"
            value={formData.houseStreet}
            onChange={handleChange}
            placeholder="e.g., 123 Main Street"
            required
          />
        </div>

        <div className="form-group">
          <label>Area / Landmark *</label>
          <input
            type="text"
            name="areaLandmark"
            value={formData.areaLandmark}
            onChange={handleChange}
            placeholder="e.g., Near Town Hall"
            required
          />
        </div>

        <div className="form-group">
          <label>Town / City *</label>
          <input
            type="text"
            name="townCity"
            value={formData.townCity}
            onChange={handleChange}
            placeholder="Mahalingapura"
            required
          />
          <small>Valid towns: Mahalingapura, Mahalingpur, MLP</small>
        </div>

        <div className="form-group">
          <label>PIN Code *</label>
          <input
            type="text"
            name="pinCode"
            value={formData.pinCode}
            onChange={handleChange}
            placeholder="587312"
            pattern="[0-9]{6}"
            required
          />
        </div>

        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            ⚠️ {error}
          </div>
        )}

        <button 
          type="submit" 
          disabled={isValidating}
          className="btn-submit"
        >
          {isValidating ? 'Validating...' : 'Geocode & Validate'}
        </button>
      </form>
    </div>
  );
};

export default ManualAddressForm;
```

---

### 4. Saved Addresses List

```jsx
// components/SavedAddressesList.jsx
import React, { useState, useEffect } from 'react';

const SavedAddressesList = ({ userId, onSelect }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const loadAddresses = async () => {
    try {
      const response = await fetch(`/api/address/user/${userId}`);
      const data = await response.json();
      setAddresses(data);
    } catch (error) {
      console.error('Failed to load addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addressId) => {
    if (!confirm('Delete this address?')) return;

    try {
      await fetch(`/api/address/user/${userId}/${addressId}`, {
        method: 'DELETE'
      });
      loadAddresses(); // Reload list
    } catch (error) {
      alert('Failed to delete address');
    }
  };

  if (loading) {
    return <div>Loading saved addresses...</div>;
  }

  if (addresses.length === 0) {
    return (
      <div className="no-addresses">
        <p>No saved addresses yet.</p>
        <p>Use Google Map or Manual Entry to add your first address.</p>
      </div>
    );
  }

  return (
    <div className="saved-addresses-list">
      {addresses.map((address) => (
        <div key={address._id} className="address-card">
          <div className="address-header">
            <span className="address-label">
              {address.label === 'Home' && '🏠'}
              {address.label === 'Work' && '💼'}
              {address.label === 'Mom' && '👩'}
              {address.label === 'Dad' && '👨'}
              {address.label === 'Office' && '🏢'}
              {' '}
              {address.label}
              {address.isDefault && <span className="badge-default">Default</span>}
            </span>
          </div>

          <div className="address-content">
            {address.recipientName && (
              <p className="recipient-name">
                <strong>Recipient:</strong> {address.recipientName}
              </p>
            )}
            <p className="address-text">{address.fullAddress}</p>
            <small className="address-coords">
              📍 {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
            </small>
          </div>

          <div className="address-actions">
            <button 
              onClick={() => onSelect(address)}
              className="btn-select"
            >
              Select
            </button>
            <button 
              onClick={() => handleDelete(address._id)}
              className="btn-delete"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SavedAddressesList;
```

---

### 5. Save Address Dialog (After Order)

```jsx
// components/SaveAddressDialog.jsx
import React, { useState } from 'react';

const SaveAddressDialog = ({ userId, addressData, onClose }) => {
  const [label, setLabel] = useState('Home');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/address/user/${userId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addressData,
          label,
          isDefault
        })
      });

      if (response.ok) {
        alert('Address saved successfully!');
        onClose(true);
      } else {
        alert('Failed to save address');
      }
    } catch (error) {
      alert('Error saving address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="save-address-dialog-overlay">
      <div className="save-address-dialog">
        <h3>Save this address for future orders?</h3>

        <div className="form-group">
          <label>Label</label>
          <select value={label} onChange={(e) => setLabel(e.target.value)}>
            <option value="Home">🏠 Home</option>
            <option value="Work">💼 Work</option>
            <option value="Mom">👩 Mom</option>
            <option value="Dad">👨 Dad</option>
            <option value="Office">🏢 Office</option>
            <option value="Other">📍 Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            Set as default address
          </label>
        </div>

        <div className="address-preview">
          <p>{addressData.fullAddress || addressData.googleFormattedAddress}</p>
        </div>

        <div className="dialog-actions">
          <button 
            onClick={() => onClose(false)}
            className="btn-skip"
            disabled={saving}
          >
            Skip
          </button>
          <button 
            onClick={handleSave}
            className="btn-save"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveAddressDialog;
```

---

### 6. Delivery Boy Map View

```jsx
// components/DeliveryBoyMapView.jsx
import React, { useEffect, useState } from 'react';

const DeliveryBoyMapView = ({ order }) => {
  const [map, setMap] = useState(null);

  useEffect(() => {
    if (!order) return;

    // Initialize map
    const mapInstance = new window.google.maps.Map(
      document.getElementById('delivery-map'),
      {
        center: { 
          lat: order.customerLocation.lat, 
          lng: order.customerLocation.lng 
        },
        zoom: 13
      }
    );

    // Pickup marker (Restaurant)
    const pickupMarker = new window.google.maps.Marker({
      position: { 
        lat: order.restaurantLocation?.lat || 16.3800, 
        lng: order.restaurantLocation?.lng || 75.1150 
      },
      map: mapInstance,
      icon: {
        url: '/icons/restaurant-marker.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      title: 'Pickup: ' + order.restaurantName
    });

    // Delivery marker (Customer)
    const deliveryMarker = new window.google.maps.Marker({
      position: { 
        lat: order.customerLocation.lat, 
        lng: order.customerLocation.lng 
      },
      map: mapInstance,
      icon: {
        url: '/icons/delivery-marker.png',
        scaledSize: new window.google.maps.Size(40, 40)
      },
      title: 'Delivery: ' + order.userDetails.address
    });

    // Draw route line
    const routePath = new window.google.maps.Polyline({
      path: [
        { lat: order.restaurantLocation?.lat || 16.3800, lng: order.restaurantLocation?.lng || 75.1150 },
        { lat: order.customerLocation.lat, lng: order.customerLocation.lng }
      ],
      geodesic: true,
      strokeColor: '#4285F4',
      strokeOpacity: 0.8,
      strokeWeight: 4,
      map: mapInstance
    });

    setMap(mapInstance);
  }, [order]);

  const openGoogleMapsNavigation = () => {
    const pickupLat = order.restaurantLocation?.lat || 16.3800;
    const pickupLng = order.restaurantLocation?.lng || 75.1150;
    const deliveryLat = order.customerLocation.lat;
    const deliveryLng = order.customerLocation.lng;

    const url = `https://www.google.com/maps/dir/?api=1&origin=${pickupLat},${pickupLng}&destination=${deliveryLat},${deliveryLng}&travelmode=driving`;
    
    window.open(url, '_blank');
  };

  return (
    <div className="delivery-boy-map-view">
      <div className="order-info">
        <h3>Order #{order._id.slice(-6)}</h3>
        
        <div className="location-info">
          <div className="pickup-info">
            <h4>📍 Pickup</h4>
            <p>{order.restaurantName}</p>
            <small>{order.restaurantAddress}</small>
          </div>

          <div className="delivery-info">
            <h4>🏠 Delivery</h4>
            {order.userDetails.recipientName && (
              <p><strong>{order.userDetails.recipientName}</strong></p>
            )}
            <p>{order.userDetails.address}</p>
            <p>📞 {order.userDetails.phone}</p>
            <small>📍 {order.customerLocation.lat.toFixed(4)}, {order.customerLocation.lng.toFixed(4)}</small>
          </div>
        </div>

        {order.order_notes && (
          <div className="order-notes">
            <strong>📝 Notes:</strong> {order.order_notes}
          </div>
        )}
      </div>

      <div id="delivery-map" style={{ width: '100%', height: '400px', margin: '1rem 0' }}></div>

      <button 
        onClick={openGoogleMapsNavigation}
        className="btn-navigate"
      >
        🧭 Navigate with Google Maps
      </button>
    </div>
  );
};

export default DeliveryBoyMapView;
```

---

## 📱 Integration in Checkout Page

```jsx
// pages/CheckoutPage.jsx
import React, { useState } from 'react';
import AddressSelection from '../components/AddressSelection';
import SaveAddressDialog from '../components/SaveAddressDialog';

const CheckoutPage = () => {
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address');
      return;
    }

    try {
      const orderData = {
        userId: currentUser.id,
        userDetails: {
          name: currentUser.name,
          phone: currentUser.phone,
          address: selectedAddress.fullAddress || selectedAddress.googleFormattedAddress,
          
          // Enhanced address fields
          recipientName: selectedAddress.recipientName,
          houseStreet: selectedAddress.houseStreet,
          areaLandmark: selectedAddress.areaLandmark,
          townCity: selectedAddress.townCity,
          pinCode: selectedAddress.pinCode,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
          googleFormattedAddress: selectedAddress.googleFormattedAddress,
          addressType: selectedAddress.addressType
        },
        items: cartItems,
        totalAmount: calculateTotal(),
        paymentMode: 'COD',
        userCoords: {
          lat: selectedAddress.latitude,
          lng: selectedAddress.longitude
        }
      };

      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const order = await response.json();
        setOrderId(order._id);
        
        // Show save address dialog if it's a new address
        if (!selectedAddress._id) {
          setShowSaveDialog(true);
        } else {
          // Redirect to order tracking
          window.location.href = `/order/${order._id}`;
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to place order');
      }
    } catch (error) {
      alert('Error placing order');
    }
  };

  return (
    <div className="checkout-page">
      <h2>Checkout</h2>

      {/* Address Selection */}
      <AddressSelection
        userId={currentUser.id}
        onAddressSelected={setSelectedAddress}
      />

      {/* Cart Summary */}
      <div className="cart-summary">
        {/* Your existing cart summary code */}
      </div>

      {/* Place Order Button */}
      <button 
        onClick={handlePlaceOrder}
        disabled={!selectedAddress}
        className="btn-place-order"
      >
        Place Order
      </button>

      {/* Save Address Dialog */}
      {showSaveDialog && (
        <SaveAddressDialog
          userId={currentUser.id}
          addressData={selectedAddress}
          onClose={(saved) => {
            setShowSaveDialog(false);
            window.location.href = `/order/${orderId}`;
          }}
        />
      )}
    </div>
  );
};

export default CheckoutPage;
```

---

## 🎨 CSS Styling Examples

```css
/* styles/address-components.css */

.address-selection {
  background: #fff;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 1.5rem;
}

.address-mode-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.address-mode-tabs button {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.address-mode-tabs button.active {
  border-color: #4285F4;
  background: #E8F0FE;
  color: #4285F4;
  font-weight: 600;
}

.order-for-someone-else {
  background: #FFF9E6;
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.recipient-name input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-top: 0.5rem;
}

.saved-addresses-list {
  display: grid;
  gap: 1rem;
}

.address-card {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.3s;
}

.address-card:hover {
  border-color: #4285F4;
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.1);
}

.address-label {
  font-weight: 600;
  font-size: 1.1rem;
}

.badge-default {
  background: #34A853;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.address-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-select {
  flex: 1;
  padding: 0.75rem;
  background: #4285F4;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-delete {
  padding: 0.75rem 1rem;
  background: #EA4335;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.selected-address-preview {
  background: #E8F5E9;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #34A853;
  margin-top: 1.5rem;
}

.error-message {
  background: #FDECEA;
  color: #C5221F;
  padding: 1rem;
  border-radius: 6px;
  border-left: 4px solid #EA4335;
}

.save-address-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.save-address-dialog {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.dialog-actions button {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.btn-skip {
  background: #f1f3f4;
  color: #5f6368;
}

.btn-save {
  background: #34A853;
  color: white;
}
```

---

## 📝 HTML Setup (Add to index.html)

```html
<!-- Add Google Maps API -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
```

---

## ✅ Integration Checklist

- [ ] Install required dependencies
- [ ] Add Google Maps API key to environment
- [ ] Create all component files
- [ ] Add CSS styling
- [ ] Update checkout page to use AddressSelection
- [ ] Test address validation
- [ ] Test saved addresses
- [ ] Test "order for someone else"
- [ ] Test delivery boy map view
- [ ] Deploy to production

---

## 🎯 Summary

This guide provides complete React components for:
1. ✅ Address selection with 3 modes (Saved, Map, Manual)
2. ✅ Google Maps location picker
3. ✅ Manual address form with validation
4. ✅ Saved addresses management
5. ✅ "Order for someone else" functionality
6. ✅ Save address after order dialog
7. ✅ Delivery boy map navigation

All components are ready to integrate with your existing FoodRiders frontend!
