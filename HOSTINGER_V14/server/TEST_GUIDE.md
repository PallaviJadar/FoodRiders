# FoodRiders Address System - Quick Test Guide

## Server Status
✅ Server is running on port 5000
✅ MongoDB connected
✅ All routes loaded successfully

## Test the New Address Endpoints

### 1. Get Town Configuration
```bash
curl http://localhost:5000/api/address/config
```

**Expected Response:**
```json
{
  "validPinCode": "587312",
  "townName": "Mahalingapura",
  "maxServiceRadiusKm": 7,
  "serviceCenterLat": 16.3833,
  "serviceCenterLng": 75.1167
}
```

### 2. Validate Address (Valid PIN Code)
```bash
curl -X POST http://localhost:5000/api/address/validate \
  -H "Content-Type: application/json" \
  -d "{\"addressType\":\"manual\",\"houseStreet\":\"123 Main Street\",\"areaLandmark\":\"Near Town Hall\",\"townCity\":\"Mahalingapura\",\"pinCode\":\"587312\"}"
```

**Expected Response:**
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
  "validationReason": "PIN code match"
}
```

### 3. Validate Address (Invalid - Should Reject)
```bash
curl -X POST http://localhost:5000/api/address/validate \
  -H "Content-Type: application/json" \
  -d "{\"addressType\":\"manual\",\"houseStreet\":\"123 Street\",\"townCity\":\"Mumbai\",\"pinCode\":\"400001\"}"
```

**Expected Response:**
```json
{
  "valid": false,
  "message": "Delivery is available only within Mahalingapura (PIN 587312). You can order for someone inside this area."
}
```

### 4. Geocode Manual Address
```bash
curl -X POST http://localhost:5000/api/address/geocode \
  -H "Content-Type: application/json" \
  -d "{\"houseStreet\":\"456 Oak Avenue\",\"areaLandmark\":\"Near Market\",\"townCity\":\"Mahalingapura\",\"pinCode\":\"587312\"}"
```

**Expected Response:**
```json
{
  "latitude": 16.3833,
  "longitude": 75.1167,
  "googleFormattedAddress": "456 Oak Avenue, Near Market, Mahalingapura, 587312",
  "success": true,
  "note": "Using mock geocoding. Replace with Google Maps API in production."
}
```

### 5. Test Order Creation with Enhanced Address
```bash
curl -X POST http://localhost:5000/api/orders/create \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\":\"guest\",
    \"userDetails\":{
      \"name\":\"Test User\",
      \"phone\":\"9876543210\",
      \"address\":\"123 Main Street, Near Town Hall, Mahalingapura, 587312\",
      \"recipientName\":\"Jane Doe\",
      \"houseStreet\":\"123 Main Street\",
      \"areaLandmark\":\"Near Town Hall\",
      \"townCity\":\"Mahalingapura\",
      \"pinCode\":\"587312\",
      \"latitude\":16.3833,
      \"longitude\":75.1167,
      \"googleFormattedAddress\":\"123 Main Street, Near Town Hall, Mahalingapura, 587312\",
      \"addressType\":\"manual\"
    },
    \"items\":[{\"id\":\"1\",\"name\":\"Test Item\",\"price\":100,\"quantity\":1,\"restaurant\":\"Test Restaurant\"}],
    \"totalAmount\":100,
    \"paymentMode\":\"COD\",
    \"userCoords\":{\"lat\":16.3833,\"lng\":75.1167}
  }"
```

## Browser Testing

### Open in Browser:
1. **Town Config**: http://localhost:5000/api/address/config
2. **Health Check**: http://localhost:5000/api/health-check
3. **Frontend**: http://localhost:5000

## What's Working:

✅ **Backend Complete**:
- Address validation with 3-tier system (PIN, keywords, GPS)
- Geocoding support (mock, ready for Google API)
- Saved addresses CRUD operations
- Enhanced order creation with coordinates
- "Order for someone else" data structure
- Delivery boy navigation support

⚠️ **Frontend Needed**:
- Checkout page UI with address selection
- Google Maps location picker
- Manual address entry form
- Saved addresses list
- "Order for someone else" checkbox
- Delivery boy map view

## Next Steps:

1. **Test the endpoints** using the curl commands above or Postman
2. **Integrate frontend** with the new API endpoints
3. **Add Google Maps API key** for production geocoding
4. **Build frontend components** for address selection

## Files Created/Modified:

### New Files:
- `server/routes/address.js` - Address management API
- `server/utils/googleMaps.js` - Google Maps utilities
- `server/ADDRESS_API_DOCUMENTATION.md` - Complete API docs
- `server/IMPLEMENTATION_SUMMARY.md` - Implementation details
- `server/TEST_GUIDE.md` - This file

### Modified Files:
- `server/models/User.js` - Enhanced addresses schema
- `server/models/Order.js` - Enhanced userDetails schema
- `server/routes/orders.js` - Enhanced order creation with address validation
- `server/server.js` - Added address routes

## Support:

For detailed API documentation, see:
- `server/ADDRESS_API_DOCUMENTATION.md`
- `server/IMPLEMENTATION_SUMMARY.md`

**Server is ready for frontend integration!** 🚀
