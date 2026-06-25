'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Users, Plus, Pencil, HandCoins, NotebookText, Tags, KeyRound, BadgeCheck, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { bn, taka, todayStr, CUSTOMER_TYPES, CUSTOMER_TYPE_LABEL } from '@/lib/utils';
import {
  PageHeader, Card, CardContent, Button, Input, Field, Select, Switch, Badge, Textarea,
  Table, THead, TH, TR, TD, PageLoader, EmptyState,
  Dialog, DialogContent, DialogClose,
} from '@/components/ui';

const emptyForm = { name: '', type: 'shop', phone: '', address: '', note: '', password: '' };
const typeTone = { shop: 'leaf', factory: 'ghee', individual: 'stone' };

export default function CustomersPage() {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState(null);
  const [products, setProducts] = useState([]);
  const [editTarget, setEditTarget] = useState(null); // null | 'new' | customer
  const [payTarget, setPayTarget] = useState(null);
  const [rateTarget, setRateTarget] = useState(null);
  const [pwTarget, setPwTarget] = useState(null);
  const [pwValue, setPwValue] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [pay, setPay] = useState({ date: todayStr(), amount: '', note: '' });
  const [rateMap, setRateMap] = useState({});
  const [busy, setBusy] = useState(false);

  const load = () =>
    Promise.all([api('/customers?all=1'), api('/products?all=1')])
      .then(([c, p]) => {
        setCustomers(c);
        setProducts(p.filter((x) => x.active));
      })
      .catch((err) => toast.error(err.message));

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditTarget('new');
  };
  const openEdit = (c) => {
    setForm({ name: c.name, type: c.type, phone: c.phone || '', address: c.address || '', note: c.note || '' });
    setEditTarget(c);
  };
  const openPay = (c) => {
    setPay({ date: todayStr(), amount: '', note: '' });
    setPayTarget(c);
  };
  const openRates = (c) => {
    const m = {};
    for (const p of products) {
      const hit = c.rates?.find((r) => String(r.product) === String(p._id));
      m[p._id] = hit ? hit.rate : '';
    }
    setRateMap(m);
    setRateTarget(c);
  };

  const saveCustomer = async () => {
    setBusy(true);
    try {
      if (editTarget === 'new') {
        await api('/customers', { method: 'POST', body: form });
        toast.success('কাস্টমার যোগ হয়েছে');
      } else {
        await api(`/customers/${editTarget._id}`, { method: 'PUT', body: form });
        toast.success('কাস্টমার আপডেট হয়েছে');
      }
      setEditTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (c, active) => {
    try {
      await api(`/customers/${c._id}`, { method: 'PUT', body: { active } });
      setCustomers((list) => list.map((x) => (x._id === c._id ? { ...x, active } : x)));
      toast.success(active ? `${c.name} চালু হলো` : `${c.name} বন্ধ হলো`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const savePayment = async () => {
    setBusy(true);
    try {
      await api(`/customers/${payTarget._id}/payments`, {
        method: 'POST',
        body: { date: pay.date, amount: Number(pay.amount), note: pay.note },
      });
      toast.success(`${payTarget.name} থেকে ${taka(pay.amount)} আদায় হয়েছে`);
      setPayTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveRates = async () => {
    setBusy(true);
    try {
      const rates = Object.entries(rateMap)
        .filter(([, v]) => Number(v) > 0)
        .map(([product, rate]) => ({ product, rate: Number(rate) }));
      await api(`/customers/${rateTarget._id}/rates`, { method: 'PUT', body: { rates } });
      toast.success(`${rateTarget.name}-এর রেট সেভ হয়েছে`);
      setRateTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleApprove = async (c) => {
    try {
      const res = await api(`/customers/${c._id}/approve`, { method: 'POST' });
      setCustomers((list) => list.map((x) => (x._id === c._id ? { ...x, approved: res.approved } : x)));
      toast.success(res.approved ? `${c.name} অনুমোদিত হলো` : `${c.name}-এর অনুমোদন বাতিল`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openPw = (c) => {
    setPwValue('');
    setPwTarget(c);
  };
  const savePw = async () => {
    setBusy(true);
    try {
      const res = await api(`/customers/${pwTarget._id}/password`, { method: 'PUT', body: { password: pwValue } });
      toast.success(res.created ? 'লগইন তৈরি হয়েছে' : 'পাসওয়ার্ড পরিবর্তন হয়েছে');
      setPwTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!customers) return <PageLoader />;

  const totalDue = customers.reduce((s, c) => s + c.due, 0);
  const pendingCount = customers.filter((c) => c.hasLogin && !c.approved).length;

  return (
    <div>
      <PageHeader
        title="কাস্টমার"
        desc={`মোট ${bn(customers.length)} জন · সব মিলিয়ে পাবো ${taka(totalDue)}${
          pendingCount > 0 ? ` · ${bn(pendingCount)} জন অনুমোদনের অপেক্ষায়` : ''
        }`}
      >
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          নতুন কাস্টমার
        </Button>
      </PageHeader>

      {customers.length === 0 ? (
        <EmptyState icon={Users} title="কোনো কাস্টমার নেই" desc="দোকান, ফ্যাক্টরি বা ব্যক্তি কাস্টমার যোগ করুন।">
          <Button onClick={openNew}>কাস্টমার যোগ করুন</Button>
        </EmptyState>
      ) : (
        <Card>
          <CardContent className="pt-5">
            <Table>
              <THead>
                <tr>
                  <TH>নাম</TH>
                  <TH>ধরন</TH>
                  <TH className="text-right">মোট বিক্রি</TH>
                  <TH className="text-right">জমা</TH>
                  <TH className="text-right">বাকি (পাবো)</TH>
                  {isAdmin && <TH>লগইন</TH>}
                  <TH>চালু</TH>
                  <TH className="text-right">অ্যাকশন</TH>
                </tr>
              </THead>
              <tbody>
                {customers.map((c) => (
                  <TR key={c._id} className={!c.active ? 'opacity-50' : ''}>
                    <TD>
                      <p className="font-medium text-leaf-900">{c.name}</p>
                      {c.phone && <p className="text-[11px] text-stone-400">{c.phone}</p>}
                    </TD>
                    <TD>
                      <Badge tone={typeTone[c.type] || 'stone'}>{CUSTOMER_TYPE_LABEL[c.type]}</Badge>
                    </TD>
                    <TD className="num text-right">{taka(c.totalSales)}</TD>
                    <TD className="num text-right text-leaf-700">{taka(c.totalPaid)}</TD>
                    <TD className="num text-right">
                      {c.due > 0 ? <span className="font-semibold text-rose-600">{taka(c.due)}</span> : '—'}
                    </TD>
                    {isAdmin && (
                      <TD>
                        {c.hasLogin ? (
                          <button onClick={() => toggleApprove(c)} title="ক্লিক করে অনুমোদন টগল করুন">
                            {c.approved ? (
                              <Badge tone="leaf"><BadgeCheck className="h-3 w-3" /> অনুমোদিত</Badge>
                            ) : (
                              <Badge tone="ghee"><Clock className="h-3 w-3" /> অপেক্ষমাণ</Badge>
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-stone-400">লগইন নেই</span>
                        )}
                      </TD>
                    )}
                    <TD>
                      <Switch checked={c.active} onChange={(v) => toggleActive(c, v)} />
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openPay(c)}>
                          <HandCoins className="h-3.5 w-3.5" />
                          টাকা নিন
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => openRates(c)} title="বিশেষ রেট">
                            <Tags className="h-4 w-4" />
                          </Button>
                        )}
                        {isAdmin && (
                          <Button variant="ghost" size="icon" onClick={() => openPw(c)} title="লগইন / পাসওয়ার্ড">
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        )}
                        <Link href={`/ledger/customer/${c._id}`}>
                          <Button variant="ghost" size="icon" title="খাতা">
                            <NotebookText className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="এডিট">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* add/edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent title={editTarget === 'new' ? 'নতুন কাস্টমার' : 'কাস্টমার এডিট'}>
          <div className="space-y-4">
            <Field label="নাম">
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="ধরন">
              <Select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                {CUSTOMER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="মোবাইল (ঐচ্ছিক)">
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </Field>
              <Field label="ঠিকানা (ঐচ্ছিক)">
                <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
              </Field>
            </div>
            <Field label="নোট (ঐচ্ছিক)">
              <Textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </Field>
            {editTarget === 'new' && isAdmin && (
              <Field label="লগইন পাসওয়ার্ড (ঐচ্ছিক — দিলে কাস্টমার অ্যাপ থেকে অর্ডার করতে পারবে)">
                <Input
                  type="text"
                  placeholder="কমপক্ষে ৬ অক্ষর · মোবাইল নম্বর লাগবে"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                />
              </Field>
            )}
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost">বাতিল</Button>
              </DialogClose>
              <Button onClick={saveCustomer} loading={busy} disabled={!form.name}>
                সেভ করুন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* due collection dialog */}
      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent
          title={`${payTarget?.name || ''} — বকেয়া আদায়`}
          description={payTarget ? `এখন পর্যন্ত বাকি: ${taka(payTarget.due)}` : ''}
        >
          <div className="space-y-4">
            <Field label="তারিখ">
              <Input type="date" value={pay.date} onChange={(e) => setPay((p) => ({ ...p, date: e.target.value }))} />
            </Field>
            <Field label="টাকার পরিমাণ (৳)">
              <Input
                type="number"
                step="1"
                min="0"
                value={pay.amount}
                onChange={(e) => setPay((p) => ({ ...p, amount: e.target.value }))}
              />
            </Field>
            <Field label="নোট (ঐচ্ছিক)">
              <Input value={pay.note} onChange={(e) => setPay((p) => ({ ...p, note: e.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost">বাতিল</Button>
              </DialogClose>
              <Button onClick={savePayment} loading={busy} disabled={!Number(pay.amount)}>
                টাকা নিন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* custom rates dialog */}
      <Dialog open={!!rateTarget} onOpenChange={(o) => !o && setRateTarget(null)}>
        <DialogContent
          title={`${rateTarget?.name || ''} — বিশেষ রেট`}
          description="ঘর খালি রাখলে পণ্যের সাধারণ দাম ধরা হবে"
        >
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p._id} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-leaf-900">{p.name}</p>
                  <p className="text-[11px] text-stone-400">
                    সাধারণ দাম: {taka(p.defaultRate)}/{p.unit}
                  </p>
                </div>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder={String(p.defaultRate)}
                  value={rateMap[p._id] ?? ''}
                  onChange={(e) => setRateMap((m) => ({ ...m, [p._id]: e.target.value }))}
                  className="h-9 w-28"
                />
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <DialogClose asChild>
                <Button variant="ghost">বাতিল</Button>
              </DialogClose>
              <Button onClick={saveRates} loading={busy}>
                রেট সেভ করুন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* login / password dialog */}
      <Dialog open={!!pwTarget} onOpenChange={(o) => !o && setPwTarget(null)}>
        <DialogContent
          title={`${pwTarget?.name || ''} — লগইন / পাসওয়ার্ড`}
          description={
            pwTarget?.hasLogin
              ? `নতুন পাসওয়ার্ড দিন (বর্তমান পাসওয়ার্ড লাগবে না)। লগইন: ${pwTarget?.loginPhone || ''}`
              : `এই কাস্টমারের মোবাইল নম্বর (${pwTarget?.phone || '—'}) দিয়ে নতুন লগইন তৈরি হবে।`
          }
        >
          <div className="space-y-4">
            <Field label="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)">
              <Input
                type="text"
                value={pwValue}
                onChange={(e) => setPwValue(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড"
              />
            </Field>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost">বাতিল</Button>
              </DialogClose>
              <Button onClick={savePw} loading={busy} disabled={pwValue.length < 6}>
                {pwTarget?.hasLogin ? 'পাসওয়ার্ড পরিবর্তন' : 'লগইন তৈরি করুন'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
