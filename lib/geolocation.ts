export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
}

type StatusMessage =
  | "Getting your location..."
  | "Improving GPS accuracy..."
  | "Locking onto GPS satellites..."
  | "Waiting for a stronger GPS fix..."
  | "Using the best location available...";

interface RobustLocationOptions {
  onStatusChange?: (status: StatusMessage) => void;
  // Streams each fix's accuracy (in metres) as GPS tightens, so the UI can show
  // a live "locking on" indicator instead of a single end result.
  onAccuracyUpdate?: (accuracyMeters: number) => void;
}

type GeolocationPositionOptions = PositionOptions;

// Always demand the device's true GPS (not the coarse wifi/network fix) and
// never reuse a cached position.
const WATCH_OPTIONS: GeolocationPositionOptions = {
  enableHighAccuracy: true,
  timeout: 30000,
  maximumAge: 0,
};

const FALLBACK_OPTIONS: GeolocationPositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 0,
};

// We keep sampling for up to this long, letting the GPS fix settle. A phone's
// first readings are coarse (network/wifi assisted, 20-100m); accuracy tightens
// as satellites lock, which can take 15-25s from cold. Waiting this long is
// what gets a real GPS fix instead of the coarse early one.
const SETTLE_WINDOW_MS = 24000;
// Stop early only on a genuinely tight satellite fix.
const EXCELLENT_ACCURACY_METERS = 8;
// A fix we are happy to return once two of them agree.
const GOOD_ACCURACY_METERS = 18;
// If two consecutive tight readings agree to within this distance, the fix has
// stabilised and we can return immediately.
const STABLE_AGREEMENT_METERS = 6;

const isDev = process.env.NODE_ENV !== "production";

const toLocationData = (position: GeolocationPosition): LocationData => ({
  lat: position.coords.latitude,
  lng: position.coords.longitude,
  accuracy: Math.min(position.coords.accuracy, 10000),
});

export const mapGeolocationError = (error: { code?: number } | null): string => {
  switch (error?.code) {
    case 1:
      return "Location permission denied. Enable location access in browser settings.";
    case 2:
      return "Unable to detect location. Check GPS/network and try again.";
    case 3:
      return "Location request timed out. Move to an open area, turn on GPS, and try again.";
    default:
      return "Unable to detect location. Check GPS/network and try again.";
  }
};

// Haversine distance in metres between two coordinates.
const distanceMeters = (a: LocationData, b: LocationData): number => {
  const earthRadius = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(h));
};

const getCurrentPositionWithOptions = (
  options: GeolocationPositionOptions,
): Promise<LocationData> =>
  new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(toLocationData(position)),
      (error) => reject(error),
      options,
    );
  });

// Watch the GPS for a short window, collect readings, and resolve with the most
// accurate, stabilised fix. This is what makes repeated captures of the same
// spot land on (nearly) the same coordinates instead of drifting.
const watchForStableFix = (
  onStatusChange?: (status: StatusMessage) => void,
  onAccuracyUpdate?: (accuracyMeters: number) => void,
): Promise<LocationData> =>
  new Promise((resolve, reject) => {
    let finished = false;
    let best: LocationData | null = null;
    let previousTight: LocationData | null = null;

    const finish = (
      watchId: number,
      timeoutId: ReturnType<typeof setTimeout>,
      result?: LocationData,
      error?: { code?: number; message: string },
    ) => {
      if (finished) return;
      finished = true;
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timeoutId);
      if (result) {
        if (isDev) console.debug("[geo] final fix", result);
        resolve(result);
      } else {
        reject(error);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const reading = toLocationData(position);
        if (isDev) console.debug("[geo] reading", reading);
        onAccuracyUpdate?.(reading.accuracy);

        if (!best || reading.accuracy < best.accuracy) {
          best = reading;
        }

        // An excellent fix: return right away.
        if (reading.accuracy <= EXCELLENT_ACCURACY_METERS) {
          finish(watchId, timeoutId, reading);
          return;
        }

        // Two consecutive reasonably tight fixes that agree => stabilised.
        if (reading.accuracy <= GOOD_ACCURACY_METERS) {
          if (
            previousTight &&
            distanceMeters(previousTight, reading) <= STABLE_AGREEMENT_METERS
          ) {
            finish(watchId, timeoutId, reading.accuracy <= previousTight.accuracy ? reading : previousTight);
            return;
          }
          previousTight = reading;
          onStatusChange?.("Locking onto GPS satellites...");
        }
      },
      (error) => {
        if (best) {
          finish(watchId, timeoutId, best);
          return;
        }
        finish(watchId, timeoutId, undefined, error);
      },
      WATCH_OPTIONS,
    );

    const timeoutId = setTimeout(() => {
      // Window elapsed: return the most accurate reading we gathered.
      if (best) {
        finish(watchId, timeoutId, best);
        return;
      }
      finish(watchId, timeoutId, undefined, {
        code: 3,
        message: "Unable to get a precise enough GPS fix.",
      });
    }, SETTLE_WINDOW_MS);
  });

export const getRobustUserLocation = async (
  options: RobustLocationOptions = {},
): Promise<LocationData> => {
  if (!navigator.geolocation) {
    throw new Error("Unable to detect location. Check GPS/network and try again.");
  }

  options.onStatusChange?.("Getting your location...");

  try {
    options.onStatusChange?.("Improving GPS accuracy...");
    return await watchForStableFix(options.onStatusChange, options.onAccuracyUpdate);
  } catch (watchError) {
    const code = (watchError as { code?: number })?.code;
    // Permission denied / unavailable are terminal — surface them.
    if (code === 1 || code === 2) {
      throw new Error(mapGeolocationError(watchError as { code?: number }));
    }

    // Timed out without a tight fix: take one last high-accuracy reading.
    options.onStatusChange?.("Using the best location available...");
    try {
      return await getCurrentPositionWithOptions(FALLBACK_OPTIONS);
    } catch (fallbackError) {
      const fallbackCode = (fallbackError as { code?: number })?.code;
      if (fallbackCode === 1 || fallbackCode === 2) {
        throw new Error(mapGeolocationError(fallbackError as { code?: number }));
      }
      throw new Error(
        "GPS is weak right now, so the map may be less precise than usual. If the pin looks off, try again near a window or open area.",
      );
    }
  }
};
