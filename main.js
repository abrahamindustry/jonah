const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const axios = require('axios');

const GOOGLE_API_KEY = "AIzaSyADND9PItYgU1JJwYclnW5E5ZWrZQiomaE";
const GOOGLE_CX = "227fd21b1ac784f3b";

// 🔥 ADD THIS
const NEWS_API_KEY = "707146fc1eed4462a9609898231f68cd";

let mainWindow;
app.disableHardwareAcceleration = false;
// 🔓 Enable media access automatically
app?.commandLine?.appendSwitch("enable-media-stream");
app?.commandLine?.appendSwitch("enable-usermedia-screen-capturing");
app?.commandLine?.appendSwitch("autoplay-policy", "no-user-gesture-required");
app?.commandLine?.appendSwitch("enable-features", "WebRTCPipeWireCapturer");
app.commandLine.appendSwitch("enable-webrtc-pipewire-capturer");
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
app.commandLine.appendSwitch("enable-features", "WebRtcHideLocalIpsWithMdns,WebRtcAllowInputVolumeAdjustment");

// ✅ GOOGLE SEARCH
ipcMain.handle('search-google', async (event, query) => {
    try {
        const response = await axios.get(
            `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${GOOGLE_CX}&key=${GOOGLE_API_KEY}`
        );
        return response.data;
    } catch (error) {
        console.error("Google API Error:", error.message);
        return null;
    }
});


// 🔥 ✅ NEWS API HANDLER (ADD THIS)
let cachedNews = null; // 🔥 GLOBAL CACHE

ipcMain.handle('get-news', async (event, page = 1) => {
    try {
        const config = {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Accept": "application/json"
            }
        };

        let response = await axios.get(
            `https://newsapi.org/v2/top-headlines?country=in&pageSize=12&page=${page}&apiKey=${NEWS_API_KEY}`,
            config
        );

        if (response.data.totalResults === 0) {
            response = await axios.get(
                `https://newsapi.org/v2/everything?q=technology&pageSize=12&page=${page}&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`,
                config
            );
        }

        // ✅ SAVE SUCCESSFUL DATA
        cachedNews = response.data;

        return response.data;

    } catch (error) {
        console.error(
            "News API Error:",
            error.response?.status,
            error.response?.data || error.message
        );

        // 🔥 RETURN CACHE IF AVAILABLE
        if (cachedNews) {
            console.log("Using cached news");
            return cachedNews;
        }

        return null;
    }
});


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false,
        icon: path.join(__dirname, 'assets/Jonah.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
            sandbox: false,
            partition: "persist:main",
            enableBlinkFeatures: "WebRTC,MediaStream",
            experimentalFeatures: true
        }
    });

    const userAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

    const ses = session.fromPartition("persist:main");

    ses.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders["User-Agent"] = userAgent;
        callback({ requestHeaders: details.requestHeaders });
    });

    mainWindow.loadFile('index.html');

    mainWindow.webContents.setAudioMuted(false);

    mainWindow.webContents.openDevTools();
}


app.whenReady().then(async () => {
    const ses = session.fromPartition("persist:main");
    ses.webRequest.onHeadersReceived((details, callback) => {

    const headers = details.responseHeaders;

    // remove headers that block embedded browsers
    delete headers["x-frame-options"];
    delete headers["X-Frame-Options"];
    delete headers["content-security-policy"];
    delete headers["Content-Security-Policy"];

    callback({ responseHeaders: headers });

});
    ses.webRequest.onHeadersReceived((details, callback) => {

        delete details.responseHeaders['x-frame-options'];
        delete details.responseHeaders['X-Frame-Options'];

        if (details.responseHeaders['content-security-policy']) {
            delete details.responseHeaders['content-security-policy'];
        }

        if (details.responseHeaders['Content-Security-Policy']) {
            delete details.responseHeaders['Content-Security-Policy'];
        }

        callback({ responseHeaders: details.responseHeaders });

    });
    ses.setDevicePermissionHandler((details) => {
        return true;
    });
    
    // 🔓 Auto allow permissions (camera, mic, etc.)
    ses.setPermissionRequestHandler((webContents, permission, callback) => {

        const allowedPermissions = [
            "media",
            "microphone",
            "camera",
            "geolocation",
            "notifications",
            "fullscreen",
            "pointerLock",
            "clipboard-read",
            "clipboard-sanitized-write"
        ];

        if (allowedPermissions.includes(permission)) {
            callback(true);
        } else {
            callback(false);
        }

    });

    ses.setPermissionCheckHandler((webContents, permission) => {
        if (permission === "media" || permission === "camera" || permission === "microphone") {
            return true;
        }
        return true;
    });

    await ses.clearCache();
    await ses.clearStorageData();

    createWindow();
});


// ✅ WINDOW CONTROLS
ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
    if (!mainWindow) return;

    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});

ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close();
});