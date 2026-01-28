import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useNavigate, Link } from 'react-router-dom';
import {
    Phone, Navigation, Shield, Search, AlertTriangle,
    Loader2, X, MessageCircle, PhoneCall, ArrowLeft, Clock,
    ExternalLink, Copy, CheckCircle2, MapPin, ChevronRight,
    Gavel, Home, Building2
} from 'lucide-react';
import Background from '../components/Background';
import { CYBER_STATIONS } from '../data/cyberStations';

// Map container styles
const containerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '1rem',
};

// Default center (India - New Delhi)
const defaultCenter = { lat: 28.6139, lng: 77.209 };

// Libraries to load
const libraries = ['places'];

// Search keywords for Cyber Cells
const SEARCH_KEYWORDS = [
    'Cyber Crime Police Station',
    'CEN Police Station',
    'Cyber Cell',
    'Commissioner of Police Office',
    'Police Station'
];

// Custom map styles for dark theme
const mapStyles = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

// Important Cyber Crime Helplines
const HELPLINES = [
    { name: 'National Cyber Crime Helpline', number: '1930', description: '24x7 Available', color: 'from-red-500 to-rose-600' },
    { name: 'Women Helpline', number: '181', description: 'For cyber harassment', color: 'from-pink-500 to-rose-600' },
    { name: 'Police Emergency', number: '100', description: 'General emergency', color: 'from-orange-500 to-red-600' },
];

