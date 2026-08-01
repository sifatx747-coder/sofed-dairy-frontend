'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, Plus, Minus, CheckCircle2, Phone, MapPin, User, ChevronDown, Truck } from 'lucide-react';

async function apiFetch(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    method: opts.method || 'GET',
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'কিছু একটা সমস্যা হয়েছে');
  return data;
}

const taka = (n) => `৳${Number(n || 0).toLocaleString('bn-BD', { maximumFractionDigits: 0 })}`;
const bn = (n) => Number(n || 0).toLocaleString('bn-BD', { maximumFractionDigits: 2 });

const CATEGORY_LABEL = { milk: 'দুধ', doi: 'দই', ponir: 'পনির', ghee: 'ঘি', other: 'অন্যান্য' };

const BENEFITS = [
  { emoji: '🥛', title: 'খাঁটি ও তাজা', desc: 'প্রতিদিন সকালে সংগ্রহ করা তাজা দুধ ও দুগ্ধজাত পণ্য' },
  { emoji: '🚚', title: 'দ্রুত ডেলিভারি', desc: 'অর্ডার কনফার্মের পর দ্রুততম সময়ে আপনার দরজায়' },
  { emoji: '💯', title: '১০০% বিশুদ্ধ', desc: 'কোনো ভেজাল নেই — সরাসরি খামার থেকে আপনার কাছে' },
  { emoji: '💰', title: 'সাশ্রয়ী মূল্য', desc: 'বাজারের চেয়ে কম দামে সেরা মানের পণ্য পাচ্ছেন' },
];

