'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  ClipboardList, ChevronDown, Pencil, Plus, Trash2, History, MapPin, Phone,
} from 'lucide-react';
import { api } from '@/lib/api';
import { bn, taka, bnDate, ORDER_STATUS } from '@/lib/utils';
import {
  PageHeader, Card, Button, Input, Field, Select, Badge, PageLoader, EmptyState, Pagination,
  Dialog, DialogContent, DialogClose,
} from '@/components/ui';

const FILTERS = [
  { value: 'all', label: 'সব' },
  { value: 'pending', label: 'নতুন' },
  { value: 'confirmed', label: 'কনফার্ম' },
  { value: 'delivered', label: 'ডেলিভারড' },
  { value: 'cancelled', label: 'বাতিল' },
];

const unitsOf = (p) => (p?.unitOptions?.length ? p.unitOptions : p ? [p.unit] : []);

const fmtWhen = (d) =>
  new Date(d).toLocaleString('bn-BD', { day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });

/* one history entry → a friendly Bengali line */
function historyLine(h) {
  if (h.action === 'created') return 'অর্ডার তৈরি হয়েছে';
  if (h.action === 'status') {
    const a = ORDER_STATUS[h.before?.status]?.label || h.before?.status || '—';
    const b = ORDER_STATUS[h.after?.status]?.label || h.after?.status || '—';
    return `স্ট্যাটাস: ${a} → ${b}`;
  }
  if (h.action === 'items') {
    const bt = h.before?.total != null ? taka(h.before.total) : '—';
    const at = h.after?.total != null ? taka(h.after.total) : '—';
    return `পণ্য সম্পাদনা · মোট ${bt} → ${at}`;
  }
  return h.action || 'পরিবর্তন';
}

