import * as Location from 'expo-location';

export const CAMPUS_CENTER = {
  latitude: 23.04980892525792,
  longitude: 72.607932179558,
};

const CAMPUS_RADIUS_METERS = 500;

function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function requestPermissions() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Location permission denied');
  }
  return true;
}

export async function getCurrentLocation() {
  await requestPermissions();
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

export function isOnCampus(lat, lng) {
  const distance = haversineDistance(
    lat,
    lng,
    CAMPUS_CENTER.latitude,
    CAMPUS_CENTER.longitude
  );
  return {
    onCampus: distance <= CAMPUS_RADIUS_METERS,
    distance: Math.round(distance),
  };
}
