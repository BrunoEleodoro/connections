/*
 * Export Module
 * Handles sending the structured connection object to the backend which will perform OAuth export.
 */

export async function exportConnection(connection) {
  try {
    const res = await fetch('/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection })
    });
    if (!res.ok) throw new Error(await res.text());
    alert('✅ Exported successfully');
  } catch (err) {
    console.error('Export failed', err);
    alert('❌ Export failed: ' + (err.message || 'unknown error'));
  }
} 