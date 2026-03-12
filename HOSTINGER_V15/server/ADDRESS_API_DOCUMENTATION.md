# FoodRiders Address Management API Documentation

## Overview
This document describes the enhanced address handling system for FoodRiders, supporting Google Maps integration, manual address entry, and "order for someone else" functionality.

## Town Configuration
- **Town**: Mahalingapura
- **PIN Code**: 587312
- **Service Radius**: 7 km from town center
- **Town Keywords**: mahalingapura, mahalingpur, mahalingpuram, mlp

---

## API Endpoints

### 1. Get Town Configuration
**GET** `/api/address/config`

Returns the town configuration for frontend validation.

**Response:**
```json
{
  "validPinCode": "587312",
  "townName": "Mahalingapura",
  "maxServiceRadiusKm": 7,
  "serviceCenterLat": 16.3833,
  "serviceCenterLng": 75.1167
}
```

---

### 2. Validate Address
**POST** `/api/address/validate`

Validates if an address is within the service area.

**Request Body:**
```json
{
  "addressType": "manual",
  "houseStreet": "123 Main Street",
  "areaLandmark": "Near Town Hall",
  "townCity": "Mahalingapura",
  "pinCode": "587312",
  "latitude": 16.3833,
  "longitude": 75.1167
}
```

**Response (Success):**
```json
{
  "valid": true,
  "address": {
    "houseStreet": "123 Main Street",
    "areaLandmark": "Near Town Hall",
    "townCity": "Mahalingapura",
    "pinCode": "587312",
    "latitude": 16.3833,
    "longitude": 75.1167,
    "googleFormattedAddress": "123 Main Street, Near Town Hall, Mahalingapura, 587312"
  },
  "validationReason": "PIN code match",
  "distance": 0.5
}
```

**Response (Error):**
```json
{
  "valid": false,
  "message": "Delivery is available only within Mahalingapura (PIN 587312). You can order for someone inside this area."
}
```

---

### 3. Geocode Manual Address
**POST** `/api/address/geocode`

Converts a manual address to GPS coordinates.

**Request Body:**
```json
{
  "houseStreet": "123 Main Street",
  "areaLandmark": "Near Town Hall",
  "townCity": "Mahalingapura",
  "pinCode": "587312"
}
```

**Response:**
```json
{
  "latitude": 16.3833,
  "longitude": 75.1167,
  "googleFormattedAddress": "123 Main Street, Near Town Hall, Mahalingapura, 587312",
  "success": true
}
```

---

### 4. Get User's Saved Addresses
**GET** `/api/address/user/:userId`

Retrieves all saved addresses for a user.

**Response:**
```json
[
  {
    "_id": "address_id_1",
    "label": "Home",
    "recipientName": "John Doe",
    "houseStreet": "123 Main Street",
    "areaLandmark": "Near Town Hall",
    "townCity": "Mahalingapura",
    "pinCode": "587312",
    "fullAddress": "123 Main Street, Near Town Hall, Mahalingapura, 587312",
    "latitude": 16.3833,
    "longitude": 75.1167,
    "googleFormattedAddress": "123 Main Street, Near Town Hall, Mahalingapura, 587312",
    "addressType": "manual",
    "isDefault": true,
    "createdAt": "2026-01-16T00:00:00.000Z"
  }
]
```

---

### 5. Save New Address
**POST** `/api/address/user/:userId/save`

Saves a new address for a user.

**Request Body:**
```json
{
  "label": "Mom",
  "recipientName": "Jane Doe",
  "houseStreet": "456 Oak Avenue",
  "areaLandmark": "Near Market",
  "townCity": "Mahalingapura",
  "pinCode": "587312",
  "fullAddress": "456 Oak Avenue, Near Market, Mahalingapura, 587312",
  "latitude": 16.3850,
  "longitude": 75.1180,
  "googleFormattedAddress": "456 Oak Avenue, Near Market, Mahalingapura, 587312",
  "addressType": "manual",
  "isDefault": false
}
```

**Response:**
```json
{
  "message": "Address saved successfully",
  "address": {
    "_id": "new_address_id",
    "label": "Mom",
    "recipientName": "Jane Doe",
    ...
  }
}
```

---

### 6. Update Address
**PUT** `/api/address/user/:userId/:addressId`

Updates an existing saved address.

**Request Body:** Same as Save New Address

**Response:**
```json
{
  "message": "Address updated successfully",
  "address": { ... }
}
```

---

### 7. Delete Address
**DELETE** `/api/address/user/:userId/:addressId`

Deletes a saved address.

**Response:**
```json
{
  "message": "Address deleted successfully"
}
```

---

## Order Creation with Enhanced Address

### Create Order
**POST** `/api/orders/create`

**Enhanced Request Body:**
```json
{
  "userId": "user_id",
  "userDetails": {
    "name": "John Doe",
    "phone": "9876543210",
    "address": "123 Main Street, Near Town Hall, Mahalingapura, 587312",
    
    // Enhanced fields
    "recipientName": "Jane Doe",
    "houseStreet": "123 Main Street",
    "areaLandmark": "Near Town Hall",
    "townCity": "Mahalingapura",
    "pinCode": "587312",
    "latitude": 16.3833,
    "longitude": 75.1167,
    "googleFormattedAddress": "123 Main Street, Near Town Hall, Mahalingapura, 587312",
    "addressType": "manual"
  },
  "items": [...],
  "totalAmount": 500,
  "paymentMode": "COD",
  "userCoords": {
    "lat": 16.3833,
    "lng": 75.1167
  },
  ...
}
```

---

## Address Validation Rules

The system accepts an address if **ANY** of the following conditions are true:

