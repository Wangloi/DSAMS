# Leaflet Map Integration - Philippines (No API Key Required!)

## Why Leaflet is Better for Your Attendance System

### Benefits over Google Maps:
- **No API key needed** - No setup required
- **Free forever** - No billing, no usage limits
- **Simple & reliable** - Just works out of the box
- **Perfect for internal use** - Designed for applications like yours
- **Fast loading** - No authentication delays

## What Admins Can Do

1. **Click anywhere in the Philippines** to set event location
2. **Drag the pin** to fine-tune position
3. **See coordinates automatically** populate in the form
4. **Manual entry backup** - Always available if needed

## Philippines Test Coordinates

### Major Cities:
- **Manila**: 14.5995, 120.9842
- **Quezon City**: 14.6760, 121.0437
- **Cebu City**: 10.3157, 123.8854
- **Davao City**: 7.0731, 125.6128

### University Areas:
- **UP Diliman**: 14.6533, 121.0683
- **Ateneo**: 14.6398, 121.0758
- **La Salle**: 14.5642, 120.9930
- **UST**: 14.6120, 120.9969

## How It Works

1. **Map centers on Philippines** - Shows the entire country by default
2. Uses OpenStreetMap tiles (free, open-source)
3. Leaflet.js handles all map interactions
4. No external API calls or authentication
5. Works offline once tiles are cached

## What Changed

- Replaced `GoogleMapSelector` with `LeafletMapSelector`
- Map now centers on Philippines (12.8797, 121.7740)
- Zoom level 6 to show the entire country
- Updated placeholder text with Philippine cities
- Added Philippines-specific coordinate examples

## Testing the Map

1. Go to Admin Dashboard > Attendance > Create Event
2. Enable "Enable geofence validation"
3. Click "Select Location on Map"
4. The map shows the entire Philippines
5. Click anywhere to set location (Manila, Cebu, Davao, etc.)

## Troubleshooting

If map doesn't show:
- Check browser console for errors
- Ensure internet connection (for map tiles)
- Try refreshing the page

The map uses OpenStreetMap which is reliable and requires no setup. Perfect for your Philippine attendance system!
