import "@plasmohq/messaging/background"
import { startHub } from "@plasmohq/messaging/pub-sub"

startHub()

chrome.action.onClicked.addListener(async (tab) => {
  if (!chrome.sidePanel) {
    chrome.runtime.openOptionsPage();
    return;
  }
  chrome.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true,
  }).catch(console.error)
})
