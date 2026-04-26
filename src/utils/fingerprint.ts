import FingerprintJS from "@fingerprintjs/fingerprintjs";

export async function getBrowserFingerprint() {
  const base = `${navigator.userAgent}|${navigator.language}|${navigator.platform}`;
  const primitiveFingerprint = btoa(base).slice(0, 24);

  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return {
      deviceFingerprint: primitiveFingerprint,
      visitorId: result.visitorId,
    };
  } catch {
    return {
      deviceFingerprint: primitiveFingerprint,
      visitorId: undefined,
    };
  }
}
