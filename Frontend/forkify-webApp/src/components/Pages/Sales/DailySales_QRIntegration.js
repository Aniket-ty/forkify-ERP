/**
 * PATCH FILE — DailySales.js integration instructions
 * ─────────────────────────────────────────────────────
 * Add these changes to the existing DailySales.js:
 *
 * 1. Add import at top (after existing imports):
 */

// ADD THIS IMPORT:
import QROrdersPanel from '../../../components/Sales/QROrdersPanel';

/**
 * 2. In the JSX return, BEFORE the <div className="ds-form-card"> section,
 *    add the QROrdersPanel:
 *
 * FIND THIS LINE (approx line 179):
 *   <div className="ds-form-card">
 *
 * ADD BEFORE IT:
 */

// ── QR Orders Panel (insert before ds-form-card) ──
<QROrdersPanel
  salesHistory={history}
  loading={loading}
  onRefresh={load}
/>

/**
 * 3. In the history table (approx line 326), add a QR indicator column.
 *    FIND: {history.map(e => (
 *    In the table row for each entry, add after the recipe name cell:
 */

// In the table row, after recipe name, add:
{e.notes?.includes('[QR-ORDER:') && (
  <span style={{
    fontSize: 10, background: 'rgba(188,140,255,.15)',
    border: '1px solid rgba(188,140,255,.3)', color: '#bc8cff',
    borderRadius: 4, padding: '1px 6px', marginLeft: 6,
    fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3,
  }}>
    QR Order
  </span>
)}
