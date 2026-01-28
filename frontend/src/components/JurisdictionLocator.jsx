import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, Phone, Navigation, Shield, Scale, Search, AlertTriangle, Loader2, X } from 'lucide-react';

// Map container styles
const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '1rem',
};

// Default center (India - New Delhi)
const defaultCenter = { lat: 28.6139, lng: 77.209 };

// Libraries to load (places for search)
const libraries = ['places'];

// Search keywords for each mode - optimized for Indian context
const SEARCH_KEYWORDS = {
    police: [
        'Cyber Crime Police Station',
        'CEN Police Station',
        'Cyber Cell',
        'Commissioner of Police Office',
        'Police Station'
    ],
    lawyer: [
        'Cyber Crime Lawyer',
        'Advocate High Court',
        'Criminal Lawyer',
        'Lawyer'
    ]
};

// Custom map styles for a modern look
const mapStyles = [
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

export default function JurisdictionLocator() {
    // ============ STATE MANAGEMENT ============
    const [mode, setMode] = useState('police'); // 'police' or 'lawyer'
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [manualCity, setManualCity] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [searchRadius, setSearchRadius] = useState(10000); // 10km default
    const [hasSearched, setHasSearched] = useState(false);
    const [mapCenter, setMapCenter] = useState(defaultCenter);

    // Refs for Google services
    const mapRef = useRef(null);
    const placesServiceRef = useRef(null);
    const geocoderRef = useRef(null);
    const searchCacheRef = useRef(new Map()); // Cache to minimize API calls

    // ============ LOAD GOOGLE MAPS ============
    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    // ============ GEOLOCATION ON MOUNT ============
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };
                    setUserLocation(loc);
                    setMapCenter(loc);
                    setLocationError(null);
                },
                (error) => {
                    console.warn('Geolocation error:', error.message);
                    setLocationError(
                        error.code === 1
                            ? 'Location permission denied. Please enter your city manually.'
                            : 'Unable to get your location. Please enter your city manually.'
                    );
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
            );
        } else {
            setLocationError('Geolocation not supported. Please enter your city manually.');
        }
    }, []);

    // ============ MAP LOAD CALLBACK ============
    const onMapLoad = useCallback((map) => {
        mapRef.current = map;
        placesServiceRef.current = new window.google.maps.places.PlacesService(map);
        geocoderRef.current = new window.google.maps.Geocoder();
    }, []);

    // ============ CACHE KEY GENERATOR ============
    const getCacheKey = useCallback((location, searchMode, radius) => {
        return `${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_${searchMode}_${radius}`;
    }, []);

    // ============ SEARCH PLACES (OPTIMIZED) ============
    const searchPlaces = useCallback(async (location, keywords, radius) => {
        if (!placesServiceRef.current) return [];

        const allResults = [];
        const seenPlaceIds = new Set();

        // Search with only the first 2 most relevant keywords to minimize API calls
        const priorityKeywords = keywords.slice(0, 2);

        for (const keyword of priorityKeywords) {
            try {
                const results = await new Promise((resolve, reject) => {
                    placesServiceRef.current.nearbySearch(
                        {
                            location,
                            radius,
                            keyword,
                            type: mode === 'police' ? 'police' : 'lawyer',
                        },
                        (results, status) => {
                            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                                resolve(results);
                            } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                                resolve([]);
                            } else {
                                reject(new Error(status));
                            }
                        }
                    );
                });

                // Deduplicate results
                for (const place of results) {
                    if (!seenPlaceIds.has(place.place_id)) {
                        seenPlaceIds.add(place.place_id);
                        allResults.push(place);
                    }
                }

                // Stop if we have enough results (minimize API calls)
                if (allResults.length >= 5) break;
            } catch (error) {
                console.warn(`Search failed for "${keyword}":`, error);
            }
        }

        return allResults;
    }, [mode]);

    // ============ GET PLACE DETAILS (COST OPTIMIZED) ============
    const getPlaceDetails = useCallback((placeId) => {
        return new Promise((resolve) => {
            if (!placesServiceRef.current) {
                resolve(null);
                return;
            }

            placesServiceRef.current.getDetails(
                {
                    placeId,
                    fields: ['formatted_phone_number', 'formatted_address', 'opening_hours', 'website'],
                },
                (place, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                        resolve(place);
                    } else {
                        resolve(null);
                    }
                }
            );
        });
    }, []);

    // ============ CALCULATE DISTANCE ============
    const calculateDistance = useCallback((from, to) => {
        const R = 6371; // Earth's radius in km
        const dLat = ((to.lat - from.lat) * Math.PI) / 180;
        const dLng = ((to.lng - from.lng) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((from.lat * Math.PI) / 180) *
            Math.cos((to.lat * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }, []);

    // ============ MAIN SEARCH FUNCTION ============
    const performSearch = useCallback(async (searchLocation) => {
        if (!searchLocation || !placesServiceRef.current) return;

        setIsSearching(true);
        setResults([]);
        setHasSearched(true);

        const keywords = SEARCH_KEYWORDS[mode];
        const cacheKey = getCacheKey(searchLocation, mode, searchRadius);

        // Check cache first
        if (searchCacheRef.current.has(cacheKey)) {
            const cachedResults = searchCacheRef.current.get(cacheKey);
            setResults(cachedResults);
            setIsSearching(false);
            return;
        }

        try {
            // First search with 10km radius
            let places = await searchPlaces(searchLocation, keywords, 10000);

            // If no results, expand to 30km
            if (places.length === 0) {
                setSearchRadius(30000);
                places = await searchPlaces(searchLocation, keywords, 30000);
            }

            // Calculate distance and sort
            const placesWithDistance = places.map((place) => ({
                ...place,
                distance: calculateDistance(searchLocation, {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                }),
                position: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                },
            }));

            // Sort by distance and take top 5
            placesWithDistance.sort((a, b) => a.distance - b.distance);
            const topResults = placesWithDistance.slice(0, 5);

            // Get phone details for top 3 only (cost optimization)
            const resultsWithDetails = await Promise.all(
                topResults.slice(0, 3).map(async (place) => {
                    const details = await getPlaceDetails(place.place_id);
                    return {
                        ...place,
                        phone: details?.formatted_phone_number || null,
                        address: details?.formatted_address || place.vicinity,
                        website: details?.website || null,
                    };
                })
            );

            // Add remaining without details
            const remainingWithoutDetails = topResults.slice(3).map((place) => ({
                ...place,
                phone: null,
                address: place.vicinity,
                website: null,
            }));

            const finalResults = [...resultsWithDetails, ...remainingWithoutDetails];

            // Cache results
            searchCacheRef.current.set(cacheKey, finalResults);

            setResults(finalResults);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, [mode, searchRadius, getCacheKey, searchPlaces, calculateDistance, getPlaceDetails]);

    // ============ GEOCODE CITY ============
    const geocodeCity = useCallback(async () => {
        if (!manualCity.trim() || !geocoderRef.current) return;

        setIsSearching(true);

        try {
            const result = await new Promise((resolve, reject) => {
                geocoderRef.current.geocode(
                    { address: `${manualCity}, India` },
                    (results, status) => {
                        if (status === 'OK' && results[0]) {
                            resolve(results[0]);
                        } else {
                            reject(new Error('City not found'));
                        }
                    }
                );
            });

            const location = {
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
            };

            setUserLocation(location);
            setMapCenter(location);
            setLocationError(null);
            performSearch(location);
        } catch (error) {
            setLocationError('City not found. Please try another city name.');
            setIsSearching(false);
        }
    }, [manualCity, performSearch]);

    // ============ TRIGGER SEARCH ON USER LOCATION ============
    useEffect(() => {
        if (userLocation && isLoaded && placesServiceRef.current && !hasSearched) {
            performSearch(userLocation);
        }
    }, [userLocation, isLoaded, performSearch, hasSearched]);

    // ============ RE-SEARCH ON MODE CHANGE ============
    useEffect(() => {
        if (userLocation && isLoaded && placesServiceRef.current) {
            setHasSearched(false);
            performSearch(userLocation);
        }
    }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

    // ============ MARKER ICON CONFIGURATIONS ============
    const userMarkerIcon = useMemo(() => {
        if (!isLoaded) return null;
        return {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#3B82F6',
            fillOpacity: 1,
            strokeColor: '#1D4ED8',
            strokeWeight: 3,
        };
    }, [isLoaded]);

    const placeMarkerIcon = useMemo(() => {
        if (!isLoaded) return null;
        return {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: mode === 'police' ? '#DC2626' : '#7C3AED',
            fillOpacity: 1,
            strokeColor: mode === 'police' ? '#991B1B' : '#5B21B6',
            strokeWeight: 2,
        };
    }, [isLoaded, mode]);

    // ============ LOADING STATE ============
    if (loadError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center max-w-md">
                    <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-400 mb-2">Map Loading Failed</h2>
                    <p className="text-gray-400">Please check your API key configuration and try again.</p>
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading Maps...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            {/* ============ HEADER ============ */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    Jurisdiction Locator
                                </h1>
                                <p className="text-sm text-gray-400">Find nearby help centers</p>
                            </div>
                        </div>

                        {/* ============ MODE TOGGLE ============ */}
                        <div className="flex items-center gap-2 bg-slate-800/50 p-1.5 rounded-xl border border-white/10">
                            <button
                                onClick={() => setMode('police')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${mode === 'police'
                                        ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Shield className="w-4 h-4" />
                                <span>Cyber Police</span>
                            </button>
                            <button
                                onClick={() => setMode('lawyer')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${mode === 'lawyer'
                                        ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <Scale className="w-4 h-4" />
                                <span>Legal Help</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ============ MAIN CONTENT ============ */}
            <main className="max-w-7xl mx-auto px-4 py-6">
                {/* ============ LOCATION ERROR / MANUAL INPUT ============ */}
                {locationError && (
                    <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-amber-200 mb-4">{locationError}</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={manualCity}
                                            onChange={(e) => setManualCity(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && geocodeCity()}
                                            placeholder="Enter your city (e.g., Mumbai, Bangalore)"
                                            className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                        {manualCity && (
                                            <button
                                                onClick={() => setManualCity('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={geocodeCity}
                                        disabled={!manualCity.trim() || isSearching}
                                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSearching ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Search className="w-5 h-5" />
                                        )}
                                        <span>Search</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ============ MAP SECTION ============ */}
                    <div className="lg:col-span-2 h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <GoogleMap
                            mapContainerStyle={containerStyle}
                            center={mapCenter}
                            zoom={userLocation ? 13 : 5}
                            onLoad={onMapLoad}
                            options={{
                                styles: mapStyles,
                                disableDefaultUI: false,
                                zoomControl: true,
                                mapTypeControl: false,
                                streetViewControl: false,
                                fullscreenControl: true,
                            }}
                        >
                            {/* User Location Marker */}
                            {userLocation && userMarkerIcon && (
                                <Marker
                                    position={userLocation}
                                    icon={userMarkerIcon}
                                    title="Your Location"
                                    zIndex={1000}
                                />
                            )}

                            {/* Place Markers */}
                            {results.map((place, index) => (
                                <Marker
                                    key={place.place_id}
                                    position={place.position}
                                    icon={placeMarkerIcon}
                                    label={{
                                        text: String(index + 1),
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '12px',
                                    }}
                                    onClick={() => setSelectedMarker(place)}
                                    zIndex={100 - index}
                                />
                            ))}

                            {/* Info Window */}
                            {selectedMarker && (
                                <InfoWindow
                                    position={selectedMarker.position}
                                    onCloseClick={() => setSelectedMarker(null)}
                                >
                                    <div className="p-2 max-w-xs">
                                        <h3 className="font-bold text-slate-900 mb-1">{selectedMarker.name}</h3>
                                        <p className="text-sm text-gray-600 mb-2">{selectedMarker.address || selectedMarker.vicinity}</p>
                                        <p className="text-sm font-medium text-indigo-600">
                                            {selectedMarker.distance.toFixed(1)} km away
                                        </p>
                                    </div>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    </div>

                    {/* ============ RESULTS PANEL ============ */}
                    <div className="space-y-4">
                        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-4">
                            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
                                {mode === 'police' ? (
                                    <Shield className="w-5 h-5 text-red-400" />
                                ) : (
                                    <Scale className="w-5 h-5 text-violet-400" />
                                )}
                                <span>
                                    {mode === 'police' ? 'Nearby Cyber Cells' : 'Legal Professionals'}
                                </span>
                            </h2>
                            <p className="text-sm text-gray-400">
                                {isSearching
                                    ? 'Searching...'
                                    : results.length > 0
                                        ? `Found ${results.length} results within ${searchRadius / 1000}km`
                                        : hasSearched
                                            ? 'No results found nearby'
                                            : 'Waiting for location...'}
                            </p>
                        </div>

                        {/* Loading State */}
                        {isSearching && (
                            <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 text-center">
                                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                                <p className="text-gray-400">Finding nearby locations...</p>
                            </div>
                        )}

                        {/* Results List */}
                        {!isSearching && results.length > 0 && (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                                {results.slice(0, 3).map((place, index) => (
                                    <div
                                        key={place.place_id}
                                        className="bg-slate-800/50 border border-white/10 rounded-2xl p-4 hover:border-indigo-500/30 transition-colors"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div
                                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${mode === 'police'
                                                        ? 'bg-gradient-to-br from-red-500 to-rose-600'
                                                        : 'bg-gradient-to-br from-violet-500 to-purple-600'
                                                    }`}
                                            >
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-white truncate">{place.name}</h3>
                                                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                                    {place.address || place.vicinity}
                                                </p>
                                                <p className="text-sm font-medium text-indigo-400 mt-2">
                                                    📍 {place.distance.toFixed(1)} km away
                                                </p>

                                                {/* Rating */}
                                                {place.rating && (
                                                    <div className="flex items-center gap-1 mt-2">
                                                        <span className="text-amber-400">★</span>
                                                        <span className="text-sm text-gray-300">
                                                            {place.rating} ({place.user_ratings_total || 0} reviews)
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 mt-4">
                                                    <a
                                                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                                                            place.name
                                                        )}&destination_place_id=${place.place_id}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
                                                    >
                                                        <Navigation className="w-4 h-4" />
                                                        <span>Directions</span>
                                                    </a>
                                                    {place.phone && (
                                                        <a
                                                            href={`tel:${place.phone}`}
                                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-medium text-sm hover:bg-emerald-500/30 transition-colors"
                                                        >
                                                            <Phone className="w-4 h-4" />
                                                            <span>Call</span>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* No Results */}
                        {!isSearching && hasSearched && results.length === 0 && (
                            <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8 text-center">
                                <Search className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                                <h3 className="font-semibold text-gray-300 mb-2">No Results Found</h3>
                                <p className="text-sm text-gray-500">
                                    Try searching with a different city or expanding your search area.
                                </p>
                            </div>
                        )}

                        {/* ============ ZERO FIR CARD (Police Mode) ============ */}
                        {mode === 'police' && (
                            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-amber-500/20 rounded-xl flex-shrink-0">
                                        <Shield className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-amber-300 mb-2">
                                            🛡️ Know Your Rights - Zero FIR
                                        </h3>
                                        <p className="text-sm text-amber-200/80 leading-relaxed">
                                            <strong>Jurisdiction is not a barrier.</strong> You can file a{' '}
                                            <span className="font-semibold text-amber-100">"Zero FIR"</span> at{' '}
                                            <strong>ANY nearest police station</strong>, even if it is not a
                                            specialized Cyber Cell. They are legally bound to transfer it to
                                            the right department under Section 154 of CrPC.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ============ LAWYER DISCLAIMER ============ */}
                        {mode === 'lawyer' && (
                            <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4">
                                <p className="text-xs text-gray-500 text-center">
                                    ⚖️ Listings are based on public map data. Please verify credentials
                                    independently before engaging any legal services.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