export default function OrdersPage() {
  const [status, setStatus] = useState('all');
  const [range, setRange] = useState({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null); // { rows, total, page, pages }
  const [products, setProducts] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [markPaid, setMarkPaid] = useState({});
  const [busyId, setBusyId] = useState(null);

  // edit dialog
  const [edit, setEdit] = useState(null); // { id, items:[], note }
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    api('/products')
      .then((p) => setProducts(p))
      .catch(() => {});
  }, []);

  const load = () => {
    const qs = new URLSearchParams({ status, page: String(page) });
    if (range.from) qs.set('from', range.from);
    if (range.to) qs.set('to', range.to);
    return api(`/orders?${qs.toString()}`)
      .then(setData)
      .catch((err) => toast.error(err.message));
  };

  useEffect(() => {
    setData(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, range.from, range.to]);

  // reset to page 1 when the filter changes
  useEffect(() => {
    setPage(1);
  }, [status, range.from, range.to]);

  const updateStatus = async (order, nextStatus) => {
    setBusyId(order._id);
    try {
      await api(`/orders/${order._id}`, {
        method: 'PUT',
        body: { status: nextStatus, markPaid: !!markPaid[order._id] },
      });
      toast.success(
        nextStatus === 'delivered' ? 'ডেলিভারড — বিক্রির হিসাবে যোগ হয়ে গেছে' : 'অর্ডার আপডেট হয়েছে'
      );
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  /* ---------- edit ---------- */
  const openEdit = (order) => {
    setEdit({
      id: order._id,
      note: order.note || '',
      items: order.items.map((i) => ({
        product: String(i.product),
        name: i.name,
        unit: i.unit,
        quantity: i.quantity,
        rate: i.rate,
      })),
    });
  };

  const setEditItem = (idx, key, value) =>
    setEdit((e) => {
      const items = e.items.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, [key]: value };
        if (key === 'product') {
          const p = products.find((x) => x._id === value);
          next.name = p?.name || '';
          next.unit = p ? unitsOf(p)[0] : '';
          next.rate = p?.defaultRate ?? '';
        }
        return next;
      });
      return { ...e, items };
    });

  const editTotal = (edit?.items || []).reduce(
    (s, it) => s + (Number(it.quantity) || 0) * (Number(it.rate) || 0),
    0
  );

  const saveEdit = async () => {
    setSavingEdit(true);
    try {
      await api(`/orders/${edit.id}/items`, {
        method: 'PUT',
        body: {
          note: edit.note,
          items: edit.items
            .filter((it) => it.product && Number(it.quantity) > 0)
            .map((it) => ({
              product: it.product,
              quantity: Number(it.quantity),
              unit: it.unit || undefined,
              rate: Number(it.rate) || undefined,
            })),
        },
      });
      toast.success('অর্ডার আপডেট হয়েছে');
      setEdit(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  if (!data) return <PageLoader />;

  return (
    <div>
      <PageHeader title="অনলাইন অর্ডার" desc="তালিকায় ক্লিক করে বিস্তারিত দেখুন · ডেলিভারড করলেই বিক্রির খাতায় ওঠে">
        <Input
          type="date"
          value={range.from}
          onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))}
          className="w-auto"
        />
        <span className="text-stone-400">—</span>
        <Input
          type="date"
          value={range.to}
          onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))}
          className="w-auto"
        />
        {(range.from || range.to) && (
          <Button variant="ghost" size="sm" onClick={() => setRange({ from: '', to: '' })}>
            তারিখ সরান
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              status === f.value
                ? 'bg-leaf-700 text-white shadow-sm'
                : 'bg-surface text-leaf-800 ring-1 ring-leaf-200 hover:bg-leaf-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {data.rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="কোনো অর্ডার নেই" desc="এই ফিল্টারে এখন কোনো অর্ডার নেই।" />
      ) : (
        <Card className="divide-y divide-leaf-100">
          {data.rows.map((o) => {
            const st = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
            const isOpen = openId === o._id;
            const editable = o.status === 'pending' || o.status === 'confirmed';
            return (
              <div key={o._id}>
                {/* row */}
                <button
                  onClick={() => setOpenId(isOpen ? null : o._id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-leaf-50/50 md:px-5"
                >
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-leaf-900">{o.customer?.name || '—'}</p>
                    <p className="truncate text-[11px] text-stone-400">
                      {fmtWhen(o.createdAt)} · {bn(o.items.length)}টি পণ্য
                    </p>
                  </div>
                  <span className="num hidden text-sm font-semibold text-leaf-900 sm:block">{taka(o.total)}</span>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </button>

                {/* expanded */}
                {isOpen && (
                  <div className="border-t border-leaf-100 bg-leaf-50/30 px-4 py-4 md:px-5">
                    <div className="grid gap-4 lg:grid-cols-2">
                      {/* items + meta */}
                      <div>
                        <div className="space-y-1.5 rounded-xl bg-surface p-3.5 text-sm ring-1 ring-leaf-100">
                          {o.items.map((it, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span>
                                {it.name}{' '}
                                <span className="text-stone-400">
                                  × {bn(it.quantity)} {it.unit} · ৳{bn(it.rate)}
                                </span>
                              </span>
                              <span className="num">{taka(it.amount)}</span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between border-t border-leaf-100 pt-1.5 font-semibold text-leaf-900">
                            <span>মোট</span>
                            <span className="num">{taka(o.total)}</span>
                          </div>
                        </div>
                        <div className="mt-3 space-y-1 text-xs text-stone-500">
                          {(o.phone || o.customer?.phone) && (
                            <p className="flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5" /> {o.phone || o.customer?.phone}
                            </p>
                          )}
                          {o.address && (
                            <p className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5" /> {o.address}
                            </p>
                          )}
                          {o.note && <p>নোট: {o.note}</p>}
                          {o.status === 'delivered' && (
                            <Badge tone={o.paid ? 'leaf' : 'rose'}>{o.paid ? 'পরিশোধিত' : 'বাকি আছে'}</Badge>
                          )}
                        </div>
                      </div>

                      {/* actions + history */}
                      <div className="space-y-3">
                        {editable && (
                          <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface p-3.5 ring-1 ring-leaf-100">
                            <Select
                              defaultValue={o.status}
                              onChange={(e) => updateStatus(o, e.target.value)}
                              disabled={busyId === o._id}
                              className="w-auto min-w-[130px]"
                            >
                              <option value="pending">নতুন</option>
                              <option value="confirmed">কনফার্ম</option>
                              <option value="delivered">ডেলিভারড</option>
                              <option value="cancelled">বাতিল</option>
                            </Select>
                            <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-600">
                              <input
                                type="checkbox"
                                checked={!!markPaid[o._id]}
                                onChange={(e) => setMarkPaid((m) => ({ ...m, [o._id]: e.target.checked }))}
                                className="h-4 w-4 accent-leaf-700"
                              />
                              ডেলিভারিতে টাকা নেওয়া হয়েছে
                            </label>
                            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openEdit(o)}>
                              <Pencil className="h-3.5 w-3.5" />
                              এডিট
                            </Button>
                          </div>
                        )}

                        {/* history */}
                        <div className="rounded-xl bg-surface p-3.5 ring-1 ring-leaf-100">
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-leaf-900/70">
                            <History className="h-3.5 w-3.5" /> পরিবর্তনের ইতিহাস
                          </p>
                          {(!o.history || o.history.length === 0) ? (
                            <p className="text-xs text-stone-400">কোনো পরিবর্তন নেই</p>
                          ) : (
                            <ol className="space-y-2">
                              {[...o.history].reverse().map((h, i) => (
                                <li key={i} className="flex gap-2 text-xs">
                                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-400" />
                                  <div>
                                    <p className="text-leaf-900">{historyLine(h)}</p>
                                    <p className="text-stone-400">
                                      {fmtWhen(h.at)}
                                      {h.byName ? ` · ${h.byName}` : ''}
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}

      <Pagination page={data.page} pages={data.pages} total={data.total} onPage={setPage} />

      {/* edit dialog */}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent wide title="অর্ডার এডিট" description="পরিমাণ, একক বা দর বদলান — ইতিহাসে রেকর্ড থাকবে">
          {edit && (
            <div className="space-y-3">
              {edit.items.map((it, idx) => {
                const ip = products.find((x) => x._id === it.product);
                const iunits = unitsOf(ip);
                return (
                  <div key={idx} className="grid grid-cols-[1fr_64px_80px_80px_32px] items-end gap-2">
                    <Field label={idx === 0 ? 'পণ্য' : undefined}>
                      <Select value={it.product} onChange={(e) => setEditItem(idx, 'product', e.target.value)}>
                        <option value="">— পণ্য —</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} ({p.unit})
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label={idx === 0 ? 'পরিমাণ' : undefined}>
                      <Input
                        type="number"
                        step="0.1"
                        min="0"
                        value={it.quantity}
                        onChange={(e) => setEditItem(idx, 'quantity', e.target.value)}
                      />
                    </Field>
                    <Field label={idx === 0 ? 'একক' : undefined}>
                      <Select value={it.unit} onChange={(e) => setEditItem(idx, 'unit', e.target.value)} className="px-2">
                        {iunits.length === 0 && <option value="">—</option>}
                        {iunits.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label={idx === 0 ? 'দর (৳)' : undefined}>
                      <Input
                        type="number"
                        step="0.5"
                        min="0"
                        value={it.rate}
                        onChange={(e) => setEditItem(idx, 'rate', e.target.value)}
                      />
                    </Field>
                    <Button
                      variant="dangerGhost"
                      size="icon"
                      onClick={() =>
                        setEdit((e) => ({
                          ...e,
                          items: e.items.length > 1 ? e.items.filter((_, i) => i !== idx) : e.items,
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => setEdit((e) => ({ ...e, items: [...e.items, { product: '', quantity: '', unit: '', rate: '' }] }))}
              >
                <Plus className="h-3.5 w-3.5" />
                আরেকটি পণ্য
              </Button>

              <Field label="নোট">
                <Input value={edit.note} onChange={(e) => setEdit((x) => ({ ...x, note: e.target.value }))} />
              </Field>

              <div className="flex items-center justify-between border-t border-leaf-100 pt-3">
                <span className="text-sm text-stone-500">
                  নতুন মোট: <span className="num font-semibold text-leaf-900">{taka(editTotal)}</span>
                </span>
                <div className="flex gap-2">
                  <DialogClose asChild>
                    <Button variant="ghost">বাতিল</Button>
                  </DialogClose>
                  <Button onClick={saveEdit} loading={savingEdit}>
                    সেভ করুন
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
