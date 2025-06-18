/*
 * Connections – Telegram Web App (Vanilla JS)
 * ------------------------------------------------
 * Core application bootstrap. Handles:
 *  – Telegram WebApp SDK initialisation
 *  – Global state store
 *  – Event wiring for QR-scanner, note capture, AI summarisation & export
 *  – Basic UI feedback (loading, toasts)
 */

import { startQrScanner } from './qrScanner.js';
import { openNotesForConnection } from './notes.js';
import { exportConnection } from './export.js';

// Simple in-memory store. In the future this can be replaced by a
// proper state management solution or persisted to localStorage.
export const store = {
  user: null,
  connections: [] // { id, rawNotes, summary }
};

/** Initialise Telegram WebApp SDK & theming */
function initTelegram() {
  // Wait for Telegram to be ready
  Telegram.WebApp.ready();

  // Cache user data
  store.user = Telegram.WebApp.initDataUnsafe?.user ?? null;

  // Adapt page colour scheme to Telegram theme
  document.documentElement.setAttribute(
    'data-theme',
    Telegram.WebApp.colorScheme === 'dark' ? 'dark' : 'light'
  );

  // React to runtime theme changes
  Telegram.WebApp.onEvent('themeChanged', () => {
    document.documentElement.setAttribute(
      'data-theme',
      Telegram.WebApp.colorScheme === 'dark' ? 'dark' : 'light'
    );
  });

  // Configure MainButton
  Telegram.WebApp.MainButton.setParams({ text: 'Scan QR' });
  Telegram.WebApp.MainButton.onClick(handleScanClick);
  Telegram.WebApp.MainButton.show();
}

/** Triggered when user clicks the main "Scan QR" button */
async function handleScanClick() {
  try {
    const connectionId = await startQrScanner();
    if (!connectionId) return; // user cancelled

    const connection = {
      id: connectionId,
      rawNotes: '',
      summary: null,
      createdAt: new Date().toISOString()
    };
    // Push to state & open notes UI
    store.connections.push(connection);
    openNotesForConnection(connection, async updatedConn => {
      // Callback after notes saved & summarised
      // Placeholder: ask user whether to export
      if (confirm('Export to Notion?')) {
        await exportConnection(updatedConn);
      }
    });
  } catch (err) {
    console.error(err);
    Telegram.WebApp.showAlert(`❌ ${err.message || 'Something went wrong'}`);
  }
}

// Kick-off
initTelegram();
// Also bind standalone button (for browser testing outside Telegram)
document.getElementById('scan-btn')?.addEventListener('click', handleScanClick); 