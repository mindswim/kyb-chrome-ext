// Phase 1: the worker only wires the toolbar icon to the side panel.
// Phase 2 adds: on-demand page extraction (scripting.executeScript with a
// self-contained function — no persistent content script) and the fetch
// orchestration across source adapters.

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
