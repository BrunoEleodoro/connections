function domReady(fn) {
    if (
        document.readyState === "complete" ||
        document.readyState === "interactive"
    ) {
        setTimeout(fn, 1000);
    } else {
        document.addEventListener("DOMContentLoaded", fn);
    }
}

domReady(function () {

    // Reference UI elements
    const connectBtn = document.getElementById("connect-btn");
    const scannerSection = document.getElementById("scanner-section");
    const resultSection = document.getElementById("result-section");
    const scannedValueEl = document.getElementById("scanned-value");
    const notesArea = document.getElementById("notes-area");
    const saveBtn = document.getElementById("save-btn");
    const userInfoEl = document.getElementById("user-info");
    const appBar = document.getElementById("app-bar");
    const userPhotoEl = document.getElementById("user-photo");
    const userNameEl = document.getElementById("user-name");
    const userUsernameEl = document.getElementById("user-username");

    let html5QrCode = null;

    // Handler for successful scan
    function onScanSuccess(decodeText, decodeResult) {
        // Stop the scanner and switch to result view
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                html5QrCode.clear();
            }).catch(console.error);
        }

        scannerSection.style.display = "none";
        scannedValueEl.textContent = "Scanned: " + decodeText;
        resultSection.style.display = "block";
    }

    // Start the QR scanner
    function startScanner() {
        // Avoid initializing multiple times
        if (window.__scannerStarted) return;
        window.__scannerStarted = true;

        html5QrCode = new Html5Qrcode("my-qr-reader");
        const config = { fps: 10, qrbox: 250, rememberLastUsedCamera: true };
        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
            .catch(err => {
                console.error("QR start error", err);
            });
    }

    // Show scanner when the user clicks "Connect"
    connectBtn.addEventListener("click", () => {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.MainButton.hide();
        }

        connectBtn.style.display = "none";
        scannerSection.style.display = "block";
        startScanner();
    });

    // Save button handler
    saveBtn.addEventListener("click", () => {
        const notes = notesArea.value.trim();
        const scannedText = scannedValueEl.textContent.replace("Scanned: ", "");

        // Persist to localStorage (simple demo)
        const stored = JSON.parse(localStorage.getItem("connections") || "[]");
        stored.push({ scannedText, notes, timestamp: Date.now() });
        localStorage.setItem("connections", JSON.stringify(stored));

        // Reset UI to homepage state
        resultSection.style.display = "none";
        if (!(window.Telegram && Telegram.WebApp)) {
            connectBtn.style.display = "block";
        }

        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.MainButton.show();
        }

        notesArea.value = "";
        window.__scannerStarted = false;
        html5QrCode = null;
    });

    /* ------------------------------------------------------------------
       Telegram Web App integration
       ------------------------------------------------------------------ */
    if (window.Telegram && Telegram.WebApp) {
        // Inform Telegram that the Web App is ready.
        Telegram.WebApp.ready();

        // Apply the current Telegram color scheme to our CSS variables.
        function applyTelegramTheme() {
            const isDark = Telegram.WebApp.colorScheme === "dark";
            document.documentElement.classList.toggle("dark", isDark);
        }

        applyTelegramTheme();
        Telegram.WebApp.onEvent("themeChanged", applyTelegramTheme);

        // Configure the main Telegram button to mimic the "Connect" button.
        Telegram.WebApp.MainButton.setParams({ text: "Connect" });
        Telegram.WebApp.MainButton.onClick(() => connectBtn.click());
        Telegram.WebApp.MainButton.show();

        // Hide the native connect button when running inside Telegram.
        connectBtn.style.display = "none";

        // Display connected user information on the homepage.
        const tgUser = Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user;
        if (tgUser) {
            // Show app bar
            if (appBar) appBar.style.display = "flex";

            // Populate name and username
            const fullName = `${tgUser.first_name || ""}${tgUser.last_name ? " " + tgUser.last_name : ""}`.trim();
            if (userNameEl) userNameEl.textContent = fullName || tgUser.username || "Telegram User";
            if (userUsernameEl) userUsernameEl.textContent = tgUser.username ? `@${tgUser.username}` : "";

            // Populate photo if available
            if (tgUser.photo_url && userPhotoEl) {
                userPhotoEl.src = tgUser.photo_url;
                userPhotoEl.classList.remove("hidden");
            }

            // Hide old paragraph if present
            if (userInfoEl) userInfoEl.style.display = "none";
        }
    }
});