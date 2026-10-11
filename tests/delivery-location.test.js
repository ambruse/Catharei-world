const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeDelivery } = require('../delivery-location');
const body = location => ({address:'Customer supplied address',deliveryLocation:location});
const pin = { latitude:25.2854,longitude:51.531,locationSource:'map-pin',confirmedAt:'2026-10-11T12:00:00Z' };
test('confirmed coordinates and Qatar details remain exact and staff readable',()=>{
  const result=normalizeDelivery(body({...pin,area:'الدوحة',buildingNumber:'12',streetNumber:'10',zoneNumber:'39',unitNumber:'8',floorNumber:'2',propertyType:'apartment',deliveryInstructions:'Side entrance'}));
  assert.equal(result.lat,pin.latitude);assert.equal(result.lng,pin.longitude);
  assert.equal(result.details.serviceability,'staff-review');assert.match(result.address,/Unit: 8/);assert.match(result.address,/Side entrance/);
});
test('manual fallback has null coordinates and explicit staff verification',()=>{
  const result=normalizeDelivery(body({latitude:null,longitude:null,locationSource:'manual'}));
  assert.equal(result.lat,null);assert.equal(result.lng,null);assert.equal(result.details.verification,'unverified');assert.match(result.address,/Map unverified/);
});
test('server rejects stale, malformed or contradictory location payloads',()=>{
  for(const change of [{latitude:91},{longitude:181},{latitude:'25.2'},{latitude:null},{confirmedAt:null},{locationSource:'invented'},{locationSource:'manual'},{area:[]},{zoneNumber:'x'.repeat(161)}]) assert.throws(()=>normalizeDelivery(body({...pin,...change})));
  assert.throws(()=>normalizeDelivery(body([])));assert.throws(()=>normalizeDelivery({address:'   '}));
});
test('legacy callers retain compatibility with valid coordinates or manual address',()=>{
  assert.equal(normalizeDelivery({address:'Legacy',lat:25,lng:51}).lat,25);
  assert.equal(normalizeDelivery({address:'Legacy'}).lat,null);
});
test('no point is claimed serviceable and no fee is invented',()=>{
  const result=normalizeDelivery(body({...pin,latitude:40,longitude:10}));
  assert.equal(result.details.serviceability,'staff-review');assert.equal(result.details.fee,undefined);
});
