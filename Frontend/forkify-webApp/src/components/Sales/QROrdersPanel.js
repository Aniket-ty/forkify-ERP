/**
 * QROrdersPanel.js
 * ─────────────────────────────────────────────────────────────────
 * Shown in the ERP Daily Sales page — lists all sales entries
 * that were placed via the public QR menu page.
 *
 * These are identified by notes containing "[QR-ORDER:...]".
 *
 * From this panel, kitchen staff can:
 *  1. See what QR orders came in today
 *  2. Click "Log Production" → navigate to /fooderp/recipes/:id/produce
 *     This deducts raw materials from inventory and adds to FinishedGoodStock
 *  3. Once produced, mark stock-out (sale deducts finished stock)
 *
 * Design: matches ERP dark card style exactly.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  QrCode, ChefHat, Clock, CheckCircle, AlertCircle,
  ExternalLink, RefreshCw, Package, Users, Hash,
} from 'lucide-react';

const T = {
  bg:      '#0d1117',
  card:    '#161b22',
  card2:   '#1c2333',
  border:  '#30363d',
  primary: '#58a6ff',
  success: '#3fb950',
  warn:    '#d29922',
  danger:  '#f85149',
  purple:  '#bc8cff',
  muted:   '#8b949e',
  text:    '#e6edf3',
};

// Parse QR order metadata from notes field
function parseQRNote(notes) {
  if (!notes) return null;
  const match = notes.match(/\[QR-ORDER:([^\]]+)\]/);
  if (!match) return null;
  const orderNum  = match[1];
  const table     = notes.match(/Table:([^\s]+)/)?.[1] || null;
  const guest     = notes.match(/Guest:([^\[]+)/)?.[1]?.trim() || null;
  return { orderNum, table, guest };
}

export default function QROrdersPanel({ salesHistory, loading, onRefresh }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all | pending | done

  if (!salesHistory) return null;

  // Filter only QR orders
  const qrOrders = salesHistory.filter(entry =>
    entry.notes && entry.notes.includes('[QR-ORDER:')
  );

  if (qrOrders.length === 0 && !loading) return null;

  // Group by order number
  const grouped = {};
  qrOrders.forEach(entry => {
    const meta = parseQRNote(entry.notes);
    if (!meta) return;
    const k = meta.orderNum;
    if (!grouped[k]) {
      grouped[k] = { orderNum: k, table: meta.table, guest: meta.guest, items: [] };
    }
    grouped[k].items.push(entry);
  });

  const orders = Object.values(grouped);

  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 14, marginBottom: 24, overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', borderBottom: `1px solid ${T.border}`,
        background: T.card2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, background: `${T.purple}20`,
            borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <QrCode size={16} color={T.purple} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>
              QR Menu Orders
            </div>
            <div style={{ fontSize: 11, color: T.muted }}>
              {orders.length} order{orders.length !== 1 ? 's' : ''} from public menu today
            </div>
          </div>
          {orders.length > 0 && (
            <div style={{
              background: T.purple, color: '#0d1117', fontSize: 11, fontWeight: 700,
              padding: '2px 8px', borderRadius: 20,
            }}>
              {qrOrders.length} items
            </div>
          )}
        </div>
        <button
          onClick={onRefresh}
          style={{
            background: 'none', border: `1px solid ${T.border}`,
            borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: T.muted,
          }}
        >
          <RefreshCw size={13} className={loading ? 'ds-spin' : ''} />
        </button>
      </div>

      {/* Info notice */}
      <div style={{
        padding: '10px 18px', background: `${T.primary}08`,
        borderBottom: `1px solid ${T.border}`, fontSize: 12, color: T.muted,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <AlertCircle size={12} color={T.primary} />
        <span>
          These orders came from the public QR menu.
          <strong style={{ color: T.warn }}> Log Production</strong> for each item
          to deduct raw materials → FinishedGoodStock is updated → sale is fulfilled.
        </span>
      </div>

      {/* Order cards */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {orders.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: T.muted, fontSize: 13 }}>
            No QR orders yet today
          </div>
        )}

        {orders.map(order => (
          <div key={order.orderNum} style={{
            background: T.card2, border: `1px solid ${T.border}`,
            borderRadius: 12, overflow: 'hidden',
          }}>
            {/* Order header row */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderBottom: `1px solid ${T.border}`,
              background: `${T.purple}08`,
            }}>
              <Hash size={12} color={T.purple} />
              <span style={{ fontWeight: 700, color: T.purple, fontSize: 13 }}>
                {order.orderNum}
              </span>
              {order.table && (
                <span style={{
                  fontSize: 11, color: T.muted, background: T.card,
                  border: `1px solid ${T.border}`, borderRadius: 4, padding: '1px 6px',
                }}>
                  Table {order.table}
                </span>
              )}
              {order.guest && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: T.muted }}>
                  <Users size={10} /> {order.guest}
                </span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 11, color: T.muted }}>
                <Clock size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                {order.items[0]?.saleDate || 'Today'}
              </span>
            </div>

            {/* Items */}
            {order.items.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                borderBottom: i < order.items.length - 1 ? `1px solid ${T.border}` : 'none',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                    {item.recipeName || item.recipe?.name || `Recipe #${item.recipeId}`}
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>
                    Qty: {item.quantitySold} &nbsp;·&nbsp; ₹{Number(item.totalRevenue || 0).toFixed(2)}
                  </div>
                </div>

                {/* Log Production button — key action */}
                <button
                  onClick={() => navigate(`/fooderp/recipes/${item.recipeId}/produce`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: `${T.warn}15`, border: `1px solid ${T.warn}40`,
                    borderRadius: 8, padding: '6px 12px',
                    fontSize: 12, fontWeight: 600, color: T.warn, cursor: 'pointer',
                    transition: 'all .15s', whiteSpace: 'nowrap',
                  }}
                  title="Go to Log Production to produce this item and deduct inventory"
                >
                  <ChefHat size={12} /> Log Production
                </button>

                {/* View recipe */}
                <button
                  onClick={() => navigate(`/fooderp/recipes/${item.recipeId}`)}
                  style={{
                    background: 'none', border: `1px solid ${T.border}`,
                    borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: T.muted,
                  }}
                  title="View recipe"
                >
                  <ExternalLink size={12} />
                </button>
              </div>
            ))}

            {/* Order total footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              padding: '8px 14px', background: `${T.card}`,
              borderTop: `1px solid ${T.border}`,
            }}>
              <span style={{ fontSize: 12, color: T.muted, marginRight: 8 }}>Order Total</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: T.success }}>
                ₹{order.items.reduce((s, e) => s + Number(e.totalRevenue || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
