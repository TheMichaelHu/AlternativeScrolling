chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  window.scrollBy(0, request.scrollDist);
});
