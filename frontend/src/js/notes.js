/*
 * Notes UI Module
 * Displays a modal with textarea for raw notes, calls /summarize API, and allows user to review summary.
 */

import { store } from './app.js';

/**
 * Opens a modal for given connection object.
 * @param {object} connection – state object to populate
 * @param {(connection) => void} onComplete – callback when user finalises
 */
export function openNotesForConnection(connection, onComplete) {
  // Build modal skeleton
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:9999;`;

  const modal = document.createElement('div');
  modal.style.cssText = `background:#fff;width:90%;max-width:500px;padding:1rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);display:flex;flex-direction:column;gap:1rem;`;
  overlay.appendChild(modal);

  modal.innerHTML = `
    <h3>Notes for Connection</h3>
    <textarea rows="6" style="resize:vertical;padding:.5rem;font-size:14px"></textarea>
    <button style="padding:.5rem 1rem;align-self:flex-end;background:var(--primary,#1D4ED8);color:#fff;border:none;border-radius:4px">Save</button>
  `;

  const textarea = modal.querySelector('textarea');
  const saveBtn = modal.querySelector('button');

  saveBtn.addEventListener('click', async () => {
    const raw = textarea.value.trim();
    if (!raw) return alert('Please enter some notes');
    connection.rawNotes = raw;

    // Show loading
    saveBtn.disabled = true;
    saveBtn.textContent = 'Summarising…';

    try {
      connection.summary = await summariseNotes(raw);
    } catch (err) {
      console.warn('Summarise failed', err);
      alert('AI summarisation failed, using raw notes');
      connection.summary = null;
    }

    // Close UI
    overlay.remove();
    onComplete?.(connection);
  });

  // Close on outside click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

async function summariseNotes(rawNotes) {
  // Call backend endpoint. Here we'll call a placeholder public endpoint or mock.
  const res = await fetch('/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw_notes: rawNotes })
  });

  if (!res.ok) throw new Error('Server error');
  return res.json();
} 