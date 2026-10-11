const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source = fs.readFileSync(require.resolve('../script.js'), 'utf8').split('// BEGIN COMMERCE ANALYTICS')[1].split('// END COMMERCE ANALYTICS')[0];
function setup(hostname = 'www.catharei.com') {
  const calls = [], handlers = [];
  const window = { location: { hostname }, gtag: (...args) => calls.push(args) };
  const document = { addEventListener: (_, fn) => handlers.push(fn), getElementById: () => null };
  vm.runInNewContext(source, { window, document });
  return { window, document, calls, handlers, track: window.cathareiAnalytics.track };
}
test('commerce emits QAR item values and preserves variant identity without customer details', () => {
  const app = setup();
  app.track('add_to_cart', [{ id: '9_large', name: 'Baklava (Large)', price: 60, qty: 2, phone: 'private', email: 'private', lat: 25, address: 'private' }]);
  const [command, event, payload] = app.calls[0];
  assert.equal(command, 'event'); assert.equal(event, 'add_to_cart');
  assert.equal(payload.currency, 'QAR'); assert.equal(payload.value, 120);
  assert.equal(payload.items[0].item_id, '9'); assert.equal(payload.items[0].item_variant, 'large');
  assert.equal(payload.items[0].quantity, 2);
  assert.doesNotMatch(JSON.stringify(payload), /private|phone|email|address|"lat"/);
});
test('empty/invalid carts and purchase calls never produce fabricated events', () => {
  const app = setup();
  for (const rows of [[], [null], [{id:'1',price:NaN}], [{id:'1',price:-1}], [{id:'1',price:null}], [{id:'1',price:1,qty:0}], [{id:'1',price:1,qty:1.5}]]) app.track('begin_checkout', rows);
  app.track('purchase', [{id:'1',price:1}]);
  assert.equal(app.calls.length, 0);
});
test('preview, missing tags, opt-out and throwing tags cannot interrupt commerce', () => {
  const item = [{ id: 1, price: 20, qty: 1 }];
  const local = setup('127.0.0.1'); local.track('add_to_cart', item); assert.equal(local.calls.length, 0);
  const app = setup(); app.window['ga-disable-G-RYKLR11ZQT'] = true; app.track('add_to_cart', item); assert.equal(app.calls.length, 0);
  delete app.window['ga-disable-G-RYKLR11ZQT']; delete app.window.gtag;
  assert.doesNotThrow(() => app.track('add_to_cart', item));
  app.window.gtag = () => { throw Error('blocked'); };
  assert.doesNotThrow(() => app.track('add_to_cart', item));
});
test('product detail records actual dataset and pending order event stays distinct from purchase', () => {
  const app = setup(); app.document.getElementById = () => ({dataset:{id:'4',name:'Test cake',price:'25.50'}});
  app.handlers[0](); app.track('order_submitted', [{id:4,name:'Test cake',price:25.50,qty:2}]);
  assert.deepEqual(app.calls.map(c => c[1]), ['view_item','order_submitted']);
  assert.equal(app.calls[1][2].value, 51); assert.equal(app.calls[1][2].transaction_id, undefined);
});

test('unselected size view does not invent a zero-price offer, while the chosen cart size is priced', () => {
  const app = setup();
  app.track('view_item', [{id:'9', name:'Cake', price:0, variants:'{"small":40,"large":60}'}]);
  assert.equal(app.calls[0][2].value, undefined);
  assert.equal(app.calls[0][2].items[0].price, undefined);
  app.track('remove_from_cart', [{id:'9_large', name:'Cake', price:60, qty:2}]);
  assert.equal(app.calls[1][2].value, 120);
  assert.equal(app.calls[1][2].items[0].item_variant, 'large');
});
