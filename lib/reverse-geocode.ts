"use client";

export interface ReverseGeocodeResult {
  shortLabel: string;
  displayName: string;
  source: string;
}

interface NominatimAddress {
  building?: string;
  amenity?: string;
  office?: string;
  tourism?: string;
  shop?: string;
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
}

interface NominatimReverseResponse {
  display_name?: string;
  address?: NominatimAddress;
  name?: string;
}

function pickShortLabel(address?: NominatimAddress, fallback?: string) {
  const candidates = [
    address?.building,
    address?.amenity,
    address?.office,
    address?.tourism,
    address?.shop,
    address?.road,
    address?.pedestrian,
    address?.neighbourhood,
    address?.suburb,
    address?.city,
    address?.town,
    address?.village,
  ].filter(Boolean) as string[];

  return candidates[0] || fallback || "Detected venue";
}

export async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to resolve the captured location into a nearby venue.");
  }

  const payload = (await response.json()) as NominatimReverseResponse;
  if (!payload.display_name && !payload.address) {
    return null;
  }

  return {
    shortLabel: pickShortLabel(payload.address, payload.name),
    displayName: payload.display_name || pickShortLabel(payload.address, payload.name),
    source: "OpenStreetMap Nominatim",
  };
}
