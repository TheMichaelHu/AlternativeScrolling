chrome.tabs.create({'url': chrome.extension.getURL('popup.html')}, tab => {
  // Tab opened.
});
