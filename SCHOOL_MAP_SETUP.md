# School Map Setup Guide

## How to Add Your SRCBMap.svg

The system is now ready to use your custom SVG school map instead of the generic Leaflet map. Here's how to integrate your SRCBMap.svg:

### Step 1: Add Your SVG File

1. Place your `SRCBMap.svg` file in the `public` directory:
   ```
   c:\laragon\www\DSAMS\public\SRCBMap.svg
   ```

### Step 2: Update the SchoolMapSelector Component

Edit `resources/js/components/SchoolMapSelector.tsx` and replace the placeholder SVG content with your actual school map:

```tsx
// Replace this section in the SchoolMapSelector component:
<svg
  ref={svgRef}
  viewBox="0 0 100 100"
  className="w-full h-full cursor-crosshair"
  onClick={handleSvgClick}
>
  <!-- PASTE YOUR SRCBMap.svg CONTENT HERE -->
  
  <!-- Keep the location markers and interaction logic below -->
  {schoolLocations.map((location) => (
    // ... existing marker code
  ))}
</svg>
```

### Step 3: Update Location Coordinates

Update the `schoolLocations` array in `SchoolMapSelector.tsx` with your actual school locations:

```tsx
const schoolLocations = [
  { id: 'main_gate', name: 'Main Gate', x: 50, y: 80, lat: 14.5995, lng: 120.9842 },
  { id: 'library', name: 'Library', x: 30, y: 40, lat: 14.5996, lng: 120.9841 },
  // Add your actual school locations with correct coordinates
];
```

### Step 4: Adjust Coordinate Conversion

Update the coordinate conversion formula in the `handleSvgClick` function to match your school's actual GPS coordinates:

```tsx
const lat = YOUR_SCHOOL_BASE_LATITUDE + (50 - y) * COORDINATE_SCALE;
const lng = YOUR_SCHOOL_BASE_LONGITUDE + (x - 50) * COORDINATE_SCALE;
```

### Step 5: Test the Integration

1. Run the development server
2. Go to Admin Dashboard → Attendance → Create Event
3. Enable geofence and click "📍 Select Location on Map"
4. Test clicking on different locations in your school map

## Benefits of Using Custom SVG Map

✅ **Accurate School Layout**: Shows actual school buildings and areas
✅ **Better User Experience**: Students and admins can see real school locations
✅ **Precise Geotagging**: More accurate location tracking within school premises
✅ **Custom Styling**: Matches your school's branding and colors
✅ **Faster Loading**: No external map service dependencies

## Current System Status

- ✅ SchoolMapSelector component created
- ✅ Integration with CreateEventModal and EditEventModal
- ✅ Location selection and coordinate conversion
- ✅ Ready for your SRCBMap.svg integration

## Next Steps

1. Add your SRCBMap.svg to the public directory
2. Update the SchoolMapSelector component with your SVG content
3. Adjust location coordinates to match your school
4. Test the geotagging functionality

The system will now use your custom school map for geotagging instead of the generic Leaflet map, providing much better accuracy and user experience for attendance tracking within your school campus.
