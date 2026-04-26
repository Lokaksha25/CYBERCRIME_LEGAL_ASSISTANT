import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Phone, Navigation, Shield, Search, AlertTriangle,
    Loader2, X, MessageCircle, PhoneCall, ArrowLeft, Clock,
    ExternalLink, Copy, CheckCircle2, MapPin, ChevronRight,
    Gavel, Home, Building2
} from 'lucide-react';
import Background from '../components/Background';
import MapTilerMap from '../components/MapTilerMap';
import CYBER_STATIONS from '../data/cyberStations';

// Default center (India - New Delhi)
const defaultCenter = { lat: 28.6139, lng: 77.209 };

// Important Cyber Crime Helplines
const HELPLINES = [
    { name: 'National Cyber Crime Helpline', number: '1930', description: '24x7 Available', color: 'from-red-500 to-rose-600' },
    { name: 'Women Helpline', number: '181', description: 'For cyber harassment', color: 'from-pink-500 to-rose-600' },
    { name: 'Police Emergency', number: '100', description: 'General emergency', color: 'from-orange-500 to-red-600' },
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

export default function CyberCellLocator() {
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

    // ============ SEARCH CURATED STATIONS ============
    const searchStations = useCallback((location) => {
        if (!location) return;

        setIsSearching(true);
        setHasSearched(true);

        // Calculate distance from user to each curated station
        const stationsWithDistance = CYBER_STATIONS.map((station) => ({
            ...station,
            id: `station-${station.city}-${station.lat}`,
            name: station.label,
            distance: calculateDistance(location, { lat: station.lat, lng: station.lng }),
        }));

        // Sort by distance, show top 8
        stationsWithDistance.sort((a, b) => a.distance - b.distance);
        const topResults = stationsWithDistance.slice(0, 8);

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
            searchStations(location);
        } catch (error) {
            setLocationError('City not found. Please try another city name.');
            setIsSearching(false);
        }
    }, [manualCity, searchStations]);

    // ============ TRIGGER SEARCH WHEN LOCATION AVAILABLE ============
    useEffect(() => {
        if (userLocation && !hasSearched) {
            searchStations(userLocation);
        }
    }, [userLocation, hasSearched, searchStations]);

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

    // ============ MAP MARKERS ============
    const mapMarkers = results.map((place) => ({
        id: place.id,
        lat: place.lat,
        lng: place.lng,
        name: place.name,
        address: place.address,
        distance: place.distance,
        color: '#EF4444',
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
                                                onKeyDown={(e) => e.key === 'Enter' && geocodeCity()}
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
                                        className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    />
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
                                    <div className="p-2 bg-red-500/20 rounded-lg">
                                        <MapPin className="w-5 h-5 text-red-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">Nearby Cyber Cells</h2>
                                </div>
                                <p className="text-sm text-slate-400">
                                    {isSearching
                                        ? 'Searching nearby stations...'
                                        : results.length > 0
                                            ? `Found ${results.length} stations nearest to you`
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
                                            key={place.id}
                                            className={`bg-slate-900/50 border rounded-2xl overflow-hidden transition-all duration-300 ${expandedResult === place.id
                                                ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                                                : 'border-slate-800 hover:border-slate-700'
                                                }`}
                                        >
                                            <div
                                                className="p-4 cursor-pointer"
                                                onClick={() => setExpandedResult(expandedResult === place.id ? null : place.id)}
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
                                                            <span className="text-xs text-slate-500 bg-slate-800/50 px-2 py-0.5 rounded-full">
                                                                {place.city}
                                                            </span>
                                                        </div>
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

                                                            <a
                                                                href={place.url}
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
                    </div>
                </main>
            </div>
        </Background>
    );
}
