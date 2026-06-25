'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Banknote, Plus, Trash2, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { bn, taka, rateFor, SHIFT_LABEL, todayStr } from '@/lib/utils';
import {
  PageHeader, Card, CardHeader, CardTitle, CardContent, Button, Input, Select, Field,
  Table, THead, TH, TR, TD, DayShiftPicker, PageLoader, Tabs, Badge,
  Dialog, DialogTrigger, DialogContent, DialogClose, Textarea,
} from '@/components/ui';

const itemsSummary = (items = []) =>
  items.map((i) => `${i.name} ${bn(i.quantity)} ${i.unit}`).join(', ') || '—';

const emptyItem = () => ({ product: '', quantity: '', unit: '', rate: '' });
const unitsOf = (p) => (p?.unitOptions?.length ? p.unitOptions : p ? [p.unit] : []);

export default function SalesPage() {
  const { user, isAdmin, isEmployee } = useAuth();
  const [date, setDate] = useState(todayStr());
  const [shift, setShift] = useState('morning');
  const [sellerKey, setSellerKey] = useState('owner');
  const [tab, setTab] = useState('quick');

  const [customers, setCustomers] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [daySales, setDaySales] = useState([]);
  const [grid, setGrid] = useState({});
  const [saving, setSaving] = useState(false);

  // full-sale dialog
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer: '', items: [emptyItem()], paid: '', note: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api('/customers'), api('/products')])
      .then(([c, p]) => {
        setCustomers(c.filter((x) => x.active));
        setProducts(p.filter((x) => x.active));
      })
      .catch((err) => toast.error(err.message));
    // employees list (for the seller dropdown) is admin-only
    if (isAdmin) {
      api('/employees')
        .then((e) => setEmployees(e.filter((x) => x.active)))
        .catch(() => {});
    }
  }, [isAdmin]);

  // an employee only ever sells as themselves
  useEffect(() => {
    if (isEmployee && user?.employee) setSellerKey(String(user.employee));
  }, [isEmployee, user]);

  const loadDay = (d) =>
    api(`/sales?date=${d}`)
      .then(setDaySales)
      .catch((err) => toast.error(err.message));

  useEffect(() => {
    loadDay(date);
  }, [date]);

  const quickProducts = useMemo(() => (products || []).filter((p) => p.quickSale), [products]);
  const gridCustomers = useMemo(
    () => (customers || []).filter((c) => c.type !== 'individual'),
    [customers]
  );

  // prefill the grid from saved quick sales for this date+shift+seller
  useEffect(() => {
    if (!customers) return;
    const g = {};
    for (const c of gridCustomers) {
      const sale = daySales.find(
        (s) => s.quick && s.shift === shift && s.soldBy?.key === sellerKey && s.customer?._id === c._id
      );
      const row = { paid: sale ? sale.paid : '' };
      for (const p of quickProducts) {
        const item = sale?.items?.find((i) => String(i.product) === String(p._id));
        row[p._id] = item ? item.quantity : '';
      }
      g[c._id] = row;
    }
    setGrid(g);
  }, [customers, gridCustomers, quickProducts, daySales, shift, sellerKey]);

  const rowTotal = (c) =>
    quickProducts.reduce((sum, p) => {
      const q = Number(grid[c._id]?.[p._id]) || 0;
      return sum + q * rateFor(c, p._id, p.defaultRate);
    }, 0);

  const gridTotals = useMemo(() => {
    let total = 0;
    let paid = 0;
    for (const c of gridCustomers) {
      total += rowTotal(c);
      paid += Number(grid[c._id]?.paid) || 0;
    }
    return { total, paid };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid, gridCustomers, quickProducts]);

  const setCell = (custId, key, value) =>
    setGrid((g) => ({ ...g, [custId]: { ...g[custId], [key]: value } }));

  const saveGrid = async () => {
    setSaving(true);
    try {
      const rows = gridCustomers.map((c) => ({
        customer: c._id,
        items: quickProducts.map((p) => ({ product: p._id, quantity: Number(grid[c._id]?.[p._id]) || 0 })),
        paid: Number(grid[c._id]?.paid) || 0,
      }));
      const saved = await api('/sales/batch', { method: 'POST', body: { date, shift, sellerKey, rows } });
      setDaySales(saved);
      toast.success(`${SHIFT_LABEL[shift]}ের বিক্রি সেভ হয়েছে`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ---------- full sale dialog ---------- */
  const formCustomer = customers?.find((c) => c._id === form.customer);

  const setItem = (idx, key, value) =>
    setForm((f) => {
      const items = f.items.map((it, i) => {
        if (i !== idx) return it;
        const next = { ...it, [key]: value };
        if (key === 'product') {
          const p = products.find((x) => x._id === value);
          next.rate = p ? rateFor(formCustomer, p._id, p.defaultRate) : '';
          next.unit = p ? unitsOf(p)[0] : '';
        }
        return next;
      });
      return { ...f, items };
    });

  const formTotal = form.items.reduce(
    (s, it) => s + (Number(it.quantity) || 0) * (Number(it.rate) || 0),
    0
  );

  const submitSale = async () => {
    setBusy(true);
    try {
      await api('/sales', {
        method: 'POST',
        body: {
          date,
          shift,
          sellerKey,
          customer: form.customer,
          items: form.items
            .filter((it) => it.product && Number(it.quantity) > 0)
            .map((it) => ({ product: it.product, quantity: Number(it.quantity), unit: it.unit || undefined, rate: Number(it.rate) || undefined })),
          paid: Number(form.paid) || 0,
          note: form.note,
        },
      });
      toast.success('বিক্রি সেভ হয়েছে');
      setOpen(false);
      setForm({ customer: '', items: [emptyItem()], paid: '', note: '' });
      loadDay(date);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeSale = async (id) => {
    try {
      await api(`/sales/${id}`, { method: 'DELETE' });
      setDaySales((list) => list.filter((s) => s._id !== id));
      toast.success('বিক্রি মুছে ফেলা হয়েছে');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!customers) return <PageLoader />;

  const dayTotals = daySales.reduce(
    (a, s) => ({ total: a.total + s.total, paid: a.paid + s.paid, due: a.due + s.due }),
    { total: 0, paid: 0, due: 0 }
  );

  return (
    <div>
      <PageHeader title="বিক্রি" desc="দ্রুত গ্রিডে দিনের দুধ-বিক্রি, আর আলাদা ফর্মে দই-পনির-ঘি">
        <DayShiftPicker date={date} onDate={setDate} shift={shift} onShift={setShift} />
        {isEmployee ? (
          <Badge tone="leaf" className="h-9 px-3">বিক্রেতা: {user?.name}</Badge>
        ) : (
          <Select value={sellerKey} onChange={(e) => setSellerKey(e.target.value)} className="w-auto min-w-[140px]">
            <option value="owner">বিক্রেতা: মালিক</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                বিক্রেতা: {e.name}
              </option>
            ))}
          </Select>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'quick', label: 'দ্রুত এন্ট্রি' },
            { value: 'list', label: `সব বিক্রি (${bn(daySales.length)})` },
          ]}
        />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              নতুন বিক্রি (দই/পনির/ঘি)
            </Button>
          </DialogTrigger>
          <DialogContent wide title="নতুন বিক্রি" description="যেকোনো পণ্য, দর চাইলে বদলানো যাবে">
            <div className="space-y-4">
              <Field label="কাস্টমার">
                <Select value={form.customer} onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}>
                  <option value="">— বেছে নিন —</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="space-y-2">
                {form.items.map((it, idx) => {
                  const ip = products.find((x) => x._id === it.product);
                  const iunits = unitsOf(ip);
                  return (
                  <div key={idx} className="grid grid-cols-[1fr_70px_84px_84px_36px] items-end gap-2">
                    <Field label={idx === 0 ? 'পণ্য' : undefined}>
                      <Select value={it.product} onChange={(e) => setItem(idx, 'product', e.target.value)}>
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
                        placeholder="0"
                        value={it.quantity}
                        onChange={(e) => setItem(idx, 'quantity', e.target.value)}
                      />
                    </Field>
                    <Field label={idx === 0 ? 'একক' : undefined}>
                      <Select
                        value={it.unit}
                        onChange={(e) => setItem(idx, 'unit', e.target.value)}
                        disabled={!it.product}
                        className="px-2"
                      >
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
                        onChange={(e) => setItem(idx, 'rate', e.target.value)}
                      />
                    </Field>
                    <Button
                      variant="dangerGhost"
                      size="icon"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          items: f.items.length > 1 ? f.items.filter((_, i) => i !== idx) : [emptyItem()],
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
                  onClick={() => setForm((f) => ({ ...f, items: [...f.items, emptyItem()] }))}
                >
                  <Plus className="h-3.5 w-3.5" />
                  আরেকটি পণ্য
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={`নগদ নিলাম (মোট ${taka(formTotal)})`}>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={form.paid}
                    onChange={(e) => setForm((f) => ({ ...f, paid: e.target.value }))}
                  />
                </Field>
                <Field label="নোট (ঐচ্ছিক)">
                  <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
                </Field>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <DialogClose asChild>
                  <Button variant="ghost">বাতিল</Button>
                </DialogClose>
                <Button onClick={submitSale} loading={busy} disabled={!form.customer}>
                  সেভ করুন
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {tab === 'quick' ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {SHIFT_LABEL[shift]}ের দ্রুত বিক্রি —{' '}
              {sellerKey === 'owner' ? 'মালিক' : employees.find((e) => e._id === sellerKey)?.name}
            </CardTitle>
            <Button onClick={saveGrid} loading={saving} className="gap-2">
              <Save className="h-4 w-4" />
              সেভ করুন
            </Button>
          </CardHeader>
          <CardContent>
            {quickProducts.length === 0 ? (
              <p className="py-4 text-center text-sm text-stone-400">
                ‘পণ্য’ পাতায় গিয়ে দুধের পণ্যে “দ্রুত বিক্রি” চালু করুন — তাহলে এখানে কলাম আসবে।
              </p>
            ) : (
              <>
                <Table>
                  <THead>
                    <tr>
                      <TH>দোকান/কাস্টমার</TH>
                      {quickProducts.map((p) => (
                        <TH key={p._id} className="w-28">
                          {p.name} ({p.unit})
                        </TH>
                      ))}
                      <TH className="text-right">মোট</TH>
                      <TH className="w-28">নগদ (৳)</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {gridCustomers.map((c) => (
                      <TR key={c._id}>
                        <TD>
                          <p className="font-medium text-leaf-900">{c.name}</p>
                          <p className="text-[11px] text-stone-400">
                            {quickProducts.map((p) => `${p.name} ৳${bn(rateFor(c, p._id, p.defaultRate))}`).join(' · ')}
                          </p>
                        </TD>
                        {quickProducts.map((p) => (
                          <TD key={p._id}>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="0"
                              value={grid[c._id]?.[p._id] ?? ''}
                              onChange={(e) => setCell(c._id, p._id, e.target.value)}
                              className="h-9"
                            />
                          </TD>
                        ))}
                        <TD className="num text-right font-semibold text-leaf-900">{taka(rowTotal(c))}</TD>
                        <TD>
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="0"
                            value={grid[c._id]?.paid ?? ''}
                            onChange={(e) => setCell(c._id, 'paid', e.target.value)}
                            className="h-9"
                          />
                        </TD>
                      </TR>
                    ))}
                    <TR className="bg-leaf-50/60">
                      <TD className="font-display text-leaf-900">মোট</TD>
                      {quickProducts.map((p) => (
                        <TD key={p._id} />
                      ))}
                      <TD className="num text-right font-display text-lg text-leaf-900">{taka(gridTotals.total)}</TD>
                      <TD className="num font-semibold">{taka(gridTotals.paid)}</TD>
                    </TR>
                  </tbody>
                </Table>
                <p className="mt-3 text-xs text-stone-400">
                  দর প্রতিটি কাস্টমারের নিজের রেট অনুযায়ী নিজে নিজেই বসে। ঘর খালি/০ করে সেভ করলে সেই এন্ট্রি মুছে যায়।
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>এই দিনের সব বিক্রি</CardTitle>
            <div className="text-right text-sm">
              <span className="num font-semibold text-leaf-900">{taka(dayTotals.total)}</span>
              <span className="text-stone-400"> · নগদ {taka(dayTotals.paid)} · বাকি </span>
              <span className="num font-semibold text-rose-600">{taka(dayTotals.due)}</span>
            </div>
          </CardHeader>
          <CardContent>
            {daySales.length === 0 ? (
              <p className="py-4 text-center text-sm text-stone-400">এখনো কোনো বিক্রি নেই</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>শিফট</TH>
                    <TH>কাস্টমার</TH>
                    <TH>বিক্রেতা</TH>
                    <TH>পণ্য</TH>
                    <TH className="text-right">মোট</TH>
                    <TH className="text-right">নগদ</TH>
                    <TH className="text-right">বাকি</TH>
                    <TH className="w-12" />
                  </tr>
                </THead>
                <tbody>
                  {daySales.map((s) => (
                    <TR key={s._id}>
                      <TD>
                        {s.channel === 'online' ? (
                          <Badge tone="ghee">অনলাইন</Badge>
                        ) : (
                          SHIFT_LABEL[s.shift] || '—'
                        )}
                      </TD>
                      <TD className="font-medium text-leaf-900">{s.customer?.name || '—'}</TD>
                      <TD>{s.soldBy?.label || 'মালিক'}</TD>
                      <TD className="max-w-[260px] truncate" title={itemsSummary(s.items)}>
                        {itemsSummary(s.items)}
                      </TD>
                      <TD className="num text-right font-semibold">{taka(s.total)}</TD>
                      <TD className="num text-right text-leaf-700">{taka(s.paid)}</TD>
                      <TD className="num text-right">
                        {s.due > 0 ? <span className="font-semibold text-rose-600">{taka(s.due)}</span> : '—'}
                      </TD>
                      <TD>
                        {isAdmin && (
                          <Button variant="dangerGhost" size="icon" onClick={() => removeSale(s._id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
