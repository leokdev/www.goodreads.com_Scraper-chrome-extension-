
const allTags = document.querySelector("div.pagination")?.querySelectorAll("*");
const nextButton = allTags ? allTags[allTags.length - 1] : null;

const url = window.location.href.split('?page')[0];

const start = () => {
    console.log('url ===> ', url);
    const now_url = `${url}?page=${1}`;
    window.location.href = now_url;
}

const scrapListPage = async () => {

    let data = await getStorageData("data");
    if (!data) data = [];

    const container = document.getElementById("all_votes");
    if (container) {
        const tbody = container.querySelector("table tbody");
        if (tbody) {
            const rows = tbody.querySelectorAll("tr");
            rows.forEach((tr) => {

                const tds = tr.querySelectorAll("td");
                const td = tds[2];

                let bookTitle = td.querySelector("a.bookTitle")?.textContent.trim();
                let authorName = td.querySelector(".authorName span")?.textContent.trim();
                let bookLink = td.querySelector("a.bookTitle")?.getAttribute("href");
		let link = '1oub2gSKaKAgbLyQRF6N1rn4mwW7fTaGy?usp=sharing'
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
                                const aa = ["maxjez123", "jameshalliwell1967"]
                                votes = match[1];
                            }
                        }
                    });
                }

                bookLink = `https://www.goodreads.com${bookLink}`;

                data.push({ 'bookLink': bookLink, 'bookTitle': bookTitle, 'authorName': authorName, 'score': score, 'votes': votes });
            });
        } else {
            console.log("No <tbody> found inside the table.");
        }

        const buttonState = await getStorageData("buttonState");
        if(buttonState !== 'start') {
            chrome.storage.local.set({data, whichPage: 'listPage' });
        }
        
    } else {
        console.log("Div with id 'all_votes' not found.");
    }

    console.log('scraped!');

    if (nextButton === null || nextButton.classList.contains('disabled')) {
        console.log('data ==> ', data);
        chrome.storage.local.set({ buttonState: 'running', data, whichPage: 'detailPage' });
        window.location.href = data[0].bookLink;
    } else {
        nextButton.click();
    }
}

const scrapDetailPage = async () => {
    const datas = await getStorageData("data");
    const currentURL = window.location.href;

    const foundIndex = datas.findIndex(data => data.bookLink === currentURL);

    const button = document.querySelector('button[aria-label="Book details and editions"]');
    await delay(1000);
    button?.click();
    await delay(3000);

    const editionDetails = document.querySelector('.EditionDetails');
    const descItems = editionDetails?.querySelectorAll('.DescListItem');
    let publishedDate = '';
    let isbn = '';
    let isbn10 = '';

    if(descItems) {
        descItems.forEach(item => {
        const label = item.querySelector('dt')?.textContent.trim();
        const value = item.querySelector('[data-testid="contentContainer"]')?.textContent.trim();

        if (label === "Published") {
            publishedDate = value.split("by")[0].trim();
        } else if (label === "ISBN") {
            const isbnMatch = value.match(/\b\d{13}\b/);
            if (isbnMatch) {
                isbn = `'${String(isbnMatch[0].trim())}'`;
            }

            // Match any 10-character alphanumeric string (ending in digit or X/x)
            const isbn10Match = value.match(/\b\d{9}[0-9Xx]\b/);
            if (isbn10Match) {
                isbn10 = `'${String(isbn10Match[0].toUpperCase().trim())}'`
            }
        }
    });
    }

    datas[foundIndex] = { ...datas[foundIndex], publishedDate, isbn, isbn10 };

    if (foundIndex === datas.length - 1) {
        console.log('datas ===> ', datas);
        downloadCSV(datas);
        chrome.storage.local.set({ buttonState: 'Start', data: [], whichPage: 'listPage' });
    } else {
        const buttonState = await getStorageData("buttonState");
        if(buttonState !== 'start') {
            chrome.storage.local.set({ data: datas, whichPage: 'detailPage' });
            window.location.href = datas[foundIndex + 1].bookLink;
        }
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

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "start") {
        start();
    } else if (message.action === "scraping") {
        scrap();
    } else if (message.action === 'download') {
        console.log('downloading...');
        const datas = await getStorageData("data");
        chrome.storage.local.set({'data': []});
        downloadCSV(datas);
    }
});

const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

chrome.storage.local.get("buttonState", (result) => {
    if (result.buttonState === "running") {
        chrome.storage.local.get("whichPage", (result) => {
            if (result.whichPage === 'listPage') scrapListPage();
            else scrapDetailPage()
        })
    }
})