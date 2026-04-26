import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Phone, Navigation, Scale, Search, AlertTriangle,
    Loader2, X, MessageCircle, ArrowLeft, Clock, Star,
    ExternalLink, Copy, CheckCircle2, Briefcase, Award,
    Shield, ChevronRight, Gavel, Home, MapPin
} from 'lucide-react';
import Background from '../components/Background';
import MapTilerMap from '../components/MapTilerMap';
import LAWYER_DATA from '../data/lawyerData';
const SPECIALIZATIONS = ['Cyber Crime', 'Financial Fraud', 'Data Privacy'];

// Default center (India - New Delhi)
const defaultCenter = { lat: 28.6139, lng: 77.209 };

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

// ============ HAVERSINE DISTANCE ============
function calculateDistance(from, to) {
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
}

export default function LegalHelpLocator() {
    // ============ STATE MANAGEMENT ============
    const [userLocation, setUserLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [manualCity, setManualCity] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(5);
    const [copiedNumber, setCopiedNumber] = useState(null);
    const [expandedResult, setExpandedResult] = useState(null);
    const [selectedSpecialization, setSelectedSpecialization] = useState(null);

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
                    setMapZoom(10);
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

    // ============ SEARCH CURATED LAWYERS ============
    const searchLawyers = useCallback((location, specialization = null) => {
        if (!location) return;

        setIsSearching(true);
        setHasSearched(true);

        // Filter by specialization if selected
        let filteredLawyers = LAWYER_DATA;
        if (specialization) {
            filteredLawyers = LAWYER_DATA.filter(lawyer =>
                lawyer.specializations?.includes(specialization)
            );
        }

        // Calculate distance from user to each lawyer
        const lawyersWithDistance = filteredLawyers.map((lawyer) => ({
            ...lawyer,
            distance: calculateDistance(location, { lat: lawyer.lat, lng: lawyer.lng }),
        }));

        // Sort by distance, show top 8
        lawyersWithDistance.sort((a, b) => a.distance - b.distance);
        const topResults = lawyersWithDistance.slice(0, 8);

        setResults(topResults);
        setIsSearching(false);
    }, []);

    // ============ GEOCODE CITY VIA MAPTILER ============
    const geocodeCity = useCallback(async () => {
        if (!manualCity.trim()) return;

        setIsSearching(true);

        try {
            const apiKey = import.meta.env.VITE_MAPTILER_API_KEY || '';
            const query = encodeURIComponent(`${manualCity}, India`);
            const url = `https://api.maptiler.com/geocoding/${query}.json?key=${apiKey}&limit=1&country=in`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Geocoding request failed');

            const data = await response.json();
            if (!data.features || data.features.length === 0) {
                throw new Error('City not found');
            }

            const [lng, lat] = data.features[0].geometry.coordinates;
            const location = { lat, lng };

            setUserLocation(location);
            setMapCenter(location);
            setMapZoom(10);
            setLocationError(null);
            searchLawyers(location, selectedSpecialization);
        } catch (error) {
            setLocationError('City not found. Please try another city name.');
            setIsSearching(false);
        }
    }, [manualCity, searchLawyers, selectedSpecialization]);

    // ============ TRIGGER SEARCH WHEN LOCATION AVAILABLE ============
    useEffect(() => {
        if (userLocation && !hasSearched) {
            searchLawyers(userLocation, selectedSpecialization);
        }
    }, [userLocation, hasSearched, searchLawyers, selectedSpecialization]);

    // ============ HANDLE SPECIALIZATION CHANGE ============
    const handleSpecializationChange = useCallback((spec) => {
        const newSpec = spec === selectedSpecialization ? null : spec;
        setSelectedSpecialization(newSpec);
        if (userLocation) {
            searchLawyers(userLocation, newSpec);
        }
    }, [selectedSpecialization, userLocation, searchLawyers]);

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

    // ============ MAP MARKERS ============
    const mapMarkers = results.map((lawyer) => ({
        id: lawyer.id || `lawyer-${lawyer.lat}`,
        lat: lawyer.lat,
        lng: lawyer.lng,
        name: lawyer.label || lawyer.name,
        address: lawyer.address,
        distance: lawyer.distance,
        color: '#8B5CF6',
    }));

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
                                                onKeyDown={(e) => e.key === 'Enter' && geocodeCity()}
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

                    {/* ============ SEARCH BAR (when location is available) ============ */}
                    {!locationError && (
                        <div className="mb-8">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        value={manualCity}
                                        onChange={(e) => setManualCity(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && geocodeCity()}
                                        placeholder="Search by city name (e.g., Mumbai, Pune, Hyderabad)"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                    />
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
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* ============ MAP SECTION ============ */}
                        <div className="lg:col-span-2">
                            <div className="h-[450px] sm:h-[550px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                                <MapTilerMap
                                    center={mapCenter}
                                    zoom={mapZoom}
                                    markers={mapMarkers}
                                    userLocation={userLocation}
                                    onMarkerClick={(marker) => setExpandedResult(marker.id)}
                                />
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
                                            ? `Found ${results.length} advocates nearest to you${selectedSpecialization ? ` (${selectedSpecialization})` : ''}`
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
                                    {results.map((place, index) => (
                                        <div
                                            key={place.id}
                                            className={`bg-slate-900/50 border rounded-2xl overflow-hidden transition-all duration-300 ${expandedResult === place.id
                                                ? 'border-violet-500/50 shadow-lg shadow-violet-500/10'
                                                : 'border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <div
                                                className="p-4 cursor-pointer"
                                                onClick={() => setExpandedResult(expandedResult === place.id ? null : place.id)}
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
                                                            <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
                                                                {place.city}
                                                            </span>
                                                        </div>
                                                        {/* Specialization tags */}
                                                        {place.specializations && place.specializations.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {place.specializations.slice(0, 3).map(spec => (
                                                                    <span key={spec} className="text-[10px] bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20">
                                                                        {spec}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${expandedResult === place.id ? 'rotate-90' : ''}`} />
                                                </div>
                                            </div>

                                            {/* Expanded Content */}
                                            {expandedResult === place.id && (
                                                <div className="px-4 pb-4 pt-2 border-t border-slate-800 space-y-3">
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <a
                                                            href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
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
                                                            <a
                                                                href={`https://www.google.com/maps/search/${encodeURIComponent(place.name + ' ' + place.city)}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-medium text-sm transition-all"
                                                            >
                                                                <ExternalLink className="w-4 h-4" />
                                                                Google Maps
                                                            </a>
                                                        </div>
                                                    )}

                                                    {place.phone && (
                                                        <div className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                                                            <span className="text-sm text-slate-300 font-mono">{place.phone}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    copyToClipboard(place.phone, place.id);
                                                                }}
                                                                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                                                            >
                                                                {copiedNumber === place.id ? (
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
                            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
                                <div className="flex items-start gap-3">
                                    <Shield className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <strong className="text-slate-400">Disclaimer:</strong> This directory is for informational purposes only.
                                        Always verify credentials through the Bar Council of India. This does not constitute a legal referral.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </Background>
    );
}
