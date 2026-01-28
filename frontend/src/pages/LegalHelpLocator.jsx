import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useNavigate, Link } from 'react-router-dom';
import {
    Phone, Navigation, Scale, Search, AlertTriangle,
    Loader2, X, MessageCircle, ArrowLeft, Clock, Star,
    ExternalLink, Copy, CheckCircle2, Briefcase, Award,
    Shield, ChevronRight, Gavel, Home, MapPin
} from 'lucide-react';
import Background from '../components/Background';

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

// Search keywords for Lawyers
const SEARCH_KEYWORDS = [
    'Cyber Crime Lawyer',
    'Advocate High Court',
    'Criminal Lawyer',
    'IT Act Lawyer',
    'Lawyer'
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

// Legal Aid Resources
const LEGAL_RESOURCES = [
    {
        name: 'National Legal Services Authority',
        description: 'Free legal aid for eligible citizens',
        website: 'https://nalsa.gov.in/',
        icon: '⚖️'
    },
    {
        name: 'Bar Council of India',
        description: 'Verify advocate credentials',
        website: 'https://www.barcouncilofindia.org/',
        icon: '🏛️'
    },
];

// Specializations to look for
const SPECIALIZATIONS = [
    { name: 'Cyber Crime', color: 'from-violet-500 to-purple-600' },
    { name: 'IT Act', color: 'from-blue-500 to-indigo-600' },
    { name: 'Data Privacy', color: 'from-emerald-500 to-teal-600' },
    { name: 'Online Fraud', color: 'from-orange-500 to-red-600' },
    { name: 'Digital Evidence', color: 'from-cyan-500 to-blue-600' },
    { name: 'E-commerce', color: 'from-pink-500 to-rose-600' }
];

export default function LegalHelpLocator() {
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
    const [selectedSpecialization, setSelectedSpecialization] = useState(null);

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
    const getCacheKey = useCallback((location, radius, specialization) => {
        return `lawyer_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_${radius}_${specialization || 'all'}`;
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
                        { location, radius, keyword, type: 'lawyer' },
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

                if (allResults.length >= 6) break;
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
                    fields: ['formatted_phone_number', 'formatted_address', 'opening_hours', 'website', 'international_phone_number', 'reviews'],
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
    const performSearch = useCallback(async (searchLocation, specialization = null) => {
        if (!searchLocation || !placesServiceRef.current) return;

        setIsSearching(true);
        setResults([]);
        setHasSearched(true);

        const keywords = specialization
            ? [`${specialization} Lawyer`, ...SEARCH_KEYWORDS]
            : SEARCH_KEYWORDS;

        const cacheKey = getCacheKey(searchLocation, searchRadius, specialization);

        if (searchCacheRef.current.has(cacheKey)) {
            const cachedResults = searchCacheRef.current.get(cacheKey);
            setResults(cachedResults);
            setIsSearching(false);
            return;
        }

        try {
            let places = await searchPlaces(searchLocation, keywords, 10000);

            if (places.length === 0) {
                setSearchRadius(30000);
                places = await searchPlaces(searchLocation, keywords, 30000);
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
            const topResults = placesWithDistance.slice(0, 6);

            const resultsWithDetails = await Promise.all(
                topResults.slice(0, 4).map(async (place) => {
                    const details = await getPlaceDetails(place.place_id);
                    return {
                        ...place,
                        phone: details?.formatted_phone_number || null,
                        internationalPhone: details?.international_phone_number || null,
                        address: details?.formatted_address || place.vicinity,
                        website: details?.website || null,
                        isOpen: details?.opening_hours?.isOpen?.() || null,
                        openingHours: details?.opening_hours?.weekday_text || null,
                        reviews: details?.reviews?.slice(0, 2) || [],
                    };
                })
            );

            const remainingResults = topResults.slice(4).map((place) => ({
                ...place,
                phone: null,
                address: place.vicinity,
                website: null,
                reviews: [],
            }));

            const finalResults = [...resultsWithDetails, ...remainingResults];
            searchCacheRef.current.set(cacheKey, finalResults);
            setResults(finalResults);
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
            performSearch(location, selectedSpecialization);
        } catch (error) {
            setLocationError('City not found. Please try another city name.');
            setIsSearching(false);
        }
    }, [manualCity, performSearch, selectedSpecialization]);

    // ============ TRIGGER SEARCH ============
    useEffect(() => {
        if (userLocation && isLoaded && placesServiceRef.current && !hasSearched) {
            performSearch(userLocation, selectedSpecialization);
        }
    }, [userLocation, isLoaded, performSearch, hasSearched, selectedSpecialization]);

    // ============ HANDLE SPECIALIZATION CHANGE ============
    const handleSpecializationChange = useCallback((spec) => {
        const newSpec = spec === selectedSpecialization ? null : spec;
        setSelectedSpecialization(newSpec);
        if (userLocation) {
            setHasSearched(false);
            performSearch(userLocation, newSpec);
        }
    }, [selectedSpecialization, userLocation, performSearch]);

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
        return `https://wa.me/${formattedPhone}?text=${encodeURIComponent('Hello, I need legal consultation regarding a cybercrime matter. Can we schedule a meeting?')}`;
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
            fillColor: '#8B5CF6',
            fillOpacity: 1,
            strokeColor: '#7C3AED',
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
                            <div className="w-16 h-16 rounded-full border-4 border-violet-500/30 border-t-violet-500 animate-spin mx-auto" />
                            <Scale className="w-6 h-6 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-gray-400 mt-6 text-lg">Loading Legal Help Finder...</p>
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
                                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg shadow-violet-500/25">
                                        <Scale className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h1 className="text-lg font-bold text-white">
                                            Find Legal Help
                                        </h1>
                                        <p className="text-xs text-slate-400 hidden sm:block">Cyber Crime Lawyers & Advocates</p>
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
                    {/* ============ SPECIALIZATION FILTERS ============ */}
                    <div className="mb-8">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">⚖️ Filter by Specialization</h2>
                        <div className="flex flex-wrap gap-3">
                            {SPECIALIZATIONS.map((spec) => (
                                <button
                                    key={spec.name}
                                    onClick={() => handleSpecializationChange(spec.name)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${selectedSpecialization === spec.name
                                        ? `bg-gradient-to-r ${spec.color} text-white shadow-lg`
                                        : 'bg-slate-900/50 text-slate-400 border border-slate-800 hover:border-violet-500/50 hover:text-white'
                                        }`}
                                >
                                    {spec.name}
                                </button>
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
                                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
                                            className="flex items-center justify-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25"
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
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-violet-600">{selectedMarker.distance.toFixed(1)} km away</span>
                                                    {selectedMarker.rating && (
                                                        <span className="text-sm text-amber-600 flex items-center gap-1">
                                                            <Star className="w-3.5 h-3.5 fill-current" />
                                                            {selectedMarker.rating}
                                                        </span>
                                                    )}
                                                </div>
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
                                    <div className="p-2 bg-violet-500/20 rounded-lg">
                                        <Briefcase className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">Legal Professionals</h2>
                                </div>
                                <p className="text-sm text-slate-400">
                                    {isSearching
                                        ? 'Searching for advocates...'
                                        : results.length > 0
                                            ? `Found ${results.length} advocates within ${searchRadius / 1000}km`
                                            : hasSearched
                                                ? 'No results found nearby'
                                                : 'Waiting for your location...'}
                                </p>
                            </div>

                            {/* Loading State */}
                            {isSearching && (
                                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
                                    <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
                                    <p className="text-slate-400">Finding legal professionals...</p>
                                </div>
                            )}

                            {/* Results List */}
                            {!isSearching && results.length > 0 && (
                                <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                                    {results.slice(0, 4).map((place, index) => (
                                        <div
                                            key={place.place_id}
                                            className={`bg-slate-900/50 border rounded-2xl overflow-hidden transition-all duration-300 ${expandedResult === place.place_id
                                                ? 'border-violet-500/50 shadow-lg shadow-violet-500/10'
                                                : 'border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <div
                                                className="p-4 cursor-pointer"
                                                onClick={() => setExpandedResult(expandedResult === place.place_id ? null : place.place_id)}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                                                        <Briefcase className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-white truncate">{place.name}</h3>
                                                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{place.address}</p>
                                                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                                                            <span className="text-sm font-medium text-violet-400">
                                                                📍 {place.distance.toFixed(1)} km
                                                            </span>
                                                            {place.rating && (
                                                                <span className="text-sm flex items-center gap-1 text-amber-400">
                                                                    <Star className="w-3.5 h-3.5 fill-current" />
                                                                    {place.rating}
                                                                </span>
                                                            )}
                                                            {place.isOpen !== null && (
                                                                <span className={`text-sm flex items-center gap-1.5 ${place.isOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                    {place.isOpen ? 'Open' : 'Closed'}
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
                                                            className="flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-medium text-sm transition-all shadow-lg shadow-violet-500/20"
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

                                                    {/* Reviews */}
                                                    {place.reviews && place.reviews.length > 0 && (
                                                        <div className="space-y-2">
                                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Reviews</h4>
                                                            {place.reviews.map((review, idx) => (
                                                                <div key={idx} className="bg-slate-800/30 rounded-xl p-3">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <div className="flex">
                                                                            {[...Array(5)].map((_, i) => (
                                                                                <Star
                                                                                    key={i}
                                                                                    className={`w-3 h-3 ${i < review.rating ? 'text-amber-400 fill-current' : 'text-slate-600'}`}
                                                                                />
                                                                            ))}
                                                                        </div>
                                                                        <span className="text-xs text-slate-500">{review.relative_time_description}</span>
                                                                    </div>
                                                                    <p className="text-xs text-slate-400 line-clamp-2">{review.text}</p>
                                                                </div>
                                                            ))}
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
                                    <h3 className="font-semibold text-slate-300 mb-2">No Lawyers Found</h3>
                                    <p className="text-sm text-slate-500">Try searching with a different city or removing specialization filters.</p>
                                </div>
                            )}

                            {/* ============ LEGAL RESOURCES ============ */}
                            <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20 rounded-2xl p-5 backdrop-blur-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-violet-500/20 rounded-xl">
                                        <Award className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-violet-300">Verify Credentials</h3>
                                        <p className="text-xs text-violet-200/60">Always verify before engaging services</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {LEGAL_RESOURCES.map((resource, idx) => (
                                        <a
                                            key={idx}
                                            href={resource.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{resource.icon}</span>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-200">{resource.name}</p>
                                                    <p className="text-xs text-slate-500">{resource.description}</p>
                                                </div>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors" />
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* ============ DISCLAIMER ============ */}
                            <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl p-4">
                                <p className="text-xs text-slate-500 text-center leading-relaxed">
                                    ⚖️ Listings are based on public map data. Please verify credentials independently before engaging any legal services. This is not legal advice.
                                </p>
                            </div>

                            {/* Quick Link to Cyber Cell */}
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Need Police Assistance?</h4>
                                <Link
                                    to="/cyber-cell"
                                    className="flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 border border-red-500/30 rounded-xl transition-all group"
                                >
                                    <Shield className="w-5 h-5 text-red-400" />
                                    <span className="font-medium text-red-300">Find Nearest Cyber Cell</span>
                                    <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>
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
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8b5cf6; }
      `}</style>
        </Background>
    );
}
