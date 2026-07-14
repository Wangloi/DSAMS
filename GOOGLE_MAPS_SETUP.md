# Google Maps Setup Guide for Admin Geotagging

Follow these steps to enable the interactive map for setting event locations. This will make it much easier for admins to select locations instead of manually entering coordinates.

## Step 1: Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to **APIs & Services** > **Credentials**
4. Click **+ CREATE CREDENTIALS** > **API key**
5. Copy the API key (it looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXX`)

## Step 2: Enable Required APIs

In the same Google Cloud Console project:

1. Go to **APIs & Services** > **Library**
2. Search and enable these two APIs:
   - **Maps JavaScript API**
   - **Places API**

## Step 3: Configure API Key Restrictions (Optional but Recommended)

1. Go to **APIs & Services** > **Credentials**
2. Click on your API key
3. Under **Application restrictions**, select **HTTP referrers**
4. Add your development domains:
   ```
   http://localhost:5173/*
   http://127.0.0.1:5173/*
   ```
5. Under **API restrictions**, select **Restrict key**
6. Select only:
   - Maps JavaScript API
   - Places API

## Step 4: Add API Key to Your Project

1. Open or create `.env.local` in your project root
2. Add this line (replace with your actual key):
   ```
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyYOUR_ACTUAL_KEY_HERE
   ```

## Step 5: Restart Your Development Server

Stop your dev server (Ctrl+C) and restart it:
```bash
npm run dev
# or
yarn dev
```

## Step 6: Test the Map

1. Open the admin dashboard
2. Go to **Attendance** > **Create Event**
3. Enable geofence validation
4. Click **"Select Location on Map"**
5. The map should load and you can:
   - Search for places (e.g., "Gym", "University Hall")
   - Click on the map to set a location
   - Drag the pin to adjust

## Troubleshooting

### "Google Maps authentication failed"
- Check that your API key is correct (no extra spaces)
- Ensure both Maps JavaScript API and Places API are enabled
- Verify API key restrictions allow your domain

### "Google Maps failed to load"
- Check your internet connection
- Verify the API key has billing enabled (Google Maps requires billing)
- Try temporarily removing API restrictions for testing

### Map shows but search doesn't work
- Ensure Places API is enabled
- Check that the API key has Places API permissions

## Quick Test Coordinates

If you want to test without the map, use these coordinates:
- **University Gym**: 14.599512, 120.984219
- **Main Hall**: 14.599800, 120.984500
- **Library**: 14.599200, 120.983800

## What Works After Setup

Once the map is working, admins can:
- Search for locations by name
- Click anywhere on the map to set the event location
- Drag the pin to fine-tune the position
- See the selected location name (not just coordinates)
- Still manually enter coordinates as a backup

This makes the geotagging setup much more user-friendly for non-technical admins.
