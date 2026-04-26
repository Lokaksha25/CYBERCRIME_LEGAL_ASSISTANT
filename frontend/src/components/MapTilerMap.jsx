import { useEffect, useRef, useState } from 'react';

/**
 * Reusable MapTiler map component.
 * Waits for the CDN-loaded maptilersdk to become available on window,
 * then initializes a dark-themed map with markers and popups.
 */
export default function MapTilerMap({
    center,
    zoom = 5,
    markers = [],
    userLocation = null,
    onMarkerClick = null,
    className = '',
}) {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markerObjectsRef = useRef([]);
    const userMarkerRef = useRef(null);
    const popupRef = useRef(null);
    const [sdkReady, setSdkReady] = useState(!!window.maptilersdk);

    // ============ WAIT FOR SDK TO LOAD ============
    useEffect(() => {
        if (window.maptilersdk) {
            setSdkReady(true);
            return;
        }
        // Poll for SDK availability (CDN script may load after React mounts)
        const interval = setInterval(() => {
            if (window.maptilersdk) {
                setSdkReady(true);
                clearInterval(interval);
            }
        }, 100);
        // Timeout after 10 seconds
        const timeout = setTimeout(() => {
            clearInterval(interval);
            console.error('[MapTilerMap] MapTiler SDK not found on window after 10s. Check index.html CDN script.');
        }, 10000);
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    // ============ INITIALIZE MAP ============
    useEffect(() => {
        if (!sdkReady || !mapContainerRef.current) return;
        // Don't re-create if map already exists
        if (mapRef.current) return;

        const maptilersdk = window.maptilersdk;
        const apiKey = import.meta.env.VITE_MAPTILER_API_KEY || '';

        console.log('[MapTilerMap] Initializing with API key:', apiKey ? `${apiKey.substring(0, 6)}...` : 'MISSING');

        // Set API key
        maptilersdk.config.apiKey = apiKey;

        try {
            // Create map instance
            const map = new maptilersdk.Map({
                container: mapContainerRef.current,
                style: maptilersdk.MapStyle.STREETS.DARK,
                center: [center?.lng || 77.209, center?.lat || 28.6139],
                zoom: zoom,
                navigationControl: true,
                geolocateControl: false,
            });

            map.on('load', () => {
                console.log('[MapTilerMap] Map loaded successfully');
            });

            map.on('error', (e) => {
                console.error('[MapTilerMap] Map error:', e);
            });

            mapRef.current = map;
        } catch (err) {
            console.error('[MapTilerMap] Failed to create map:', err);
        }

        return () => {
            markerObjectsRef.current.forEach(m => m.remove());
            markerObjectsRef.current = [];
            if (userMarkerRef.current) userMarkerRef.current.remove();
            if (popupRef.current) popupRef.current.remove();
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sdkReady]);

    // ============ UPDATE CENTER & ZOOM ============
    useEffect(() => {
        if (!mapRef.current || !center) return;
        mapRef.current.flyTo({
            center: [center.lng, center.lat],
            zoom: zoom,
            duration: 1200,
        });
    }, [center, zoom]);

    // ============ USER LOCATION MARKER ============
    useEffect(() => {
        const maptilersdk = window.maptilersdk;
        if (!mapRef.current || !maptilersdk || !userLocation) return;

        // Remove old user marker
        if (userMarkerRef.current) {
            userMarkerRef.current.remove();
        }

        // Create pulsing user location dot
        const el = document.createElement('div');
        el.className = 'maptiler-user-marker';
        el.innerHTML = `
            <div style="
                width: 22px; height: 22px;
                background: #6366F1;
                border: 3px solid #4F46E5;
                border-radius: 50%;
                box-shadow: 0 0 0 6px rgba(99,102,241,0.25), 0 0 12px rgba(99,102,241,0.4);
                animation: user-pulse 2s ease-in-out infinite;
            "></div>
        `;

        const marker = new maptilersdk.Marker({ element: el })
            .setLngLat([userLocation.lng, userLocation.lat])
            .addTo(mapRef.current);

        userMarkerRef.current = marker;
    }, [userLocation]);

    // ============ RESULT MARKERS ============
    useEffect(() => {
        const maptilersdk = window.maptilersdk;
        if (!mapRef.current || !maptilersdk) return;

        // Clear previous markers
        markerObjectsRef.current.forEach(m => m.remove());
        markerObjectsRef.current = [];
        if (popupRef.current) {
            popupRef.current.remove();
            popupRef.current = null;
        }

        if (markers.length === 0) return;

        // Wait for map to be fully loaded before adding markers
        const addMarkers = () => {
            const bounds = new maptilersdk.LngLatBounds();

            markers.forEach((markerData, index) => {
                const el = document.createElement('div');
                const color = markerData.color || '#EF4444';
                el.className = 'maptiler-result-marker';
                el.style.cursor = 'pointer';
                el.innerHTML = `
                    <div style="
                        position: relative;
                        width: 32px; height: 32px;
                        display: flex; align-items: center; justify-content: center;
                    ">
                        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 24 16 24s16-12 16-24C32 7.164 24.836 0 16 0z" fill="${color}"/>
                            <circle cx="16" cy="15" r="9" fill="rgba(0,0,0,0.3)"/>
                        </svg>
                        <span style="
                            position: absolute;
                            top: 6px; left: 0; right: 0;
                            text-align: center;
                            color: white;
                            font-weight: 700;
                            font-size: 12px;
                            line-height: 1;
                            pointer-events: none;
                        ">${index + 1}</span>
                    </div>
                `;

                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (popupRef.current) popupRef.current.remove();

                    const popup = new maptilersdk.Popup({
                        offset: [0, -40],
                        closeButton: true,
                        closeOnClick: true,
                        className: 'maptiler-custom-popup',
                    })
                        .setLngLat([markerData.lng, markerData.lat])
                        .setHTML(`
                            <div style="padding: 8px; max-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
                                <h3 style="font-weight: 700; color: #1e293b; margin: 0 0 6px 0; font-size: 14px; line-height: 1.3;">${markerData.name || 'Unknown'}</h3>
                                <p style="color: #64748b; margin: 0 0 6px 0; font-size: 12px; line-height: 1.4;">${markerData.address || ''}</p>
                                <p style="color: ${color}; font-weight: 600; margin: 0; font-size: 13px;">📍 ${markerData.distance?.toFixed(1) || '?'} km away</p>
                            </div>
                        `)
                        .addTo(mapRef.current);

                    popupRef.current = popup;
                    if (onMarkerClick) onMarkerClick(markerData);
                });

                const marker = new maptilersdk.Marker({ element: el })
                    .setLngLat([markerData.lng, markerData.lat])
                    .addTo(mapRef.current);

                markerObjectsRef.current.push(marker);
                bounds.extend([markerData.lng, markerData.lat]);
            });

            if (userLocation) {
                bounds.extend([userLocation.lng, userLocation.lat]);
            }

            if (!bounds.isEmpty()) {
                mapRef.current.fitBounds(bounds, {
                    padding: { top: 50, bottom: 50, left: 50, right: 50 },
                    maxZoom: 14,
                    duration: 800,
                });
            }
        };

        // If map style is loaded, add markers immediately; otherwise wait
        if (mapRef.current.isStyleLoaded()) {
            addMarkers();
        } else {
            mapRef.current.on('load', addMarkers);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [markers, userLocation, onMarkerClick]);

    return (
        <>
            <style>{`
                @keyframes user-pulse {
                    0%, 100% { box-shadow: 0 0 0 6px rgba(99,102,241,0.25), 0 0 12px rgba(99,102,241,0.4); }
                    50% { box-shadow: 0 0 0 12px rgba(99,102,241,0.1), 0 0 20px rgba(99,102,241,0.2); }
                }
                .maplibregl-popup-content {
                    border-radius: 12px !important;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3) !important;
                    padding: 0 !important;
                    overflow: hidden;
                }
                .maplibregl-popup-close-button {
                    font-size: 18px !important;
                    color: #94a3b8 !important;
                    padding: 4px 8px !important;
                }
                .maplibregl-popup-close-button:hover {
                    color: #334155 !important;
                    background: transparent !important;
                }
            `}</style>
            <div
                ref={mapContainerRef}
                className={`w-full h-full rounded-2xl ${className}`}
                style={{ minHeight: '400px' }}
            />
        </>
    );
}
