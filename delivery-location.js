'use strict';

// Shared server normalization. No delivery boundaries or fees are invented here.
const detailFields = ['area', 'zoneNumber', 'streetNumber', 'buildingNumber', 'propertyType', 'unitNumber', 'floorNumber', 'landmark', 'deliveryInstructions'];
const labels = { area: 'Area', zoneNumber: 'Zone', streetNumber: 'Street', buildingNumber: 'Building', propertyType: 'Property', unitNumber: 'Unit', floorNumber: 'Floor', landmark: 'Landmark', deliveryInstructions: 'Instructions' };
const validCoordinate = (lat, lng) => typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;

function normalizeDelivery(body) {
  if (typeof body.address !== 'string' || !body.address.trim() || body.address.length > 4000) throw new Error('Enter a complete delivery address.');
  const location = body.deliveryLocation;
  if (location != null && (typeof location !== 'object' || Array.isArray(location))) throw new Error('Invalid delivery location.');
  // Old clients remain compatible, but missing coordinates are never replaced with Doha.
  const lat = location ? location.latitude : body.lat;
  const lng = location ? location.longitude : body.lng;
  const manual = location ? location.locationSource === 'manual' : lat == null && lng == null;
  if (manual ? lat != null || lng != null : !validCoordinate(lat, lng)) throw new Error('Choose a valid delivery pin or use a manual address.');
  const details = { locationSource: manual ? 'manual' : 'map-pin', verification: manual ? 'unverified' : 'pin-confirmed', serviceability: 'staff-review' };
  if (location) {
    if (!['gps', 'area-search', 'map-pin', 'manual'].includes(location.locationSource)) throw new Error('Invalid location source.');
    if (!manual && (!location.confirmedAt || !Number.isFinite(Date.parse(location.confirmedAt)))) throw new Error('Confirm your delivery pin.');
    details.locationSource = location.locationSource;
    if (!manual) details.confirmedAt = new Date(location.confirmedAt).toISOString();
    if (location.locationSource === 'gps' && Number.isFinite(location.accuracyMeters) && location.accuracyMeters >= 0) details.accuracyMeters = location.accuracyMeters;
    for (const field of detailFields) {
      if (location[field] == null) continue;
      if (typeof location[field] !== 'string' || location[field].length > (field === 'deliveryInstructions' ? 500 : 160)) throw new Error('Delivery details are too long or invalid.');
      details[field] = location[field].trim();
    }
    if (details.propertyType && !['villa', 'apartment', 'office', 'other'].includes(details.propertyType)) throw new Error('Invalid property type.');
  }
  const lines = [body.address.trim(), ...detailFields.filter(key => details[key]).map(key => `${labels[key]}: ${details[key]}`), manual ? 'Map unverified — confirm address with customer.' : 'Delivery pin confirmed — serviceability subject to staff acceptance.'];
  return { address: lines.join('\n'), lat: manual ? null : lat, lng: manual ? null : lng, details };
}
module.exports = { normalizeDelivery, validCoordinate };
