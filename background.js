

const extensionVersion = chrome.runtime.getManifest().version;
const STATUS = Object.freeze({ PENDING: "pending", COMPLETED: "completed" });

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        title: "Copy Quiz to Clipboard",
        id: "copyQuiz",
        contexts: ["page", "frame"],
        documentUrlPatterns: ["*://*.vu.edu.pk/*"]
    });
});

chrome.contextMenus.onClicked.addListener(info => {
    if (info.menuItemId === "copyQuiz") {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
            chrome.tabs.sendMessage(tabs[0].id, { ev: "copyQuiz" });
        });
    }
});
