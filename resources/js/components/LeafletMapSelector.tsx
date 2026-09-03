import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Check,
    Compass,
    Copy,
    Crosshair,
    Layers,
    LocateFixed,
    MapPin,
    Maximize2,
    Minimize2,
    Navigation,
    Radio,
    RefreshCw,
    Search,
    Shield,
    X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Fix Leaflet marker icon asset path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom animated SVG pulse pin icon for Leaflet
const createCustomMarkerIcon = (color: string = '#2563eb') => {
    return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transform: translate(-18px, -36px);">
                <div style="position: absolute; width: 36px; height: 36px; border-radius: 9999px; background-color: ${color}; opacity: 0.25; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                <div style="position: relative; width: 28px; height: 28px; background-color: ${color}; border-radius: 9999px 9999px 0 9999px; transform: rotate(45deg); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center;">
                    <div style="width: 8px; height: 8px; background-color: #ffffff; border-radius: 9999px; transform: rotate(-45deg);"></div>
                </div>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
    });
};

export interface Location {
    lat: number;
    lng: number;
    name?: string;
    radius_m?: number;
}

export interface LeafletMapSelectorProps {
    onLocationSelect: (
        lat: number,
        lng: number,
        name?: string,
        radius?: number,
    ) => void;
    initialLocation?: Location | null;
    initialRadius?: number;
    className?: string;
    height?: string;
    showRadiusControl?: boolean;
    showPresets?: boolean;
}

// Campus Landmarks for St. Rita's College of Balingasag (SRCB)
const CAMPUS_PRESETS = [
    {
        name: "St. Rita's College of Balingasag (Full Campus)",
        lat: 8.74307,
        lng: 124.7745,
        category: 'Campus Center',
    },
    {
        name: 'Main Gate & Entrance',
        lat: 8.74275,
        lng: 124.77445,
        category: 'Entrance',
    },
    {
        name: 'College Gymnasium',
        lat: 8.7428,
        lng: 124.7742,
        category: 'Sports & Events',
    },
    {
        name: 'Central Quadrangle / Inner Ground',
        lat: 8.74317,
        lng: 124.77437,
        category: 'Assembly Area',
    },
    {
        name: 'St. Rita Building (Dean of Student Affairs / Administration)',
        lat: 8.74248,
        lng: 124.77467,
        category: 'Administration',
    },
    {
        name: 'Audio-Visual Room (AVR / Room 204)',
        lat: 8.74258,
        lng: 124.77448,
        category: 'Academic',
    },
    {
        name: 'Mother Ignacia Building',
        lat: 8.7432,
        lng: 124.77428,
        category: 'Academic',
    },
    {
        name: 'College Cafeteria',
        lat: 8.74316,
        lng: 124.77436,
        category: 'Facilities',
    },
    {
        name: 'Outer Campus Ground & Parking',
        lat: 8.7427,
        lng: 124.7744,
        category: 'Parking',
    },
];