export default function CampaignPage() {
  const [products, setProducts] = useState([]);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [selectedUnits, setSelectedUnits] = useState({});
  const [step, setStep] = useState('browse'); // browse | checkout | success
  const [form, setForm] = useState({ name: '', phone: '', address: '', note: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState(null); // { _id, total, deliveryCharge }

  useEffect(() => {
    apiFetch('/campaign/products')
      .then((data) => {
        setProducts(data.products);
        setDeliveryCharge(Number(data.deliveryCharge ?? 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unitsOf = (p) => (p.unitOptions?.length ? p.unitOptions : [p.unit]);

  const setQty = (p, qty) =>
    setCart((c) => {
      const next = Math.max(0, Math.round((Number(qty) || 0) * 100) / 100);
      const copy = { ...c };
      if (next <= 0) delete copy[p._id];
      else copy[p._id] = { qty: next, unit: c[p._id]?.unit || selectedUnits[p._id] || unitsOf(p)[0] };
      return copy;
    });

  const bump = (p, delta) => setQty(p, (cart[p._id]?.qty || 0) + delta);
  const setUnit = (p, unit) => {
    setSelectedUnits((u) => ({ ...u, [p._id]: unit }));
    setCart((c) => (c[p._id] ? { ...c, [p._id]: { ...c[p._id], unit } } : c));
  };

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([id, { qty, unit }]) => {
        const p = products.find((x) => x._id === id);
        if (!p) return null;
        const multiplier = p.unitMultipliers?.[unit] ?? 1;
        const rate = p.defaultRate * multiplier;
        return { ...p, qty, unit, rate, amount: qty * rate };
      })
      .filter(Boolean);
  }, [cart, products]);

  const subtotal = cartItems.reduce((s, i) => s + i.amount, 0);
  const grandTotal = subtotal + deliveryCharge;
  const count = cartItems.length;

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'নাম দিন';
    if (!form.phone.trim()) e.phone = 'মোবাইল নম্বর দিন';
    else if (!/^01[3-9]\d{8}$/.test(form.phone.trim())) e.phone = 'সঠিক মোবাইল নম্বর দিন';
    if (!form.address.trim()) e.address = 'ঠিকানা দিন';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/campaign/orders', {
        method: 'POST',
        body: {
          ...form,
          items: cartItems.map((i) => ({ product: i._id, quantity: i.qty, unit: i.unit })),
        },
      });
      setOrderResult(res);
      setStep('success');
      setCart({});
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const grouped = useMemo(() => {
    const map = {};
    for (const p of products) {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    }
    return map;
  }, [products]);

  /* ---- Success screen ---- */
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-leaf-50 via-white to-ghee-100/40 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-3xl shadow-lift p-10 ring-1 ring-leaf-100">
            <div className="w-20 h-20 bg-leaf-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-leaf-600" />
            </div>
            <h2 className="text-3xl font-bold text-leaf-900 mb-2">অর্ডার হয়ে গেছে! 🎉</h2>
            <p className="text-stone-500 mb-6">
              আপনার অর্ডার পেয়েছি। শিগগিরই আমরা কনফার্ম করে ডেলিভারির ব্যবস্থা করবো।
            </p>
            <div className="bg-leaf-50 rounded-2xl p-5 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">অর্ডার নম্বর</span>
                <span className="font-mono text-leaf-800 font-semibold">#{String(orderResult?._id).slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">পণ্যের মূল্য</span>
                <span className="text-stone-700">{taka((orderResult?.total ?? 0) - (orderResult?.deliveryCharge ?? 0))}</span>
              </div>
              {(orderResult?.deliveryCharge ?? 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> ডেলিভারি চার্জ</span>
                  <span className="text-stone-700">{taka(orderResult.deliveryCharge)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-leaf-900 border-t border-leaf-100 pt-2">
                <span>সর্বমোট</span>
                <span className="text-lg">{taka(orderResult?.total)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1">
                <span className="text-stone-500">পেমেন্ট</span>
                <span className="text-stone-700">ডেলিভারিতে নগদ</span>
              </div>
            </div>
            <p className="text-sm text-stone-400">যেকোনো প্রশ্নে আমাদের সাথে যোগাযোগ করুন</p>
            <button
              onClick={() => { setStep('browse'); setForm({ name: '', phone: '', address: '', note: '' }); }}
              className="mt-6 w-full bg-leaf-700 text-white rounded-2xl py-3.5 font-semibold hover:bg-leaf-800 transition"
            >
              আরেকটি অর্ডার করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Checkout screen ---- */
  if (step === 'checkout') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-leaf-50 via-white to-ghee-100/40">
        <div className="max-w-lg mx-auto px-4 py-8">
          <button
            onClick={() => setStep('browse')}
            className="flex items-center gap-2 text-leaf-700 font-medium mb-6 hover:text-leaf-900 transition"
          >
            ← পণ্যে ফিরে যান
          </button>

          <h2 className="text-2xl font-bold text-leaf-900 mb-6">অর্ডার কনফার্ম করুন</h2>

          {/* Order summary */}
          <div className="bg-white rounded-2xl shadow-soft ring-1 ring-leaf-100 p-5 mb-5">
            <h3 className="font-semibold text-leaf-900 mb-3">আপনার অর্ডার</h3>
            <div className="space-y-2">
              {cartItems.map((i) => (
                <div key={i._id} className="flex justify-between text-sm">
                  <span className="text-stone-700">
                    {i.name} <span className="text-stone-400">× {bn(i.qty)} {i.unit}</span>
                  </span>
                  <span className="font-semibold text-leaf-900">{taka(i.amount)}</span>
                </div>
              ))}
              <div className="border-t border-leaf-100 pt-2 space-y-1.5">
                <div className="flex justify-between text-sm text-stone-500">
                  <span>পণ্যের মূল্য</span>
                  <span>{taka(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-stone-500">
                    <Truck className="w-3.5 h-3.5" /> ডেলিভারি চার্জ
                  </span>
                  <span className={deliveryCharge > 0 ? 'text-stone-700 font-medium' : 'text-leaf-600 font-medium'}>
                    {deliveryCharge > 0 ? taka(deliveryCharge) : 'বিনামূল্যে'}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-leaf-900 border-t border-leaf-100 pt-1.5">
                  <span>সর্বমোট</span>
                  <span className="text-xl">{taka(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery form */}
          <div className="bg-white rounded-2xl shadow-soft ring-1 ring-leaf-100 p-5 space-y-4">
            <h3 className="font-semibold text-leaf-900">ডেলিভারির তথ্য</h3>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                <User className="inline w-4 h-4 mr-1" />আপনার নাম *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="আপনার পুরো নাম"
                className={`w-full rounded-xl border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-leaf-500/60 ${errors.name ? 'border-rose-400' : 'border-leaf-200'}`}
              />
              {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                <Phone className="inline w-4 h-4 mr-1" />মোবাইল নম্বর *
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="01XXXXXXXXX"
                inputMode="tel"
                className={`w-full rounded-xl border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-leaf-500/60 ${errors.phone ? 'border-rose-400' : 'border-leaf-200'}`}
              />
              {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                <MapPin className="inline w-4 h-4 mr-1" />ডেলিভারির ঠিকানা *
              </label>
              <textarea
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="বাসা/ফ্ল্যাট নম্বর, রোড, এলাকা, জেলা"
                rows={3}
                className={`w-full rounded-xl border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-leaf-500/60 resize-none ${errors.address ? 'border-rose-400' : 'border-leaf-200'}`}
              />
              {errors.address && <p className="text-rose-500 text-xs mt-1">{errors.address}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">বিশেষ নির্দেশনা (ঐচ্ছিক)</label>
              <input
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="যেমন: বিকালে দিলে ভালো হয়"
                className="w-full rounded-xl border border-leaf-200 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-leaf-500/60"
              />
            </div>

            {errors.submit && (
              <div className="bg-rose-50 text-rose-700 rounded-xl px-4 py-3 text-sm">{errors.submit}</div>
            )}

            <div className="bg-ghee-100/60 rounded-xl px-4 py-3 text-sm text-stone-600">
              💳 পেমেন্ট পদ্ধতি: <strong>ডেলিভারিতে নগদ</strong>
            </div>

            <button
              onClick={placeOrder}
              disabled={submitting}
              className="w-full bg-leaf-700 text-white rounded-2xl py-4 font-bold text-lg hover:bg-leaf-800 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  অর্ডার দিন — {taka(grandTotal)}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Browse / landing page ---- */
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-leaf-800 via-leaf-700 to-leaf-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            🥛 সরাসরি খামার থেকে আপনার দরজায়
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Sofed Dairy
            <span className="block text-ghee-300 text-3xl md:text-4xl mt-2 font-normal">
              খাঁটি দুধ ও দুগ্ধজাত পণ্য
            </span>
          </h1>
          <p className="text-leaf-100 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            প্রতিদিন তাজা সংগ্রহ করা খাঁটি দুধ, দই, পনির ও ঘি — সরাসরি আপনার বাড়িতে ডেলিভারি
          </p>
          {deliveryCharge > 0 ? (
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
              <Truck className="w-4 h-4" /> ডেলিভারি চার্জ: {taka(deliveryCharge)}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
              <Truck className="w-4 h-4" /> বিনামূল্যে ডেলিভারি
            </div>
          )}
          <div>
            <a
              href="#products"
              className="inline-flex items-center gap-2 bg-ghee-400 text-leaf-900 font-bold px-8 py-4 rounded-2xl text-lg hover:bg-ghee-300 transition shadow-lg"
            >
              <ShoppingBag className="w-5 h-5" />
              এখনই অর্ডার করুন
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-leaf-50 border-b border-leaf-100">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="text-center">
              <div className="text-3xl mb-2">{b.emoji}</div>
              <p className="font-bold text-leaf-900 text-sm">{b.title}</p>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div id="products" className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-leaf-900">আমাদের পণ্যসমূহ</h2>
          <p className="text-stone-500 mt-2">পরিমাণ বেছে নিন এবং কার্টে যোগ করুন</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-leaf-200 border-t-leaf-600 rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <p className="text-5xl mb-4">🥛</p>
            <p className="text-lg">এই মুহূর্তে কোনো পণ্য নেই</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([cat, prods]) => (
              <div key={cat}>
                <h3 className="text-lg font-bold text-leaf-800 mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-leaf-600 rounded-full inline-block" />
                  {CATEGORY_LABEL[cat] || cat}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {prods.map((p) => {
                    const item = cart[p._id];
                    const qty = item?.qty || 0;
                    const unit = item?.unit || selectedUnits[p._id] || unitsOf(p)[0];
                    const units = unitsOf(p);
                    return (
                      <div
                        key={p._id}
                        className={`bg-white rounded-2xl shadow-soft ring-1 overflow-hidden transition-all ${qty > 0 ? 'ring-leaf-400 shadow-lift' : 'ring-leaf-100'}`}
                      >
                        {p.image?.url ? (
                          <img src={p.image.url} alt={p.name} className="h-44 w-full object-cover" />
                        ) : (
                          <div className="h-44 w-full bg-gradient-to-br from-leaf-100 to-ghee-100/60 flex items-center justify-center">
                            <span className="text-6xl text-leaf-300 font-bold">{p.name?.[0]}</span>
                          </div>
                        )}
                        <div className="p-4">
                          <p className="font-bold text-leaf-900 text-lg">{p.name}</p>
                          {p.description && (
                            <p className="text-xs text-stone-500 mt-1 line-clamp-2">{p.description}</p>
                          )}
                          <div className="mt-3 flex items-center justify-between gap-2">
                            {(() => {
                              const multiplier = p.unitMultipliers?.[unit] ?? 1;
                              const displayRate = p.defaultRate * multiplier;
                              return (
                                <p className="text-ghee-600 font-bold text-xl">
                                  {taka(displayRate)}
                                  <span className="text-xs font-normal text-stone-400">/{unit}</span>
                                </p>
                              );
                            })()}
                            {units.length > 1 && (
                              <select
                                value={unit}
                                onChange={(e) => setUnit(p, e.target.value)}
                                className="text-xs border border-leaf-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-leaf-400"
                              >
                                {units.map((u) => {
                                  const m = p.unitMultipliers?.[u] ?? 1;
                                  return (
                                    <option key={u} value={u}>
                                      {u} — {taka(p.defaultRate * m)}
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                          </div>

                          {qty === 0 ? (
                            <button
                              onClick={() => bump(p, 1)}
                              className="mt-3 w-full bg-leaf-700 text-white rounded-xl py-2.5 font-semibold text-sm hover:bg-leaf-800 transition flex items-center justify-center gap-1.5"
                            >
                              <Plus className="w-4 h-4" /> কার্টে যোগ করুন
                            </button>
                          ) : (
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={() => bump(p, -1)}
                                className="w-10 h-10 rounded-xl border border-leaf-200 flex items-center justify-center hover:bg-leaf-50 transition shrink-0"
                              >
                                <Minus className="w-4 h-4 text-leaf-700" />
                              </button>
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                value={qty}
                                onChange={(e) => setQty(p, e.target.value)}
                                className="flex-1 h-10 text-center border border-leaf-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-leaf-500/60 font-semibold"
                              />
                              <button
                                onClick={() => bump(p, 1)}
                                className="w-10 h-10 rounded-xl border border-leaf-200 flex items-center justify-center hover:bg-leaf-50 transition shrink-0"
                              >
                                <Plus className="w-4 h-4 text-leaf-700" />
                              </button>
                            </div>
                          )}
                          {qty > 0 && (
                            <p className="text-right text-xs text-stone-500 mt-1.5">
                              {bn(qty)} {unit} · <span className="font-bold text-leaf-700">{taka(qty * (p.unitMultipliers?.[unit] ?? 1) * p.defaultRate)}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky cart bar */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-white/95 backdrop-blur border-t border-leaf-100 shadow-lift p-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-xs text-stone-500">{count}টি পণ্য · পণ্য {taka(subtotal)}</p>
              <div className="flex items-center gap-2">
                <p className="font-bold text-leaf-900 text-xl">{taka(grandTotal)}</p>
                {deliveryCharge > 0 && (
                  <span className="text-xs text-stone-400 flex items-center gap-0.5">
                    <Truck className="w-3 h-3" />{taka(deliveryCharge)} ডেলিভারি সহ
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setStep('checkout')}
              className="bg-leaf-700 text-white font-bold px-8 py-3.5 rounded-2xl text-base hover:bg-leaf-800 transition flex items-center gap-2 shadow-lg"
            >
              <ShoppingBag className="w-5 h-5" />
              অর্ডার করুন
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className={`bg-leaf-900 text-leaf-200 text-center py-8 text-sm ${count > 0 ? 'pb-24' : ''}`}>
        <p className="font-bold text-white text-lg mb-1">Sofed Dairy</p>
        <p>খাঁটি দুধ ও দুগ্ধজাত পণ্য — সরাসরি খামার থেকে</p>
        <p className="mt-3 text-leaf-400 text-xs">© {new Date().getFullYear()} Sofed Dairy. সর্বস্বত্ব সংরক্ষিত।</p>
      </div>
    </div>
  );
}
