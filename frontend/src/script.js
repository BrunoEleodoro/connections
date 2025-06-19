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
    // --- DOM References ---
    // Telegram Header
    const tgUserHeader = document.getElementById("tg-user-header");
    const tgAvatar = document.getElementById("tg-avatar");
    const tgFullname = document.getElementById("tg-fullname");
    const tgUsername = document.getElementById("tg-username");
    const openConfigBtn = document.getElementById("open-config-btn");

    // Main Sections
    const eventsListEl = document.getElementById("events-list");
    const addEventBtn = document.getElementById("add-event-btn");
    const addEventModal = document.getElementById("add-event-modal");
    const newEventNameInput = document.getElementById("new-event-name");
    const addEventSaveBtn = document.getElementById("add-event-save-btn");
    const cancelAddEventBtn = document.getElementById("cancel-add-event");
    const eventError = document.getElementById("event-error");
    const eventSelectEl = document.getElementById("event-select");

    // QR Section
    const qrSection = document.getElementById("qr-section");
    const qrReady = document.getElementById("qr-ready");
    const qrScanning = document.getElementById("qr-scanning");
    const qrSaveForm = document.getElementById("qr-save-form");
    const startScanBtn = document.getElementById("start-scan-btn");
    const scannedUsername = document.getElementById("scanned-username");
    const notesArea = document.getElementById("notes-area");
    const cancelSaveBtn = document.getElementById("cancel-save-btn");
    const saveConnectionBtn = document.getElementById("save-connection-btn");

    // Toast
    const toast = document.getElementById("toast");

    // Config Modal
    const configModal = document.getElementById("config-modal");
    const blurbTextarea = document.getElementById("blurb-textarea");
    const saveConfigBtn = document.getElementById("save-config-btn");
    const cancelConfigBtn = document.getElementById("cancel-config-btn");

    // --- State ---
    let html5QrCode = null;
    let scannedUserLink = null;
    let eventsData = loadEvents();

    // --- Utility Functions ---
    function showToast(msg, type = "success") {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.remove("hidden");
        toast.classList.toggle("bg-white/90", type === "success");
        toast.classList.toggle("bg-red-500", type === "error");
        setTimeout(() => toast.classList.add("hidden"), 2500);
    }

    function isValidTMeLink(text) {
        return /^(https?:\/\/)?t\.me\/[A-Za-z0-9_]{3,}$/i.test(text.trim());
    }

    function extractUsername(link) {
        const match = link.match(/t\.me\/(\+?[A-Za-z0-9_]+)/i);
        return match ? match[1] : null;
    }

    // --- Telegram Integration ---
    function setupTelegramHeader() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            const isDark = Telegram.WebApp.colorScheme === "dark";
            document.documentElement.classList.toggle("dark", isDark);
            Telegram.WebApp.onEvent("themeChanged", () => {
                document.documentElement.classList.toggle("dark", Telegram.WebApp.colorScheme === "dark");
            });
            const tgUser = Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user;
            if (tgUser && tgUserHeader) {
                tgUserHeader.classList.remove("hidden");
                // Avatar (fallback to initials)
                if (tgUser.photo_url) {
                    tgAvatar.innerHTML = `<img src="${tgUser.photo_url}" class="w-12 h-12 rounded-full" alt="Avatar">`;
                } else {
                    const initials = (tgUser.first_name?.[0] || "") + (tgUser.last_name?.[0] || "");
                    tgAvatar.textContent = initials.toUpperCase() || "U";
                }
                tgFullname.textContent = `${tgUser.first_name || ""}${tgUser.last_name ? " " + tgUser.last_name : ""}`.trim() || tgUser.username || "Telegram User";
                tgUsername.textContent = tgUser.username ? `@${tgUser.username}` : "";
            }
        }
    }
    setupTelegramHeader();

    // --- Events Storage ---
    function loadEvents() {
        try {
            const data = JSON.parse(localStorage.getItem("eventsData") || "[]");
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }
    function saveEvents(events) {
        localStorage.setItem("eventsData", JSON.stringify(events));
    }

    // --- Render Events ---
    function renderEvents() {
        if (!eventsListEl) return;
        eventsListEl.innerHTML = "";
        if (!eventsData.length) {
            const empty = document.createElement("div");
            empty.id = "empty-events";
            empty.className = "text-center text-white/50 py-8";
            empty.textContent = "No events yet. Create your first event to get started!";
            eventsListEl.appendChild(empty);
        } else {
            eventsData.forEach((event, eventIdx) => {
                const card = document.createElement("div");
                card.className = "rounded-xl mb-2 bg-transparent";
                // Event header with robot icon and delete button
                const header = document.createElement("div");
                header.className = "flex items-center gap-2 mb-2 justify-between";
                header.innerHTML = `<span class='font-semibold text-lg'>${event.name}</span>`;
                // 3-dot menu (kebab)
                const menuWrapper = document.createElement('div');
                menuWrapper.className = 'relative';
                const menuBtn = document.createElement('button');
                menuBtn.className = 'ml-2 px-2 py-1 rounded hover:bg-white/10 text-white text-xl';
                menuBtn.innerHTML = '&#8942;'; // vertical ellipsis
                menuWrapper.appendChild(menuBtn);
                // Dropdown menu
                const dropdown = document.createElement('div');
                dropdown.className = 'absolute right-0 mt-2 w-44 bg-white rounded shadow-lg z-50 hidden';
                dropdown.innerHTML = `
                  <button class="block w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-100" data-action="agent">Talk with Agent</button>
                  <button class="block w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-100" data-action="board">Leads Board</button>
                  <button class="block w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-100" data-action="export">Export</button>
                `;
                menuWrapper.appendChild(dropdown);
                header.appendChild(menuWrapper);
                // Menu logic
                menuBtn.onclick = (e) => {
                  e.stopPropagation();
                  // Close any other open menus
                  document.querySelectorAll('.event-menu-dropdown').forEach(el => el.classList.add('hidden'));
                  dropdown.classList.toggle('hidden');
                };
                dropdown.classList.add('event-menu-dropdown');
                // Dropdown actions
                dropdown.onclick = (e) => {
                  e.stopPropagation();
                  const action = e.target.getAttribute('data-action');
                  dropdown.classList.add('hidden');
                  if (action === 'agent') openChatOverlay(event);
                  if (action === 'board') openLeadsBoard(event);
                  if (action === 'export') openExportModal(event);
                };
                // Close menu on outside click
                document.addEventListener('click', () => {
                  dropdown.classList.add('hidden');
                });
                card.appendChild(header);
                if (event.connections.length) {
                    const connList = document.createElement("ul");
                    connList.className = "space-y-2";
                    event.connections.forEach((conn, connIdx) => {
                        // Ensure status field exists
                        if (!conn.status) conn.status = 'New';
                        const li = document.createElement("li");
                        li.className = "flex items-center gap-3 bg-white/5 rounded p-2 cursor-pointer hover:bg-white/10 transition";
                        // Avatar
                        const username = extractUsername(conn.userLink) || conn.userLink;
                        const avatar = document.createElement('div');
                        avatar.className = 'w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base';
                        avatar.style.background = stringToColor(username);
                        avatar.textContent = getInitials(username);
                        // User info
                        const info = document.createElement('div');
                        info.className = 'flex flex-col min-w-0';
                        const nameEl = document.createElement('span');
                        nameEl.className = 'font-semibold text-white truncate max-w-[120px]';
                        nameEl.textContent = `@${username}`;
                        const dateEl = document.createElement('span');
                        dateEl.className = 'text-xs text-white/50';
                        dateEl.textContent = new Date(conn.timestamp).toLocaleDateString();
                        const descEl = document.createElement('span');
                        descEl.className = 'text-white/70 text-xs truncate max-w-[160px]';
                        descEl.textContent = conn.notes ? conn.notes.substring(0, 40) + (conn.notes.length > 40 ? '…' : '') : '';
                        info.appendChild(nameEl);
                        info.appendChild(dateEl);
                        info.appendChild(descEl);
                        // Remove user button
                        const removeUserBtn = document.createElement('button');
                        removeUserBtn.className = 'ml-auto px-2 py-1 rounded bg-red-500/80 text-white text-xs hover:bg-red-600';
                        removeUserBtn.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' class='w-4 h-4 inline' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 18L18 6M6 6l12 12' /></svg>`;
                        removeUserBtn.onclick = (e) => {
                            e.stopPropagation();
                            if (confirm(`Remove @${username} from event '${event.name}'?`)) {
                                event.connections.splice(connIdx, 1);
                                saveEvents(eventsData);
                                renderEvents();
                                showToast('User removed from event!');
                            }
                        };
                        // Make row clickable to Telegram URL
                        li.onclick = () => {
                            const url = `https://t.me/${username}`;
                            window.open(url, '_blank');
                        };
                        li.appendChild(avatar);
                        li.appendChild(info);
                        li.appendChild(removeUserBtn);
                        connList.appendChild(li);
                    });
                    card.appendChild(connList);
                } else {
                    const empty = document.createElement("div");
                    empty.className = "text-white/50 text-sm mt-2";
                    empty.textContent = "No connections yet.";
                    card.appendChild(empty);
                }
                eventsListEl.appendChild(card);
            });
        }
        populateEventSelect();
    }
    function populateEventSelect() {
        if (!eventSelectEl) return;
        eventSelectEl.innerHTML = "";
        if (!eventsData.length) {
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
    renderEvents();

    // --- Add Event Modal ---
    function showAddEventModal() {
        if (addEventModal) addEventModal.style.display = "flex";
        if (newEventNameInput) newEventNameInput.value = "";
        if (eventError) eventError.classList.add("hidden");
    }
    function hideAddEventModal() {
        if (addEventModal) addEventModal.style.display = "none";
    }
    if (addEventBtn) addEventBtn.onclick = showAddEventModal;
    if (cancelAddEventBtn) cancelAddEventBtn.onclick = hideAddEventModal;
    if (addEventSaveBtn) {
        addEventSaveBtn.onclick = () => {
            const name = newEventNameInput.value.trim();
            if (!name) {
                if (eventError) eventError.classList.remove("hidden");
                return;
            }
            const newEvent = { id: Date.now().toString(), name, connections: [] };
            eventsData.push(newEvent);
            saveEvents(eventsData);
            renderEvents();
            hideAddEventModal();
            showToast("Event added!");
        };
    }

    // --- Config Modal ---
    function showConfigModal() {
        if (configModal) configModal.style.display = "flex";
        if (blurbTextarea) blurbTextarea.value = getBlurb();
    }
    function hideConfigModal() {
        if (configModal) configModal.style.display = "none";
    }
    if (openConfigBtn) openConfigBtn.onclick = showConfigModal;
    if (cancelConfigBtn) cancelConfigBtn.onclick = hideConfigModal;
    if (saveConfigBtn) {
        saveConfigBtn.onclick = () => {
            localStorage.setItem("blurbMessage", blurbTextarea.value.trim());
            showToast("Blurb saved!");
            hideConfigModal();
        };
    }
    function getBlurb() {
        return localStorage.getItem("blurbMessage") || "";
    }

    // --- QR Code Scanning ---
    function showQRState(state) {
        // state: 'ready', 'scanning', 'save'
        if (qrReady) qrReady.classList.toggle("hidden", state !== "ready");
        if (qrScanning) qrScanning.classList.toggle("hidden", state !== "scanning");
        if (qrSaveForm) qrSaveForm.classList.toggle("hidden", state !== "save");
    }
    function resetQR() {
        showQRState("ready");
        scannedUserLink = null;
        if (scannedUsername) scannedUsername.textContent = "username";
        if (notesArea) notesArea.value = "";
        if (html5QrCode) {
            html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
            html5QrCode = null;
        }
    }

    // --- UI Hide/Show Helpers ---
    const mainUISections = [
        tgUserHeader,
        document.querySelector('.text-center.space-y-2'),
        document.querySelector('.glass.rounded-2xl.p-6.w-full.max-w-2xl.shadow-lg'), // events card
        qrSection
    ];
    function hideMainUIExceptCamera() {
        mainUISections.forEach(el => { if (el) el.style.display = 'none'; });
        if (qrSection) qrSection.style.display = 'block';
        if (qrReady) qrReady.classList.add('hidden');
        if (qrScanning) qrScanning.classList.remove('hidden');
        if (qrSaveForm) qrSaveForm.classList.add('hidden');
    }
    function showMainUI() {
        mainUISections.forEach(el => { if (el) el.style.display = ''; });
        showQRState('ready');
    }

    // --- Telegram MainButton Integration ---
    function setupTelegramScanButton() {
        if (window.Telegram && Telegram.WebApp) {
            // Hide the UI scan button
            if (startScanBtn) startScanBtn.style.display = 'none';
            Telegram.WebApp.MainButton.setParams({ text: 'Scan QR Code', color: '#6D28D9', text_color: '#fff', is_active: true, is_visible: true });
            Telegram.WebApp.MainButton.show();
            Telegram.WebApp.MainButton.onClick(() => {
                startScanningFlow();
            });
        }
    }
    setupTelegramScanButton();

    // --- Notes Modal ---
    const notesModal = document.getElementById('notes-modal');
    const modalUsername = document.getElementById('modal-username');
    const modalNotes = document.getElementById('modal-notes');
    const notesCancelBtn = document.getElementById('notes-cancel-btn');
    const notesSaveBtn = document.getElementById('notes-save-btn');
    const modalEventSelect = document.getElementById('modal-event-select');
    let lastScannedUserLink = null;
    function populateModalEventSelect() {
        if (!modalEventSelect) return;
        modalEventSelect.innerHTML = '';
        if (!eventsData.length) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'Add an event first';
            modalEventSelect.appendChild(opt);
            modalEventSelect.disabled = true;
            return;
        }
        modalEventSelect.disabled = false;
        eventsData.forEach(event => {
            const opt = document.createElement('option');
            opt.value = event.id;
            opt.textContent = event.name;
            modalEventSelect.appendChild(opt);
        });
    }
    function showNotesModal(username) {
        if (notesModal) notesModal.style.display = 'flex';
        if (modalUsername) modalUsername.textContent = username ? `@${username}` : '';
        if (modalNotes) modalNotes.value = '';
        populateModalEventSelect();
    }
    function hideNotesModal() {
        if (notesModal) notesModal.style.display = 'none';
    }
    if (notesCancelBtn) notesCancelBtn.onclick = () => {
        hideNotesModal();
        showMainUI();
    };
    if (notesSaveBtn) notesSaveBtn.onclick = () => {
        if (!lastScannedUserLink) {
            hideNotesModal();
            showMainUI();
            return;
        }
        const notes = modalNotes.value.trim();
        let eventId = modalEventSelect && modalEventSelect.value;
        if (!eventId && eventsData.length > 0) eventId = eventsData[0].id;
        if (!eventId) {
            showToast('Please create an event first.', 'error');
            hideNotesModal();
            showMainUI();
            return;
        }
        const event = eventsData.find(ev => ev.id === eventId);
        if (!event) {
            showToast('Event not found.', 'error');
            hideNotesModal();
            showMainUI();
            return;
        }
        event.connections.push({ userLink: lastScannedUserLink, notes, timestamp: Date.now() });
        saveEvents(eventsData);
        renderEvents();
        showToast('Connection saved!');
        hideNotesModal();
        showMainUI();
    };

    // --- Helper: Random Avatar (GitHub style) ---
    function stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const c = (hash & 0x00FFFFFF)
            .toString(16)
            .toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    }
    function getInitials(str) {
        if (!str) return '?';
        const parts = str.replace('@', '').split(/[^a-zA-Z0-9]/).filter(Boolean);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
    }

    // --- Scanning Flow ---
    function startScanningFlow() {
        hideMainUIExceptCamera();
        if (html5QrCode) {
            html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
        }
        setTimeout(() => {
            // Remove any existing scanner divs
            const oldScanner = document.getElementById('my-qr-reader');
            if (oldScanner) oldScanner.remove();
            // Create and insert scanner at the top
            const qrDiv = document.createElement('div');
            qrDiv.id = 'my-qr-reader';
            if (qrScanning.firstChild) {
                qrScanning.insertBefore(qrDiv, qrScanning.firstChild);
            } else {
                qrScanning.appendChild(qrDiv);
            }
            // Scroll scanner into view
            qrSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            html5QrCode = new Html5Qrcode('my-qr-reader');
            html5QrCode.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: 250 },
                (decodeText) => {
                    if (!isValidTMeLink(decodeText)) {
                        showToast('Invalid QR Code. Expected a Telegram link.', 'error');
                        return;
                    }
                    lastScannedUserLink = decodeText.trim();
                    const username = extractUsername(lastScannedUserLink);
                    showNotesModal(username);
                    html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
                    html5QrCode = null;
                },
                (err) => {}
            ).catch(() => {
                showToast('Camera error. Try again.', 'error');
                showMainUI();
            });
        }, 400);
    }

    // --- UI Button (non-Telegram) ---
    if (startScanBtn) {
        startScanBtn.onclick = startScanningFlow;
    }

    if (cancelSaveBtn) cancelSaveBtn.onclick = resetQR;
    if (saveConnectionBtn) {
        saveConnectionBtn.onclick = () => {
            if (!scannedUserLink || !isValidTMeLink(scannedUserLink)) {
                showToast("No valid user scanned.", "error");
                return;
            }
            const notes = notesArea.value.trim();
            const eventId = eventSelectEl.value;
            if (!eventId) {
                showToast("Please select an event.", "error");
                return;
            }
            const event = eventsData.find(ev => ev.id === eventId);
            if (!event) {
                showToast("Event not found.", "error");
                return;
            }
            event.connections.push({ userLink: scannedUserLink, notes, timestamp: Date.now() });
            saveEvents(eventsData);
            renderEvents();
            resetQR();
            showToast("Connection saved!");
        };
    }
    // Reset QR state on load
    resetQR();

    // --- Blurb Sending ---
    function sendBlurb(userLink) {
        const blurb = getBlurb();
        if (!blurb) {
            showToast("Please configure your blurb first in settings.", "error");
            return;
        }
        if (!isValidTMeLink(userLink)) {
            showToast("Invalid user link.", "error");
            return;
        }
        const target = extractUsername(userLink);
        if (!target) {
            showToast("Invalid user link.", "error");
            return;
        }
        let url;
        if (window.Telegram && Telegram.WebApp) {
            url = `tg://resolve?domain=${target}&text=${encodeURIComponent(blurb)}`;
            Telegram.WebApp.openTelegramLink(url);
        } else {
            url = `https://t.me/${target}?text=${encodeURIComponent(blurb)}`;
            window.open(url, "_blank");
        }
    }

    // --- Export Modal ---
    const exportModal = document.getElementById('export-modal');
    const exportCloseBtn = document.getElementById('export-close-btn');
    const exportTitle = document.getElementById('export-title');
    const exportDate = document.getElementById('export-date');
    const copyTextBtn = document.getElementById('copy-text-btn');
    const copyCsvBtn = document.getElementById('copy-csv-btn');
    const exportPreview = document.getElementById('export-preview');
    let exportModalEvent = null;
    let exportText = '';
    let exportCSV = '';

    function openExportModal(event) {
        exportModalEvent = event;
        if (!exportModal || !exportTitle || !exportDate || !exportPreview) return;
        exportTitle.textContent = `Export Contacts - ${event.name}`;
        // Default to today
        const today = new Date();
        exportDate.value = today.toISOString().slice(0, 10);
        updateExportPreview();
        exportModal.style.display = 'flex';
    }
    if (exportCloseBtn) exportCloseBtn.onclick = () => {
        if (exportModal) exportModal.style.display = 'none';
    };
    if (exportDate) exportDate.onchange = updateExportPreview;
    if (copyTextBtn) copyTextBtn.onclick = () => {
        if (exportText) {
            navigator.clipboard.writeText(exportText);
            showToast('Copied as text!');
        }
    };
    if (copyCsvBtn) copyCsvBtn.onclick = () => {
        if (exportCSV) {
            navigator.clipboard.writeText(exportCSV);
            showToast('Copied as CSV!');
        }
    };
    function updateExportPreview() {
        if (!exportModalEvent || !exportDate || !exportPreview) return;
        const dateStr = exportDate.value;
        const filtered = exportModalEvent.connections.filter(conn => {
            const d = new Date(conn.timestamp);
            return d.toISOString().slice(0, 10) === dateStr;
        });
        exportText = filtered.map(conn => `@${extractUsername(conn.userLink) || conn.userLink} - ${conn.notes || ''}`).join('\n');
        exportCSV = 'Username,Notes,Date,Status\n' + filtered.map(conn => {
            const username = extractUsername(conn.userLink) || conn.userLink;
            const notes = (conn.notes || '').replace(/"/g, '""');
            const date = new Date(conn.timestamp).toLocaleDateString();
            const status = conn.status || 'New';
            return `"@${username}","${notes}","${date}","${status}"`;
        }).join('\n');
        exportPreview.textContent = exportText || 'No contacts for this date.';
    }

    // --- Leads Board Modal ---
    const kanbanModal = document.getElementById('kanban-modal');
    const kanbanCloseBtn = document.getElementById('kanban-close-btn');
    const kanbanTitle = document.getElementById('kanban-title');
    const kanbanBoard = document.getElementById('kanban-board');
    const KANBAN_STATUSES = ['New', 'Contacted', 'Interested', 'Converted'];

    function openLeadsBoard(event) {
        if (!kanbanModal || !kanbanBoard || !kanbanTitle) return;
        kanbanTitle.textContent = `Leads Board - ${event.name}`;
        renderKanbanBoard(event);
        kanbanModal.style.display = 'flex';
    }
    if (kanbanCloseBtn) kanbanCloseBtn.onclick = () => {
        if (kanbanModal) kanbanModal.style.display = 'none';
    };

    function renderKanbanBoard(event) {
        kanbanBoard.innerHTML = '';
        // For each status, create a column
        KANBAN_STATUSES.forEach(status => {
            const col = document.createElement('div');
            col.className = 'flex-1 min-w-[260px] bg-white/10 rounded-lg p-3 flex flex-col gap-3';
            col.dataset.status = status;
            // Column header
            const header = document.createElement('div');
            header.className = 'font-bold text-white mb-2';
            header.textContent = status;
            col.appendChild(header);
            // Cards
            const cards = event.connections.filter(c => c.status === status);
            cards.forEach((conn, idx) => {
                const card = document.createElement('div');
                card.className = 'bg-white/80 text-gray-900 rounded p-3 shadow cursor-pointer relative';
                card.innerHTML = `
                  <div class="font-semibold text-base truncate">@${extractUsername(conn.userLink) || conn.userLink}</div>
                  <div class="text-xs text-gray-600 mb-1">${new Date(conn.timestamp).toLocaleDateString()}</div>
                  <div class="text-sm text-gray-800 truncate">${conn.notes ? conn.notes.substring(0, 60) : ''}</div>
                `;
                // Click-to-move popover
                card.onclick = (e) => {
                    e.stopPropagation();
                    // Remove any other open popovers
                    document.querySelectorAll('.kanban-move-popover').forEach(el => el.remove());
                    // Build popover
                    const popover = document.createElement('div');
                    popover.className = 'kanban-move-popover absolute top-10 right-4 bg-white rounded shadow-lg z-50 p-2';
                    popover.style.minWidth = '160px';
                    popover.innerHTML = `<div class='text-xs text-gray-700 mb-2'>Move to:</div>`;
                    KANBAN_STATUSES.filter(s => s !== status).forEach(targetStatus => {
                        const btn = document.createElement('button');
                        btn.className = 'block w-full text-left px-3 py-2 text-gray-800 hover:bg-blue-100 rounded';
                        btn.textContent = targetStatus;
                        btn.onclick = (ev) => {
                            ev.stopPropagation();
                            conn.status = targetStatus;
                            saveEvents(eventsData);
                            renderKanbanBoard(event);
                        };
                        popover.appendChild(btn);
                    });
                    // Close popover on outside click
                    setTimeout(() => {
                        document.addEventListener('click', closePopover, { once: true });
                    }, 0);
                    function closePopover() {
                        popover.remove();
                    }
                    card.appendChild(popover);
                };
                col.appendChild(card);
            });
            kanbanBoard.appendChild(col);
        });
    }

    // --- Show user's own QR code in the UI ---
    function showOwnQRCode() {
        const qrDiv = document.getElementById('my-qr-code');
        if (!qrDiv) return;
        if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user && Telegram.WebApp.initDataUnsafe.user.username) {
            const username = Telegram.WebApp.initDataUnsafe.user.username;
            const url = `https://t.me/${username}`;
            // Use QRCode.js if available
            if (window.QRCode) {
                qrDiv.innerHTML = '';
                new QRCode(qrDiv, {
                    text: url,
                    width: 128,
                    height: 128,
                    colorDark: '#000000',
                    colorLight: '#ffffff',
                    correctLevel: QRCode.CorrectLevel.H
                });
            } else {
                // Fallback: simple SVG
                qrDiv.innerHTML = `<a href='${url}' target='_blank' class='block'><svg width='128' height='128'><rect width='128' height='128' fill='#eee'/><text x='50%' y='50%' text-anchor='middle' fill='#333' dy='.3em'>QR</text></svg></a>`;
            }
        } else {
            qrDiv.innerHTML = '<div class="text-white/50">Login with Telegram to get your QR code.</div>';
        }
    }
    // Load QRCode.js if not present
    if (!window.QRCode) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
        script.onload = showOwnQRCode;
        document.body.appendChild(script);
    } else {
        showOwnQRCode();
    }

    // --- Chat with AI Modal ---
    const chatOverlay = document.getElementById('chat-overlay');
    const chatBackBtn = document.getElementById('chat-back-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    let currentChatEventId = null;

    function openChatOverlay(event) {
        currentChatEventId = event.id;
        // Hide main UI
        document.body.querySelectorAll('.container, #qr-section').forEach(el => el.style.display = 'none');
        if (chatOverlay) chatOverlay.classList.remove('hidden');
        // Load chat history for this event
        loadChatHistory(event.id);
        // Initial greeting if no history
        if (!getChatHistory(event.id).length) {
            addChatMessage('ai', 'Hi! I am your event assistant. Ask me anything about your contacts for this event.');
        }
    }
    function closeChatOverlay() {
        if (chatOverlay) chatOverlay.classList.add('hidden');
        document.body.querySelectorAll('.container, #qr-section').forEach(el => el.style.display = '');
        currentChatEventId = null;
    }
    if (chatBackBtn) chatBackBtn.onclick = closeChatOverlay;

    function getChatHistory(eventId) {
        try {
            return JSON.parse(localStorage.getItem('chatHistory_' + eventId) || '[]');
        } catch { return []; }
    }
    function saveChatHistory(eventId, history) {
        localStorage.setItem('chatHistory_' + eventId, JSON.stringify(history));
    }
    function loadChatHistory(eventId) {
        if (!chatMessages) return;
        chatMessages.innerHTML = '';
        const history = getChatHistory(eventId);
        history.forEach(msg => addChatMessage(msg.sender, msg.text));
    }
    function addChatMessage(sender, text) {
        if (!chatMessages) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = sender === 'user'
            ? 'self-end bg-blue-600 text-white rounded-lg px-4 py-2 max-w-[80%] text-right'
            : 'self-start bg-white/20 text-white rounded-lg px-4 py-2 max-w-[80%]';
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        // Save to history
        if (currentChatEventId) {
            const history = getChatHistory(currentChatEventId);
            history.push({ sender, text });
            saveChatHistory(currentChatEventId, history);
        }
    }
    function setChatLoading(loading) {
        if (!chatMessages) return;
        let loadingDiv = chatMessages.querySelector('.chat-loading');
        if (loading) {
            if (!loadingDiv) {
                loadingDiv = document.createElement('div');
                loadingDiv.className = 'chat-loading self-start text-white/70 px-2 py-1';
                loadingDiv.textContent = 'AI is typing...';
                chatMessages.appendChild(loadingDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } else if (loadingDiv) {
            loadingDiv.remove();
        }
    }
    if (chatForm) {
        chatForm.onsubmit = async (e) => {
            e.preventDefault();
            const userMsg = chatInput.value.trim();
            if (!userMsg || !currentChatEventId) return;
            addChatMessage('user', userMsg);
            chatInput.value = '';
            setChatLoading(true);
            // Get contacts for this event
            const event = eventsData.find(ev => ev.id === currentChatEventId);
            const chatContacts = (event && event.connections) ? event.connections : [];
            try {
                const res = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: userMsg, contacts: chatContacts })
                });
                const data = await res.json();
                setChatLoading(false);
                if (data.aiMessage) {
                    addChatMessage('ai', data.aiMessage);
                } else {
                    addChatMessage('ai', 'Sorry, I could not get a response.');
                }
            } catch (err) {
                setChatLoading(false);
                addChatMessage('ai', 'Error connecting to AI.');
            }
        };
    }
});