export default function LeafletMapSelector({
    onLocationSelect,
    initialLocation,
    initialRadius = 50,
    className = '',
    height = '420px',
    showRadiusControl = true,
    showPresets = true,
}: LeafletMapSelectorProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const circleRef = useRef<L.Circle | null>(null);
    const accuracyCircleRef = useRef<L.Circle | null>(null);

    // Map Center: Default to St. Rita's College of Balingasag
    const defaultCenter: [number, number] = [
        initialLocation?.lat || 8.74307,
        initialLocation?.lng || 124.7745,
    ];

    const [currentLat, setCurrentLat] = useState<number>(defaultCenter[0]);
    const [currentLng, setCurrentLng] = useState<number>(defaultCenter[1]);
    const [locationName, setLocationName] = useState<string>(
        initialLocation?.name || "St. Rita's College of Balingasag",
    );
    const [radius, setRadius] = useState<number>(
        initialLocation?.radius_m || initialRadius || 50,
    );
    const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
    const [isMapReady, setIsMapReady] = useState<boolean>(false);
    const [gpsLoading, setGpsLoading] = useState<boolean>(false);
    const [gpsError, setGpsError] = useState<string | null>(null);
    const [copied, setCopied] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [searchResults, setSearchResults] = useState<
        Array<{ name: string; lat: number; lng: number }>
    >([]);
    const [showResultsDropdown, setShowResultsDropdown] =
        useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    // Tile layers definitions
    const streetLayerRef = useRef<L.TileLayer | null>(null);
    const satelliteLayerRef = useRef<L.TileLayer | null>(null);

    // Initialize Leaflet map
    useEffect(() => {
        if (!mapContainerRef.current || mapInstanceRef.current) return;

        try {
            const map = L.map(mapContainerRef.current, {
                center: defaultCenter,
                zoom: 18,
                zoomControl: true,
                maxZoom: 20,
                minZoom: 4,
            });

            // Street tile layer (OpenStreetMap)
            streetLayerRef.current = L.tileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {
                    attribution:
                        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19,
                },
            );

            // Satellite tile layer (Esri World Imagery)
            satelliteLayerRef.current = L.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                {
                    attribution:
                        'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                    maxZoom: 19,
                },
            );

            // Add default street layer
            streetLayerRef.current.addTo(map);

            // Add interactive draggable marker
            const marker = L.marker(defaultCenter, {
                draggable: true,
                icon: createCustomMarkerIcon('#2563eb'),
                title: 'Drag to adjust geotagged position',
            }).addTo(map);

            // Add Geofence circle
            const circle = L.circle(defaultCenter, {
                radius: radius,
                color: '#2563eb',
                weight: 2,
                opacity: 0.8,
                fillColor: '#3b82f6',
                fillOpacity: 0.18,
                dashArray: '4, 6',
            }).addTo(map);

            // Marker Drag End Listener
            marker.on('dragend', () => {
                const pos = marker.getLatLng();
                updatePosition(pos.lat, pos.lng, false);
            });

            // Map Click Listener to place pin anywhere
            map.on('click', (e: L.LeafletMouseEvent) => {
                updatePosition(e.latlng.lat, e.latlng.lng, false);
            });

            mapInstanceRef.current = map;
            markerRef.current = marker;
            circleRef.current = circle;

            setIsMapReady(true);

            // Trigger size calculation after layout mounts
            setTimeout(() => {
                map.invalidateSize();
            }, 250);
        } catch (error) {
            console.error('[LeafletMapSelector] Error initializing map:', error);
        }

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
                circleRef.current = null;
                setIsMapReady(false);
            }
        };
    }, []);

    // Switch Tile Layer (Streets / Satellite)
    const handleToggleMapStyle = (style: 'streets' | 'satellite') => {
        if (!mapInstanceRef.current) return;
        setMapStyle(style);

        if (style === 'satellite') {
            if (streetLayerRef.current)
                mapInstanceRef.current.removeLayer(streetLayerRef.current);
            if (satelliteLayerRef.current)
                satelliteLayerRef.current.addTo(mapInstanceRef.current);
        } else {
            if (satelliteLayerRef.current)
                mapInstanceRef.current.removeLayer(satelliteLayerRef.current);
            if (streetLayerRef.current)
                streetLayerRef.current.addTo(mapInstanceRef.current);
        }
    };

    // Update position helper
    const updatePosition = (
        lat: number,
        lng: number,
        panMap: boolean = true,
        customName?: string,
    ) => {
        const roundedLat = parseFloat(lat.toFixed(6));
        const roundedLng = parseFloat(lng.toFixed(6));
        setCurrentLat(roundedLat);
        setCurrentLng(roundedLng);

        const name = customName || locationName || `${roundedLat}, ${roundedLng}`;
        setLocationName(name);

        if (markerRef.current) {
            markerRef.current.setLatLng([roundedLat, roundedLng]);
        }

        if (circleRef.current) {
            circleRef.current.setLatLng([roundedLat, roundedLng]);
        }

        if (panMap && mapInstanceRef.current) {
            mapInstanceRef.current.setView([roundedLat, roundedLng], 18, {
                animate: true,
            });
        }

        // Notify parent form component
        onLocationSelect(roundedLat, roundedLng, name, radius);
    };

    // Update Geofence Radius
    const handleRadiusChange = (newRadius: number) => {
        const r = Math.max(10, Math.min(1000, newRadius));
        setRadius(r);

        if (circleRef.current) {
            circleRef.current.setRadius(r);
        }

        onLocationSelect(currentLat, currentLng, locationName, r);
    };

    // Use Device Geolocation ("Locate Me")
    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            setGpsError('Geolocation is not supported by your browser.');
            return;
        }

        setGpsLoading(true);
        setGpsError(null);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setGpsLoading(false);
                const { latitude, longitude, accuracy } = pos.coords;

                updatePosition(latitude, longitude, true, 'Current GPS Location');

                // Draw user accuracy indicator
                if (mapInstanceRef.current) {
                    if (accuracyCircleRef.current) {
                        mapInstanceRef.current.removeLayer(accuracyCircleRef.current);
                    }
                    accuracyCircleRef.current = L.circle([latitude, longitude], {
                        radius: accuracy,
                        color: '#10b981',
                        weight: 1,
                        fillColor: '#10b981',
                        fillOpacity: 0.1,
                    }).addTo(mapInstanceRef.current);
                }
            },
            (err) => {
                setGpsLoading(false);
                setGpsError(err.message || 'Unable to retrieve your location.');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        );
    };

    // Search OpenStreetMap Nominatim or Presets
    const handleSearch = async (query: string) => {
        setSearchQuery(query);
        if (!query.trim()) {
            setSearchResults([]);
            setShowResultsDropdown(false);
            return;
        }

        // Check local campus presets first
        const matchedPresets = CAMPUS_PRESETS.filter((p) =>
            p.name.toLowerCase().includes(query.toLowerCase()),
        ).map((p) => ({ name: p.name, lat: p.lat, lng: p.lng }));

        setSearchResults(matchedPresets);
        setShowResultsDropdown(true);

        // If query is longer, query OpenStreetMap Nominatim for Philippines
        if (query.trim().length > 3) {
            setIsSearching(true);
            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                        query + ', Philippines',
                    )}&limit=5`,
                );
                const data = await res.json();
                const remoteResults = (data || []).map((item: any) => ({
                    name: item.display_name,
                    lat: parseFloat(item.lat),
                    lng: parseFloat(item.lon),
                }));

                setSearchResults([...matchedPresets, ...remoteResults]);
            } catch (err) {
                console.warn('[LeafletMapSelector] Nominatim search failed:', err);
            } finally {
                setIsSearching(false);
            }
        }
    };

    const handleSelectSearchResult = (result: {
        name: string;
        lat: number;
        lng: number;
    }) => {
        setSearchQuery(result.name);
        setShowResultsDropdown(false);
        updatePosition(result.lat, result.lng, true, result.name);
    };

    const copyCoords = () => {
        navigator.clipboard.writeText(`${currentLat}, ${currentLng}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div
            className={`flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#0B192C] ${className}`}
        >
            {/* Header Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Leaflet Geotagging & Geofence
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Click or drag marker to set GPS attendance radius
                        </p>
                    </div>
                </div>

                {/* Right Action Tools */}
                <div className="flex items-center gap-1.5">
                    {/* Layer Switcher */}
                    <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800">
                        <button
                            type="button"
                            onClick={() => handleToggleMapStyle('streets')}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                mapStyle === 'streets'
                                    ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-white'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                            }`}
                        >
                            Streets
                        </button>
                        <button
                            type="button"
                            onClick={() => handleToggleMapStyle('satellite')}
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                                mapStyle === 'satellite'
                                    ? 'bg-white text-blue-600 shadow-xs dark:bg-slate-700 dark:text-white'
                                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                            }`}
                        >
                            Satellite
                        </button>
                    </div>

                    {/* Locate Me */}
                    <button
                        type="button"
                        onClick={handleLocateMe}
                        disabled={gpsLoading}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 shadow-2xs hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer"
                        title="Locate my GPS position"
                    >
                        <LocateFixed
                            className={`h-3.5 w-3.5 ${gpsLoading ? 'animate-spin' : ''}`}
                        />
                        <span>{gpsLoading ? 'Locating...' : 'GPS'}</span>
                    </button>
                </div>
            </div>

            {/* Search Bar & Autocomplete */}
            <div className="relative">
                <div className="relative flex items-center">
                    <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Search landmark (e.g., Gymnasium, Quadrangle, Balingasag)..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2 pr-9 pl-10 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-900/60 dark:text-white dark:focus:border-blue-400"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery('');
                                setShowResultsDropdown(false);
                            }}
                            className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {showResultsDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                        {searchResults.map((result, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectSearchResult(result)}
                                className="flex w-full items-start gap-2.5 rounded-lg px-3 py-2 text-left text-xs text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-blue-400 cursor-pointer"
                            >
                                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                                <div className="min-w-0 flex-1">
                                    <div className="font-bold truncate">
                                        {result.name}
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        {result.lat.toFixed(5)},{' '}
                                        {result.lng.toFixed(5)}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Error Banner */}
            {gpsError && (
                <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                    <span>{gpsError}</span>
                    <button
                        type="button"
                        onClick={() => setGpsError(null)}
                        className="text-rose-500 hover:text-rose-700"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                </div>
            )}

            {/* Interactive Leaflet Map Container */}
            <div
                className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-100 shadow-inner dark:border-slate-800 dark:bg-slate-950"
                style={{ height }}
            >
                <div
                    ref={mapContainerRef}
                    className="h-full w-full z-10"
                    style={{ minHeight: height }}
                />

                {/* Floating Geofence Badge Overlay */}
                <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 rounded-xl border border-white/40 bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90">
                    <Radio className="h-4 w-4 text-blue-600 animate-pulse dark:text-blue-400" />
                    <div className="text-[11px] font-black text-slate-800 dark:text-white">
                        Geofence: <span className="text-blue-600 dark:text-blue-400">{radius}m</span> Radius
                    </div>
                </div>
            </div>

            {/* Radius & Coordinate Controls */}
            {showRadiusControl && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800/80 dark:bg-slate-900/40">
                    {/* Geofence Radius Selector */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Geofence Radius
                            </label>
                            <span className="rounded-md bg-blue-100 px-2 py-0.5 text-[11px] font-black text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                {radius} meters
                            </span>
                        </div>
                        <input
                            type="range"
                            min={15}
                            max={300}
                            step={5}
                            value={radius}
                            onChange={(e) =>
                                handleRadiusChange(parseInt(e.target.value, 10))
                            }
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 dark:bg-slate-700"
                        />
                        <div className="mt-1.5 flex justify-between gap-1">
                            {[25, 50, 100, 150, 200].map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => handleRadiusChange(r)}
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold transition-all cursor-pointer ${
                                        radius === r
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                                    }`}
                                >
                                    {r}m
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Coordinates Readout & Copy */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Pin Coordinates
                            </span>
                            <button
                                type="button"
                                onClick={copyCoords}
                                className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-3 w-3 text-emerald-500" />
                                        <span className="text-emerald-600">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3 w-3" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
                                <span className="block text-[10px] font-bold text-slate-400">
                                    Latitude
                                </span>
                                <span className="font-mono font-bold text-slate-800 dark:text-white">
                                    {currentLat.toFixed(6)}
                                </span>
                            </div>
                            <div className="rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800">
                                <span className="block text-[10px] font-bold text-slate-400">
                                    Longitude
                                </span>
                                <span className="font-mono font-bold text-slate-800 dark:text-white">
                                    {currentLng.toFixed(6)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Campus Landmark Preset Quick Buttons */}
            {showPresets && (
                <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <Compass className="h-3.5 w-3.5" />
                        <span>SRCB Campus Quick Landmarks:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                        {CAMPUS_PRESETS.slice(0, 6).map((preset, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() =>
                                    updatePosition(
                                        preset.lat,
                                        preset.lng,
                                        true,
                                        preset.name,
                                    )
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-2xs transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-slate-800 cursor-pointer"
                            >
                                <MapPin className="h-3 w-3 text-blue-500" />
                                <span>{preset.name.split('(')[0].trim()}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
