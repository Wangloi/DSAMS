import L from 'leaflet';
import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type Location = { lat: number; lng: number; name?: string } | null;

interface LeafletMapSelectorProps {
  onLocationSelect: (lat: number, lng: number, name?: string) => void;
  initialLocation?: Location;
}

export default function LeafletMapSelector({ onLocationSelect, initialLocation }: LeafletMapSelectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [selectedLocationName, setSelectedLocationName] = useState(initialLocation?.name ?? '');
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [error, setError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [manualLat, setManualLat] = useState(initialLocation?.lat?.toFixed(6) ?? '12.8797');
  const [manualLng, setManualLng] = useState(initialLocation?.lng?.toFixed(6) ?? '121.7740');
  const [searchResults, setSearchResults] = useState<Array<{name: string, lat: number, lng: number}>>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Predefined Philippine locations
  const philippineLocations = [
    // Major Cities
    { name: 'Manila', lat: 14.5995, lng: 120.9842 },
    { name: 'Quezon City', lat: 14.6760, lng: 121.0437 },
    { name: 'Cebu City', lat: 10.3157, lng: 123.8854 },
    { name: 'Davao City', lat: 7.0731, lng: 125.6128 },
    { name: 'Makati', lat: 14.5547, lng: 121.0244 },
    { name: 'Pasig', lat: 14.5764, lng: 121.0851 },
    { name: 'Taguig', lat: 14.5176, lng: 121.0538 },
    { name: 'Pasay', lat: 14.5378, lng: 121.0017 },
    { name: 'Mandaluyong', lat: 14.5794, lng: 121.0344 },
    { name: 'Caloocan', lat: 14.6507, lng: 120.9704 },
    { name: 'Baguio', lat: 16.4023, lng: 120.5960 },
    { name: 'Angeles', lat: 15.1474, lng: 120.5899 },
    { name: 'Iloilo City', lat: 10.7202, lng: 122.5621 },
    { name: 'Bacolod', lat: 10.6605, lng: 122.9510 },
    { name: 'Zamboanga', lat: 6.9214, lng: 122.0790 },
    
    // Universities
    { name: 'UP Diliman', lat: 14.6533, lng: 121.0683 },
    { name: 'Ateneo de Manila', lat: 14.6398, lng: 121.0758 },
    { name: 'De La Salle', lat: 14.5642, lng: 120.9930 },
    { name: 'UST', lat: 14.6120, lng: 120.9969 },
    { name: 'MIT', lat: 14.5605, lng: 120.9935 },
    { name: 'FEU', lat: 14.6081, lng: 120.9838 },
    { name: 'Adamson', lat: 14.6049, lng: 120.9899 },
    { name: 'CEU', lat: 14.6202, lng: 120.9830 },
    { name: 'San Beda', lat: 14.6039, lng: 120.9868 },
    { name: 'Trinity', lat: 14.6156, lng: 121.0429 },
    { name: 'Miriam', lat: 14.6415, lng: 121.0693 },
    { name: 'St. Scholastica', lat: 14.6274, lng: 121.0429 },
  ];

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchInput(query);
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const filtered = philippineLocations.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 8); // Limit to 8 results

    setSearchResults(filtered);
    setShowSearchResults(true);
  };

  const selectLocation = (location: {name: string, lat: number, lng: number}) => {
    setSearchInput(location.name);
    setShowSearchResults(false);
    setSearchResults([]);
    
    // Update map and marker
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([location.lat, location.lng]);
      mapInstanceRef.current.setView([location.lat, location.lng], 15);
    }
    
    // Update form data
    onLocationSelect(location.lat, location.lng, location.name);
    setSelectedLocationName(location.name);
    setManualLat(location.lat.toFixed(6));
    setManualLng(location.lng.toFixed(6));
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      setIsMapLoaded(false);
      
      // Initialize map
      const map = L.map(mapRef.current, {
        center: initialLocation ? [initialLocation.lat, initialLocation.lng] : [12.8797, 121.7740],
        zoom: 6,
        zoomControl: true,
      });

      // Add OpenStreetMap tiles (free, no API key needed)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add marker
      const marker = L.marker(
        initialLocation ? [initialLocation.lat, initialLocation.lng] : [12.8797, 121.7740],
        {
          draggable: true,
          title: 'Event Location',
        }
      ).addTo(map);

      // Handle marker drag
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        const lat = position.lat;
        const lng = position.lng;
        const name = selectedLocationName || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onLocationSelect(lat, lng, name);
        setSelectedLocationName(name);
        setManualLat(lat.toFixed(6));
        setManualLng(lng.toFixed(6));
      });

      // Handle map click
      map.on('click', (e: L.LeafletMouseEvent) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        marker.setLatLng([lat, lng]);
        const name = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onLocationSelect(lat, lng, name);
        setSelectedLocationName(name);
        setManualLat(lat.toFixed(6));
        setManualLng(lng.toFixed(6));
        setSearchInput('');
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      
      // Small delay to ensure map is fully loaded
      setTimeout(() => {
        setIsMapLoaded(true);
      }, 100);
    } catch (err) {
      console.error('Failed to initialize Leaflet map:', err);
      setError('Failed to load map. Using manual entry mode.');
      setIsMapLoaded(false);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
        setIsMapLoaded(false);
      }
    };
  }, []); // Empty dependency array to prevent re-initialization

  // Update map when initialLocation changes (but don't re-initialize)
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && initialLocation) {
      const currentLatLng = markerRef.current.getLatLng();
      // Only update if the location actually changed
      if (Math.abs(currentLatLng.lat - initialLocation.lat) > 0.0001 || 
          Math.abs(currentLatLng.lng - initialLocation.lng) > 0.0001) {
        markerRef.current.setLatLng([initialLocation.lat, initialLocation.lng]);
        mapInstanceRef.current.setView([initialLocation.lat, initialLocation.lng], 16);
        setSelectedLocationName(initialLocation.name || `${initialLocation.lat.toFixed(6)}, ${initialLocation.lng.toFixed(6)}`);
      }
    }
  }, [initialLocation]);

  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Invalid coordinates. Enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    const name = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    onLocationSelect(lat, lng, name);
    setSelectedLocationName(name);
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.setView([lat, lng], 16);
    }
    setError('');
  };

  return (
    <div className="space-y-3">
      <div className="search-container">
        <label className="block text-sm font-medium text-slate-700">Search location</label>
        <div className="relative">
          <input
            type="text"
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
            placeholder="e.g., Manila, Quezon City, UP Diliman"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={!isMapLoaded}
          />
          {showSearchResults && searchResults.length > 0 && (
            <div className="search-dropdown z-50 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((location, index) => (
                <button
                  key={index}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 focus:bg-slate-100 focus:outline-none border-b border-slate-100 last:border-b-0"
                  onClick={() => selectLocation(location)}
                >
                  <div className="font-medium text-slate-900">{location.name}</div>
                  <div className="text-xs text-slate-500">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">Search Philippine cities and universities</p>
      </div>

      {selectedLocationName && (
        <div className="text-sm text-slate-600">
          Selected: <span className="font-semibold">{selectedLocationName}</span>
        </div>
      )}

      <div className="map-wrapper rounded-lg overflow-hidden border border-slate-300 bg-slate-100" style={{ height: '400px', position: 'relative', minHeight: '400px' }}>
        {!isMapLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-slate-600">Loading Philippines map...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-amber-50 z-10">
            <div className="text-center p-4">
              <p className="text-sm text-amber-700 mb-2">Map unavailable - using manual entry</p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          </div>
        )}
        <div 
          ref={mapRef} 
          className="w-full h-full leaflet-container" 
          style={{ 
            display: isMapLoaded && !error ? 'block' : 'none',
            visibility: isMapLoaded && !error ? 'visible' : 'hidden',
            minHeight: '400px'
          }} 
        />
      </div>

      {!selectedLocationName && !error && isMapLoaded && (
        <p className="text-xs text-amber-600">Click on the map to set the event location</p>
      )}

      <div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-slate-500 underline"
        >
          {showAdvanced ? 'Hide' : 'Show'} Manual Entry {error && '(Map unavailable - use this)'}
        </button>
        {(showAdvanced || error) && (
          <div className="mt-2 p-3 bg-slate-50 rounded-md space-y-2">
            <p className="text-xs text-slate-600 mb-2">Enter coordinates manually:</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-slate-700">Latitude</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-slate-300 text-xs"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  placeholder="14.5995 (Luzon)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700">Longitude</label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border-slate-300 text-xs"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  placeholder="120.9842 (Manila)"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleManualSubmit}
              className="text-xs bg-slate-600 text-white px-3 py-1 rounded hover:bg-slate-700"
            >
              Set Location
            </button>
            {error && (
              <p className="text-xs text-slate-500 mt-2">
                Map is unavailable due to loading issues. Use manual entry to continue testing geotagging.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
