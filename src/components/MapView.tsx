/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import {
  DistrictInfo,
  PickupScheduleItem,
  UrgencyTier,
} from '../types';
import {
  getDistrictsGeoJson,
  DISTRICT_METADATA,
  getUrgencyColor,
  isPointInDistrictPolygon,
  getTodaysActiveZone,
  findDistrictByCoordinates,
} from '../services/denverPickupService';
import { triggerBuzzAlert, playBuzzSound } from '../services/buzzAlertService';
import {
  Layers,
  Compass,
  MapPin,
  Clock,
  Maximize2,
  Minimize2,
  Globe,
  Check,
  Crosshair,
  Volume2,
  Play,
  Square,
  AlertTriangle,
  Radio,
  Sparkles,
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

export type FossUnderlayId =
  | 'osmDark'
  | 'osmStandard'
  | 'osmHot'
  | 'openTopo'
  | 'cartoDark'
  | 'cartoLight';

interface FossUnderlayOption {
  id: FossUnderlayId;
  name: string;
  tag: string;
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom: number;
  isDarkFilter?: boolean;
}

const FOSS_UNDERLAYS: FossUnderlayOption[] = [
  {
    id: 'osmDark',
    name: 'OpenStreetMap Dark',
    tag: '100% FOSS (No API Key Needed)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19,
    isDarkFilter: true,
  },
  {
    id: 'osmStandard',
    name: 'OpenStreetMap Standard',
    tag: '100% FOSS Core (No Key)',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    id: 'osmHot',
    name: 'OpenStreetMap Humanitarian',
    tag: 'High-Detail HOT (No Key)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, Humanitarian Team',
    subdomains: ['a', 'b'],
    maxZoom: 19,
  },
  {
    id: 'openTopo',
    name: 'OpenTopoMap',
    tag: 'Elevation & Topography (No Key)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors | Style: OpenTopoMap',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 17,
  },
  {
    id: 'cartoDark',
    name: 'Carto Dark Matter',
    tag: 'CARTO Proxy (Key Injected)',
    url: '/api/carto-tile/dark/{z}/{x}/{y}',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    maxZoom: 20,
  },
  {
    id: 'cartoLight',
    name: 'Carto Positron',
    tag: 'CARTO Proxy (Key Injected)',
    url: '/api/carto-tile/light/{z}/{x}/{y}',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank">CARTO</a>',
    maxZoom: 20,
  },
];

interface UserLocationState {
  lat: number;
  lng: number;
  districtNumber: number;
  districtName: string;
  isInsideTodaysZone: boolean;
  accuracy?: number;
}

interface MapViewProps {
  districtsInfo: DistrictInfo[];
  rankedSchedules: PickupScheduleItem[];
  selectedDistrict: number | null;
  onSelectDistrict: (d: number | null) => void;
  focusedSchedule: PickupScheduleItem | null;
}

export const MapView: React.FC<MapViewProps> = ({
  districtsInfo,
  rankedSchedules,
  selectedDistrict,
  onSelectDistrict,
  focusedSchedule,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Layer & Display States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDistrictsOverlay, setShowDistrictsOverlay] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);
  const [isLayersMenuOpen, setIsLayersMenuOpen] = useState(false);
  const [activeUnderlay, setActiveUnderlay] = useState<FossUnderlayId>('osmDark');
  const [isUnderlayMenuOpen, setIsUnderlayMenuOpen] = useState(false);

  // Location & "GO" Geofence Tracking States
  const [userLocation, setUserLocation] = useState<UserLocationState | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isGoActive, setIsGoActive] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'prompt' | 'granted' | 'denied'>('unknown');
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [buzzAlert, setBuzzAlert] = useState<{
    active: boolean;
    message: string;
    timestamp: number;
  } | null>(null);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);

  // Monitor Geolocation Permission API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((permissionDesc) => {
          setPermissionStatus(permissionDesc.state as 'prompt' | 'granted' | 'denied');
          permissionDesc.onchange = () => {
            setPermissionStatus(permissionDesc.state as 'prompt' | 'granted' | 'denied');
          };
        })
        .catch(() => {
          setPermissionStatus('unknown');
        });
    }
  }, []);

  // Today's active zone
  const todaysZone = useMemo(() => getTodaysActiveZone(), []);

  // Previous zone check state to trigger buzz specifically on *leaving* the zone
  const wasInsideTodaysZoneRef = useRef<boolean | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Denver: [39.7392, -104.9903]
    const map = L.map(mapContainerRef.current, {
      center: [39.7392, -104.9903],
      zoom: 11,
      zoomControl: false,
    });

    // Custom zoom control in bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial FOSS Tile Layer
    const underlayConfig = FOSS_UNDERLAYS.find((u) => u.id === activeUnderlay) || FOSS_UNDERLAYS[0];
    if (underlayConfig.isDarkFilter) {
      map.getContainer().classList.add('leaflet-foss-dark');
    }
    const tileLayer = L.tileLayer(underlayConfig.url, {
      attribution: underlayConfig.attribution,
      subdomains: underlayConfig.subdomains || 'abc',
      maxZoom: underlayConfig.maxZoom,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle FOSS tile underlay switching
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const underlayConfig = FOSS_UNDERLAYS.find((u) => u.id === activeUnderlay) || FOSS_UNDERLAYS[0];

    // Toggle dark filter CSS class on map container for pure FOSS dark mode
    const container = map.getContainer();
    if (underlayConfig.isDarkFilter) {
      container.classList.add('leaflet-foss-dark');
    } else {
      container.classList.remove('leaflet-foss-dark');
    }

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(underlayConfig.url, {
      attribution: underlayConfig.attribution,
      subdomains: underlayConfig.subdomains || 'abc',
      maxZoom: underlayConfig.maxZoom,
    }).addTo(map);

    // Ensure tile layer stays beneath GeoJSON vector overlays
    newTileLayer.bringToBack();
    tileLayerRef.current = newTileLayer;
  }, [activeUnderlay]);

  // Update GeoJSON layer and centroid markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clean existing layers
    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }
    if (markersLayerRef.current) {
      map.removeLayer(markersLayerRef.current);
      markersLayerRef.current = null;
    }

    const geojsonData = getDistrictsGeoJson();
    if (!geojsonData) return;

    // Create District Info Map for fast lookup
    const districtMap = new Map<number, DistrictInfo>();
    districtsInfo.forEach((d) => districtMap.set(d.districtNumber, d));

    // Determine urgency tier for district
    const getDistrictUrgencyTier = (dNum: number): UrgencyTier => {
      const info = districtMap.get(dNum);
      if (!info) return 'distant';
      if (info.daysUntilEarliest <= 6) return 'active';
      if (info.daysUntilEarliest <= 13) return 'upcoming';
      if (info.daysUntilEarliest <= 28) return 'medium';
      return 'distant';
    };

    if (showDistrictsOverlay) {
      // Create GeoJSON Polygon layer
      const geoLayer = L.geoJSON(geojsonData as any, {
        style: (feature) => {
          const dNum = parseInt(feature?.properties?.DISTRICT_NUMBER || '1', 10);
          const isSelected = selectedDistrict === dNum;
          const isTodayDistrict = dNum === todaysZone.districtNumber;
          const urgency = getDistrictUrgencyTier(dNum);
          const color = getUrgencyColor(urgency);

          return {
            fillColor: isTodayDistrict && isGoActive ? '#10b981' : color,
            fillOpacity: isSelected ? 0.65 : isTodayDistrict && isGoActive ? 0.45 : 0.32,
            color: isSelected ? '#ffffff' : isTodayDistrict && isGoActive ? '#34d399' : color,
            weight: isSelected ? 3.5 : isTodayDistrict && isGoActive ? 2.5 : 1.8,
            dashArray: isSelected ? '' : isTodayDistrict && isGoActive ? '' : '3',
            className: 'transition-all duration-300',
          };
        },
        onEachFeature: (feature, layer) => {
          const dNum = parseInt(feature?.properties?.DISTRICT_NUMBER || '1', 10);
          const info = districtMap.get(dNum);
          const meta = DISTRICT_METADATA[dNum];
          const isTodayDistrict = dNum === todaysZone.districtNumber;

          // Hover interaction
          layer.on({
            mouseover: (e) => {
              const target = e.target as L.Path;
              if (selectedDistrict !== dNum) {
                target.setStyle({
                  fillOpacity: 0.55,
                  weight: 2.8,
                  color: '#ffffff',
                });
              }
            },
            mouseout: (e) => {
              const target = e.target as L.Path;
              if (selectedDistrict !== dNum) {
                const urgency = getDistrictUrgencyTier(dNum);
                target.setStyle({
                  fillOpacity: isTodayDistrict && isGoActive ? 0.45 : 0.32,
                  weight: isTodayDistrict && isGoActive ? 2.5 : 1.8,
                  color: isTodayDistrict && isGoActive ? '#34d399' : getUrgencyColor(urgency),
                });
              }
            },
            click: () => {
              onSelectDistrict(dNum === selectedDistrict ? null : dNum);
            },
          });

          // Popup content
          if (info && meta) {
            const urgency = getDistrictUrgencyTier(dNum);
            const urgencyBadgeColor =
              urgency === 'active'
                ? '#10b981'
                : urgency === 'upcoming'
                ? '#0284c7'
                : urgency === 'medium'
                ? '#f59e0b'
                : '#8b5cf6';

            const popupContent = `
              <div class="p-3 max-w-xs font-sans text-slate-100">
                <div class="flex items-center justify-between gap-2 border-b border-slate-700 pb-2 mb-2">
                  <div class="font-bold text-sm text-white">${meta.name}</div>
                  <span style="background:${urgencyBadgeColor}20; color:${urgencyBadgeColor}; border:1px solid ${urgencyBadgeColor}40;" class="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    ${isTodayDistrict ? "TODAY'S ACTIVE ZONE" : info.dailySchedules[0]?.relativeTimeLabel || 'Scheduled'}
                  </span>
                </div>
                <div class="text-xs text-slate-300 mb-2">
                  <span class="font-semibold text-slate-200">Next Pickup:</span> 
                  <span class="font-bold text-emerald-400">${info.earliestPickupDate}</span>
                </div>
                <div class="text-[11px] text-slate-400 mb-2 leading-tight">
                  <span class="font-semibold text-slate-300">Neighborhoods:</span> ${meta.neighborhoods.slice(0, 5).join(', ')}${meta.neighborhoods.length > 5 ? '...' : ''}
                </div>
                <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span class="text-slate-400 font-medium">9-Week Cycle</span>
                  <span class="text-emerald-400 font-bold">5 Items Max</span>
                </div>
              </div>
            `;

            layer.bindPopup(popupContent, {
              className: 'custom-leaflet-popup',
              offset: L.point(0, -5),
            });
          }
        },
      }).addTo(map);

      geoJsonLayerRef.current = geoLayer;
    }

    if (showMarkers) {
      const markersLayer = L.layerGroup();

      districtsInfo.forEach((info) => {
        const meta = DISTRICT_METADATA[info.districtNumber];
        if (!meta) return;

        const isSelected = selectedDistrict === info.districtNumber;
        const isTodayDistrict = info.districtNumber === todaysZone.districtNumber;
        const urgency = getDistrictUrgencyTier(info.districtNumber);
        const color = getUrgencyColor(urgency);
        const earliestSchedule = info.dailySchedules[0];

        // Custom HTML Marker with urgency badge
        const iconHtml = `
          <div class="relative group cursor-pointer">
            <div style="background-color: ${color}; box-shadow: 0 4px 14px ${color}60;" class="w-10 h-10 rounded-2xl flex flex-col items-center justify-center text-white border-2 ${
          isSelected || (isTodayDistrict && isGoActive)
            ? 'border-white ring-4 ring-emerald-400/60 scale-110'
            : 'border-white/90'
        } transition-transform duration-200">
              <span class="text-xs font-black leading-none">D${info.districtNumber}</span>
              <span class="text-[9px] font-bold opacity-90 leading-none mt-0.5">${
                earliestSchedule?.daysRemaining === 0
                  ? 'TODAY'
                  : earliestSchedule?.daysRemaining === 1
                  ? 'TMRW'
                  : `${earliestSchedule?.daysRemaining}d`
              }</span>
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-district-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });

        const marker = L.marker(meta.center, { icon: customIcon });

        marker.on('click', () => {
          onSelectDistrict(info.districtNumber === selectedDistrict ? null : info.districtNumber);
        });

        markersLayer.addLayer(marker);
      });

      markersLayer.addTo(map);
      markersLayerRef.current = markersLayer;
    }
  }, [districtsInfo, selectedDistrict, showDistrictsOverlay, showMarkers, onSelectDistrict, isGoActive, todaysZone]);

  // Update user location marker on the map
  const renderUserLocationOnMap = useCallback(
    (lat: number, lng: number, accuracy?: number, districtNumber?: number) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Remove existing user marker & circle
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
        userMarkerRef.current = null;
      }
      if (userAccuracyCircleRef.current) {
        map.removeLayer(userAccuracyCircleRef.current);
        userAccuracyCircleRef.current = null;
      }

      // Add accuracy circle if provided
      if (accuracy && accuracy > 10) {
        const circle = L.circle([lat, lng], {
          radius: Math.min(accuracy, 800),
          color: '#06b6d4',
          fillColor: '#06b6d4',
          fillOpacity: 0.12,
          weight: 1,
        }).addTo(map);
        userAccuracyCircleRef.current = circle;
      }

      // Custom pulsing user GPS marker
      const userMarkerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer">
          <div class="animate-ping absolute inline-flex h-9 w-9 rounded-full bg-cyan-400 opacity-75"></div>
          <div class="relative inline-flex items-center justify-center rounded-full h-5 w-5 bg-cyan-500 border-2 border-white shadow-xl text-[9px] font-black text-slate-950">
            •
          </div>
        </div>
      `;

      const userIcon = L.divIcon({
        html: userMarkerHtml,
        className: 'custom-user-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 2000 });
      marker.bindPopup(`
        <div class="p-2.5 text-xs font-sans text-slate-100">
          <div class="font-bold text-cyan-400 flex items-center gap-1.5 mb-1">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Your Live Location</span>
          </div>
          <div class="text-slate-300 font-medium">
            ${districtNumber ? `District ${districtNumber} - ${DISTRICT_METADATA[districtNumber]?.name || ''}` : 'Denver Area'}
          </div>
          <div class="text-[10px] text-slate-400 mt-1">
            Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}
          </div>
        </div>
      `, { className: 'custom-leaflet-popup' });

      marker.addTo(map);
      userMarkerRef.current = marker;
    },
    []
  );

  // Process a coordinate update and check for geofence exit
  const handleLocationUpdate = useCallback(
    (lat: number, lng: number, accuracy?: number, isSimulated = false) => {
      const dNum = findDistrictByCoordinates(lat, lng);
      const isInsideToday = isPointInDistrictPolygon(lat, lng, todaysZone.districtNumber);
      const meta = DISTRICT_METADATA[dNum];

      setUserLocation({
        lat,
        lng,
        districtNumber: dNum,
        districtName: meta ? meta.name : `District ${dNum}`,
        isInsideTodaysZone: isInsideToday,
        accuracy,
      });

      renderUserLocationOnMap(lat, lng, accuracy, dNum);

      // Check if GO Mode is active and user LEAVES today's zone:
      if (isGoActive) {
        const wasInside = wasInsideTodaysZoneRef.current;

        // If previously inside (or starting check while outside in GO mode):
        if (wasInside === true && !isInsideToday) {
          // BUZZ ALERT! User left today's zone!
          triggerBuzzAlert();
          setBuzzAlert({
            active: true,
            message: `⚠️ BUZZ! You just exited Today's Active Zone (District ${todaysZone.districtNumber})!`,
            timestamp: Date.now(),
          });
        } else if (wasInside === false && !isInsideToday) {
          // Still outside
        } else if (!isInsideToday && wasInside === null) {
          // Just clicked GO while already outside today's zone!
          triggerBuzzAlert();
          setBuzzAlert({
            active: true,
            message: `⚠️ BUZZ! You are currently outside Today's Active Zone (District ${todaysZone.districtNumber} - ${todaysZone.districtName})!`,
            timestamp: Date.now(),
          });
        }

        wasInsideTodaysZoneRef.current = isInsideToday;
      }
    },
    [isGoActive, todaysZone, renderUserLocationOnMap]
  );

  // "Locate Me" Handler
  const handleLocateMe = useCallback(() => {
    setIsLocating(true);
    setLocationStatusMessage('Acquiring high-accuracy GPS position...');

    if (!navigator.geolocation) {
      setLocationStatusMessage('Geolocation not supported by browser. Centering on Denver.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setPermissionStatus('granted');
        const { latitude, longitude, accuracy } = pos.coords;

        handleLocationUpdate(latitude, longitude, accuracy);

        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo([latitude, longitude], 13, { duration: 1.2 });
        }
        setLocationStatusMessage(null);
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        if (err.code === 1) {
          // PERMISSION_DENIED
          setPermissionStatus('denied');
          setShowPermissionModal(true);
          setLocationStatusMessage('Location permission was denied. Click to enable.');
        } else {
          // Position unavailable or timeout
          setLocationStatusMessage('GPS signal unavailable. Set to Denver Area.');
          // Fallback to District 3 center so user is not stuck
          handleLocationUpdate(39.7757, -104.8792, 30);
        }
        setTimeout(() => setLocationStatusMessage(null), 5000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, [handleLocationUpdate]);

  // "GO" Button: Start / Stop Live Zone Geofencing
  const handleToggleGo = useCallback(() => {
    if (isGoActive) {
      // STOP GO MODE
      setIsGoActive(false);
      wasInsideTodaysZoneRef.current = null;
      setBuzzAlert(null);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    } else {
      // START GO MODE: Unlock Web Audio & start watching
      setIsGoActive(true);
      playBuzzSound(); // Quick test chirp on activation
      wasInsideTodaysZoneRef.current = userLocation ? userLocation.isInsideTodaysZone : true;

      // Center on today's active zone
      const map = mapInstanceRef.current;
      const todayMeta = DISTRICT_METADATA[todaysZone.districtNumber];
      if (map && todayMeta) {
        map.flyToBounds(todayMeta.bounds, { padding: [40, 40], duration: 1 });
      }

      // If user location not set yet, locate user
      if (!userLocation) {
        handleLocateMe();
      } else {
        // Evaluate immediately
        if (!userLocation.isInsideTodaysZone) {
          triggerBuzzAlert();
          setBuzzAlert({
            active: true,
            message: `⚠️ BUZZ! You are outside Today's Active Zone (District ${todaysZone.districtNumber})!`,
            timestamp: Date.now(),
          });
        }
      }

      // Start continuous watchPosition
      if (navigator.geolocation) {
        const id = navigator.geolocation.watchPosition(
          (pos) => {
            handleLocationUpdate(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
          },
          (err) => console.warn('Watch position error:', err),
          { enableHighAccuracy: true, maximumAge: 5000 }
        );
        watchIdRef.current = id;
      }
    }
  }, [isGoActive, userLocation, todaysZone, handleLocateMe, handleLocationUpdate]);

  // Clean up watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Simulation: Move Inside Today's Zone
  const handleSimulateInside = () => {
    const meta = DISTRICT_METADATA[todaysZone.districtNumber];
    if (!meta) return;
    const [cLat, cLng] = meta.center;
    wasInsideTodaysZoneRef.current = true;
    handleLocationUpdate(cLat, cLng, 10, true);
    setBuzzAlert(null);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([cLat, cLng], 13, { duration: 1 });
    }
  };

  // Simulation: Move Outside Today's Zone (triggers the buzz!)
  const handleSimulateLeave = () => {
    // Pick District 1 or 8 coordinates (outside today's District 3)
    const outsideTarget = DISTRICT_METADATA[1] || DISTRICT_METADATA[8];
    const [outLat, outLng] = outsideTarget.center;
    // Set wasInside to true so this transition triggers the buzz!
    wasInsideTodaysZoneRef.current = true;
    handleLocationUpdate(outLat, outLng, 10, true);
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([outLat, outLng], 12, { duration: 1 });
    }
  };

  // Fly to selected or focused district
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (focusedSchedule) {
      const meta = DISTRICT_METADATA[focusedSchedule.districtNumber];
      if (meta) {
        map.flyToBounds(meta.bounds, {
          padding: [50, 50],
          maxZoom: 14,
          duration: 1.2,
        });
      }
    } else if (selectedDistrict) {
      const meta = DISTRICT_METADATA[selectedDistrict];
      if (meta) {
        map.flyToBounds(meta.bounds, {
          padding: [50, 50],
          maxZoom: 14,
          duration: 1.2,
        });
      }
    }
  }, [selectedDistrict, focusedSchedule]);

  const handleRecenterDenver = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([39.7392, -104.9903], 11, { duration: 1 });
    onSelectDistrict(null);
  };

  const currentUnderlay =
    FOSS_UNDERLAYS.find((u) => u.id === activeUnderlay) || FOSS_UNDERLAYS[0];

  return (
    <div
      className={`relative w-full ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950' : 'h-[480px] md:h-full min-h-[440px]'
      } rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900 flex flex-col`}
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full flex-1 h-full" />

      {/* Floating Top Header: Live GO Mode Status & Controls */}
      <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 z-[1000] pointer-events-none">
        {/* District Quick Selection & Location Status */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2 rounded-xl shadow-lg pointer-events-auto flex items-center gap-2">
          {userLocation ? (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-xs font-semibold text-slate-200">
                You: <span className="text-cyan-400 font-bold">{userLocation.districtName.split(' - ')[0]}</span>
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  userLocation.isInsideTodaysZone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {userLocation.isInsideTodaysZone ? 'In Active Zone' : 'Outside Active Zone'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold text-slate-200">
                {selectedDistrict ? (
                  <>
                    <span className="text-emerald-400 font-bold">District {selectedDistrict}</span> Selected
                  </>
                ) : (
                  <>Today: <span className="text-emerald-400 font-bold">District {todaysZone.districtNumber}</span></>
                )}
              </span>
            </div>
          )}

          {selectedDistrict && (
            <button
              onClick={() => onSelectDistrict(null)}
              className="ml-1 text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Action Controls: GO Button, My Location, Layers, Underlay */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* THE "GO" BUTTON - Live Zone Geofencing Tracker */}
          <button
            onClick={handleToggleGo}
            title={
              isGoActive
                ? 'Stop GO Live Zone Geofence Tracker'
                : "Click GO to start tracking today's zone and buzz if you leave"
            }
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition shadow-xl flex items-center gap-1.5 cursor-pointer border ${
              isGoActive
                ? 'bg-red-600 hover:bg-red-500 border-red-400 text-white animate-pulse'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 border-emerald-400 text-white shadow-emerald-500/20'
            }`}
          >
            {isGoActive ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>STOP GO</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>GO (ZONE TRACKER)</span>
              </>
            )}
          </button>

          {/* "My Location" Button */}
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            title="Find My Location on Denver Map"
            className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 transition shadow-lg cursor-pointer flex items-center gap-1 text-xs font-medium"
          >
            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">My Location</span>
          </button>

          {/* Location Permission Status / Config Button */}
          <button
            onClick={() => setShowPermissionModal(true)}
            title="Location Permission Status & Settings"
            className={`p-2 rounded-xl backdrop-blur-md border transition shadow-lg cursor-pointer flex items-center gap-1.5 text-xs font-medium ${
              permissionStatus === 'granted'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/60'
                : permissionStatus === 'denied'
                ? 'bg-amber-950/80 border-amber-500/60 text-amber-300 hover:bg-amber-900/80 animate-pulse'
                : 'bg-slate-900/90 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {permissionStatus === 'granted' ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : permissionStatus === 'denied' ? (
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            ) : (
              <Shield className="w-4 h-4 text-cyan-400" />
            )}
            <span className="hidden xl:inline">
              {permissionStatus === 'granted'
                ? 'GPS Allowed'
                : permissionStatus === 'denied'
                ? 'GPS Blocked'
                : 'Permission'}
            </span>
          </button>

          {/* FOSS Underlay Selector Button */}
          <div className="relative">
            <button
              onClick={() => {
                setIsUnderlayMenuOpen(!isUnderlayMenuOpen);
                setIsLayersMenuOpen(false);
              }}
              title="Change FOSS Map Underlay"
              className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:bg-slate-800 text-slate-200 text-xs font-medium transition shadow-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="hidden lg:inline text-slate-300">Underlay:</span>
              <span className="text-emerald-400 font-semibold hidden md:inline truncate max-w-[80px]">
                {currentUnderlay.name.split(' ')[0]}
              </span>
            </button>

            {/* FOSS Underlay Dropdown Menu */}
            {isUnderlayMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-2 z-[1100] space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                  Select FOSS Map Underlay
                </div>
                {FOSS_UNDERLAYS.map((underlay) => {
                  const isActive = activeUnderlay === underlay.id;
                  return (
                    <button
                      key={underlay.id}
                      onClick={() => {
                        setActiveUnderlay(underlay.id);
                        setIsUnderlayMenuOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs transition flex items-center justify-between cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600/20 text-emerald-300 font-semibold border border-emerald-500/40'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="leading-tight">{underlay.name}</div>
                        <div className="text-[10px] text-slate-400 leading-none mt-0.5">
                          {underlay.tag}
                        </div>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Toggle Layer Overlays Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsLayersMenuOpen(!isLayersMenuOpen);
                setIsUnderlayMenuOpen(false);
              }}
              title="Map Overlays & Layer Controls"
              className={`p-2 rounded-xl backdrop-blur-md border transition shadow-lg cursor-pointer flex items-center gap-1.5 ${
                showDistrictsOverlay || showMarkers
                  ? 'bg-slate-900/90 border-slate-700 text-slate-200 hover:bg-slate-800'
                  : 'bg-slate-900/90 border-slate-700/80 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Layer Controls Dropdown */}
            {isLayersMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-3 z-[1100] space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Map Overlay Controls
                  </span>
                  <button
                    onClick={() => setIsLayersMenuOpen(false)}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    Done
                  </button>
                </div>

                {/* Checkbox 1: District Boundaries & Polygons */}
                <label
                  htmlFor="cb1_44mv_1_3abc9ff4888dc57d04114c9e"
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition select-none"
                >
                  <input
                    type="checkbox"
                    id="cb1_44mv_1_3abc9ff4888dc57d04114c9e"
                    data-testid="cb1_44mv_1"
                    checked={showDistrictsOverlay}
                    onChange={(e) => setShowDistrictsOverlay(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      District Urgency Overlay
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Choropleth color fill for all 9 zones
                    </div>
                  </div>
                </label>

                {/* Checkbox 2: District Pins & Countdown Badges */}
                <label
                  htmlFor="cb2_44mv_2_markers"
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer transition select-none"
                >
                  <input
                    type="checkbox"
                    id="cb2_44mv_2_markers"
                    data-testid="cb2_44mv_2"
                    checked={showMarkers}
                    onChange={(e) => setShowMarkers(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      Centroid Countdown Pins
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Days remaining countdown badges
                    </div>
                  </div>
                </label>

                {/* Quick District Focus Selector */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[10px] font-semibold text-slate-400 mb-1.5">
                    Highlight Specific District:
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                      const isSelected = selectedDistrict === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          id={`cb_district_${num}`}
                          onClick={() => onSelectDistrict(isSelected ? null : num)}
                          className={`py-1 px-1.5 rounded text-[11px] font-bold text-center transition cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-white/30'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                          }`}
                        >
                          D{num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recenter Button */}
          <button
            onClick={handleRecenterDenver}
            title="Recenter on Denver"
            className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:bg-slate-800 text-slate-200 transition shadow-lg cursor-pointer"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen Map'}
            className="p-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:bg-slate-800 text-slate-200 transition shadow-lg cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* BUZZ ALERT NOTIFICATION BANNER (When User Leaves Today's Zone) */}
      {buzzAlert && buzzAlert.active && (
        <div className="absolute top-16 left-3 right-3 z-[1100] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-red-950/95 border-2 border-red-500 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-white flex items-center justify-between gap-3 ring-4 ring-red-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-600 text-white animate-bounce flex-shrink-0">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <div className="font-black text-sm text-red-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>ZONE EXIT GEOFENCE BUZZ TRIGGERED!</span>
                </div>
                <div className="text-xs text-red-100 font-medium mt-0.5">
                  {buzzAlert.message}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => triggerBuzzAlert()}
                className="px-2.5 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-xs font-bold text-white transition flex items-center gap-1 cursor-pointer"
                title="Play buzz again"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Buzz Again</span>
              </button>
              <button
                onClick={() => setBuzzAlert(null)}
                className="p-1 rounded-lg text-red-300 hover:text-white hover:bg-red-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GO MODE ACTIVE STATUS HUD (Bottom-Center) */}
      {isGoActive && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/95 backdrop-blur-md border border-emerald-500/50 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-bold text-white">GO Mode Active:</span>
            <span className="text-emerald-400 font-semibold">
              Monitoring District {todaysZone.districtNumber} ({todaysZone.districtName.split(' - ')[0]})
            </span>
          </div>

          <div className="w-px h-4 bg-slate-700" />

          {/* Test Simulation Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium">Test:</span>
            <button
              onClick={handleSimulateInside}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-300 border border-emerald-500/30 font-medium transition cursor-pointer"
              title="Simulate position inside today's zone"
            >
              Inside Zone
            </button>
            <button
              onClick={handleSimulateLeave}
              className="px-2 py-1 rounded bg-red-950 hover:bg-red-900 text-[11px] text-red-300 border border-red-500/40 font-bold transition flex items-center gap-1 cursor-pointer"
              title="Simulate leaving today's zone to trigger the buzz"
            >
              <Volume2 className="w-3 h-3 text-red-400" />
              <span>Leave Zone (Buzz)</span>
            </button>
          </div>
        </div>
      )}

      {/* Location Status Toast (if any) */}
      {locationStatusMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-cyan-300 shadow-xl backdrop-blur-md">
          {locationStatusMessage}
        </div>
      )}

      {/* Floating Map Legend (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-xl max-w-[240px] hidden sm:block">
        <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Pickup Ranking</span>
          <span className="text-[10px] text-slate-400 lowercase font-normal">urgency</span>
        </div>
        <div className="space-y-1.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
            <span className="font-medium">This Week (0 - 6 days)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-500 ring-2 ring-cyan-500/30" />
            <span>Next Week (7 - 13 days)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
            <span>2 - 4 Weeks (14 - 28 days)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-purple-500/30" />
            <span>5 - 8 Weeks Out</span>
          </div>
        </div>
        <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
          <span>FOSS: {currentUnderlay.name.split(' ')[0]}</span>
          <span className="text-emerald-400 font-medium">OSM Data</span>
        </div>
      </div>

      {/* LOCATION PERMISSIONS MODAL */}
      {showPermissionModal && (
        <div className="fixed inset-0 z-[3000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">
                    Device Location Permission
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Denver Solid Waste Zone Geofencing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPermissionModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Permission Status */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs text-slate-300 font-medium">
                Browser Permission State:
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${
                  permissionStatus === 'granted'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : permissionStatus === 'denied'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                }`}
              >
                {permissionStatus}
              </span>
            </div>

            {/* Why Location is Needed */}
            <div className="space-y-2 text-xs text-slate-300">
              <p className="font-semibold text-slate-200">
                What does this app use your location for?
              </p>
              <ul className="space-y-1.5 text-slate-400 pl-1">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-200">Automatic District Lookup:</strong> Pinpoint which of Denver's 9 Solid Waste Districts your home or current site belongs to.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-slate-200">GO Geofence Zone Tracker:</strong> Sounds an authentic audible buzz and haptic vibration when your device exits today's scheduled collection zone.
                  </span>
                </li>
              </ul>
            </div>

            {/* How to enable if denied */}
            {permissionStatus === 'denied' && (
              <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-xs text-amber-200 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>How to unblock location in your browser:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-100/90 pl-1">
                  <li>Click the <strong>Lock / Settings icon</strong> next to the URL in your browser address bar.</li>
                  <li>Find <strong>Location</strong> and switch it from "Block" to <strong>"Allow"</strong>.</li>
                  <li>Click the button below to re-request position.</li>
                </ol>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  handleLocateMe();
                }}
                className="w-full sm:flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crosshair className="w-4 h-4" />
                <span>{permissionStatus === 'denied' ? 'Re-check Permission' : 'Allow / Locate Me'}</span>
              </button>
              <button
                onClick={() => {
                  setShowPermissionModal(false);
                  handleSimulateInside();
                }}
                className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition cursor-pointer"
                title="Test with simulated Denver coordinates"
              >
                Use Demo Location
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
