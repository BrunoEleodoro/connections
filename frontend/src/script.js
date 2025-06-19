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

        // Save connection to selected event
        const selectedEventId = eventSelectEl.value;
        if (!selectedEventId) {
            alert("Please create an event first and select it.");
            return;
        }

        const selectedEvent = eventsData.find(ev => ev.id === selectedEventId);
        if (!selectedEvent) {
            alert("Selected event not found.");
            return;
        }

        selectedEvent.connections.push({ userLink: scannedText, notes, timestamp: Date.now() });
        saveEvents(eventsData);
        renderEvents();

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

    /* ------------------------------------------------------------------
       Events & Connections storage helpers
    ------------------------------------------------------------------ */
    const STORAGE_KEY_EVENTS = "eventsData";

    function loadEvents() {
        try {
            const data = JSON.parse(localStorage.getItem(STORAGE_KEY_EVENTS) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error("Failed to parse events from storage", e);
            return [];
        }
    }

    function saveEvents(events) {
        localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));
    }

    let eventsData = loadEvents();

    /* ------------------------------------------------------------------
       DOM references for Events UI
    ------------------------------------------------------------------ */
    const eventsListEl = document.getElementById("events-list");
    const addEventBtn = document.getElementById("add-event-btn");
    const addEventModal = document.getElementById("add-event-modal");
    const newEventNameInput = document.getElementById("new-event-name");
    const addEventSaveBtn = document.getElementById("add-event-save-btn");
    const cancelAddEventBtn = document.getElementById("cancel-add-event");
    const eventSelectEl = document.getElementById("event-select");

    /* ------------------------------------------------------------------
       Rendering helpers
    ------------------------------------------------------------------ */
    function renderEvents() {
        // Update list on homepage
        if (!eventsListEl) return;
        eventsListEl.innerHTML = "";

        eventsData.forEach(event => {
            const li = document.createElement("li");
            li.className = "border border-gray-300 dark:border-gray-700 rounded-lg p-4";

            const title = document.createElement("h3");
            title.className = "font-semibold text-lg";
            title.textContent = event.name;
            li.appendChild(title);

            if (event.connections.length > 0) {
                const connList = document.createElement("ul");
                connList.className = "list-disc ml-5 mt-2 space-y-1";

                event.connections.forEach(conn => {
                    const connItem = document.createElement("li");
                    const link = document.createElement("a");
                    link.href = conn.userLink;
                    link.textContent = conn.userLink;
                    link.className = "text-blue-600 dark:text-blue-400 underline mr-2";
                    link.target = "_blank";

                    connItem.appendChild(link);
                    const noteSpan = document.createElement("span");
                    noteSpan.textContent = `- ${conn.notes.substring(0, 60)}${conn.notes.length > 60 ? "…" : ""}`;
                    connItem.appendChild(noteSpan);
                    connList.appendChild(connItem);
                });
                li.appendChild(connList);
            } else {
                const empty = document.createElement("p");
                empty.className = "text-sm text-gray-500 mt-1";
                empty.textContent = "No connections yet.";
                li.appendChild(empty);
            }

            eventsListEl.appendChild(li);
        });

        // Populate dropdown
        populateEventSelect();
    }

    function populateEventSelect() {
        if (!eventSelectEl) return;
        eventSelectEl.innerHTML = "";

        if (eventsData.length === 0) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "Add an event first";
            eventSelectEl.appendChild(opt);
            eventSelectEl.disabled = true;
            return;
        }

        eventSelectEl.disabled = false;
        eventsData.forEach(event => {
            const opt = document.createElement("option");
            opt.value = event.id;
            opt.textContent = event.name;
            eventSelectEl.appendChild(opt);
        });
    }

    // Initial render
    renderEvents();

    /* ------------------------------------------------------------------
       Add Event Modal Logic
    ------------------------------------------------------------------ */
    function showAddEventModal() {
        if (addEventModal) addEventModal.style.display = "flex";
        if (newEventNameInput) newEventNameInput.value = "";
    }

    function hideAddEventModal() {
        if (addEventModal) addEventModal.style.display = "none";
    }

    if (addEventBtn) addEventBtn.addEventListener("click", showAddEventModal);
    if (cancelAddEventBtn) cancelAddEventBtn.addEventListener("click", hideAddEventModal);

    if (addEventSaveBtn) {
        addEventSaveBtn.addEventListener("click", () => {
            const name = newEventNameInput.value.trim();
            if (!name) {
                alert("Please enter an event name");
                return;
            }
            const newEvent = { id: Date.now().toString(), name, connections: [] };
            eventsData.push(newEvent);
            saveEvents(eventsData);
            renderEvents();
            hideAddEventModal();
        });
    }
});