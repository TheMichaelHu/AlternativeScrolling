chrome.tabs.create({'url': chrome.extension.getURL('popup.html')}, tab => {
  // Tab opened.
});

chrome.browserAction.onClicked.addListener(() => {
   chrome.tabs.create({'url': 'popup.html'}, window => {
   });
});