import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  GitFork,
  History,
  Layers,
  MapPin,
  Maximize2,
  Minus,
  Plus,
  Route,
  Search,
  X,
} from 'lucide-react';
import { BIBLICAL_EVENTS } from '../data/atlasModules';
import {
  BIBLICAL_JOURNEYS,
  BIBLICAL_LOCATIONS,
  BIBLICAL_PERIODS,
  BIBLICAL_WORLD_GEOJSON,
  CERTAINTY_META,
  JOURNEY_CATEGORY_META,
  LOCATION_CATEGORY_META,
} from '../data/geography';
import {
  getJourneysForLocation,
  getVerseById,
  queryBiblicalLocations,
} from '../services/scriptureService';
import {
  AtlasTheme,
  BiblicalPeriodId,
  JourneyCategory,
  LocationCategory,
  VerseId,
} from '../types/scripture';

interface GeographyViewProps {
  atlasTheme?: AtlasTheme;
  initialLocationId?: string;
  initialJourneyId?: string;
  onOpenInGraph: (verseId: VerseId) => void;
  onLoadVersesInGraph: (verseIds: VerseId[], anchorId: VerseId) => void;
  onOpenInReader: (bookId: string, chapter: number, verseId: VerseId) => void;
  onOpenTimeline?: (eventId?: string) => void;
}

type GeoMode = 'locations' | 'journeys';

interface MapPalette {
  waterFill: string;
  waterStroke: string;
  landFill: string;
  landStroke: string;
  graticule: string;
  seaLabel: string;
  markerBorder: string;
  markerSelectedBorder: string;
  waypointBg: string;
  waypointText: string;
  waypointActiveText: string;
  waypointActiveBorder: string;
  tileUrl: string;
  tileOpacity: number;
}

function getMapPalette(theme: AtlasTheme): MapPalette {
  if (theme === 'light') {
    return {
      waterFill: '#D5E3DF',
      waterStroke: '#1E7A65',
      landFill: '#F4EFE6',
      landStroke: '#B8AD9E',
      graticule: 'rgba(45, 38, 30, 0.09)',
      seaLabel: 'rgba(45, 38, 30, 0.42)',
      markerBorder: '#F8F6F3',
      markerSelectedBorder: '#1F1B17',
      waypointBg: '#F8F6F3',
      waypointText: '#1F1B17',
      waypointActiveText: '#FBF9F5',
      waypointActiveBorder: '#1F1B17',
      tileUrl: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
      tileOpacity: 0.65,
    };
  }
  return {
    waterFill: '#091114',
    waterStroke: '#4EC498',
    landFill: '#171A1F',
    landStroke: '#333A42',
    graticule: 'rgba(214, 206, 190, 0.07)',
    seaLabel: 'rgba(214, 206, 190, 0.32)',
    markerBorder: '#0D0E10',
    markerSelectedBorder: '#F4EFE6',
    waypointBg: '#141619',
    waypointText: '#F4EFE6',
    waypointActiveText: '#0D0E10',
    waypointActiveBorder: '#F4EFE6',
    tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    tileOpacity: 0.55,
  };
}

const EXTENT_PRESETS: {
  id: string;
  label: string;
  bounds: [[number, number], [number, number]];
}[] = [
  {
    id: 'world',
    label: 'Biblical World',
    bounds: [
      [27.2, 11.5],
      [42.2, 49.0],
    ],
  },
  {
    id: 'levant',
    label: 'Israel & Levant',
    bounds: [
      [28.2, 31.4],
      [33.8, 36.6],
    ],
  },
  {
    id: 'aegean',
    label: 'Aegean & Asia Minor',
    bounds: [
      [34.4, 21.5],
      [41.5, 36.8],
    ],
  },
  {
    id: 'mesopotamia',
    label: 'Mesopotamia',
    bounds: [
      [30.0, 38.0],
      [37.6, 49.0],
    ],
  },
];

