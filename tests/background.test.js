const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const backgroundSource = fs.readFileSync(
  path.join(__dirname, '..', 'extension', 'background.js'),
  'utf8',
);

function eventSlot(listeners, name) {
  return { addListener(listener) { listeners[name] = listener; } };
}

function loadBackground(initialTabs) {
  const tabs = initialTabs.map(tab => ({ ...tab }));
  const listeners = {};
  const calls = { activated: [], focused: [], removed: [] };

  const chrome = {
    runtime: {
      getURL: file => `chrome-extension://test/${file}`,
      onInstalled: eventSlot(listeners, 'installed'),
      onStartup: eventSlot(listeners, 'startup'),
    },
    tabs: {
      query: async () => tabs,
      update: async (id, changes) => {
        calls.activated.push({ id, changes });
        return tabs.find(tab => tab.id === id);
      },
      remove: async id => { calls.removed.push(id); },
      onCreated: eventSlot(listeners, 'created'),
      onRemoved: eventSlot(listeners, 'removed'),
      onUpdated: eventSlot(listeners, 'updated'),
    },
    windows: {
      update: async (id, changes) => { calls.focused.push({ id, changes }); },
    },
    action: {
      setBadgeText: async () => {},
      setBadgeBackgroundColor: async () => {},
    },
  };

  vm.runInNewContext(backgroundSource, { chrome, console, Set });
  return { listeners, calls };
}

test('a second personal new tab returns to the most recently used existing one', async () => {
  const existingUrl = 'chrome-extension://test/index.html';
  const { listeners, calls } = loadBackground([
    { id: 10, url: existingUrl, windowId: 1, lastAccessed: 100 },
    { id: 11, url: existingUrl, windowId: 2, lastAccessed: 300 },
    { id: 12, pendingUrl: 'chrome://newtab/', windowId: 3, lastAccessed: 400 },
  ]);

  await listeners.created({ id: 12, pendingUrl: 'chrome://newtab/', windowId: 3 });

  assert.equal(calls.activated.length, 1);
  assert.equal(calls.activated[0].id, 11);
  assert.equal(calls.activated[0].changes.active, true);
  assert.equal(calls.focused.length, 1);
  assert.equal(calls.focused[0].id, 2);
  assert.equal(calls.focused[0].changes.focused, true);
  assert.deepEqual(calls.removed, [12]);
});

test('the first personal new tab stays open', async () => {
  const { listeners, calls } = loadBackground([
    { id: 20, pendingUrl: 'chrome://newtab/', windowId: 1 },
    { id: 21, url: 'https://example.com', windowId: 1 },
  ]);

  await listeners.created({ id: 20, pendingUrl: 'chrome://newtab/', windowId: 1 });

  assert.equal(calls.activated.length, 0);
  assert.equal(calls.focused.length, 0);
  assert.equal(calls.removed.length, 0);
});

test('ordinary web tabs are never redirected', async () => {
  const existingUrl = 'chrome-extension://test/index.html';
  const { listeners, calls } = loadBackground([
    { id: 30, url: existingUrl, windowId: 1 },
    { id: 31, url: 'https://example.com', windowId: 1 },
  ]);

  await listeners.created({ id: 31, pendingUrl: 'https://example.com', windowId: 1 });

  assert.equal(calls.activated.length, 0);
  assert.equal(calls.focused.length, 0);
  assert.equal(calls.removed.length, 0);
});
