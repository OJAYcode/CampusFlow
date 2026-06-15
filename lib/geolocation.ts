export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
}

type StatusMessage =
  | "Getting your location..."
  | "Improving GPS accuracy..."
  | "Waiting for a stronger GPS fix..."
  | "Using the best location available...";

interface RobustLocationOptions {
  onStatusChange?: (status: StatusMessage) => void;
}

type GeolocationPositionOptions = PositionOptions;

const HIGH_ACCURACY_OPTIONS: GeolocationPositionOptions = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 0,
};

const FAST_RETRY_OPTIONS: GeolocationPositionOptions = {
  enableHighAccuracy: false,
  timeout: 12000,
  maximumAge: 120000,
};

const WATCH_HIGH_ACCURACY_OPTIONS: GeolocationPositionOptions = {
  enableHighAccuracy: true,
  timeout: 30000,
  maximumAge: 0,
};

const WATCH_WINDOW_MS = 25000;
const TARGET_GPS_ACCURACY_METERS = 20;
const ACCEPTABLE_GPS_ACCURACY_METERS = 45;
const MAX_ACCEPTABLE_GPS_ACCURACY_METERS = 180;

const isDev = process.env.NODE_ENV !== "production";

const logAttempt = (
  label: string,
  options: GeolocationPositionOptions,
  elapsedMs: number,
  outcome:
    | { success: true; coords: LocationData }
    | { success: false; code?: number; message: string },
) => {
  if (!isDev) return;

  if (outcome.success) {
    console.debug("[geo] success", {
      label,
      options,
      elapsedMs,
      lat: outcome.coords.lat,
      lng: outcome.coords.lng,
      accuracy: outcome.coords.accuracy,
    });
    return;
  }

  console.debug("[geo] failed", {
    label,
    options,
    elapsedMs,
    code: outcome.code,
    message: outcome.message,
  });
};

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

const getCurrentPositionWithOptions = (
  label: string,
  options: GeolocationPositionOptions,
): Promise<LocationData> =>
  new Promise((resolve, reject) => {
    const startedAt = performance.now();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const elapsedMs = Math.round(performance.now() - startedAt);
        const locationData = toLocationData(position);
        logAttempt(label, options, elapsedMs, { success: true, coords: locationData });
        resolve(locationData);
      },
      (error) => {
        const elapsedMs = Math.round(performance.now() - startedAt);
        logAttempt(label, options, elapsedMs, {
          success: false,
          code: error.code,
          message: error.message,
        });
        reject(error);
      },
      options,
    );
  });

const watchForBestHighAccuracyFix = (): Promise<LocationData> =>
  new Promise((resolve, reject) => {
    const startedAt = performance.now();
    let finished = false;
    let bestLocation: LocationData | null = null;

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
        resolve(result);
        return;
      }

      reject(error);
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const elapsedMs = Math.round(performance.now() - startedAt);
        const locationData = toLocationData(position);

        if (!bestLocation || locationData.accuracy < bestLocation.accuracy) {
          bestLocation = locationData;
        }

        logAttempt("watch-high-accuracy", WATCH_HIGH_ACCURACY_OPTIONS, elapsedMs, {
          success: true,
          coords: locationData,
        });

        if (locationData.accuracy <= TARGET_GPS_ACCURACY_METERS) {
          finish(watchId, timeoutId, locationData);
        }
      },
      (error) => {
        const elapsedMs = Math.round(performance.now() - startedAt);
        logAttempt("watch-high-accuracy", WATCH_HIGH_ACCURACY_OPTIONS, elapsedMs, {
          success: false,
          code: error.code,
          message: error.message,
        });

        if (bestLocation) {
          finish(watchId, timeoutId, bestLocation);
          return;
        }

        finish(watchId, timeoutId, undefined, error);
      },
      WATCH_HIGH_ACCURACY_OPTIONS,
    );

    const timeoutId = setTimeout(() => {
      if (bestLocation) {
        finish(watchId, timeoutId, bestLocation);
        return;
      }

      finish(watchId, timeoutId, undefined, {
        code: 3,
        message: "Unable to get a precise enough GPS fix.",
      });
    }, WATCH_WINDOW_MS);
  });

export const getRobustUserLocation = async (
  options: RobustLocationOptions = {},
): Promise<LocationData> => {
  if (!navigator.geolocation) {
    throw new Error("Unable to detect location. Check GPS/network and try again.");
  }

  let bestKnownLocation: LocationData | null = null;
  options.onStatusChange?.("Getting your location...");

  try {
    const initialLocation = await getCurrentPositionWithOptions("initial-high-accuracy", HIGH_ACCURACY_OPTIONS);
    bestKnownLocation = initialLocation;
    if (initialLocation.accuracy <= ACCEPTABLE_GPS_ACCURACY_METERS) {
      return initialLocation;
    }
  } catch (initialError) {
    const errorCode = (initialError as { code?: number })?.code;
    if (errorCode && errorCode !== 3) {
      throw new Error(mapGeolocationError(initialError as { code?: number }));
    }
  }

  options.onStatusChange?.("Improving GPS accuracy...");

  try {
    const improvedLocation = await watchForBestHighAccuracyFix();
    bestKnownLocation = improvedLocation;
    if (improvedLocation.accuracy <= MAX_ACCEPTABLE_GPS_ACCURACY_METERS) {
      return improvedLocation;
    }
  } catch (watchError) {
    const mapped = mapGeolocationError(watchError as { code?: number });
    if ((watchError as { code?: number })?.code === 3) {
      options.onStatusChange?.("Using the best location available...");
      try {
        const fallbackLocation = await getCurrentPositionWithOptions("fast-retry-fallback", FAST_RETRY_OPTIONS);
        return !bestKnownLocation || fallbackLocation.accuracy < bestKnownLocation.accuracy
          ? fallbackLocation
          : bestKnownLocation;
      } catch {
        if (bestKnownLocation) {
          return bestKnownLocation;
        }
        throw new Error(
          "GPS is weak right now, so the map may be less precise than usual. If the pin looks off, try again near a window or open area.",
        );
      }
    }
    throw new Error(mapped);
  }

  options.onStatusChange?.("Using the best location available...");
  try {
    const fallbackLocation = await getCurrentPositionWithOptions("final-fast-retry", FAST_RETRY_OPTIONS);
    return !bestKnownLocation || fallbackLocation.accuracy < bestKnownLocation.accuracy
      ? fallbackLocation
      : bestKnownLocation;
  } catch {
    if (bestKnownLocation) {
      return bestKnownLocation;
    }
    throw new Error(
      "GPS is weak right now, so the map may be less precise than usual. If the pin looks off, try again near a window or open area.",
    );
  }
};