export default function CyberCellLocator() {
    const navigate = useNavigate();

    // ============ STATE MANAGEMENT ============
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [manualCity, setManualCity] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [selectedMarker, setSelectedMarker] = useState(null);
    const [searchRadius, setSearchRadius] = useState(10000);
    const [hasSearched, setHasSearched] = useState(false);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [copiedNumber, setCopiedNumber] = useState(null);
    const [expandedResult, setExpandedResult] = useState(null);

    // Refs
    const mapRef = useRef(null);
    const placesServiceRef = useRef(null);
    const geocoderRef = useRef(null);
    const searchCacheRef = useRef(new Map());

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
    const getCacheKey = useCallback((location, radius) => {
        return `cyber_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_${radius}`;
    }, []);

    // ============ SEARCH PLACES ============
    const searchPlaces = useCallback(async (location, keywords, radius) => {
        if (!placesServiceRef.current) return [];

        const allResults = [];
        const seenPlaceIds = new Set();
        const priorityKeywords = keywords.slice(0, 2);

        for (const keyword of priorityKeywords) {
            try {
                const results = await new Promise((resolve, reject) => {
                    placesServiceRef.current.nearbySearch(
                        { location, radius, keyword, type: 'police' },
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

                for (const place of results) {
                    if (!seenPlaceIds.has(place.place_id)) {
                        seenPlaceIds.add(place.place_id);
                        allResults.push(place);
                    }
                }

                if (allResults.length >= 5) break;
            } catch (error) {
                console.warn(`Search failed for "${keyword}":`, error);
            }
        }

        return allResults;
    }, []);

    // ============ GET PLACE DETAILS ============
    const getPlaceDetails = useCallback((placeId) => {
        return new Promise((resolve) => {
            if (!placesServiceRef.current) {
                resolve(null);
                return;
            }

            placesServiceRef.current.getDetails(
                {
                    placeId,
                    fields: ['formatted_phone_number', 'formatted_address', 'opening_hours', 'website', 'international_phone_number'],
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
        const R = 6371;
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

        const cacheKey = getCacheKey(searchLocation, searchRadius);

        if (searchCacheRef.current.has(cacheKey)) {
            const cachedResults = searchCacheRef.current.get(cacheKey);
            setResults(cachedResults);
            setIsSearching(false);
            return;
        }

        try {
            let places = await searchPlaces(searchLocation, SEARCH_KEYWORDS, 10000);

            if (places.length === 0) {
                setSearchRadius(30000);
                places = await searchPlaces(searchLocation, SEARCH_KEYWORDS, 30000);
            }

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

            placesWithDistance.sort((a, b) => a.distance - b.distance);
            const topResults = placesWithDistance.slice(0, 5);

            const resultsWithDetails = await Promise.all(
                topResults.map(async (place) => {
                    const details = await getPlaceDetails(place.place_id);
                    return {
                        ...place,
                        phone: details?.formatted_phone_number || null,
                        internationalPhone: details?.international_phone_number || null,
                        address: details?.formatted_address || place.vicinity,
                        website: details?.website || null,
                        isOpen: details?.opening_hours?.isOpen?.() || null,
                        openingHours: details?.opening_hours?.weekday_text || null,
                    };
                })
            );

            searchCacheRef.current.set(cacheKey, resultsWithDetails);
            setResults(resultsWithDetails);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setIsSearching(false);
        }
    }, [searchRadius, getCacheKey, searchPlaces, calculateDistance, getPlaceDetails]);

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

    // ============ TRIGGER SEARCH ============
    useEffect(() => {
        if (userLocation && isLoaded && placesServiceRef.current && !hasSearched) {
            performSearch(userLocation);
        }
    }, [userLocation, isLoaded, performSearch, hasSearched]);

    // ============ COPY TO CLIPBOARD ============
    const copyToClipboard = useCallback((text, id) => {
        navigator.clipboard.writeText(text);
        setCopiedNumber(id);
        setTimeout(() => setCopiedNumber(null), 2000);
    }, []);

    // ============ WHATSAPP LINK ============
    const getWhatsAppLink = useCallback((phone) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
        return `https://wa.me/${formattedPhone}?text=${encodeURIComponent('Hello, I need assistance regarding a cybercrime complaint.')}`;
    }, []);

    // ============ MARKER ICONS ============
    const userMarkerIcon = useMemo(() => {
        if (!isLoaded) return null;
        return {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#6366F1',
            fillOpacity: 1,
            strokeColor: '#4F46E5',
            strokeWeight: 3,
        };
    }, [isLoaded]);

    const placeMarkerIcon = useMemo(() => {
        if (!isLoaded) return null;
        return {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 7,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#DC2626',
            strokeWeight: 2,
        };
    }, [isLoaded]);

    // ============ LOADING/ERROR STATES ============
    if (loadError) {
        return (
            <Background>
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center max-w-md backdrop-blur-sm">
                        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-red-400 mb-2">Map Loading Failed</h2>
                        <p className="text-gray-400">Please check your API key configuration and try again.</p>
                        <Link to="/" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors">
                            <Home className="w-4 h-4" /> Back to Home
                        </Link>
                    </div>
                </div>
            </Background>
        );
    }

    if (!isLoaded) {
        return (
            <Background>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin mx-auto" />
                            <Shield className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-gray-400 mt-6 text-lg">Loading Cyber Cell Locator...</p>
                    </div>
                </div>
            </Background>
        );
    }

    return (
        <Background>
            <div className="min-h-screen text-white">
                {/* ============ HEADER ============ */}
                <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-[#020617]/80 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link
                                    to="/"
                                    className="flex items-center gap-2 group active:scale-95 transition-transform"
                                    title="Return to Home"
                                >
                                    <div className="p-2 bg-indigo-600 rounded-lg shadow-md group-hover:bg-indigo-500 transition-colors">
                                        <Gavel size={18} className="text-white" />
                                    </div>
                                    <span className="font-bold tracking-tight text-slate-100 group-hover:text-indigo-400 transition-colors hidden sm:block">
                                        LegalCore AI
                                    </span>
                                </Link>

                                <div className="h-6 w-px bg-slate-700 hidden sm:block" />

                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg shadow-red-500/25">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-white">
                                            Track Nearest Cyber Cell
                                        </h1>
                                        <p className="text-xs text-slate-400 hidden sm:block">Find Cyber Crime Police Stations</p>
                                    </div>
                                </div>
                            </div>

                            <Link
                                to="/"
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
                            >
                                <ArrowLeft className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-300 hidden sm:inline">Home</span>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* ============ MAIN CONTENT ============ */}
                <main className="max-w-7xl mx-auto px-6 py-8">
                    {/* ============ EMERGENCY HELPLINES ============ */}
                    <div className="mb-8">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">🚨 Emergency Helplines</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {HELPLINES.map((helpline, index) => (
                                <div
                                    key={index}
                                    className="group relative overflow-hidden bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-red-500/30 transition-all duration-300"
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${helpline.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                                    <div className="relative flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{helpline.name}</p>
                                            <p className="text-3xl font-extrabold text-white mt-1">{helpline.number}</p>
                                            <p className="text-xs text-red-400 font-medium mt-1">{helpline.description}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <a
                                                href={`tel:${helpline.number}`}
                                                className={`p-3 bg-gradient-to-br ${helpline.color} rounded-xl text-white shadow-lg hover:scale-105 transition-transform`}
                                            >
                                                <PhoneCall className="w-5 h-5" />
                                            </a>
                                            <button
                                                onClick={() => copyToClipboard(helpline.number, `helpline-${index}`)}
                                                className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                                            >
                                                {copiedNumber === `helpline-${index}` ? (
                                                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                                ) : (
                                                    <Copy className="w-5 h-5 text-slate-400" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ============ LOCATION ERROR / MANUAL INPUT ============ */}
                    {locationError && (
                        <div className="mb-8 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 backdrop-blur-sm">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-amber-500/20 rounded-xl">
                                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-amber-200 mb-4 font-medium">{locationError}</p>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={manualCity}
                                                onChange={(e) => setManualCity(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && geocodeCity()}
                                                placeholder="Enter your city (e.g., Mumbai, Bangalore)"
                                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            />
                                            {manualCity && (
                                                <button
                                                    onClick={() => setManualCity('')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                        <button
                                            onClick={geocodeCity}
                                            disabled={!manualCity.trim() || isSearching}
                                            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
                                        >
                                            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                            <span>Search</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* ============ MAP SECTION ============ */}
                        <div className="lg:col-span-2">
                            <div className="h-[450px] sm:h-[550px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
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
                                    {userLocation && userMarkerIcon && (
                                        <Marker position={userLocation} icon={userMarkerIcon} title="Your Location" zIndex={1000} />
                                    )}

                                    {results.map((place, index) => (
                                        <Marker
                                            key={place.place_id}
                                            position={place.position}
                                            icon={placeMarkerIcon}
                                            label={{ text: String(index + 1), color: 'white', fontWeight: 'bold', fontSize: '12px' }}
                                            onClick={() => setSelectedMarker(place)}
                                            zIndex={100 - index}
                                        />
                                    ))}

                                    {selectedMarker && (
                                        <InfoWindow position={selectedMarker.position} onCloseClick={() => setSelectedMarker(null)}>
                                            <div className="p-2 max-w-xs">
                                                <h3 className="font-bold text-slate-900 mb-1">{selectedMarker.name}</h3>
                                                <p className="text-sm text-gray-600 mb-2">{selectedMarker.address}</p>
                                                <p className="text-sm font-medium text-red-600">{selectedMarker.distance.toFixed(1)} km away</p>
                                            </div>
                                        </InfoWindow>
                                    )}
                                </GoogleMap>
                            </div>
                        </div>

                        {/* ============ RESULTS PANEL ============ */}
                        <div className="space-y-6">
                            {/* Results Header */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                        <MapPin className="w-5 h-5 text-red-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">Nearby Cyber Cells</h2>
                                </div>
                                <p className="text-sm text-slate-400">
                                    {isSearching
                                        ? 'Searching nearby stations...'
                                        : results.length > 0
                                            ? `Found ${results.length} stations within ${searchRadius / 1000}km`
                                            : hasSearched
                                                ? 'No results found nearby'
                                                : 'Waiting for your location...'}
                                </p>
                            </div>

                            {/* Loading State */}
                            {isSearching && (
                                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
                                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mx-auto mb-3" />
                                    <p className="text-slate-400">Finding nearby Cyber Cells...</p>
                                </div>
                            )}

                            {/* Results List */}
                            {!isSearching && results.length > 0 && (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {results.map((place, index) => (
                                        <div
                                            key={place.place_id}
                                            className={`bg-slate-900/50 border rounded-2xl overflow-hidden transition-all duration-300 ${expandedResult === place.place_id
                                                ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                                                : 'border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <div
                                                className="p-4 cursor-pointer"
                                                onClick={() => setExpandedResult(expandedResult === place.place_id ? null : place.place_id)}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br from-red-500 to-rose-600 shadow-lg">
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-white truncate">{place.name}</h3>
                                                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{place.address}</p>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <span className="text-sm font-medium text-indigo-400">
                                                                📍 {place.distance.toFixed(1)} km
                                                            </span>
                                                            {place.isOpen !== null && (
                                                                <span className={`text-sm flex items-center gap-1.5 ${place.isOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {place.isOpen ? 'Open Now' : 'Closed'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${expandedResult === place.place_id ? 'rotate-90' : ''}`} />
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            {expandedResult === place.place_id && (
                                                <div className="px-4 pb-4 pt-2 border-t border-slate-800 space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <a
                                                            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name)}&destination_place_id=${place.place_id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-500/20"
                                                        >
                                                            <Navigation className="w-4 h-4" />
                                                            Directions
                                                        </a>

                                                        {place.phone ? (
                                                            <a
                                                                href={`tel:${place.phone}`}
                                                                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium text-sm transition-all"
                                                            >
                                                                <Phone className="w-4 h-4" />
                                                                Call
                                                            </a>
                                                        ) : (
                                                            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-500 rounded-xl text-sm cursor-not-allowed">
                                                                <Phone className="w-4 h-4" />
                                                                No Phone
                                                            </div>
                                                        )}
                                                    </div>

                                                    {place.phone && (
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <a
                                                                href={getWhatsAppLink(place.phone)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-500 rounded-xl font-medium text-sm transition-all"
                                                            >
                                                                <MessageCircle className="w-4 h-4" />
                                                                WhatsApp
                                                            </a>

                                                            {place.website && (
                                                                <a
                                                                    href={place.website}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium text-sm transition-all"
                                                                >
                                                                    <ExternalLink className="w-4 h-4" />
                                                                    Website
                                                                </a>
                                                            )}
                                                        </div>
                                                    )}

                                                    {place.phone && (
                                                        <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                                                            <span className="text-sm text-slate-300 font-mono">{place.phone}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    copyToClipboard(place.phone, place.place_id);
                                                                }}
                                                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                                            >
                                                                {copiedNumber === place.place_id ? (
                                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                                ) : (
                                                                    <Copy className="w-4 h-4 text-slate-400" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* No Results */}
                            {!isSearching && hasSearched && results.length === 0 && (
                                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
                                    <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                    <h3 className="font-semibold text-slate-300 mb-2">No Cyber Cells Found</h3>
                                    <p className="text-sm text-slate-500">Try searching with a different city or use the helplines above.</p>
                                </div>
                            )}

                            {/* ============ ZERO FIR CARD ============ */}
                            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-5 backdrop-blur-sm">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-amber-500/20 rounded-xl flex-shrink-0">
                                        <Shield className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-amber-300 mb-2">🛡️ Know Your Rights - Zero FIR</h3>
                                        <p className="text-sm text-amber-200/80 leading-relaxed">
                                            <strong>Jurisdiction is not a barrier.</strong> You can file a{' '}
                                            <span className="font-semibold text-amber-100">"Zero FIR"</span> at{' '}
                                            <strong>ANY nearest police station</strong>. They are legally bound to transfer it under Section 154 of CrPC.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Quick Actions</h4>
                                <div className="space-y-3">
                                    <a
                                        href="https://cybercrime.gov.in/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors group"
                                    >
                                        <span className="text-sm text-slate-300 font-medium">File Online Complaint</span>
                                        <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                    </a>
                                    <a
                                        href="tel:1930"
                                        className="flex items-center justify-between p-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors border border-red-500/20"
                                    >
                                        <span className="text-sm text-red-300 font-medium">Call 1930 (Cyber Helpline)</span>
                                        <PhoneCall className="w-4 h-4 text-red-400" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ============ CURATED CYBER STATIONS ============ */}
                    <div className="mt-12">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-500/20 rounded-xl">
                                <Building2 className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">All Cyber Crime Police Stations</h2>
                                <p className="text-sm text-slate-400">Quick access to major city cyber cells across India</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {CYBER_STATIONS.map((station, index) => (
                                <a
                                    key={index}
                                    href={station.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative overflow-hidden bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300"
                                >
                                    {/* Gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors truncate">
                                                {station.city}
                                            </h3>
                                            <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                                                {station.label}
                                            </p>
                                            <div className="flex items-center gap-2 mt-3">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                                                    <Navigation className="w-3 h-3" />
                                                    Navigate
                                                </span>
                                                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                            </div>
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>

                        {/* Info Note */}
                        <div className="mt-6 bg-slate-900/30 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                            <Shield className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-400">
                                <strong className="text-slate-300">Tip:</strong> Click on any city card to open Google Maps with directions to the nearest Cyber Crime Police Station in that city.
                            </p>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-slate-800/60 py-8 mt-12">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <p className="text-[11px] text-slate-500 uppercase tracking-widest">
                            Part of LegalCore AI • Verified Legal Intelligence
                        </p>
                    </div>
                </footer>
            </div>

            {/* Custom Scrollbar Styles */}
            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366f1; }
      `}</style>
        </Background>
    );
}