export const GeographyView: React.FC<GeographyViewProps> = ({
  atlasTheme = 'dark',
  initialLocationId,
  initialJourneyId,
  onOpenInGraph,
  onLoadVersesInGraph,
  onOpenInReader,
  onOpenTimeline,
}) => {
  const [mode, setMode] = useState<GeoMode>(initialJourneyId ? 'journeys' : 'locations');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<LocationCategory | 'all'>('all');
  const [periodFilter, setPeriodFilter] = useState<BiblicalPeriodId | 'all'>('all');
  const [journeyCategoryFilter, setJourneyCategoryFilter] = useState<JourneyCategory | 'all'>('all');

  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    initialLocationId ?? BIBLICAL_LOCATIONS[0].id
  );
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>(
    initialJourneyId ?? BIBLICAL_JOURNEYS[0].id
  );
  const [activeWaypointIdx, setActiveWaypointIdx] = useState<number>(0);

  const [showUncertaintyRings, setShowUncertaintyRings] = useState<boolean>(true);
  const [useBasemapTiles, setUseBasemapTiles] = useState<boolean>(false);
  const [inspectorOpen, setInspectorOpen] = useState<boolean>(true);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const graticuleLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const tileUrlRef = useRef<string>('');
  const riversLayerRef = useRef<L.LayerGroup | null>(null);
  const uncertaintyLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const journeyLayerRef = useRef<L.LayerGroup | null>(null);

  const palette = useMemo(() => getMapPalette(atlasTheme), [atlasTheme]);
  const paletteRef = useRef(palette);
  paletteRef.current = palette;

  useEffect(() => {
    if (initialJourneyId) {
      setSelectedJourneyId(initialJourneyId);
      setActiveWaypointIdx(0);
      setMode('journeys');
      setInspectorOpen(true);
    } else if (initialLocationId) {
      setSelectedLocationId(initialLocationId);
      setMode('locations');
      setInspectorOpen(true);
    }
  }, [initialLocationId, initialJourneyId]);

  const filteredLocations = useMemo(
    () =>
      queryBiblicalLocations({
        query,
        category: categoryFilter,
        period: periodFilter,
      }),
    [query, categoryFilter, periodFilter]
  );

  const filteredJourneys = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BIBLICAL_JOURNEYS.filter((j) => {
      if (journeyCategoryFilter !== 'all' && j.category !== journeyCategoryFilter) {
        return false;
      }
      if (periodFilter !== 'all' && j.period !== periodFilter) {
        return false;
      }
      if (q) {
        const haystack = [
          j.title,
          j.figure,
          j.summary,
          ...j.waypoints.map((w) => w.name),
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [query, journeyCategoryFilter, periodFilter]);

  const selectedLocation =
    BIBLICAL_LOCATIONS.find((l) => l.id === selectedLocationId) ??
    filteredLocations[0] ??
    BIBLICAL_LOCATIONS[0];

  const selectedJourney =
    BIBLICAL_JOURNEYS.find((j) => j.id === selectedJourneyId) ??
    filteredJourneys[0] ??
    BIBLICAL_JOURNEYS[0];

  // Keep refs fresh for Leaflet event listeners
  const selectLocationRef = useRef((locId: string) => {
    setSelectedLocationId(locId);
    setMode('locations');
    setInspectorOpen(true);
  });
  selectLocationRef.current = (locId: string) => {
    setSelectedLocationId(locId);
    setMode('locations');
    setInspectorOpen(true);
  };

  const selectWaypointRef = useRef((idx: number) => {
    setActiveWaypointIdx(idx);
    setInspectorOpen(true);
  });
  selectWaypointRef.current = (idx: number) => {
    setActiveWaypointIdx(idx);
    setInspectorOpen(true);
  };

  const populateGraticule = (group: L.LayerGroup, pal: MapPalette) => {
    group.clearLayers();
    for (let lat = 24; lat <= 44; lat += 4) {
      L.polyline(
        [
          [lat, 6],
          [lat, 54],
        ],
        {
          color: pal.graticule,
          weight: 1,
          interactive: false,
        }
      ).addTo(group);
    }
    for (let lng = 10; lng <= 52; lng += 5) {
      L.polyline(
        [
          [24, lng],
          [45, lng],
        ],
        {
          color: pal.graticule,
          weight: 1,
          interactive: false,
        }
      ).addTo(group);
    }

    const seaLabels: { name: string; pos: [number, number] }[] = [
      { name: 'MEDITERRANEAN SEA (GREAT SEA)', pos: [34.1, 21.5] },
      { name: 'RED SEA', pos: [27.0, 34.8] },
      { name: 'AEGEAN SEA', pos: [38.2, 25.2] },
    ];
    for (const s of seaLabels) {
      L.marker(s.pos, {
        interactive: false,
        icon: L.divIcon({
          className: '',
          html: `<div style="color:${pal.seaLabel};font-size:10px;letter-spacing:0.14em;white-space:nowrap;font-weight:500;">${s.name}</div>`,
          iconSize: [160, 16],
          iconAnchor: [80, 8],
        }),
      }).addTo(group);
    }
  };

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const pal = paletteRef.current;
    const map = L.map(mapContainerRef.current, {
      center: [34.2, 33.5],
      zoom: 5,
      minZoom: 4,
      maxZoom: 11,
      zoomControl: false,
      attributionControl: true,
    });

    geoJsonLayerRef.current = L.geoJSON(BIBLICAL_WORLD_GEOJSON, {
      style: (feature) => {
        const isWater = feature?.properties?.kind === 'water';
        const cur = paletteRef.current;
        return isWater
          ? {
              fillColor: cur.waterFill,
              fillOpacity: 0.96,
              color: cur.waterStroke,
              weight: 0.9,
              opacity: 0.45,
            }
          : {
              fillColor: cur.landFill,
              fillOpacity: 1,
              color: cur.landStroke,
              weight: 1.15,
              opacity: 0.9,
            };
      },
      interactive: false,
    }).addTo(map);

    const graticuleGroup = L.layerGroup().addTo(map);
    populateGraticule(graticuleGroup, pal);
    graticuleLayerRef.current = graticuleGroup;

    riversLayerRef.current = L.layerGroup().addTo(map);
    uncertaintyLayerRef.current = L.layerGroup().addTo(map);
    journeyLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    map.fitBounds(EXTENT_PRESETS[0].bounds, { padding: [24, 24] });

    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      geoJsonLayerRef.current = null;
      graticuleLayerRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Re-style base vector landmass, inland water, and graticule when theme toggles
  useEffect(() => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.setStyle((feature) => {
        const isWater = feature?.properties?.kind === 'water';
        return isWater
          ? {
              fillColor: palette.waterFill,
              fillOpacity: 0.96,
              color: palette.waterStroke,
              weight: 0.9,
              opacity: 0.45,
            }
          : {
              fillColor: palette.landFill,
              fillOpacity: 1,
              color: palette.landStroke,
              weight: 1.15,
              opacity: 0.9,
            };
      });
    }
    if (graticuleLayerRef.current) {
      populateGraticule(graticuleLayerRef.current, palette);
    }
  }, [palette]);

  // Optional CartoDB Dark/Light Positron tile underlay toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (useBasemapTiles) {
      if (tileLayerRef.current && tileUrlRef.current !== palette.tileUrl) {
        map.removeLayer(tileLayerRef.current);
        tileLayerRef.current = null;
      }
      if (!tileLayerRef.current) {
        const layer = L.tileLayer(palette.tileUrl, {
          attribution: '&copy; OpenStreetMap &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 14,
          opacity: palette.tileOpacity,
        });
        layer.addTo(map);
        layer.bringToBack();
        tileLayerRef.current = layer;
        tileUrlRef.current = palette.tileUrl;
      }
    } else if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
      tileLayerRef.current = null;
      tileUrlRef.current = '';
    }
  }, [useBasemapTiles, palette.tileUrl, palette.tileOpacity]);

  // Render rivers, uncertainty rings, and filtered locations on the Leaflet map
  useEffect(() => {
    const map = mapRef.current;
    const riversGroup = riversLayerRef.current;
    const uncertaintyGroup = uncertaintyLayerRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !riversGroup || !uncertaintyGroup || !markersGroup) return;

    riversGroup.clearLayers();
    uncertaintyGroup.clearLayers();
    markersGroup.clearLayers();

    const visibleIds = new Set(filteredLocations.map((l) => l.id));

    // 1. River geometry courses
    for (const loc of BIBLICAL_LOCATIONS) {
      if (loc.category === 'river' && loc.pathGeometry && loc.pathGeometry.length > 1) {
        const isVisible = visibleIds.has(loc.id);
        const isSelected = mode === 'locations' && loc.id === selectedLocation.id;
        if (!isVisible && mode === 'locations') continue;

        const riverLine = L.polyline(loc.pathGeometry, {
          color: isSelected
            ? atlasTheme === 'light'
              ? '#1C6F8C'
              : '#9BD6EA'
            : atlasTheme === 'light'
            ? '#3388A6'
            : '#67B7D1',
          weight: isSelected ? 3.5 : 2,
          opacity: isSelected ? 0.95 : mode === 'journeys' ? 0.35 : 0.72,
        });
        riverLine.on('click', () => selectLocationRef.current(loc.id));
        riverLine.bindTooltip(loc.name, {
          className: 'atlas-map-tooltip',
          sticky: true,
        });
        riverLine.addTo(riversGroup);
      }
    }

    // 2. Location markers + uncertainty radius circles
    const locationsToRender = mode === 'locations' ? filteredLocations : BIBLICAL_LOCATIONS;

    for (const loc of locationsToRender) {
      const catMeta = LOCATION_CATEGORY_META[loc.category];
      const isSelected = mode === 'locations' && loc.id === selectedLocation.id;
      const isApproximate = loc.certainty !== 'established';

      if (showUncertaintyRings && isApproximate && loc.uncertaintyRadiusKm && mode === 'locations') {
        L.circle([loc.coordinates.lat, loc.coordinates.lng], {
          radius: loc.uncertaintyRadiusKm * 1000,
          color: CERTAINTY_META[loc.certainty].color,
          weight: isSelected ? 1.5 : 1,
          dashArray: '5 5',
          fillColor: CERTAINTY_META[loc.certainty].color,
          fillOpacity: isSelected ? 0.16 : 0.08,
          interactive: false,
        }).addTo(uncertaintyGroup);
      }

      const radius =
        mode === 'journeys'
          ? 4
          : isSelected
          ? 8
          : loc.category === 'region'
          ? 6.5
          : 5.5;

      const marker = L.circleMarker([loc.coordinates.lat, loc.coordinates.lng], {
        radius,
        color: isSelected ? palette.markerSelectedBorder : palette.markerBorder,
        weight: isSelected ? 2.5 : 1.5,
        fillColor: catMeta.color,
        fillOpacity: mode === 'journeys' ? 0.45 : isApproximate ? 0.78 : 0.95,
        dashArray: isApproximate ? '3 2' : undefined,
      });

      marker.on('click', () => selectLocationRef.current(loc.id));

      const shortName = loc.name.split(' (')[0];
      marker.bindTooltip(
        isApproximate ? `${shortName} (Approx.)` : shortName,
        {
          permanent: isSelected || (mode === 'locations' && filteredLocations.length <= 16 && loc.category === 'city'),
          direction: 'right',
          offset: [8, 0],
          className: 'atlas-map-tooltip',
        }
      );

      marker.addTo(markersGroup);
    }
  }, [
    filteredLocations,
    selectedLocation.id,
    mode,
    showUncertaintyRings,
    atlasTheme,
    palette,
  ]);

  // Render active Journey polyline + numbered waypoints when in Journeys mode
  useEffect(() => {
    const journeyGroup = journeyLayerRef.current;
    if (!journeyGroup) return;

    journeyGroup.clearLayers();
    if (mode !== 'journeys' || !selectedJourney) return;

    const coords: [number, number][] = selectedJourney.waypoints.map((w) => [
      w.coordinates.lat,
      w.coordinates.lng,
    ]);

    L.polyline(coords, {
      color: selectedJourney.color,
      weight: 6,
      opacity: 0.2,
      interactive: false,
    }).addTo(journeyGroup);

    L.polyline(coords, {
      color: selectedJourney.color,
      weight: 2.75,
      opacity: 0.92,
      dashArray: selectedJourney.category === 'exodus_israel' ? '7 5' : undefined,
    }).addTo(journeyGroup);

    selectedJourney.waypoints.forEach((wp, idx) => {
      const isActive = idx === activeWaypointIdx;
      const isApprox = wp.certainty !== 'established';

      const marker = L.marker([wp.coordinates.lat, wp.coordinates.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:${isActive ? 26 : 22}px;height:${
            isActive ? 26 : 22
          }px;border-radius:4px;background:${
            isActive ? selectedJourney.color : palette.waypointBg
          };color:${isActive ? palette.waypointActiveText : palette.waypointText};border:${
            isApprox ? '1.5px dashed' : '1.5px solid'
          } ${
            isActive ? palette.waypointActiveBorder : selectedJourney.color
          };display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.45);">${
            wp.order
          }</div>`,
          iconSize: [isActive ? 26 : 22, isActive ? 26 : 22],
          iconAnchor: [isActive ? 13 : 11, isActive ? 13 : 11],
        }),
      });

      marker.on('click', () => selectWaypointRef.current(idx));
      marker.bindTooltip(`${wp.order}. ${wp.name}`, {
        permanent: isActive,
        direction: 'top',
        offset: [0, -12],
        className: 'atlas-map-tooltip',
      });
      marker.addTo(journeyGroup);
    });
  }, [mode, selectedJourney, activeWaypointIdx, palette]);

  // Smoothly pan / fit map on selection changes
  const focusLocationOnMap = (locId: string) => {
    const map = mapRef.current;
    const loc = BIBLICAL_LOCATIONS.find((l) => l.id === locId);
    if (!map || !loc) return;
    const targetZoom = loc.category === 'region' || loc.category === 'river' ? 6 : 7;
    map.flyTo([loc.coordinates.lat, loc.coordinates.lng], Math.max(map.getZoom(), targetZoom), {
      duration: 0.45,
    });
  };

  const focusJourneyOnMap = (journeyId: string) => {
    const map = mapRef.current;
    const journey = BIBLICAL_JOURNEYS.find((j) => j.id === journeyId);
    if (!map || !journey || journey.waypoints.length === 0) return;
    const bounds = L.latLngBounds(
      journey.waypoints.map((w) => [w.coordinates.lat, w.coordinates.lng] as [number, number])
    );
    map.flyToBounds(bounds, { padding: [55, 55], maxZoom: 7, duration: 0.5 });
  };

  const focusWaypointOnMap = (idx: number) => {
    const map = mapRef.current;
    const wp = selectedJourney?.waypoints[idx];
    if (!map || !wp) return;
    map.flyTo([wp.coordinates.lat, wp.coordinates.lng], Math.max(map.getZoom(), 6), {
      duration: 0.4,
    });
  };

  const handleSelectLocation = (locId: string) => {
    setSelectedLocationId(locId);
    setMode('locations');
    setInspectorOpen(true);
    focusLocationOnMap(locId);
  };

  const handleSelectJourney = (journeyId: string) => {
    setSelectedJourneyId(journeyId);
    setActiveWaypointIdx(0);
    setMode('journeys');
    setInspectorOpen(true);
    focusJourneyOnMap(journeyId);
  };

  const linkedEvents = useMemo(() => {
    const ids = mode === 'locations' ? selectedLocation.eventIds : selectedJourney.eventIds;
    return BIBLICAL_EVENTS.filter((evt) => ids.includes(evt.id));
  }, [mode, selectedLocation.eventIds, selectedJourney.eventIds]);

  const journeysTouchingLocation = useMemo(
    () => getJourneysForLocation(selectedLocation.id),
    [selectedLocation.id]
  );

  const activeWaypoint =
    selectedJourney.waypoints[activeWaypointIdx] ?? selectedJourney.waypoints[0];

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-[var(--atlas-bg)]">
      {/* Left Directory & Filter Sidebar */}
      <aside className="lg:w-80 bg-[var(--atlas-surface)] border-b lg:border-b-0 lg:border-r border-[var(--atlas-border)] flex flex-col shrink-0 max-h-[38vh] lg:max-h-full overflow-hidden">
        {/* Header & Mode Switch */}
        <div className="p-3 border-b border-[var(--atlas-border)] space-y-2.5 shrink-0">
          <div className="grid grid-cols-2 gap-1 p-0.5 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border)]">
            <button
              type="button"
              onClick={() => setMode('locations')}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'locations'
                  ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)]'
                  : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-[var(--atlas-accent)]" />
              <span>Locations ({BIBLICAL_LOCATIONS.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('journeys');
                focusJourneyOnMap(selectedJourney.id);
              }}
              className={`inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                mode === 'journeys'
                  ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-secondary-soft)]'
                  : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)]'
              }`}
            >
              <Route className="w-3.5 h-3.5 text-[var(--atlas-secondary)]" />
              <span>Journeys ({BIBLICAL_JOURNEYS.length})</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--atlas-text-subtle)] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === 'locations'
                  ? 'Search site, historical name, region...'
                  : 'Search figure, journey, or waypoint...'
              }
              aria-label="Search biblical geography"
              className="w-full h-8 pl-8 pr-7 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text)] placeholder:text-[var(--atlas-text-subtle)] focus:outline-none focus:border-[var(--atlas-accent)]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear geography search"
                className="absolute right-2 top-2 text-[var(--atlas-text-subtle)] hover:text-[var(--atlas-text)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Biblical Period Filter */}
          <div>
            <label htmlFor="geo-period-filter" className="sr-only">
              Filter by biblical period
            </label>
            <select
              id="geo-period-filter"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as BiblicalPeriodId | 'all')}
              className="w-full h-8 px-2.5 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] text-xs text-[var(--atlas-text-secondary)] focus:outline-none focus:border-[var(--atlas-accent)]"
            >
              <option value="all">All Biblical Periods</option>
              {BIBLICAL_PERIODS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} ({p.dateRange})
                </option>
              ))}
            </select>
          </div>

          {/* Sub-category filter */}
          {mode === 'locations' ? (
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'city', label: 'Cities' },
                  { id: 'region', label: 'Regions' },
                  { id: 'river', label: 'Rivers' },
                  { id: 'mountain', label: 'Mountains' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                    categoryFilter === cat.id
                      ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-accent-soft)] border border-[var(--atlas-accent)]/40'
                      : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] border border-transparent hover:bg-[var(--atlas-elevated)]/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {(
                [
                  { id: 'all', label: 'All Routes' },
                  { id: 'exodus_israel', label: 'Israel Exodus' },
                  { id: 'patriarchs', label: 'Patriarchs' },
                  { id: 'ministry_jesus', label: 'Jesus' },
                  { id: 'missionary_paul', label: 'Missionary' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setJourneyCategoryFilter(cat.id)}
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap ${
                    journeyCategoryFilter === cat.id
                      ? 'bg-[var(--atlas-elevated)] text-[var(--atlas-secondary-soft)] border border-[var(--atlas-secondary)]/40'
                      : 'text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] border border-transparent hover:bg-[var(--atlas-elevated)]/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable Directory List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {mode === 'locations' ? (
            filteredLocations.length === 0 ? (
              <div className="p-4 text-xs text-[var(--atlas-text-subtle)] text-center">
                No biblical sites match the active filters.
              </div>
            ) : (
              filteredLocations.map((loc) => {
                const active = loc.id === selectedLocation.id;
                const catMeta = LOCATION_CATEGORY_META[loc.category];
                const certMeta = CERTAINTY_META[loc.certainty];
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelectLocation(loc.id)}
                    className={`w-full text-left p-2.5 rounded-md border transition-colors ${
                      active
                        ? 'bg-[var(--atlas-elevated)] border-[var(--atlas-accent)]/40 text-[var(--atlas-heading)]'
                        : 'border-transparent hover:bg-[var(--atlas-elevated)]/60 text-[var(--atlas-text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate">{loc.name}</span>
                      <span
                        className="text-[11px] shrink-0"
                        style={{ color: catMeta.color }}
                      >
                        {catMeta.label.split(' /')[0]}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-[var(--atlas-text-muted)] truncate">
                      {loc.region}
                      {loc.certainty !== 'established' && (
                        <span style={{ color: certMeta.color }}>
                          {' · '}
                          {certMeta.shortLabel}
                        </span>
                      )}
                    </div>
                    {loc.historicalNames.length > 0 && (
                      <div className="mt-0.5 text-[10.5px] text-[var(--atlas-text-subtle)] truncate">
                        Also: {loc.historicalNames.slice(0, 2).join(', ')}
                      </div>
                    )}
                  </button>
                );
              })
            )
          ) : filteredJourneys.length === 0 ? (
            <div className="p-4 text-xs text-[var(--atlas-text-subtle)] text-center">
              No journeys match the active filters.
            </div>
          ) : (
            filteredJourneys.map((journey) => {
              const active = journey.id === selectedJourney.id;
              const jMeta = JOURNEY_CATEGORY_META[journey.category];
              return (
                <button
                  key={journey.id}
                  type="button"
                  onClick={() => handleSelectJourney(journey.id)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    active
                      ? 'bg-[var(--atlas-elevated)] border-[var(--atlas-secondary)]/40 text-[var(--atlas-heading)]'
                      : 'border-transparent hover:bg-[var(--atlas-elevated)]/60 text-[var(--atlas-text-secondary)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span style={{ color: jMeta.color }} className="font-medium">
                      {jMeta.label}
                    </span>
                    <span className="font-mono text-[var(--atlas-text-subtle)] tabular-nums">
                      {journey.approximateDate}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-medium leading-snug">{journey.title}</div>
                  <div className="mt-1 text-[11px] text-[var(--atlas-text-muted)]">
                    {journey.figure} · {journey.waypoints.length} waypoints
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Center Interactive Map Canvas */}
      <div className="relative flex-1 min-h-[340px] h-full overflow-hidden">
        <div
          ref={mapContainerRef}
          className="w-full h-full z-0"
          aria-label="Interactive map of the biblical world"
        />

        {/* Top Map Controls */}
        <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none z-20">
          {/* Extent presets */}
          <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
            <div className="inline-flex items-center p-0.5 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)]">
              {EXTENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() =>
                    mapRef.current?.flyToBounds(preset.bounds, {
                      padding: [24, 24],
                      duration: 0.45,
                    })
                  }
                  className="px-2.5 py-1 rounded text-[11px] font-medium text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)] hover:bg-[var(--atlas-elevated)] transition-colors whitespace-nowrap"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {mode === 'locations' && (
              <button
                type="button"
                onClick={() => setShowUncertaintyRings((v) => !v)}
                className={`h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  showUncertaintyRings
                    ? 'bg-[var(--atlas-accent)]/15 text-[var(--atlas-accent-soft)] border-[var(--atlas-accent)]/40'
                    : 'bg-[var(--atlas-surface)]/95 text-[var(--atlas-text-secondary)] border-[var(--atlas-border-strong)]'
                }`}
                title="Toggle approximate/uncertain location radius rings"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Uncertainty Rings</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setUseBasemapTiles((v) => !v)}
              className={`h-8 px-2.5 rounded-md border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                useBasemapTiles
                  ? 'bg-[var(--atlas-secondary)]/15 text-[var(--atlas-secondary-soft)] border-[var(--atlas-secondary)]/40'
                  : 'bg-[var(--atlas-surface)]/95 text-[var(--atlas-text-secondary)] border-[var(--atlas-border-strong)]'
              }`}
              title="Toggle external Carto relief tile overlay"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">
                {useBasemapTiles ? 'Tiles On' : 'Vector Atlas'}
              </span>
            </button>
          </div>

          {/* Zoom & Panel Controls */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <div className="inline-flex items-center h-8 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)] overflow-hidden">
              <button
                type="button"
                onClick={() => mapRef.current?.zoomIn()}
                aria-label="Zoom in map"
                className="px-2 h-full text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => mapRef.current?.zoomOut()}
                aria-label="Zoom out map"
                className="px-2 h-full text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)] border-l border-[var(--atlas-border)] transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  mapRef.current?.flyToBounds(EXTENT_PRESETS[0].bounds, {
                    padding: [24, 24],
                    duration: 0.45,
                  })
                }
                aria-label="Reset map extent"
                className="px-2 h-full text-[var(--atlas-text-secondary)] hover:bg-[var(--atlas-elevated)] border-l border-[var(--atlas-border)] transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {!inspectorOpen && (
              <button
                type="button"
                onClick={() => setInspectorOpen(true)}
                className="h-8 px-3 rounded-md bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-xs font-semibold whitespace-nowrap"
              >
                Inspect
              </button>
            )}
          </div>
        </div>

        {/* Bottom-Left Cartographic Key */}
        <div className="hidden sm:block absolute bottom-3 left-3 z-20 p-2.5 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)] text-[11px] text-[var(--atlas-text-secondary)] space-y-1.5 max-w-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {(['city', 'region', 'river', 'mountain'] as LocationCategory[]).map((cat) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: LOCATION_CATEGORY_META[cat].color }}
                />
                <span>{LOCATION_CATEGORY_META[cat].pluralLabel}</span>
              </div>
            ))}
          </div>
          <div className="text-[10.5px] text-[var(--atlas-text-muted)] pt-1 border-t border-[var(--atlas-border)]">
            Dashed rings indicate approximate, regional, or debated ancient identifications.
          </div>
        </div>

        {/* Bottom-Center Journey Stepper when in Journeys mode */}
        {mode === 'journeys' && selectedJourney && activeWaypoint && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--atlas-surface)]/95 border border-[var(--atlas-border-strong)] shadow-xl max-w-md w-[90%] sm:w-auto">
            <button
              type="button"
              disabled={activeWaypointIdx <= 0}
              onClick={() => {
                const next = Math.max(0, activeWaypointIdx - 1);
                setActiveWaypointIdx(next);
                focusWaypointOnMap(next);
              }}
              aria-label="Previous journey waypoint"
              className="p-1.5 rounded hover:bg-[var(--atlas-elevated)] text-[var(--atlas-text-secondary)] disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0 text-center">
              <div className="text-[10.5px] font-mono tabular-nums text-[var(--atlas-text-muted)]">
                Stop {activeWaypoint.order} of {selectedJourney.waypoints.length}
                {activeWaypoint.certainty !== 'established'
                  ? ` · ${CERTAINTY_META[activeWaypoint.certainty].shortLabel}`
                  : ''}
              </div>
              <div className="text-xs font-medium text-[var(--atlas-heading)] truncate">
                {activeWaypoint.name}
              </div>
            </div>
            <button
              type="button"
              disabled={activeWaypointIdx >= selectedJourney.waypoints.length - 1}
              onClick={() => {
                const next = Math.min(selectedJourney.waypoints.length - 1, activeWaypointIdx + 1);
                setActiveWaypointIdx(next);
                focusWaypointOnMap(next);
              }}
              aria-label="Next journey waypoint"
              className="p-1.5 rounded hover:bg-[var(--atlas-elevated)] text-[var(--atlas-text-secondary)] disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Right Detail Inspector */}
      {inspectorOpen && (
        <aside className="fixed inset-x-0 bottom-0 h-[50vh] lg:static lg:h-full lg:w-[390px] xl:w-[420px] bg-[var(--atlas-surface)] border-t lg:border-t-0 lg:border-l border-[var(--atlas-border)] flex flex-col shrink-0 z-30 overflow-hidden">
          {mode === 'locations' ? (
            <>
              <div className="px-4 py-3 border-b border-[var(--atlas-border)] flex items-start justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <div className="text-xs text-[var(--atlas-text-muted)] flex items-center gap-1.5 flex-wrap">
                    <span style={{ color: LOCATION_CATEGORY_META[selectedLocation.category].color }}>
                      {LOCATION_CATEGORY_META[selectedLocation.category].label}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedLocation.region}</span>
                  </div>
                  <h2 className="mt-0.5 font-scripture text-xl font-semibold text-[var(--atlas-heading)] truncate">
                    {selectedLocation.name}
                  </h2>
                  {selectedLocation.historicalNames.length > 0 && (
                    <div className="mt-0.5 text-[11px] text-[var(--atlas-text-muted)]">
                      Historical names: {selectedLocation.historicalNames.join(' · ')}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setInspectorOpen(false)}
                  aria-label="Close location inspector"
                  className="p-1.5 rounded text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] hover:bg-[var(--atlas-elevated)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {/* Coordinate & Certainty Assessment */}
                <div className="p-3 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className="font-medium"
                      style={{ color: CERTAINTY_META[selectedLocation.certainty].color }}
                    >
                      {CERTAINTY_META[selectedLocation.certainty].label}
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-[var(--atlas-text-muted)]">
                      {selectedLocation.coordinates.lat.toFixed(2)}°N,{' '}
                      {selectedLocation.coordinates.lng.toFixed(2)}°E
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--atlas-text-secondary)] leading-relaxed">
                    {selectedLocation.coordinateNote}
                  </p>
                  {selectedLocation.uncertaintyRadiusKm && (
                    <div className="text-[11px] font-mono text-[var(--atlas-accent)] tabular-nums">
                      Approx. uncertainty / regional span: ~{selectedLocation.uncertaintyRadiusKm} km
                    </div>
                  )}
                </div>

                {/* Description & Significance */}
                <div className="space-y-2">
                  <div className="text-[11px] text-[var(--atlas-text-muted)]">
                    Active Eras:{' '}
                    <span className="text-[var(--atlas-text-secondary)]">
                      {selectedLocation.periods
                        .map((pid) => BIBLICAL_PERIODS.find((p) => p.id === pid)?.label)
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--atlas-text-secondary)] leading-relaxed">
                    {selectedLocation.description}
                  </p>
                  <p className="text-xs text-[var(--atlas-accent-soft)] leading-relaxed">
                    <span className="text-[var(--atlas-text-muted)]">Biblical Significance: </span>
                    {selectedLocation.significance}
                  </p>
                </div>

                {/* Journeys touching this site */}
                {journeysTouchingLocation.length > 0 && (
                  <div className="pt-2 border-t border-[var(--atlas-border)] space-y-2">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                      Journeys Passing Through Site
                    </div>
                    <div className="space-y-1.5">
                      {journeysTouchingLocation.map((j) => (
                        <button
                          key={j.id}
                          type="button"
                          onClick={() => handleSelectJourney(j.id)}
                          className="w-full flex items-center justify-between px-3 py-2 rounded bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border)] text-xs text-left transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-[var(--atlas-text)] truncate">{j.title}</div>
                            <div className="text-[11px] text-[var(--atlas-text-muted)]">{j.figure}</div>
                          </div>
                          <span className="text-[11px] text-[var(--atlas-secondary)] ml-2 shrink-0">
                            Trace Route
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Biblical Events */}
                {linkedEvents.length > 0 && (
                  <div className="pt-2 border-t border-[var(--atlas-border)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                        Linked Biblical Events
                      </span>
                      {onOpenTimeline && (
                        <button
                          type="button"
                          onClick={() => onOpenTimeline()}
                          className="inline-flex items-center gap-1 text-[11px] text-[var(--atlas-accent)] hover:underline"
                        >
                          <History className="w-3 h-3" />
                          <span>Timeline</span>
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {linkedEvents.map((evt) => (
                        <button
                          key={evt.id}
                          type="button"
                          onClick={() => onOpenTimeline?.(evt.id)}
                          className="w-full text-left p-2.5 rounded bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border)] hover:border-[var(--atlas-accent)]/40 transition-colors space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono text-[var(--atlas-text-muted)]">
                            <span>{evt.era}</span>
                            <span>{evt.approximateDate}</span>
                          </div>
                          <div className="text-xs font-medium text-[var(--atlas-heading)]">{evt.title}</div>
                          <p className="text-[11px] text-[var(--atlas-text-muted)] leading-relaxed">
                            {evt.summary}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Associated Scripture Passages */}
                <div className="pt-2 border-t border-[var(--atlas-border)] space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                      Scripture Passages
                    </span>
                    {selectedLocation.verseIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          onLoadVersesInGraph(
                            selectedLocation.verseIds,
                            selectedLocation.verseIds[0]
                          )
                        }
                        className="inline-flex items-center gap-1 text-xs text-[var(--atlas-accent)] hover:underline"
                      >
                        <GitFork className="w-3 h-3" />
                        <span>Explore in Graph</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {selectedLocation.verseIds.map((vId) => {
                      const verse = getVerseById(vId);
                      if (!verse) return null;
                      return (
                        <div
                          key={verse.id}
                          className="p-3 rounded bg-[var(--atlas-bg)] border border-[var(--atlas-border)] space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-scripture text-sm font-semibold text-[var(--atlas-accent-soft)]">
                              {verse.reference}
                            </span>
                            <div className="flex items-center gap-2 text-[11px]">
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenInReader(verse.bookId, verse.chapter, verse.id)
                                }
                                className="inline-flex items-center gap-1 text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)]"
                              >
                                <BookOpen className="w-3 h-3" />
                                <span>Read</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenInGraph(verse.id)}
                                className="inline-flex items-center gap-1 text-[var(--atlas-secondary)] hover:text-[var(--atlas-secondary-soft)]"
                              >
                                <GitFork className="w-3 h-3" />
                                <span>Graph</span>
                              </button>
                            </div>
                          </div>
                          <p className="font-scripture text-xs text-[var(--atlas-text)] leading-relaxed">
                            {verse.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {selectedLocation.additionalReferences &&
                    selectedLocation.additionalReferences.length > 0 && (
                      <div className="text-[11px] text-[var(--atlas-text-muted)]">
                        Additional canonical references:{' '}
                        <span className="text-[var(--atlas-text-secondary)]">
                          {selectedLocation.additionalReferences.join(' · ')}
                        </span>
                      </div>
                    )}
                </div>
              </div>
            </>
          ) : (
            /* Journey Inspector */
            <>
              <div className="px-4 py-3 border-b border-[var(--atlas-border)] flex items-start justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <div className="text-xs flex items-center gap-1.5 flex-wrap">
                    <span style={{ color: JOURNEY_CATEGORY_META[selectedJourney.category].color }}>
                      {JOURNEY_CATEGORY_META[selectedJourney.category].label}
                    </span>
                    <span className="text-[var(--atlas-text-subtle)]">·</span>
                    <span className="font-mono text-[var(--atlas-text-muted)] tabular-nums">
                      {selectedJourney.approximateDate}
                    </span>
                  </div>
                  <h2 className="mt-0.5 font-scripture text-xl font-semibold text-[var(--atlas-heading)]">
                    {selectedJourney.title}
                  </h2>
                  <div className="mt-0.5 text-xs text-[var(--atlas-text-muted)]">
                    Figure: {selectedJourney.figure}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectorOpen(false)}
                  aria-label="Close journey inspector"
                  className="p-1.5 rounded text-[var(--atlas-text-muted)] hover:text-[var(--atlas-text)] hover:bg-[var(--atlas-elevated)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                <p className="text-xs text-[var(--atlas-text-secondary)] leading-relaxed">
                  {selectedJourney.summary}
                </p>

                <div className="p-3 rounded-md bg-[var(--atlas-bg)] border border-[var(--atlas-border-strong)] space-y-1">
                  <div className="text-[11px] font-medium text-[var(--atlas-accent)]">
                    Route Precision &amp; Historical Basis
                  </div>
                  <p className="text-[11px] text-[var(--atlas-text-muted)] leading-relaxed">
                    {selectedJourney.routeCertaintyNote}
                  </p>
                </div>

                {/* Load all journey verses in Graph */}
                <button
                  type="button"
                  onClick={() => {
                    const allIds = Array.from(
                      new Set(selectedJourney.waypoints.flatMap((w) => w.verseIds))
                    );
                    if (allIds.length > 0) {
                      onLoadVersesInGraph(allIds, allIds[0]);
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-[var(--atlas-accent)] text-[var(--atlas-accent-contrast)] text-xs font-semibold hover:bg-[var(--atlas-accent-hover)] transition-colors"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>Explore Route Passages in Bible Graph</span>
                </button>

                {/* Waypoint Itinerary */}
                <div className="space-y-2.5 pt-1 border-t border-[var(--atlas-border)]">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                    <span>Ordered Waypoints</span>
                    <span className="font-mono tabular-nums">
                      {selectedJourney.waypoints.length} stops
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedJourney.waypoints.map((wp, idx) => {
                      const isActive = idx === activeWaypointIdx;
                      const certMeta = CERTAINTY_META[wp.certainty];
                      return (
                        <div
                          key={`${selectedJourney.id}-wp-${wp.order}`}
                          className={`p-3 rounded-md border transition-colors ${
                            isActive
                              ? 'bg-[var(--atlas-elevated)] border-[var(--atlas-secondary)]/45'
                              : 'bg-[var(--atlas-bg)] border-[var(--atlas-border)] hover:border-[var(--atlas-border-strong)]'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveWaypointIdx(idx);
                              focusWaypointOnMap(idx);
                            }}
                            className="w-full text-left"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-xs font-semibold tabular-nums text-[var(--atlas-accent)]">
                                  0{wp.order}.
                                </span>
                                <span className="text-sm font-medium text-[var(--atlas-heading)] truncate">
                                  {wp.name}
                                </span>
                              </div>
                              <span
                                className="text-[10.5px] shrink-0"
                                style={{ color: certMeta.color }}
                              >
                                {certMeta.shortLabel}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[var(--atlas-text-secondary)] leading-relaxed">
                              {wp.summary}
                            </p>
                          </button>

                          <div className="mt-2 pt-2 border-t border-[var(--atlas-border)] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                            <span className="text-[var(--atlas-text-muted)]">
                              {wp.scriptureRefs.join(' · ')}
                            </span>
                            <div className="flex items-center gap-2">
                              {wp.locationId && (
                                <button
                                  type="button"
                                  onClick={() => handleSelectLocation(wp.locationId!)}
                                  className="inline-flex items-center gap-1 text-[var(--atlas-accent)] hover:underline"
                                >
                                  <Compass className="w-3 h-3" />
                                  <span>Site</span>
                                </button>
                              )}
                              {wp.verseIds[0] && getVerseById(wp.verseIds[0]) && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const v = getVerseById(wp.verseIds[0])!;
                                      onOpenInReader(v.bookId, v.chapter, v.id);
                                    }}
                                    className="text-[var(--atlas-text-secondary)] hover:text-[var(--atlas-accent-soft)]"
                                  >
                                    Read
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onOpenInGraph(wp.verseIds[0])}
                                    className="text-[var(--atlas-secondary)] hover:text-[var(--atlas-secondary-soft)]"
                                  >
                                    Graph
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Linked Biblical Events */}
                {linkedEvents.length > 0 && (
                  <div className="pt-2 border-t border-[var(--atlas-border)] space-y-2">
                    <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--atlas-text-subtle)]">
                      Related Redemptive Events
                    </div>
                    {linkedEvents.map((evt) => (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => onOpenTimeline?.(evt.id)}
                        className="w-full text-left p-2.5 rounded bg-[var(--atlas-bg)] hover:bg-[var(--atlas-elevated)] border border-[var(--atlas-border)] hover:border-[var(--atlas-accent)]/40 transition-colors text-xs"
                      >
                        <div className="font-medium text-[var(--atlas-heading)]">{evt.title}</div>
                        <div className="text-[11px] text-[var(--atlas-text-muted)] mt-0.5">
                          {evt.era} · {evt.approximateDate}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </aside>
      )}
    </div>
  );
};
