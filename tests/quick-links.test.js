const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const appSource = fs.readFileSync(
  path.join(__dirname, '..', 'extension', 'app.js'),
  'utf8',
);
const navigationSource = appSource.slice(
  appSource.indexOf('async function openQuickLink('),
  appSource.indexOf('function updateClock('),
);

function loadNavigation(existingTabs = []) {
  const updates = [];
  const focusedWindows = [];
  const context = {
    chrome: {
      tabs: {
        query: async () => existingTabs,
        getCurrent: async () => ({ id: 42 }),
        update: async (id, changes) => { updates.push({ id, ...changes }); },
      },
      windows: {
        update: async id => { focusedWindows.push(id); },
      },
    },
    console,
    URL,
  };
  vm.createContext(context);
  vm.runInContext(navigationSource, context);
  return { context, updates, focusedWindows };
}

for (const existingUrl of [
  'https://www.xiaohongshu.com/explore/previous-note',
  'https://www.xiaohongshu.com/',
]) {
  test(`shortcut opens its destination in the current tab with ${existingUrl} already open`, async () => {
    const { context, updates, focusedWindows } = loadNavigation([
      { id: 7, windowId: 3, url: existingUrl },
    ]);

    await context.openQuickLink('https://www.xiaohongshu.com/');

    assert.deepEqual(updates, [{ id: 42, url: 'https://www.xiaohongshu.com/' }]);
    assert.deepEqual(focusedWindows, []);
  });
}

test('custom shortcuts preserve their path, query and fragment', async () => {
  const { context, updates } = loadNavigation();
  const url = 'https://example.com/saved/page?view=all#details';
  await context.openQuickLink(url);
  assert.deepEqual(updates, [{ id: 42, url }]);
});

test('browser preview opens the configured URL without Chrome APIs', async () => {
  const opened = [];
  const context = vm.createContext({
    window: { open: (...args) => opened.push(args) },
  });
  vm.runInContext(navigationSource, context);

  await context.openQuickLink('https://www.xiaohongshu.com/');

  assert.deepEqual(opened, [['https://www.xiaohongshu.com/', '_blank', 'noopener']]);
});

test('click and keyboard shortcuts use destination navigation and respect editing mode', async () => {
  const { context, updates } = loadNavigation([
    { id: 7, windowId: 3, url: 'https://www.xiaohongshu.com/explore/previous-note' },
  ]);
  const handlers = {};
  context.quickLinkElements = {
    grid: { addEventListener: (name, handler) => { handlers[name] = handler; } },
  };
  context.quickLinkState = { editing: false };
  vm.runInContext(appSource.slice(
    appSource.indexOf("quickLinkElements.grid?.addEventListener('click'"),
    appSource.indexOf('quickLinkElements.form?.addEventListener'),
  ), context);
  const link = { dataset: { url: 'https://www.xiaohongshu.com/' } };
  const event = {
    target: { closest: selector => selector === '.quick-link' ? link : null },
    preventDefault() {},
  };

  handlers.click(event);
  handlers.keydown({ ...event, key: 'Enter' });
  handlers.keydown({ ...event, key: ' ' });
  // Event handlers dispatch async navigation without awaiting it.
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(updates, Array.from({ length: 3 }, () => ({
    id: 42, url: 'https://www.xiaohongshu.com/',
  })));

  context.quickLinkState.editing = true;
  handlers.click(event);
  handlers.keydown({ ...event, key: 'Enter' });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(updates.length, 3);
});
