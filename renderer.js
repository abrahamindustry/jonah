// ===================================
// STABLE SINGLE-WEBVIEW MULTI TAB
// ===================================

let tabData = [];
let activeTabIndex = 0;
let historyList = JSON.parse(localStorage.getItem("jonah_history") || "[]");
document.addEventListener("DOMContentLoaded", function () {

    const webview = {}; // placeholder so your structure stays same
    const browser = document.getElementById("browser"); // real webview
    browser.addEventListener("did-stop-loading", () => {

        const currentURL = browser.getURL();
        const title = browser.getTitle();
    
        // Skip local pages
        if (!currentURL.startsWith("file://")) {
    
            historyList.unshift({
                url: currentURL,
                title: title,
                time: Date.now()
            });
    
            historyList = historyList.slice(0, 1000);
    
            localStorage.setItem("jonah_history", JSON.stringify(historyList));
        }
    
        // Update URL bar automatically
        document.getElementById("urlBar").value = currentURL;
    
        if (typeof injectTrustPanel === "function") {
            injectTrustPanel();
        }
    
    });
    const firstTab = document.querySelector(".tab");
    const tabBar = document.querySelector(".tab-bar");
    const newTabBtn = document.querySelector(".new-tab");
    const urlBar = document.getElementById("urlBar");

    // Initial tab
    tabData.push({
        title: "New Tab",
        url: "home.html"
    });

    // ENTER KEY
    urlBar.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
            loadURL();
        }
    });

    // NEW TAB BUTTON
    newTabBtn.addEventListener("click", function () {
        createNewTab("home.html");
    });

    // TAB CLICK + CLOSE
    tabBar.addEventListener("click", function (e) {

        // CLOSE
        if (e.target.classList.contains("close-tab")) {
            e.stopPropagation();
            closeTab(e.target.parentElement);
            return;
        }

        // SWITCH
        const tabElement = e.target.closest(".tab");
        if (!tabElement) return;

        const tabsUI = document.querySelectorAll(".tab");
        const index = Array.from(tabsUI).indexOf(tabElement);

        if (index !== -1) {
            switchTab(index);
        }
    });

});


// ===============================
// LOAD URL
// ===============================

function loadURL() {

    const input = document.getElementById("urlBar").value.trim();
    const browser = document.getElementById("browser");

    if (!input) return;

    let finalURL = "";

    if (input.startsWith("http://") || input.startsWith("https://")) {
        finalURL = input;
    } 
    else if (input.includes(".")) {
        finalURL = "https://" + input;
    } 
    else {
        finalURL = `file:///` + location.pathname.replace(/[^/]*$/, '') + `search.html?q=${encodeURIComponent(input)}`;
    }

    // LOAD PAGE
    browser.loadURL(finalURL);

    // Keep compatibility with your API
    if (window.api?.loadURL) window.api.loadURL(finalURL);

    tabData[activeTabIndex].url = finalURL;
}


// ===============================
// CREATE TAB
// ===============================

function createNewTab(url) {

    const browser = document.getElementById("browser");
    const tabBar = document.querySelector(".tab-bar");

    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));

    const newTab = document.createElement("div");
    newTab.className = "tab active";

    newTab.innerHTML = `
        <img src="assets/logo2.jpeg" class="tab-logo">
        <span>New Tab</span>
        <span class="close-tab">✕</span>
    `;

    tabBar.insertBefore(newTab, document.querySelector(".new-tab"));

    tabData.push({
        title: "New Tab",
        url: url
    });

    activeTabIndex = tabData.length - 1;

    if (!url.startsWith("http")) {
        const fullPath = `file://${location.pathname.replace(/[^/]*$/, '')}${url}`;
        browser.loadURL(fullPath);
    } else {
        browser.loadURL(url);
    }

    if (window.api?.loadURL) window.api.loadURL(url);
}


// ===============================
// SWITCH TAB
// ===============================

function switchTab(index) {

    const browser = document.getElementById("browser");

    document.querySelectorAll(".tab").forEach((t, i) => {
        t.classList.toggle("active", i === index);
    });

    activeTabIndex = index;

    const url = tabData[index].url;

    browser.loadURL(url);

    if (window.api?.loadURL) window.api.loadURL(url);
}


// ===============================
// CLOSE TAB
// ===============================

function closeTab(tabElement) {

    const tabsUI = document.querySelectorAll(".tab");
    const index = Array.from(tabsUI).indexOf(tabElement);

    if (tabData.length === 1) return;

    tabData.splice(index, 1);
    tabElement.remove();

    activeTabIndex = 0;

    switchTab(0);
}


// ===============================
// NAVIGATION
// ===============================

function goBack() {

    const browser = document.getElementById("browser");

    if (browser.canGoBack()) browser.goBack();

    if (window.api?.goBack) window.api.goBack();
}

function goForward() {

    const browser = document.getElementById("browser");

    if (browser.canGoForward()) browser.goForward();

    if (window.api?.goForward) window.api.goForward();
}

function refreshPage() {

    const browser = document.getElementById("browser");

    browser.reload();

    if (window.api?.reload) window.api.reload();
}


// ===============================
// AI PANEL
// ===============================

function toggleAI() {
    document.getElementById("aiPanel").classList.toggle("ai-hidden");
}
