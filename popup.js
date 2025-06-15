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
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "start" });
            });
        } else {
            btn.textContent = 'Start'; // 👈 Changes button text
            chrome.storage.local.set({ buttonState: 'start' });
        }
    });
});