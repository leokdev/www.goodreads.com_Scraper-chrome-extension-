
const allTags = document.querySelector("div.pagination").querySelectorAll("*");
const nextButton = allTags[allTags.length - 1];

const url = window.location.href.split('?page')[0];

const start = () => {
    console.log('url ===> ', url);
    const now_url = `${url}?page=${1}`;
    window.location.href = now_url;
}

const scrap = async() => {

    let data = await getStorageData("data");
    if(!data)  data = [];

    const container = document.getElementById("all_votes");
    if (container) {
        const tbody = container.querySelector("table tbody");
        if (tbody) {
            const rows = tbody.querySelectorAll("tr");
            rows.forEach(tr => {

                const tds = tr.querySelectorAll("td");
                const td = tds[2];

                let bookTitle = td.querySelector("a.bookTitle")?.textContent.trim();
                let authorName = td.querySelector(".authorName span")?.textContent.trim();
                let score = null;
                let votes = null;

                const extraInfoSpan = Array.from(td.querySelectorAll("span.smallText.uitext")).find(span => !span.classList.contains("greyText"));

                if (extraInfoSpan) {
                    const links = extraInfoSpan.querySelectorAll("a");
                    links.forEach(a => {
                        const text = a.textContent.trim().toLowerCase();
                        if (text.startsWith("score:")) {
                            score = text.replace("score:", "").trim();
                        } else if (text.includes("voted")) {
                            const match = text.match(/^(\d+)/);
                            if (match) {
                                votes = match[1];
                            }
                        }
                    });
                }

                data.push({ 'bookTitle': bookTitle, 'authorName': authorName, 'score': score, 'votes': votes });
            });
        } else {
            console.log("No <tbody> found inside the table.");
        }
        chrome.storage.local.set({ buttonState: 'running', data });
    } else {
        console.log("Div with id 'all_votes' not found.");
    }

    console.log('scraped!');

    if (nextButton.classList.contains('disabled')) {
        console.log('data ==> ', data);
        downloadCSV(data);
        chrome.storage.local.set({ buttonState: 'Start', data: [] });
    } else {
        nextButton.click();
    }
}

const downloadCSV = (data, filename = "data.csv") => {
    if (!data || !data.length) return;
  
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","), // header row
      ...data.map(row =>
        headers.map(field => {
          let val = row[field];
          if (typeof val === "string" && val.includes(",")) {
            val = `"${val}"`; // quote values with commas
          }
          return val;
        }).join(",")
      )
    ];
  
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function getStorageData(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
            resolve(result[key] || []);
        });
    });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start") {
        start();
    } else if (message.action === "scraping") {
        scrap();
    }
});

const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

chrome.storage.local.get("buttonState", (result) => {
    if (result.buttonState === "running") {
        scrap();
    }
})