"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import { Circle, LayersControl, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const lecturerIcon = new L.DivIcon({
  className: "custom-lecturer-pin",
  html: '<div class="geofence-command-pin"><span class="geofence-command-core"></span></div>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

const insideIcon = new L.DivIcon({
  className: "custom-student-pin",
  html: '<div style="display:flex;height:14px;width:14px;align-items:center;justify-content:center;border-radius:999px;background:#23a148;border:2px solid #ffffff;box-shadow:0 6px 14px rgba(35,161,72,0.28)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const outsideIcon = new L.DivIcon({
  className: "custom-student-pin",
  html: '<div style="display:flex;height:14px;width:14px;align-items:center;justify-content:center;border-radius:999px;background:#e04663;border:2px solid #ffffff;box-shadow:0 6px 14px rgba(224,70,99,0.28)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const staleIcon = new L.DivIcon({
  className: "custom-student-pin",
  html: '<div style="display:flex;height:14px;width:14px;align-items:center;justify-content:center;border-radius:999px;background:#94a3b8;border:2px solid #ffffff;box-shadow:0 4px 10px rgba(148,163,184,0.22)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function zoomForRadius(radius: number) {
  if (radius <= 30) return 19;
  if (radius <= 75) return 18;
  if (radius <= 150) return 17;
  if (radius <= 300) return 16;
  if (radius <= 600) return 15;
  return 14;
}

function MapUpdater({
  latitude,
  longitude,
  radius,
}: {
  latitude: number;
  longitude: number;
  radius: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView([latitude, longitude], zoomForRadius(radius));
  }, [latitude, longitude, map, radius]);

  return null;
}

function metersToLatLng(
  latitude: number,
  longitude: number,
  offsetXMeters: number,
  offsetYMeters: number,
): [number, number] {
  const metersPerDegreeLatitude = 111320;
  const metersPerDegreeLongitude = 111320 * Math.cos((latitude * Math.PI) / 180);
  return [
    latitude + offsetYMeters / metersPerDegreeLatitude,
    longitude + offsetXMeters / Math.max(metersPerDegreeLongitude, 1),
  ];
}

// A pie-slice wedge from the centre, used as the rotating radar sweep.
function createSweepWedge(
  latitude: number,
  longitude: number,
  radius: number,
  spreadDegrees: number,
  pointCount = 16,
): Array<[number, number]> {
  const half = (spreadDegrees * Math.PI) / 180 / 2;
  const points: Array<[number, number]> = [[latitude, longitude]];
  for (let i = 0; i <= pointCount; i += 1) {
    const theta = -half + (2 * half * i) / pointCount;
    points.push(
      metersToLatLng(latitude, longitude, radius * Math.cos(theta), radius * Math.sin(theta)),
    );
  }
  return points;
}

// Two perpendicular lines crossing the command point.
function createCrosshair(latitude: number, longitude: number, reach: number) {
  return {
    horizontal: [
      metersToLatLng(latitude, longitude, -reach, 0),
      metersToLatLng(latitude, longitude, reach, 0),
    ] as Array<[number, number]>,
    vertical: [
      metersToLatLng(latitude, longitude, 0, -reach),
      metersToLatLng(latitude, longitude, 0, reach),
    ] as Array<[number, number]>,
  };
}

export interface AttendanceStudentPoint {
  id: string;
  name: string;
  matricNumber?: string;
  latitude: number;
  longitude: number;
  trail?: Array<{ latitude: number; longitude: number }>;
  distanceFromSession?: number;
  accuracy?: number;
  status?: string;
  lastSeenAt?: string;
  connectionState?: "live" | "stale";
}

function coordinateGroupKey(latitude: number, longitude: number) {
  return `${latitude.toFixed(5)}:${longitude.toFixed(5)}`;
}

