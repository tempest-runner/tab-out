/**
 * background.js — Service Worker for Badge Updates
 *
 * Chrome's "always-on" background script for Tab Out.
 * Its only job: keep the toolbar badge showing the current open tab count.
 *
 * Since we no longer have a server, we query chrome.tabs directly.
 * The badge counts real web tabs (skipping chrome:// and extension pages).
 *
 * Color coding gives a quick at-a-glance health signal:
 *   Green  (#3d7a4a) → 1–10 tabs  (focused, manageable)
 *   Amber  (#b8892e) → 11–20 tabs (getting busy)
 *   Red    (#b35a5a) → 21+ tabs   (time to cull!)
 */

// ─── Badge updater ────────────────────────────────────────────────────────────

const personalNewTabUrl = chrome.runtime.getURL('index.html');
const redirectingNewTabIds = new Set();

function isPersonalNewTab(tab) {
  const url = tab?.pendingUrl || tab?.url || '';
  return url === personalNewTabUrl || url === 'chrome://newtab/';
}

/**
 * Reuse the most recently visited personal new-tab page.
 *
 * Chrome must create a tab before an extension can react to Cmd/Ctrl+T, so the
 * duplicate may exist for a split second. We immediately focus the previous
 * personal new-tab page, focus its window, and close the newly created tab.
 */
async function reuseExistingNewTab(candidateTab) {
  if (!candidateTab?.id || !isPersonalNewTab(candidateTab)) return;
  if (redirectingNewTabIds.has(candidateTab.id)) return;
  redirectingNewTabIds.add(candidateTab.id);

  try {
    const tabs = await chrome.tabs.query({});
    const existingTabs = tabs
      .filter(tab => tab.id !== candidateTab.id && isPersonalNewTab(tab))
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));

    const target = existingTabs[0];
    if (!target?.id) return;

    await chrome.tabs.update(target.id, { active: true });
    await chrome.windows.update(target.windowId, { focused: true });
    await chrome.tabs.remove(candidateTab.id);
  } catch (error) {
    // A tab can disappear while Chrome is dispatching events. That is harmless;
    // leave the new tab open instead of interrupting the user's workflow.
    console.warn('[tab-out] Could not reuse the existing new tab:', error);
  } finally {
    redirectingNewTabIds.delete(candidateTab.id);
  }
}

/**
 * updateBadge()
 *
 * Counts open real-web tabs and updates the extension's toolbar badge.
 * "Real" tabs = not chrome://, not extension pages, not about:blank.
 */
async function updateBadge() {
  try {
    const tabs = await chrome.tabs.query({});

    // Only count actual web pages — skip browser internals and extension pages
    const count = tabs.filter(t => {
      const url = t.url || '';
      return (
        !url.startsWith('chrome://') &&
        !url.startsWith('chrome-extension://') &&
        !url.startsWith('about:') &&
        !url.startsWith('edge://') &&
        !url.startsWith('brave://')
      );
    }).length;

    // Don't show "0" — an empty badge is cleaner
    await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });

    if (count === 0) return;

    // Pick badge color based on workload level
    let color;
    if (count <= 10) {
      color = '#3d7a4a'; // Green — you're in control
    } else if (count <= 20) {
      color = '#b8892e'; // Amber — things are piling up
    } else {
      color = '#b35a5a'; // Red — time to focus and close some tabs
    }

    await chrome.action.setBadgeBackgroundColor({ color });

  } catch {
    // If something goes wrong, clear the badge rather than show stale data
    chrome.action.setBadgeText({ text: '' });
  }
}

// ─── Event listeners ──────────────────────────────────────────────────────────

// Update badge when the extension is first installed
chrome.runtime.onInstalled.addListener(() => {
  updateBadge();
});

// Update badge when Chrome starts up
chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Update the badge and reuse an existing personal new-tab page when possible.
chrome.tabs.onCreated.addListener((tab) => {
  updateBadge();
  return reuseExistingNewTab(tab);
});

// Update badge whenever a tab is closed
chrome.tabs.onRemoved.addListener(() => {
  updateBadge();
});

// The final extension URL may only become available after onCreated, so check
// again when Chrome reports the first URL update.
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  updateBadge();
  if (changeInfo.url) return reuseExistingNewTab(tab);
});

// ─── Initial run ─────────────────────────────────────────────────────────────

// Run once immediately when the service worker first loads
updateBadge();
