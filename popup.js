document.addEventListener("DOMContentLoaded", function () {

    const btn = document.getElementById("start_button");

    chrome.storage.local.get("buttonState", (result) => {
        if (result.buttonState === "running") {
            btn.textContent = "Running...";
        } else {
            btn.textContent = "Start";
        }
    })

    btn.addEventListener("click", () => {
        if (btn.textContent === 'Start') {
            btn.textContent = 'Running...'; // 👈 Changes button text
            chrome.storage.local.set({ buttonState: 'running' });
            chrome.storage.local.set({ whichPage: 'listPage' });
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "start" });
            });
        } else {
            chrome.storage.local.set({ buttonState: 'start', whichPage: 'listPage' });
            btn.textContent = 'Downloading...';
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "download" });
            });
            btn.textContent = 'Start'; // 👈 Changes button text
        }
    });
});