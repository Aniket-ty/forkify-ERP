// app/(app)/sales/daily-sales.js
// Full parity with web DailySales — QR orders panel, customer CRM picker,
// stock-aware fulfilment, KPIs, history with QR badge, branch awareness
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ScrollView, ActivityIndicator, TextInput, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  salesService, recipeService, menuService,
  productionService, customerService,
} from '../../../src/services';
import { useBranch } from '../../../src/hooks';
import { Colors, Typography, Radius, Shadow, Spacing } from '../../../src/theme';
import { Banner, FormField, FormInput, PrimaryButton, StatusBadge, ScreenHeader} from '../../../src/components/common';

// ── helpers ──────────────────────────────────────────────────────────────────
const TIER_COLOR = { GOLD: '#a16207', SILVER: '#475569', BRONZE: '#0052b3' };

function parseQRNote(notes) {
  if (!notes) return null;
  const m = notes.match(/\[QR-ORDER:([^\]]+)\]/);
  if (!m) return null;
  return {
    orderNum: m[1],
    table:    notes.match(/Table:([^\s\[]+)/)?.[1] || null,
    guest:    notes.match(/Guest:([^\[]+?)(\s+\[|$)/)?.[1]?.trim() || null,
  };
}

function getStockStatus(entry, stockMap) {
  const available = stockMap[entry.recipeId] ?? 0;
  const needed    = entry.quantitySold;
  if (available >= needed) return { type: 'full',    available, needed, toLog: needed,    toProduce: 0 };
  if (available > 0)       return { type: 'partial', available, needed, toLog: available, toProduce: needed - available };
  return                          { type: 'none',    available: 0, needed, toLog: 0,      toProduce: needed };
}

// ── QR Orders Panel ───────────────────────────────────────────────────────────
function QROrdersPanel({ history, fgStock, loading, onRefresh, onSaleLogged, branchId, onNavigate }) {
  const [fulfilling, setFulfilling] = useState({});
  const [itemDone,   setItemDone]   = useState({});
  const [itemErr,    setItemErr]    = useState({});
  const [collapsed,  setCollapsed]  = useState(false);

  const stockMap = {};
  (fgStock || []).forEach(s => { stockMap[s.recipeId] = s.availableServings || 0; });

  // fulfilled keys
  const fulfilledKeys = new Set(
    history
      .filter(e => e.notes?.includes('[FULFILLED:'))
      .map(e => { const m = e.notes.match(/\[FULFILLED:([^\]]+)\]/); return m ? m[1] : null; })
      .filter(Boolean)
  );

  const qrEntries = history.filter(e => {
    if (!e.notes?.includes('[QR-ORDER:')) return false;
    const meta = parseQRNote(e.notes);
    return meta && !fulfilledKeys.has(`${meta.orderNum}:${e.recipeId}`);
  });

  if (qrEntries.length === 0) return null;

  const groups = {};
  qrEntries.forEach(e => {
    const meta = parseQRNote(e.notes);
    if (!meta) return;
    if (!groups[meta.orderNum]) groups[meta.orderNum] = { ...meta, items: [] };
    groups[meta.orderNum].items.push(e);
  });
  const orders = Object.values(groups);

  const handleFulfilNow = async (entry) => {
    const status = getStockStatus(entry, stockMap);
    if (!branchId) return;
    setFulfilling(f => ({ ...f, [entry.id]: true }));
    setItemErr(e => ({ ...e, [entry.id]: null }));
    try {
      await salesService.logSales({
        recipeId:     entry.recipeId,
        menuItemId:   entry.menuItemId || null,
        customerId:   entry.customerId || null,
        quantitySold: status.toLog,
        sellingPrice: entry.sellingPrice ? Number(entry.sellingPrice) : null,
        saleDate:     entry.saleDate,
        notes:        `[FULFILLED:${parseQRNote(entry.notes)?.orderNum}:${entry.recipeId}]`,
      }, branchId);
      setItemDone(d => ({ ...d, [entry.id]: true }));
      onSaleLogged();
    } catch (e) {
      setItemErr(err => ({ ...err, [entry.id]: e.response?.data || 'Failed' }));
    } finally {
      setFulfilling(f => ({ ...f, [entry.id]: false }));
    }
  };

  return (
    <View style={QS.wrap}>
      {/* Header */}
      <TouchableOpacity style={QS.header} onPress={() => setCollapsed(c => !c)} activeOpacity={0.8}>
        <View style={QS.headerIcon}><Text>📱</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={QS.headerTitle}>QR Menu Orders</Text>
          <Text style={QS.headerSub}>{orders.length} order{orders.length !== 1 ? 's' : ''} · tap to fulfil</Text>
        </View>
        <View style={QS.badge}><Text style={QS.badgeText}>{orders.length}</Text></View>
        <Text style={{ color: Colors.textMuted, fontSize: 16 }}>{collapsed ? '↓' : '↑'}</Text>
      </TouchableOpacity>

      {!collapsed && (
        <>
          {/* Info bar */}
          <View style={QS.infoBar}>
            <Text style={QS.infoText}>
              ⚡ Items with stock → <Text style={{ fontWeight: '700' }}>Fulfil Now</Text>.
              No stock → <Text style={{ fontWeight: '700' }}>Log Production</Text> first.
            </Text>
          </View>

          {orders.map(order => (
            <View key={order.orderNum} style={QS.orderCard}>
              {/* Order header */}
              <View style={QS.orderHeader}>
                <Text style={QS.orderNum}># {order.orderNum}</Text>
                {order.table && <View style={QS.orderTag}><Text style={QS.orderTagText}>Table {order.table}</Text></View>}
                {order.guest && <Text style={QS.orderGuest}>👤 {order.guest}</Text>}
                <Text style={QS.orderDate}>{order.items[0]?.saleDate}</Text>
              </View>

              {/* Items */}
              {order.items.map((item, i) => {
                const status = getStockStatus(item, stockMap);
                const done   = !!itemDone[item.id];
                const err    = itemErr[item.id];
                const busy   = fulfilling[item.id];

                return (
                  <View key={item.id} style={[QS.itemRow, i < order.items.length - 1 && QS.itemBorder, done && QS.itemDone]}>
                    <View style={{ flex: 1 }}>
                      <Text style={QS.itemName}>{item.recipeName}</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                        <Text style={QS.itemMeta}>Qty: {item.quantitySold}</Text>
                        <Text style={QS.itemMeta}>₹{Number(item.totalRevenue || 0).toFixed(0)}</Text>
                        {status.type === 'full' && <Text style={QS.stockGood}>✓ {status.available} in stock</Text>}
                        {status.type === 'partial' && <Text style={QS.stockWarn}>⚡ {status.available} in stock</Text>}
                        {status.type === 'none' && <Text style={QS.stockNone}>✗ No stock</Text>}
                      </View>
                      {err && <Text style={QS.itemErr}>{err}</Text>}
                      {done && <Text style={QS.itemSucc}>✓ Fulfilled · loyalty points awarded</Text>}
                    </View>

                    {!done && (
                      <View style={{ gap: 6, alignItems: 'flex-end' }}>
                        {status.type === 'full' && (
                          <TouchableOpacity
                            style={[QS.btn, QS.btnGreen]}
                            onPress={() => handleFulfilNow(item)}
                            disabled={busy}
                          >
                            {busy
                              ? <ActivityIndicator size={10} color="#15803d" />
                              : <Text style={QS.btnGreenText}>⚡ Fulfil Now</Text>}
                          </TouchableOpacity>
                        )}
                        {status.type === 'partial' && (
                          <>
                            <TouchableOpacity
                              style={[QS.btn, QS.btnAmber]}
                              onPress={() => handleFulfilNow(item)}
                              disabled={busy}
                            >
                              {busy
                                ? <ActivityIndicator size={10} color="#92400e" />
                                : <Text style={QS.btnAmberText}>Sell {status.available}</Text>}
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[QS.btn, QS.btnBlue]}
                              onPress={() => onNavigate(`/(app)/recipes/${item.recipeId}/log-production`)}
                            >
                              <Text style={QS.btnBlueText}>Produce {status.toProduce}</Text>
                            </TouchableOpacity>
                          </>
                        )}
                        {status.type === 'none' && (
                          <TouchableOpacity
                            style={[QS.btn, QS.btnAmber]}
                            onPress={() => onNavigate(`/(app)/recipes/${item.recipeId}/log-production`)}
                          >
                            <Text style={QS.btnAmberText}>👨‍🍳 Log Production</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                    {done && <Text style={{ fontSize: 20 }}>✅</Text>}
                  </View>
                );
              })}

              {/* Order total */}
              <View style={QS.orderFooter}>
                <Text style={QS.orderTotalLabel}>Order Total</Text>
                <Text style={QS.orderTotal}>
                  ₹{order.items.reduce((s, e) => s + Number(e.totalRevenue || 0), 0).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function DailySalesScreen() {
  const router = useRouter();
  const { branchId } = useBranch();

  const today = new Date().toISOString().split('T')[0];

  const [sales,        setSales]        = useState([]);
  const [recipes,      setRecipes]      = useState([]);
  const [customers,    setCustomers]    = useState([]);
  const [fgStock,      setFgStock]      = useState([]);
  const [activeMenu,   setActiveMenu]   = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [date,         setDate]         = useState(today);
  const [error,        setError]        = useState(null);
  const [success,      setSuccess]      = useState(null);
  const [modalOpen,    setModalOpen]    = useState(false);

  // entry form state
  const [entries, setEntries] = useState([{ recipeId: '', menuItemId: '', quantity: '1', salePrice: '', customerId: '', notes: '' }]);
  const [custSearch, setCustSearch] = useState('');
  const [custDropdownIdx, setCustDropdownIdx] = useState(null);

  const load = useCallback(async (silent = false) => {
    if (!branchId) return;
    if (!silent) setLoading(true);
    try {
      const [sRes, rRes, mRes, cRes, stockRes] = await Promise.all([
        salesService.getSales(branchId, date),
        recipeService.getAll({ status: 'ACTIVE' }),
        menuService.getAll(true),
        customerService.getAll(branchId),
        productionService.getStock(branchId),
      ]);
      setSales(sRes.data || []);
      setRecipes(rRes.data || []);
      const menus = mRes.data || [];
      setActiveMenu(menus[0] || null);
      setCustomers(cRes.data || []);
      setFgStock(stockRes.data || []);
    } catch { setError('Failed to load data'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [branchId, date]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(null), 4000); return () => clearTimeout(t); }
  }, [success]);

  const getAvailable = (recipeId) => {
    if (!recipeId) return null;
    const s = fgStock.find(s => String(s.recipeId) === String(recipeId));
    return s ? s.availableServings : 0;
  };

  const addEntry    = () => setEntries(e => [...e, { recipeId: '', menuItemId: '', quantity: '1', salePrice: '', customerId: '', notes: '' }]);
  const removeEntry = (i) => setEntries(e => e.filter((_, idx) => idx !== i));
  const updateEntry = (i, key, val) => setEntries(e => e.map((en, idx) => idx === i ? { ...en, [key]: val } : en));

  const handleRecipeSelect = (i, recipeId) => {
    updateEntry(i, 'recipeId', recipeId);
    if (activeMenu) {
      const mi = (activeMenu.items || []).find(m => String(m.recipeId) === String(recipeId));
      if (mi) {
        updateEntry(i, 'menuItemId', String(mi.id));
        updateEntry(i, 'salePrice', String(mi.basePrice || ''));
      }
    }
  };

  const handleSave = async () => {
    const valid = entries.filter(e => e.recipeId && parseInt(e.quantity) > 0);
    if (!valid.length) { setError('Add at least one sale entry'); return; }
    setSaving(true); setError(null);
    try {
      let saved = 0;
      const pointsEarned = {};
      for (const e of valid) {
        const res = await salesService.logSales({
          recipeId:     Number(e.recipeId),
          menuItemId:   e.menuItemId ? Number(e.menuItemId) : null,
          customerId:   e.customerId ? Number(e.customerId) : null,
          quantitySold: parseInt(e.quantity),
          sellingPrice: e.salePrice ? parseFloat(e.salePrice) : null,
          saleDate:     date,
          notes:        e.notes || null,
        }, branchId);
        saved++;
        if (res.data?.customerId && res.data?.loyaltyPointsAwarded > 0) {
          pointsEarned[res.data.customerId] = (pointsEarned[res.data.customerId] || 0) + res.data.loyaltyPointsAwarded;
        }
      }
      const pts = Object.entries(pointsEarned).map(([cid, p]) => {
        const c = customers.find(c => String(c.id) === String(cid));
        return c ? `+${p} pts for ${c.name}` : '';
      }).filter(Boolean);
      setSuccess(`${saved} sale${saved > 1 ? 's' : ''} logged${pts.length ? ' · ' + pts.join(', ') : ''}`);
      setEntries([{ recipeId: '', menuItemId: '', quantity: '1', salePrice: '', customerId: '', notes: '' }]);
      setModalOpen(false);
      load(true);
    } catch (e) { setError(e.response?.data || 'Failed to log sales'); }
    finally { setSaving(false); }
  };

  const todayRevenue = sales.reduce((s, e) => s + Number(e.totalRevenue || 0), 0);
  const todayProfit  = sales.reduce((s, e) => s + Number(e.grossProfit  || 0), 0);
  const todayCovers  = sales.reduce((s, e) => s + Number(e.quantitySold || 0), 0);
  const margin       = todayRevenue > 0 ? ((todayProfit / todayRevenue) * 100).toFixed(1) : '0';

  const filteredCusts = custSearch
    ? customers.filter(c => c.name?.toLowerCase().includes(custSearch.toLowerCase()) || c.phone?.includes(custSearch))
    : customers.slice(0, 8);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      {/* Header */}
      <ScreenHeader
          title="🛒 Daily Sales"
          subtitle="Log sales with loyalty tracking"
          right={
            <TouchableOpacity style={S.addBtn} onPress={() => setModalOpen(true)}>
          <Text style={S.addBtnText}>+ Log Sales</Text>
        </TouchableOpacity>
          }
        />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor={Colors.primary} />}
      >
        {/* Date row */}
        <View style={S.dateRow}>
          <Text style={S.dateLabel}>📅 Date:</Text>
          <View style={S.datePill}><Text style={S.dateVal}>{date}</Text></View>
        </View>

        {/* KPIs */}
        {sales.length > 0 && (
          <View style={S.kpiRow}>
            {[
              { icon: '👥', val: String(todayCovers), lbl: 'Covers',  color: '#3b82f6' },
              { icon: '💰', val: `₹${todayRevenue.toFixed(0)}`, lbl: 'Revenue', color: Colors.success },
              { icon: '📊', val: `₹${todayProfit.toFixed(0)}`,  lbl: 'Profit',  color: Colors.primary },
              { icon: '📈', val: `${margin}%`,                   lbl: 'Margin',  color: Colors.primary },
            ].map((k, i) => (
              <View key={i} style={[S.kpi, { borderTopColor: k.color, borderTopWidth: 3 }, Shadow.sm]}>
                <Text style={S.kpiIcon}>{k.icon}</Text>
                <Text style={[S.kpiVal, { color: k.color }]}>{k.val}</Text>
                <Text style={S.kpiLbl}>{k.lbl}</Text>
              </View>
            ))}
          </View>
        )}

        <Banner type="error"   message={error}   onDismiss={() => setError(null)} />
        <Banner type="success" message={success} onDismiss={() => setSuccess(null)} />

        {/* QR Orders Panel */}
        <QROrdersPanel
          history={sales}
          fgStock={fgStock}
          loading={loading}
          onRefresh={() => load(true)}
          branchId={branchId}
          onSaleLogged={() => load(true)}
          onNavigate={(path) => router.push(path)}
        />

        {/* Sales history */}
        {loading && !refreshing ? (
          <View style={S.centered}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        ) : sales.length === 0 ? (
          <View style={S.centered}>
            <Text style={{ fontSize: 44 }}>🛒</Text>
            <Text style={S.emptyT}>No sales yet for {date}</Text>
            <Text style={S.emptyS}>Tap + Log Sales to record today's revenue</Text>
          </View>
        ) : (
          <>
            <Text style={S.sectionTitle}>
              Sales on {date} — {sales.length} entries
            </Text>
            {sales.map(item => {
              const isQR = item.notes?.includes('[QR-ORDER:');
              return (
                <View key={item.id} style={[S.saleCard, Shadow.sm, isQR && S.saleCardQR]}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <Text style={S.saleName}>{item.recipeName}</Text>
                      {isQR && <View style={S.qrBadge}><Text style={S.qrBadgeText}>QR</Text></View>}
                    </View>
                    <Text style={S.saleMeta}>
                      {item.quantitySold} covers
                      {item.customerName ? ` · ${item.customerName}` : ' · Walk-in'}
                      {item.loyaltyPointsAwarded > 0 ? ` · +${item.loyaltyPointsAwarded}pts` : ''}
                    </Text>
                    <Text style={S.saleCategory}>{item.recipeCategory}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={S.saleRevenue}>₹{Number(item.totalRevenue || 0).toFixed(0)}</Text>
                    <Text style={S.saleProfit}>₹{Number(item.grossProfit || 0).toFixed(0)} profit</Text>
                    <Text style={S.saleDate}>{item.loggedBy || '—'}</Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Log Sales Modal */}
      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.card }} edges={['top']}>
          <View style={S.mHeader}>
            <Text style={S.mTitle}>Log Sales</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <Text style={S.mClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: Spacing.lg }}>
            <Banner type="error" message={error} onDismiss={() => setError(null)} />

            <FormField label="Sale Date">
              <FormInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
            </FormField>

            {entries.map((entry, i) => {
              const available     = getAvailable(entry.recipeId);
              const over          = available !== null && parseInt(entry.quantity) > available;
              const selCust       = entry.customerId ? customers.find(c => String(c.id) === String(entry.customerId)) : null;
              const estPts        = entry.salePrice && entry.quantity
                ? Math.floor((parseFloat(entry.salePrice) * parseInt(entry.quantity)) / 10) : 0;

              return (
                <View key={i} style={S.entryCard}>
                  <View style={S.entryHead}>
                    <Text style={S.entryTitle}>Entry {i + 1}</Text>
                    {i > 0 && (
                      <TouchableOpacity onPress={() => removeEntry(i)}>
                        <Text style={{ color: Colors.danger, fontWeight: '700' }}>Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Recipe picker */}
                  <Text style={S.fieldLabel}>Recipe / Dish</Text>
                  <ScrollView style={S.recipeScroll} nestedScrollEnabled>
                    {recipes.map(r => (
                      <TouchableOpacity
                        key={r.id}
                        style={[S.recipeRow, String(entry.recipeId) === String(r.id) && S.recipeRowActive]}
                        onPress={() => handleRecipeSelect(i, r.id)}
                      >
                        <Text style={{ color: Colors.text, fontWeight: String(entry.recipeId) === String(r.id) ? '700' : '400' }}>
                          {r.name}
                        </Text>
                        {String(entry.recipeId) === String(r.id) && <Text style={{ color: Colors.primary }}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Stock hint */}
                  {entry.recipeId && available !== null && (
                    <Text style={[S.stockHint, over && S.stockHintWarn]}>
                      {available > 0 ? `📦 ${available} in stock` : '⚠️ None in stock'}
                      {over ? ' — qty exceeds stock' : ''}
                    </Text>
                  )}

                  {/* Customer picker */}
                  <Text style={[S.fieldLabel, { marginTop: 10 }]}>Customer (optional)</Text>
                  {selCust ? (
                    <View style={S.custSelected}>
                      <View style={S.custAvatar}><Text style={S.custAvatarText}>{selCust.name.charAt(0)}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={S.custName}>{selCust.name}</Text>
                        <Text style={[S.custTier, { color: TIER_COLOR[selCust.tier] }]}>{selCust.tier}</Text>
                      </View>
                      {estPts > 0 && <Text style={S.ptsPreview}>+{estPts}pts</Text>}
                      <TouchableOpacity onPress={() => updateEntry(i, 'customerId', '')}>
                        <Text style={{ color: Colors.textMuted, fontWeight: '700' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <>
                      <View style={S.custSearch}>
                        <Text style={{ fontSize: 14 }}>🔍</Text>
                        <TextInput
                          style={S.custInput}
                          placeholder="Search by name or phone..."
                          placeholderTextColor={Colors.textMuted}
                          value={custDropdownIdx === i ? custSearch : ''}
                          onFocus={() => { setCustDropdownIdx(i); setCustSearch(''); }}
                          onChangeText={t => setCustSearch(t)}
                        />
                      </View>
                      {custDropdownIdx === i && (
                        <View style={S.custDropdown}>
                          {filteredCusts.length === 0
                            ? <Text style={S.custEmpty}>No customers found</Text>
                            : filteredCusts.map(c => (
                              <TouchableOpacity
                                key={c.id}
                                style={S.custOption}
                                onPress={() => { updateEntry(i, 'customerId', String(c.id)); setCustDropdownIdx(null); setCustSearch(''); }}
                              >
                                <View style={[S.custAvatar, { width: 28, height: 28, borderRadius: 7 }]}>
                                  <Text style={[S.custAvatarText, { fontSize: 11 }]}>{c.name.charAt(0)}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={S.custName}>{c.name}</Text>
                                  {c.phone && <Text style={S.custPhone}>{c.phone}</Text>}
                                </View>
                                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                                  <Text style={[S.custTier, { color: TIER_COLOR[c.tier] }]}>{c.tier}</Text>
                                  <Text style={{ fontSize: 10, color: Colors.primary, fontWeight: '600' }}>{c.loyaltyPoints}pts</Text>
                                </View>
                              </TouchableOpacity>
                            ))
                          }
                          <TouchableOpacity
                            style={S.custWalkin}
                            onPress={() => { setCustDropdownIdx(null); setCustSearch(''); }}
                          >
                            <Text style={{ fontSize: 12, color: Colors.textMuted }}>Walk-in (no account)</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}

                  {/* Qty & Price */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                    <View style={{ flex: 1 }}>
                      <FormField label="Qty">
                        <TextInput
                          style={[S.numInput, over && S.numInputWarn]}
                          value={entry.quantity}
                          onChangeText={v => updateEntry(i, 'quantity', v)}
                          keyboardType="number-pad"
                          placeholder="1"
                          placeholderTextColor={Colors.textMuted}
                        />
                      </FormField>
                    </View>
                    <View style={{ flex: 1 }}>
                      <FormField label="Price ₹">
                        <TextInput
                          style={S.numInput}
                          value={entry.salePrice}
                          onChangeText={v => updateEntry(i, 'salePrice', v)}
                          keyboardType="decimal-pad"
                          placeholder="0.00"
                          placeholderTextColor={Colors.textMuted}
                        />
                      </FormField>
                    </View>
                  </View>

                  <FormField label="Notes (optional)">
                    <FormInput value={entry.notes} onChangeText={v => updateEntry(i, 'notes', v)} placeholder="Any note..." />
                  </FormField>
                </View>
              );
            })}

            <TouchableOpacity style={S.addEntryBtn} onPress={addEntry}>
              <Text style={S.addEntryText}>+ Add Another Entry</Text>
            </TouchableOpacity>

            <PrimaryButton
              label="Log Sales"
              onPress={handleSave}
              loading={saving}
              style={{ marginTop: Spacing.md, marginBottom: 40 }}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ── QR panel styles ───────────────────────────────────────────────────────────
const QS = StyleSheet.create({
  wrap:          { backgroundColor: Colors.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: '#e9d5ff', marginBottom: Spacing.md, overflow: 'hidden' },
  header:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: Spacing.md, backgroundColor: '#faf5ff' },
  headerIcon:    { width: 32, height: 32, backgroundColor: '#ede9fe', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  headerSub:     { fontSize: Typography.xs, color: Colors.textMuted },
  badge:         { backgroundColor: '#7c3aed', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:     { fontSize: 11, fontWeight: '700', color: '#fff' },
  infoBar:       { backgroundColor: '#fefce8', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#fef08a', padding: Spacing.sm, paddingHorizontal: Spacing.md },
  infoText:      { fontSize: Typography.xs, color: '#713f12', lineHeight: 17 },
  orderCard:     { borderTopWidth: 1, borderColor: '#ede9fe', overflow: 'hidden' },
  orderHeader:   { flexDirection: 'row', alignItems: 'center', gap: 8, padding: Spacing.sm, paddingHorizontal: Spacing.md, backgroundColor: '#f5f3ff', flexWrap: 'wrap' },
  orderNum:      { fontSize: 12, fontWeight: '700', color: '#7c3aed' },
  orderTag:      { backgroundColor: '#fff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.border },
  orderTagText:  { fontSize: 10, color: Colors.textSecondary },
  orderGuest:    { fontSize: 11, color: Colors.textSecondary },
  orderDate:     { marginLeft: 'auto', fontSize: 10, color: Colors.textMuted },
  itemRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: Spacing.md, backgroundColor: '#fff' },
  itemBorder:    { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  itemDone:      { backgroundColor: '#f0fdf4' },
  itemName:      { fontSize: Typography.base, fontWeight: '600', color: Colors.text },
  itemMeta:      { fontSize: Typography.xs, color: Colors.textMuted },
  stockGood:     { fontSize: Typography.xs, fontWeight: '600', color: Colors.success },
  stockWarn:     { fontSize: Typography.xs, fontWeight: '600', color: Colors.warning },
  stockNone:     { fontSize: Typography.xs, fontWeight: '600', color: Colors.danger },
  itemErr:       { fontSize: Typography.xs, color: Colors.danger, marginTop: 2 },
  itemSucc:      { fontSize: Typography.xs, color: Colors.success, marginTop: 2, fontWeight: '600' },
  btn:           { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center', minWidth: 90 },
  btnGreen:      { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  btnGreenText:  { fontSize: 11, fontWeight: '600', color: '#15803d' },
  btnAmber:      { backgroundColor: '#fffbeb', borderColor: '#fcd34d' },
  btnAmberText:  { fontSize: 11, fontWeight: '600', color: '#92400e' },
  btnBlue:       { backgroundColor: Colors.primaryLight, borderColor: '#b3ccf5' },
  btnBlueText:   { fontSize: 11, fontWeight: '600', color: Colors.primary },
  orderFooter:   { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 8, padding: Spacing.sm, paddingHorizontal: Spacing.md, backgroundColor: '#fafafa', borderTopWidth: 1, borderTopColor: Colors.borderLight },
  orderTotalLabel:{ fontSize: Typography.xs, color: Colors.textMuted },
  orderTotal:    { fontSize: Typography.md, fontWeight: '700', color: Colors.success },
});

// ── Screen styles ─────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: 12, backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn:       { width: 36, height: 36, backgroundColor: Colors.bg, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle:   { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  headerSub:     { fontSize: Typography.xs, color: Colors.textMuted },
  addBtn:        { backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnText:    { fontSize: Typography.sm, fontWeight: '600', color: Colors.primary },

  dateRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.md },
  dateLabel:     { fontSize: Typography.base, color: Colors.textSecondary },
  datePill:      { backgroundColor: Colors.card, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border },
  dateVal:       { fontSize: Typography.base, fontWeight: '600', color: Colors.text },

  kpiRow:        { flexDirection: 'row', gap: 8, marginBottom: Spacing.md },
  kpi:           { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 10, alignItems: 'center', gap: 2, borderWidth: 1, borderColor: Colors.border },
  kpiIcon:       { fontSize: 16 },
  kpiVal:        { fontSize: 13, fontWeight: '800' },
  kpiLbl:        { fontSize: 9, color: Colors.textMuted },

  sectionTitle:  { fontSize: Typography.sm, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: 4 },

  saleCard:      { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  saleCardQR:    { backgroundColor: '#faf5ff', borderColor: '#e9d5ff' },
  saleName:      { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  saleMeta:      { fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  saleCategory:  { fontSize: Typography.xs, fontWeight: '600', color: Colors.primary, marginTop: 3, backgroundColor: '#e8f0fd', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  saleRevenue:   { fontSize: Typography.md, fontWeight: '800', color: Colors.primary },
  saleProfit:    { fontSize: Typography.xs, color: Colors.success, fontWeight: '600' },
  saleDate:      { fontSize: Typography.xs, color: Colors.textMuted },
  qrBadge:       { backgroundColor: '#ede9fe', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  qrBadgeText:   { fontSize: 9, fontWeight: '700', color: '#7c3aed' },

  centered:      { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 48 },
  emptyT:        { fontSize: Typography.lg, fontWeight: '700', color: Colors.text },
  emptyS:        { fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' },

  // Modal
  mHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mTitle:        { fontSize: Typography.xl, fontWeight: '700', color: Colors.text },
  mClose:        { fontSize: Typography.xl, color: Colors.textMuted, padding: 4 },

  entryCard:     { backgroundColor: Colors.bg, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  entryHead:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  entryTitle:    { fontSize: Typography.base, fontWeight: '700', color: Colors.text },
  fieldLabel:    { fontSize: Typography.sm, fontWeight: '600', color: '#374151', marginBottom: 5 },

  recipeScroll:  { maxHeight: 140, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.card },
  recipeRow:     { paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, flexDirection: 'row', justifyContent: 'space-between' },
  recipeRowActive:{ backgroundColor: Colors.primaryLight },

  stockHint:     { fontSize: Typography.xs, color: Colors.success, marginTop: 4, paddingLeft: 2 },
  stockHintWarn: { color: Colors.warning },

  custSelected:  { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 9, backgroundColor: '#f0fdf4', borderRadius: Radius.md, borderWidth: 1, borderColor: '#bbf7d0' },
  custAvatar:    { width: 32, height: 32, backgroundColor: Colors.primary, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  custAvatarText:{ color: '#fff', fontSize: 13, fontWeight: '700' },
  custName:      { fontSize: 12, fontWeight: '600', color: Colors.text },
  custTier:      { fontSize: 10, fontWeight: '700' },
  custPhone:     { fontSize: 10, color: Colors.textMuted },
  ptsPreview:    { fontSize: 10, fontWeight: '700', color: Colors.success, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  custSearch:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 9, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, backgroundColor: Colors.card },
  custInput:     { flex: 1, fontSize: Typography.base, color: Colors.text },
  custDropdown:  { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, marginTop: 3, maxHeight: 200, overflow: 'hidden' },
  custOption:    { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  custWalkin:    { padding: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.borderLight },
  custEmpty:     { padding: 12, textAlign: 'center', color: Colors.textMuted, fontSize: Typography.sm },

  numInput:      { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: Typography.base, color: Colors.text, backgroundColor: Colors.card },
  numInputWarn:  { borderColor: Colors.warning, backgroundColor: '#fffbeb' },

  addEntryBtn:   { borderWidth: 1, borderStyle: 'dashed', borderColor: Colors.primary, borderRadius: Radius.md, paddingVertical: 12, alignItems: 'center' },
  addEntryText:  { fontSize: Typography.base, fontWeight: '600', color: Colors.primary },
});
