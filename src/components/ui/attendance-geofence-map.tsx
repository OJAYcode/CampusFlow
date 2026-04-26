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
  html: '<div style="display:flex;height:18px;width:18px;align-items:center;justify-content:center;border-radius:999px;background:#255ac8;border:3px solid #ffffff;box-shadow:0 8px 18px rgba(37,90,200,0.32)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
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

function createEllipsePoints(
  latitude: number,
  longitude: number,
  radius: number,
  radiusYMultiplier = 0.72,
  pointCount = 72,
): Array<[number, number]> {
  const metersPerDegreeLatitude = 111320;
  const metersPerDegreeLongitude = 111320 * Math.cos((latitude * Math.PI) / 180);
  const radiusX = radius;
  const radiusY = radius * radiusYMultiplier;

  return Array.from({ length: pointCount }, (_, index) => {
    const theta = (2 * Math.PI * index) / pointCount;
    const offsetX = radiusX * Math.cos(theta);
    const offsetY = radiusY * Math.sin(theta);

    return [
      latitude + offsetY / metersPerDegreeLatitude,
      longitude + offsetX / Math.max(metersPerDegreeLongitude, 1),
    ];
  });
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
  const jurisdictionEllipse = createEllipsePoints(latitude, longitude, radius);
  const jurisdictionPulse = createEllipsePoints(latitude, longitude, radius * 1.12, 0.76);
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

        <Circle
          center={center}
          radius={radius}
          pathOptions={{ color: "#255ac8", fillColor: "#255ac8", fillOpacity: 0.12, weight: 3 }}
        />
        <Circle
          center={center}
          radius={Math.max(radius * 0.5, 5)}
          pathOptions={{ color: "#23a148", fillColor: "transparent", opacity: 0.45, weight: 1, dashArray: "4 6" }}
        />
        <Polygon
          positions={jurisdictionEllipse}
          pathOptions={{
            color: "#255ac8",
            fillColor: "#255ac8",
            fillOpacity: 0.05,
            weight: 2,
            className: "attendance-jurisdiction-oval",
          }}
        />
        <Polygon
          positions={jurisdictionPulse}
          pathOptions={{
            color: "#255ac8",
            fillColor: "transparent",
            fillOpacity: 0,
            weight: 2,
            opacity: 0.35,
            dashArray: "10 12",
            className: "attendance-jurisdiction-pulse",
          }}
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
