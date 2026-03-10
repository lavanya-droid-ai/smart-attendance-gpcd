const { CAMPUS } = require('../config/constants');

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Haversine formula — returns distance in meters between two GPS coordinates.
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const EARTH_RADIUS_METERS = 6_371_000;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

function validateCampusLocation(lat, lng) {
  const distanceMeters = haversineDistance(lat, lng, CAMPUS.CENTER_LAT, CAMPUS.CENTER_LNG);

  return {
    isOnCampus: distanceMeters <= CAMPUS.RADIUS_METERS,
    distanceMeters: Math.round(distanceMeters),
  };
}

module.exports = { validateCampusLocation };