function offsetPointMeters(
  latitude: number,
  longitude: number,
  offsetXMeters: number,
  offsetYMeters: number,
): [number, number] {
  const metersPerDegreeLatitude = 111320;
  const metersPerDegreeLongitude = 111320 * Math.cos((latitude * Math.PI) / 180);

  return [
    latitude + offsetYMeters / metersPerDegreeLatitude,
    longitude + offsetXMeters / Math.max(metersPerDegreeLongitude, 1),
  ];
}

export function AttendanceGeofenceMap({
  latitude,
  longitude,
  radius,
  venueLabel,
  studentPoints,
}: {
  latitude: number;
  longitude: number;
  radius: number;
  venueLabel?: string;
  studentPoints: AttendanceStudentPoint[];
}) {
  const center: [number, number] = [latitude, longitude];
  const [satelliteUnavailable, setSatelliteUnavailable] = useState(false);

  // Radar sweep wedge (a 50-degree fan from the centre) that we rotate via CSS.
  const radarSweep = useMemo(
    () => createSweepWedge(latitude, longitude, radius, 50),
    [latitude, longitude, radius],
  );
  // Crosshair lines that extend just past the geofence boundary.
  const crosshairLines = useMemo(
    () => createCrosshair(latitude, longitude, radius * 1.04),
    [latitude, longitude, radius],
  );
  const renderedStudentPoints = useMemo(() => {
    const grouped = new Map<string, AttendanceStudentPoint[]>();

    studentPoints.forEach((student) => {
      const key = coordinateGroupKey(student.latitude, student.longitude);
      const current = grouped.get(key) || [];
      current.push(student);
      grouped.set(key, current);
    });

    return studentPoints.map((student) => {
      const key = coordinateGroupKey(student.latitude, student.longitude);
      const group = grouped.get(key) || [student];
      const centerKey = coordinateGroupKey(latitude, longitude);
      const shouldSpread = group.length > 1 || key === centerKey;

      if (!shouldSpread) {
        return { ...student, displayLatitude: student.latitude, displayLongitude: student.longitude };
      }

      const index = group.findIndex((item) => item.id === student.id);
      const spreadRadiusMeters = Math.max(Math.min(radius * 0.18, 16), 8);
      const angle = (2 * Math.PI * index) / Math.max(group.length, 1);
      const [displayLatitude, displayLongitude] = offsetPointMeters(
        student.latitude,
        student.longitude,
        Math.cos(angle) * spreadRadiusMeters,
        Math.sin(angle) * spreadRadiusMeters,
      );

      return { ...student, displayLatitude, displayLongitude };
    });
  }, [latitude, longitude, radius, studentPoints]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[20px] border border-[var(--border)]">
      <MapContainer center={center} zoom={zoomForRadius(radius)} style={{ height: "100%", width: "100%" }}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='Imagery &copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
              maxNativeZoom={17}
              eventHandlers={{
                loading: () => setSatelliteUnavailable(false),
                tileerror: () => setSatelliteUnavailable(true),
                load: () => setSatelliteUnavailable(false),
              }}
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapUpdater latitude={latitude} longitude={longitude} radius={radius} />

        <Marker position={center} icon={lecturerIcon}>
          <Popup>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">Lecturer position</p>
              {venueLabel ? <p className="text-sm text-slate-600">{venueLabel}</p> : null}
              <p className="text-xs text-slate-500">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>

        {/* Tactical geofence: filled jurisdiction zone */}
        <Circle
          center={center}
          radius={radius}
          pathOptions={{
            color: "#19c37d",
            fillColor: "#19c37d",
            fillOpacity: 0.08,
            weight: 2,
            className: "geofence-zone",
          }}
        />
        {/* Concentric range rings */}
        <Circle
          center={center}
          radius={Math.max(radius * 0.66, 4)}
          pathOptions={{ color: "#19c37d", fillColor: "transparent", opacity: 0.35, weight: 1, dashArray: "2 8" }}
        />
        <Circle
          center={center}
          radius={Math.max(radius * 0.33, 3)}
          pathOptions={{ color: "#19c37d", fillColor: "transparent", opacity: 0.3, weight: 1, dashArray: "2 8" }}
        />
        {/* Outer boundary ring (bright) */}
        <Circle
          center={center}
          radius={radius}
          pathOptions={{
            color: "#3df5a4",
            fillColor: "transparent",
            opacity: 0.9,
            weight: 1.5,
            className: "geofence-boundary",
          }}
        />
        {/* Sweeping radar arc */}
        <Polygon
          positions={radarSweep}
          pathOptions={{
            color: "transparent",
            fillColor: "#19c37d",
            fillOpacity: 0.16,
            weight: 0,
            className: "geofence-sweep",
          }}
        />
        {/* Crosshair through the command point */}
        <Polyline
          positions={crosshairLines.horizontal}
          pathOptions={{ color: "#19c37d", opacity: 0.4, weight: 1, dashArray: "3 7" }}
        />
        <Polyline
          positions={crosshairLines.vertical}
          pathOptions={{ color: "#19c37d", opacity: 0.4, weight: 1, dashArray: "3 7" }}
        />

        {renderedStudentPoints.map((student) => {
          const inside = (student.distanceFromSession ?? Number.MAX_SAFE_INTEGER) <= radius;
          const isStale = student.connectionState === "stale";
          const markerIcon = isStale ? staleIcon : inside ? insideIcon : outsideIcon;
          const strokeOpacity = isStale ? 0.18 : 0.55;
          const trailOpacity = isStale ? 0.12 : 0.28;
          return [
            student.trail && student.trail.length > 1 ? (
              <Polyline
                key={`${student.id}-trail`}
                positions={student.trail.map((point) => [point.latitude, point.longitude])}
                pathOptions={{
                  color: inside ? "#23a148" : "#e04663",
                  opacity: trailOpacity,
                  weight: 3,
                }}
              />
            ) : null,
            <Polyline
              key={`${student.id}-line`}
              positions={[
                center,
                [student.displayLatitude, student.displayLongitude],
              ]}
              pathOptions={{
                color: inside ? "#23a148" : "#e04663",
                opacity: strokeOpacity,
                weight: 2,
                dashArray: "6 6",
              }}
            />,
            <Marker
              key={`${student.id}-marker`}
              position={[student.displayLatitude, student.displayLongitude]}
              icon={markerIcon}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold text-slate-900">{student.name}</p>
                  {student.matricNumber ? <p className="text-xs text-slate-500">{student.matricNumber}</p> : null}
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    {isStale ? "Stale device" : "Live device"}
                  </p>
                  {Math.abs(student.displayLatitude - student.latitude) > 0.000001 ||
                  Math.abs(student.displayLongitude - student.longitude) > 0.000001 ? (
                    <p className="text-xs text-slate-500">Marker nudged slightly so overlapping devices stay visible.</p>
                  ) : null}
                  <p className="text-sm text-slate-600">
                    Distance from lecturer: {Math.round(student.distanceFromSession || 0)}m
                  </p>
                  {typeof student.accuracy === "number" ? (
                    <p className="text-xs text-slate-500">Accuracy +/-{Math.round(student.accuracy)}m</p>
                  ) : null}
                  {student.lastSeenAt ? <p className="text-xs text-slate-500">Last seen {student.lastSeenAt}</p> : null}
                </div>
              </Popup>
            </Marker>,
          ];
        })}
      </MapContainer>
      {satelliteUnavailable ? (
        <div className="pointer-events-none absolute left-4 top-4 max-w-sm rounded-2xl border border-amber-200 bg-white/96 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-sm font-semibold text-slate-900">Satellite imagery is limited here</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            The satellite provider does not have full imagery for this zoom level or location yet. Switch back to
            Street Map to confirm the session area.
          </p>
        </div>
      ) : null}
    </div>
  );
}
