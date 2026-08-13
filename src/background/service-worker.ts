// The worker's only job today is wiring the toolbar icon to the side panel.
// The live data path adds on-demand page extraction here (scripting.executeScript
// with a self-contained function — no persistent content script) and the fetch
// orchestration across source adapters.

chrome.runtime.onInstalled.addListener(() => {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
