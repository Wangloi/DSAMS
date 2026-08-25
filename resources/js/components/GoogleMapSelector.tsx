import { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        google: any;
        initMap: () => void;
        gm_authFailure?: () => void;
    }
}

type Location = { lat: number; lng: number; name?: string } | null;

interface GoogleMapSelectorProps {
    onLocationSelect: (lat: number, lng: number, name?: string) => void;
    initialLocation?: Location;
}

export default function GoogleMapSelector({
    onLocationSelect,
    initialLocation,
}: GoogleMapSelectorProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const autocompleteRef = useRef<any>(null);
    const [searchInput, setSearchInput] = useState('');
    const [selectedLocationName, setSelectedLocationName] = useState(
        initialLocation?.name ?? '',
    );
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);
    const [error, setError] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [manualLat, setManualLat] = useState(
        initialLocation?.lat?.toFixed(6) ?? '',
    );
    const [manualLng, setManualLng] = useState(
        initialLocation?.lng?.toFixed(6) ?? '',
    );

    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    // Quick API key validation
    const validateApiKey = () => {
        if (!GOOGLE_MAPS_API_KEY) {
            console.warn(
                'No API key provided. See GOOGLE_MAPS_SETUP.md for instructions.',
            );
            return false;
        }
        if (!GOOGLE_MAPS_API_KEY.startsWith('AIzaSy')) {
            console.error('Invalid API key format. Should start with "AIzaSy"');
            return false;
        }
        return true;
    };

    // Load Google Maps script
    useEffect(() => {
        if (window.google || document.getElementById('google-maps-script')) {
            console.log('Google Maps already loaded or script already exists');
            setIsScriptLoaded(true);
            return;
        }

        if (!validateApiKey()) {
            console.warn(
                'Google Maps API key is missing or invalid - using fallback mode',
            );
            console.log(`
        === GOOGLE MAPS SETUP ===
        1. Get an API key: https://developers.google.com/maps/documentation/javascript/get-api-key
        2. Enable these APIs in Google Cloud Console:
           - Maps JavaScript API
           - Places API
        3. Add your key to .env.local:
           VITE_GOOGLE_MAPS_API_KEY=AIzaSyYOUR_KEY_HERE
        4. Restart your dev server
        ========================
      `);
            setError(
                'Google Maps API key is missing or invalid. Using manual entry mode. See GOOGLE_MAPS_SETUP.md for instructions.',
            );
            return;
        }

        console.log('Loading Google Maps script...');
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMap`;
        script.async = true;
        script.defer = true;

        // Set a timeout to detect if the script fails to load
        const timeout = setTimeout(() => {
            if (!window.google) {
                console.error('Google Maps script loading timed out');
                setError(
                    'Google Maps failed to load. Check your network connection and API key. Using manual entry mode.',
                );
            }
        }, 10000); // 10 seconds

        window.initMap = () => {
            clearTimeout(timeout);
            console.log('Google Maps script loaded successfully');
            setIsScriptLoaded(true);
        };

        // Add global error handler to prevent page crash
        window.gm_authFailure = () => {
            clearTimeout(timeout);
            console.error('Google Maps authentication failed');
            console.log(`
        === API KEY TROUBLESHOOTING ===
        1. Check the API key is correct
        2. Ensure these APIs are enabled:
           - Maps JavaScript API
           - Places API
        3. Check API key restrictions:
           - Remove HTTP referrer restrictions for testing
           - Or add: http://localhost:5173, http://127.0.0.1:5173
        4. Check billing is enabled for the project
        ==============================
      `);
            setError(
                'Google Maps authentication failed. Check your API key and restrictions. Using manual entry mode.',
            );
        };

        script.onerror = (event: string | Event) => {
            clearTimeout(timeout);
            console.error('Google Maps script error:', event);
            setError(
                'Failed to load Google Maps. Check API key and ensure Maps JavaScript API is enabled. Using manual entry mode.',
            );
            // Prevent the "Oops" page from taking over if possible
            if (event instanceof Event) {
                event.preventDefault?.();
            }
        };

        document.head.appendChild(script);

        return () => {
            clearTimeout(timeout);
            if (script.parentNode) script.parentNode.removeChild(script);
        };
    }, [GOOGLE_MAPS_API_KEY]);

    // Initialize map when script loads
    useEffect(() => {
        if (!isScriptLoaded || !mapRef.current || mapInstanceRef.current)
            return;

        const map = new window.google.maps.Map(mapRef.current, {
            center: initialLocation
                ? { lat: initialLocation.lat, lng: initialLocation.lng }
                : { lat: 14.5995, lng: 120.9842 },
            zoom: 16,
            mapTypeId: 'roadmap',
        });

        const marker = new window.google.maps.Marker({
            position: initialLocation
                ? { lat: initialLocation.lat, lng: initialLocation.lng }
                : { lat: 14.5995, lng: 120.9842 },
            map,
            draggable: true,
            title: 'Event Location',
        });

        marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            if (pos) {
                const lat = pos.lat();
                const lng = pos.lng();
                const name =
                    selectedLocationName ||
                    `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                onLocationSelect(lat, lng, name);
                setSelectedLocationName(name);
                setManualLat(lat.toFixed(6));
                setManualLng(lng.toFixed(6));
            }
        });

        map.addListener('click', (e: any) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            marker.setPosition({ lat, lng });
            const name = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onLocationSelect(lat, lng, name);
            setSelectedLocationName(name);
            setManualLat(lat.toFixed(6));
            setManualLng(lng.toFixed(6));
            setSearchInput('');
        });

        // Autocomplete search box
        const autocomplete = new window.google.maps.places.Autocomplete(
            document.getElementById('map-search-input') as HTMLInputElement,
            { types: ['establishment', 'geocode'] },
        );

        autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) return;
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const name =
                place.formatted_address ||
                `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            map.setCenter({ lat, lng });
            marker.setPosition({ lat, lng });
            onLocationSelect(lat, lng, name);
            setSelectedLocationName(name);
            setManualLat(lat.toFixed(6));
            setManualLng(lng.toFixed(6));
            setSearchInput(name);
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
        autocompleteRef.current = autocomplete;
    }, [
        isScriptLoaded,
        initialLocation,
        onLocationSelect,
        selectedLocationName,
    ]);

    const handleManualSubmit = () => {
        const lat = parseFloat(manualLat);
        const lng = parseFloat(manualLng);
        if (
            isNaN(lat) ||
            isNaN(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {
            setError(
                'Invalid coordinates. Enter valid latitude (-90 to 90) and longitude (-180 to 180).',
            );
            return;
        }
        const name = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        onLocationSelect(lat, lng, name);
        setSelectedLocationName(name);
        if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setCenter({ lat, lng });
            markerRef.current.setPosition({ lat, lng });
        }
        setError('');
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-sm font-medium text-slate-700">
                    Search location
                </label>
                <input
                    id="map-search-input"
                    type="text"
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm"
                    placeholder="e.g., Gym"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    disabled={!isScriptLoaded}
                />
            </div>

            {selectedLocationName && (
                <div className="text-sm text-slate-600">
                    Selected:{' '}
                    <span className="font-semibold">
                        {selectedLocationName}
                    </span>
                </div>
            )}

            <div
                className="overflow-hidden rounded-lg border border-slate-300"
                style={{ height: '300px' }}
            >
                {!isScriptLoaded && !error && (
                    <div className="flex h-full items-center justify-center bg-slate-100">
                        <div className="text-center">
                            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                            <p className="text-sm text-slate-600">
                                Loading Google Maps...
                            </p>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="flex h-full items-center justify-center bg-amber-50">
                        <div className="p-4 text-center">
                            <p className="mb-2 text-sm text-amber-700">
                                Map unavailable - using manual entry
                            </p>
                            <p className="text-xs text-slate-500">{error}</p>
                        </div>
                    </div>
                )}
                <div
                    ref={mapRef}
                    className="h-full w-full"
                    style={{
                        display: isScriptLoaded && !error ? 'block' : 'none',
                    }}
                />
            </div>

            {!selectedLocationName && !error && isScriptLoaded && (
                <p className="text-xs text-amber-600">
                    Please select a location on the map or via search.
                </p>
            )}

            <div>
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-slate-500 underline"
                >
                    {showAdvanced ? 'Hide' : 'Show'} Manual Entry{' '}
                    {error && '(Map unavailable - use this)'}
                </button>
                {(showAdvanced || error) && (
                    <div className="mt-2 space-y-2 rounded-md bg-slate-50 p-3">
                        <p className="mb-2 text-xs text-slate-600">
                            Enter coordinates manually:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs font-medium text-slate-700">
                                    Latitude
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 text-xs"
                                    value={manualLat}
                                    onChange={(e) =>
                                        setManualLat(e.target.value)
                                    }
                                    placeholder="14.599512"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700">
                                    Longitude
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-slate-300 text-xs"
                                    value={manualLng}
                                    onChange={(e) =>
                                        setManualLng(e.target.value)
                                    }
                                    placeholder="120.984219"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleManualSubmit}
                            className="rounded bg-slate-600 px-3 py-1 text-xs text-white hover:bg-slate-700"
                        >
                            Set Location
                        </button>
                        {error && (
                            <p className="mt-2 text-xs text-slate-500">
                                Map is unavailable due to API issues. Use manual
                                entry to continue testing geotagging.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