1. **PIN Code Match**: `pinCode === "587312"`
2. **Town Keyword Match**: Town name contains (case-insensitive):
   - mahalingapura
   - mahalingpur
   - mahalingpuram
   - mlp
3. **Service Radius**: Geocoded location is within 7 km of town center

If **NONE** of these conditions are met, the order is rejected with:
```
"Delivery is available only within Mahalingapura (PIN 587312). You can order for someone inside this area."
```

---

## Frontend Integration Guide

### 1. Address Selection Flow

```javascript
// At checkout, show two options:
// 1. Use Google Map Location
// 2. Enter Address Manually

// Option 1: Google Map Location
const selectMapLocation = async (lat, lng) => {
  const address = {
    addressType: 'google_map',
    latitude: lat,
    longitude: lng,
    googleFormattedAddress: await reverseGeocode(lat, lng)
  };
  
  // Validate
  const validation = await fetch('/api/address/validate', {
    method: 'POST',
    body: JSON.stringify(address)
  });
  
  if (validation.valid) {
    // Use this address for checkout
  }
};

// Option 2: Manual Address Entry
const submitManualAddress = async (formData) => {
  const address = {
    addressType: 'manual',
    houseStreet: formData.houseStreet,
    areaLandmark: formData.areaLandmark,
    townCity: formData.townCity,
    pinCode: formData.pinCode
  };
  
  // Geocode
  const geocoded = await fetch('/api/address/geocode', {
    method: 'POST',
    body: JSON.stringify(address)
  });
  
  // Validate
  const validation = await fetch('/api/address/validate', {
    method: 'POST',
    body: JSON.stringify({ ...address, ...geocoded })
  });
  
  if (validation.valid) {
    // Use this address for checkout
  }
};
```

### 2. "Order for Someone Else" Flow

```javascript
const [orderingForSomeoneElse, setOrderingForSomeoneElse] = useState(false);

// In checkout form
<Checkbox 
  checked={orderingForSomeoneElse}
  onChange={(e) => setOrderingForSomeoneElse(e.target.checked)}
>
  Ordering for someone else
</Checkbox>

{orderingForSomeoneElse && (
  <Input 
    placeholder="Recipient Name (Optional)"
    value={recipientName}
    onChange={(e) => setRecipientName(e.target.value)}
  />
)}
```

### 3. Save Address After Order

```javascript
const saveAddressAfterOrder = async (userId, addressData) => {
  const shouldSave = await showDialog(
    "Save this address for future orders?",
    ["Home", "Mom", "Dad", "Office", "Other"]
  );
  
  if (shouldSave) {
    await fetch(`/api/address/user/${userId}/save`, {
      method: 'POST',
      body: JSON.stringify({
        ...addressData,
        label: shouldSave,
        isDefault: false
      })
    });
  }
};
```

### 4. Use Saved Address

```javascript
const loadSavedAddresses = async (userId) => {
  const addresses = await fetch(`/api/address/user/${userId}`).then(r => r.json());
  
  // Show in UI for selection
  return addresses;
};

const selectSavedAddress = (address) => {
  // Use address.latitude, address.longitude for delivery
  // Use address.fullAddress for display
};
```

---

## Delivery Boy Integration

### Order Details for Delivery Boy

The delivery boy app should receive:

```json
{
  "orderId": "order_id",
  "pickupLocation": {
    "lat": 16.3800,
    "lng": 75.1150,
    "address": "Restaurant Name, Restaurant Address"
  },
  "deliveryLocation": {
    "lat": 16.3833,
    "lng": 75.1167,
    "address": "123 Main Street, Near Town Hall, Mahalingapura, 587312",
    "recipientName": "Jane Doe"
  },
  "customerPhone": "9876543210",
  "orderNotes": "Ring the bell twice"
}
```

### Google Maps Navigation

```javascript
// Open Google Maps with navigation
const openNavigation = (pickupLat, pickupLng, deliveryLat, deliveryLng) => {
  const url = `https://www.google.com/maps/dir/?api=1&origin=${pickupLat},${pickupLng}&destination=${deliveryLat},${deliveryLng}&travelmode=driving`;
  window.open(url, '_blank');
};
```

---

## Security Notes

1. **Server-Side Validation**: All address validation is done server-side in `/api/orders/create`
2. **Coordinates Required**: Every order MUST have latitude/longitude saved
3. **No Address Changes**: Address cannot be changed after order confirmation
4. **Abuse Prevention**: Address hash is used for first-order free delivery tracking

---

## Testing Checklist

- [ ] User can select location using Google Maps
- [ ] User can enter manual address with town keywords
- [ ] Manual address gets geocoded to coordinates
- [ ] Address validation rejects out-of-town addresses
- [ ] "Order for someone else" checkbox works
- [ ] Recipient name is saved and displayed
- [ ] Addresses can be saved for future use
- [ ] Saved addresses can be selected at checkout
- [ ] Delivery boy sees correct map coordinates
- [ ] Google Maps navigation works for delivery boy
- [ ] PIN code 587312 is accepted
- [ ] Town keywords (mahalingapura, mlp, etc.) are accepted
- [ ] Addresses within 7km radius are accepted
- [ ] Addresses outside service area are rejected with friendly message

---

## Future Enhancements

1. **Google Maps API Integration**: Replace mock geocoding with actual Google Geocoding API
2. **Real-time Location Tracking**: Show delivery boy's live location to customer
3. **Address Autocomplete**: Use Google Places API for address suggestions
4. **Multiple Service Areas**: Support multiple towns with different configurations
5. **Address Verification**: SMS/OTP verification for new addresses
