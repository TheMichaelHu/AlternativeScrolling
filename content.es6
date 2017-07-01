chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch(request.scrollDir) {
    case "down": {
      window.scrollBy(0, 200);
      break;
    }
    case "up": {
      window.scrollBy(0, -200);
      break;
    }
    default: {
      break;
    }
  }
});
