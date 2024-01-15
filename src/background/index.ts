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

chrome.commands.onCommand.addListener(async (command, tab) => {
  console.info("command", command)
  if (command === "add") {
    chrome.tabs.create({ url: "https://zhanghe.dev" })
  }
  if (command === "openRibbonAi") {
    if (!chrome.sidePanel) {
      chrome.runtime.openOptionsPage();
      return;
    }
    // console.info("tab", await chrome.sidePanel.getOptions({ tabId: tab.id }))
    chrome.sidePanel.open({ windowId: tab.windowId });
    chrome.sidePanel.setOptions({
      tabId: tab.id,
      path: 'sidepanel.html',
      enabled: true
    });
    // chrome.sidePanel.setPanelBehavior({
    //   openPanelOnActionClick: true,
    // }).catch(console.error)
  }
})
