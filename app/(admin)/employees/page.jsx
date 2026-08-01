'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserCog, Plus, Pencil, Wallet, KeyRound, Phone, MapPin, TrendingUp, ArrowDownToLine, Banknote, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { bn, taka, todayStr, bnDate, monthStr, SHIFT_LABEL, CUSTOMER_TYPE_LABEL } from '@/lib/utils';
import {
  PageHeader, Card, CardContent, Button, Input, Field, Switch, Badge,
  PageLoader, EmptyState, Spinner,
  Dialog, DialogContent, DialogClose,
} from '@/components/ui';

const emptyForm = { name: '', phone: '', address: '', note: '', password: '' };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // null | 'new' | employee
  const [accTarget, setAccTarget] = useState(null); // employee
  const [pwTarget, setPwTarget] = useState(null);
  const [pwValue, setPwValue] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);

  // account dialog state
  const [accTab, setAccTab] = useState('monthly'); // 'monthly' | 'daily'
  const [accDate, setAccDate] = useState(todayStr());
  const [accMonth, setAccMonth] = useState(monthStr());
  const [account, setAccount] = useState(null);   // daily data
  const [monthly, setMonthly] = useState(null);   // monthly data
  const [dep, setDep] = useState({ amount: '', note: '' });

  const load = () =>
    api('/employees?all=1')
      .then(setEmployees)
      .catch((err) => toast.error(err.message));

  useEffect(() => {
    load();
  }, []);

  const loadAccount = (emp, date) => {
    setAccount(null);
    api(`/employees/${emp._id}/account?date=${date}`)
      .then(setAccount)
      .catch((err) => toast.error(err.message));
  };

  const loadMonthly = (emp, month) => {
    setMonthly(null);
    api(`/employees/${emp._id}/monthly?month=${month}`)
      .then(setMonthly)
      .catch((err) => toast.error(err.message));
  };

  const openAccount = (emp) => {
    setAccTarget(emp);
    setAccTab('monthly');
    setAccDate(todayStr());
    setAccMonth(monthStr());
    setDep({ amount: '', note: '' });
    setMonthly(null);
    setAccount(null);
    loadMonthly(emp, monthStr());
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditTarget('new');
  };
  const openEdit = (e) => {
    setForm({ name: e.name, phone: e.phone || '', address: e.address || '', note: e.note || '' });
    setEditTarget(e);
  };

  const saveEmployee = async () => {
    setBusy(true);
    try {
      if (editTarget === 'new') {
        await api('/employees', { method: 'POST', body: form });
        toast.success('কর্মচারী যোগ হয়েছে');
      } else {
        await api(`/employees/${editTarget._id}`, { method: 'PUT', body: form });
        toast.success('কর্মচারী আপডেট হয়েছে');
      }
      setEditTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (e, active) => {
    try {
      await api(`/employees/${e._id}`, { method: 'PUT', body: { active } });
      setEmployees((list) => list.map((x) => (x._id === e._id ? { ...x, active } : x)));
      toast.success(active ? `${e.name} চালু হলো` : `${e.name} বন্ধ হলো`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const openPw = (e) => {
    setPwValue('');
    setPwTarget(e);
  };
  const savePw = async () => {
    setBusy(true);
    try {
      const res = await api(`/employees/${pwTarget._id}/password`, { method: 'PUT', body: { password: pwValue } });
      toast.success(res.created ? 'লগইন তৈরি হয়েছে' : 'পাসওয়ার্ড পরিবর্তন হয়েছে');
      setPwTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveDeposit = async () => {
    setBusy(true);
    try {
      await api(`/employees/${accTarget._id}/deposits`, {
        method: 'POST',
        body: { date: accDate, amount: Number(dep.amount), note: dep.note },
      });
      toast.success(`${accTarget.name} ${taka(dep.amount)} জমা দিয়েছে`);
      setDep({ amount: '', note: '' });
      if (accTab === 'daily') loadAccount(accTarget, accDate);
      loadMonthly(accTarget, accMonth);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!employees) return <PageLoader />;

  const ShiftCard = ({ label, s }) => (
    <div className="rounded-xl bg-leaf-50/70 p-4">
      <p className="text-sm font-semibold text-leaf-900/70">{label}</p>
      <p className="num mt-1 font-display text-2xl text-leaf-900">{taka(s.total)}</p>
      <p className="text-sm text-stone-500">
        {bn(s.count)}টি দোকান · {bn(s.kg)} কেজি · নগদ {taka(s.paid)}
        {s.due > 0 && <span className="text-rose-600"> · বাকি {taka(s.due)}</span>}
      </p>
    </div>
  );

  const BNMONTHS = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
  const bnMonth = (m) => { // m = 'YYYY-MM'
    if (!m) return '';
    const [y, mo] = m.split('-');
    return `${BNMONTHS[parseInt(mo, 10) - 1]} ${y}`;
  };

  return (
    <div>
      <PageHeader title="কর্মচারী" desc="কে কত বিক্রি করলো, কত নগদ তুললো, কত জমা দিলো — সব হিসাব">
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          নতুন কর্মচারী
        </Button>
      </PageHeader>

      {employees.length === 0 ? (
        <EmptyState icon={UserCog} title="কোনো কর্মচারী নেই" desc="যারা দোকানে দোকানে বিক্রি করে, তাদের যোগ করুন।">
          <Button onClick={openNew}>কর্মচারী যোগ করুন</Button>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {employees.map((e) => (
            <Card key={e._id} className={`flex flex-col overflow-hidden ${!e.active ? 'opacity-55' : ''}`}>
              {/* top color bar */}
              <div className={`h-1 w-full ${e.inHand > 0 ? 'bg-ghee-400' : 'bg-leaf-500'}`} />

              {/* header */}
              <div className="flex items-start justify-between gap-3 border-b border-leaf-100 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg leading-tight text-leaf-900 truncate">{e.name}</p>
                    {!e.active && <Badge tone="stone">বন্ধ</Badge>}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    {e.phone && (
                      <span className="flex items-center gap-1 text-xs text-stone-400">
                        <Phone className="h-3 w-3" />{e.phone}
                      </span>
                    )}
                    {e.address && (
                      <span className="flex items-center gap-1 text-xs text-stone-400 max-w-[140px] truncate">
                        <MapPin className="h-3 w-3 shrink-0" />{e.address}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {e.hasLogin ? <Badge tone="leaf">লগইন আছে</Badge> : <Badge tone="stone">লগইন নেই</Badge>}
                  </div>
                </div>
                <Switch checked={e.active} onChange={(v) => toggleActive(e, v)} />
              </div>

              <div className="flex flex-col gap-3 p-5">
                {/* inHand */}
                <div className={`flex items-center justify-between rounded-xl p-3.5 ${
                  e.inHand > 0 ? 'bg-ghee-100/80' : 'bg-leaf-50/60'
                }`}>
                  <div>
                    <p className="text-[11px] font-semibold text-stone-500">হাতে আছে (জমা দেয়নি)</p>
                    <p className={`num mt-0.5 font-display text-2xl ${
                      e.inHand > 0 ? 'text-ghee-700' : 'text-leaf-700'
                    }`}>{taka(e.inHand)}</p>
                  </div>
                  {e.inHand > 0 && <AlertCircle className="h-5 w-5 text-ghee-500" />}
                </div>

                {/* stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-leaf-50/60 px-2.5 py-2">
                    <div className="flex items-center gap-1 text-[10px] text-stone-400">
                      <TrendingUp className="h-3 w-3" />মোট বিক্রি
                    </div>
                    <p className="num mt-0.5 text-sm font-semibold text-leaf-900">{taka(e.totalSales)}</p>
                  </div>
                  <div className="rounded-lg bg-leaf-50/60 px-2.5 py-2">
                    <div className="flex items-center gap-1 text-[10px] text-stone-400">
                      <Banknote className="h-3 w-3" />নগদ তুলেছে
                    </div>
                    <p className="num mt-0.5 text-sm font-semibold text-leaf-900">{taka(e.cashCollected)}</p>
                  </div>
                  <div className="rounded-lg bg-leaf-50/60 px-2.5 py-2">
                    <div className="flex items-center gap-1 text-[10px] text-stone-400">
                      <ArrowDownToLine className="h-3 w-3" />জমা দিয়েছে
                    </div>
                    <p className="num mt-0.5 text-sm font-semibold text-leaf-700">{taka(e.deposited)}</p>
                  </div>
                </div>

                {e.note && <p className="text-xs text-stone-400 italic">{e.note}</p>}
              </div>

              {/* actions */}
              <div className="mt-auto flex gap-2 border-t border-leaf-100 px-5 py-3">
                <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => openAccount(e)}>
                  <Wallet className="h-3.5 w-3.5" />
                  হিসাব ও জমা
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openPw(e)} title="লগইন / পাসওয়ার্ড">
                  <KeyRound className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(e)} title="এডিট">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* add/edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent title={editTarget === 'new' ? 'নতুন কর্মচারী' : 'কর্মচারী এডিট'}>
          <div className="space-y-4">
            <Field label="নাম">
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
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
              <Input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            </Field>
            {editTarget === 'new' && (
              <Field label="লগইন পাসওয়ার্ড (ঐচ্ছিক — দিলে কর্মচারী লগইন করে কাজ করতে পারবে)">
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
              <Button onClick={saveEmployee} loading={busy} disabled={!form.name}>
                সেভ করুন
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
              : `এই কর্মচারীর মোবাইল নম্বর (${pwTarget?.phone || '—'}) দিয়ে নতুন লগইন তৈরি হবে।`
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

      {/* account dialog */}
      <Dialog open={!!accTarget} onOpenChange={(o) => !o && setAccTarget(null)}>
        <DialogContent wide title={`${accTarget?.name || ''} — হিসাব`}>
          {/* tab switcher */}
          <div className="mb-5 flex gap-1 rounded-xl bg-leaf-100/70 p-1">
            {[{ v: 'monthly', l: 'মাসিক হিসাব' }, { v: 'daily', l: 'দৈনিক হিসাব' }, { v: 'deposit', l: 'জমা নিন' }].map((t) => (
              <button
                key={t.v}
                onClick={() => {
                  setAccTab(t.v);
                  if (t.v === 'daily' && accTarget && !account) loadAccount(accTarget, accDate);
                }}
                className={`flex-1 rounded-lg py-2.5 text-base font-medium transition-all ${
                  accTab === t.v ? 'bg-surface text-leaf-900 shadow-sm' : 'text-leaf-800/60 hover:text-leaf-900'
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>

          {/* ── MONTHLY TAB ── */}
          {accTab === 'monthly' && (
            <div className="space-y-4">
              {/* month selector */}
              <div className="flex items-center gap-2">
                <input
                  type="month"
                  value={accMonth}
                  onChange={(e) => {
                    setAccMonth(e.target.value);
                    if (accTarget) loadMonthly(accTarget, e.target.value);
                  }}
                  className="h-11 rounded-xl border border-leaf-200/80 bg-surface px-3.5 text-base focus:outline-none focus:ring-2 focus:ring-leaf-500/60"
                />
                <span className="text-base font-semibold text-leaf-900">{bnMonth(accMonth)}</span>
              </div>

              {!monthly ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : (
                <>
                  {/* monthly summary strip */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {[
                      { label: 'মোট বিক্রি', value: monthly.monthTotals.totalSales, tone: 'leaf' },
                      { label: 'নগদ তুলেছে', value: monthly.monthTotals.cashCollected, tone: 'leaf' },
                      { label: 'জমা দিয়েছে', value: monthly.monthTotals.deposited, tone: 'leaf' },
                      { label: 'হাতে আছে', value: monthly.monthTotals.inHand, tone: 'ghee' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-leaf-50/70 px-4 py-3">
                        <p className="text-sm font-semibold text-stone-400">{s.label}</p>
                        <p className={`num mt-1 text-xl font-semibold ${
                          s.tone === 'ghee' && monthly.monthTotals.inHand > 0 ? 'text-ghee-700' : 'text-leaf-900'
                        }`}>{taka(s.value)}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-stone-400">
                    {bn(monthly.monthTotals.saleCount)}টি বিক্রি · {bn(monthly.monthTotals.shopCount)}টি দোকান
                    {monthly.monthTotals.due > 0 && <span className="text-rose-500"> · বাকি {taka(monthly.monthTotals.due)}</span>}
                  </p>

                  {/* per-shop breakdown */}
                  {monthly.shops.length === 0 ? (
                    <p className="py-6 text-center text-sm text-stone-400">এই মাসে কোনো বিক্রি নেই</p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-stone-500">দোকান অনুযায়ী হিসাব</p>
                      {monthly.shops.map((shop) => (
                        <div key={String(shop.customer?._id)} className="rounded-xl border border-leaf-100 overflow-hidden">
                          <div className="flex items-center justify-between gap-3 bg-leaf-50/60 px-4 py-3">
                            <div>
                              <p className="text-base font-semibold text-leaf-900">{shop.customer?.name || 'অজানা'}</p>
                              <p className="text-sm text-stone-400">
                                {CUSTOMER_TYPE_LABEL[shop.customer?.type] || ''}
                                {shop.customer?.address && ` · ${shop.customer.address}`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="num text-base font-semibold text-leaf-900">{taka(shop.cashCollected)}</p>
                              <p className="text-sm text-stone-400">নগদ · বিক্রি {taka(shop.totalSales)}</p>
                              {shop.due > 0 && <p className="text-sm text-rose-500">বাকি {taka(shop.due)}</p>}
                            </div>
                          </div>
                          <div className="divide-y divide-leaf-50">
                            {shop.sales.map((s) => (
                              <div key={String(s._id)} className="flex items-center justify-between px-4 py-2.5 text-sm">
                                <span className="text-stone-500">
                                  {bnDate(s.date)}
                                  <span className="ml-2 text-stone-400">{SHIFT_LABEL[s.shift] || ''}</span>
                                </span>
                                <div className="flex items-center gap-4">
                                  <span className="text-stone-500">বিক্রি {taka(s.total)}</span>
                                  <span className="num font-semibold text-leaf-700">নগদ {taka(s.paid)}</span>
                                  {s.due > 0 && <span className="text-rose-500">বাকি {taka(s.due)}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* monthly deposits */}
                  {monthly.deposits.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-semibold text-stone-500">এই মাসের জমা</p>
                      <div className="space-y-2">
                        {monthly.deposits.map((d) => (
                          <div key={String(d._id)} className="flex items-center justify-between rounded-lg border border-leaf-100 px-4 py-3 text-base">
                            <span className="text-stone-500">
                              {bnDate(d.date)}
                              {d.note && <span className="text-stone-400"> · {d.note}</span>}
                            </span>
                            <span className="num font-semibold text-leaf-700">{taka(d.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── DAILY TAB ── */}
          {accTab === 'daily' && (
            <div className="space-y-4">
              <Input
                type="date"
                value={accDate}
                onChange={(e) => { setAccDate(e.target.value); if (accTarget) loadAccount(accTarget, e.target.value); }}
                className="w-auto"
              />
              {!account ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : (
                <>
                  {/* day totals bar */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(() => {
                      const m = account.day.morning;
                      const a = account.day.afternoon;
                      const daySales = (m.total || 0) + (a.total || 0);
                      const dayCash = (m.paid || 0) + (a.paid || 0);
                      const dayDue = (m.due || 0) + (a.due || 0);
                      return [
                        { l: 'আজকের বিক্রি', v: daySales },
                        { l: 'আজকের নগদ', v: dayCash },
                        { l: 'আজকের বাকি', v: dayDue, rose: true },
                        { l: 'আজকের দোকান', v: (m.count || 0) + (a.count || 0), unit: 'টি' },
                      ];
                    })().map((s) => (
                      <div key={s.l} className="rounded-xl bg-leaf-50/70 px-4 py-3">
                        <p className="text-sm font-semibold text-stone-400">{s.l}</p>
                        <p className={`num mt-1 text-xl font-semibold ${
                          s.rose ? 'text-rose-600' : 'text-leaf-900'
                        }`}>
                          {s.unit ? `${bn(s.v)}${s.unit}` : taka(s.v)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* per-shift shop drill-down */}
                  {['morning', 'afternoon'].map((shift) => {
                    const s = account.day[shift];
                    if (!s.sales?.length) return (
                      <div key={shift} className="rounded-xl bg-leaf-50/40 px-4 py-4">
                        <p className="text-sm font-semibold text-leaf-900/60">{SHIFT_LABEL[shift]} — {bnDate(accDate)}</p>
                        <p className="mt-1 text-sm text-stone-400">এই শিফ্টে কোনো বিক্রি নেই</p>
                      </div>
                    );
                    return (
                      <div key={shift}>
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-base font-semibold text-leaf-900/70">
                            {SHIFT_LABEL[shift]} — {bnDate(accDate)}
                          </p>
                          <p className="text-sm text-stone-400">
                            {bn(s.count)}টি দোকান · নগদ {taka(s.paid)}
                            {s.due > 0 && <span className="text-rose-500"> · বাকি {taka(s.due)}</span>}
                          </p>
                        </div>
                        <div className="space-y-3">
                          {s.sales.map((sale) => (
                            <div key={String(sale._id)} className="rounded-xl border border-leaf-100 overflow-hidden">
                              {/* shop header */}
                              <div className="flex items-center justify-between gap-3 bg-leaf-50/60 px-4 py-3">
                                <div>
                                  <p className="text-base font-semibold text-leaf-900">
                                    {sale.customer?.name || 'অজানা দোকান'}
                                  </p>
                                  {sale.customer?.address && (
                                    <p className="text-sm text-stone-400">{sale.customer.address}</p>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="num text-base font-semibold text-leaf-900">{taka(sale.paid)}</p>
                                  <p className="text-sm text-stone-400">নগদ · বিক্রি {taka(sale.total)}</p>
                                  {sale.due > 0 && (
                                    <p className="text-sm text-rose-500">বাকি {taka(sale.due)}</p>
                                  )}
                                </div>
                              </div>
                              {/* items list */}
                              {sale.items?.length > 0 && (
                                <div className="divide-y divide-leaf-50 px-4">
                                  {sale.items.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-2.5 text-sm">
                                      <span className="text-stone-600">
                                        {item.name}
                                        <span className="ml-1.5 text-stone-400">{bn(item.quantity)} {item.unit}</span>
                                      </span>
                                      <span className="num text-stone-700">{taka(item.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {sale.note && (
                                <p className="px-4 pb-3 text-sm text-stone-400 italic">{sale.note}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {/* lifetime totals */}
                  <div className="rounded-xl border border-leaf-100 px-4 py-3">
                    <p className="mb-2 text-sm font-semibold text-stone-400">সার্বকালীন হিসাব</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { l: 'মোট বিক্রি', v: account.totals.totalSales },
                        { l: 'নগদ তুলেছে', v: account.totals.cashCollected },
                        { l: 'জমা দিয়েছে', v: account.totals.deposited },
                        { l: 'হাতে আছে', v: account.totals.inHand },
                      ].map((s) => (
                        <div key={s.l}>
                          <p className="text-sm text-stone-400">{s.l}</p>
                          <p className="num text-base font-semibold text-leaf-900">{taka(s.v)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {accTab === 'deposit' && (
            <div className="space-y-4">
              <div className="rounded-xl bg-leaf-50/70 p-5">
                <p className="mb-4 text-base font-semibold text-leaf-900">নগদ জমা নিন</p>
                <div className="flex flex-wrap items-end gap-2">
                  <Field label="তারিখ" className="w-36">
                    <Input type="date" value={accDate} onChange={(e) => setAccDate(e.target.value)} />
                  </Field>
                  <Field label="টাকা (৳)" className="w-32">
                    <Input
                      type="number" step="1" min="0"
                      value={dep.amount}
                      onChange={(e) => setDep((d) => ({ ...d, amount: e.target.value }))}
                    />
                  </Field>
                  <Field label="নোট (ঐচ্ছিক)" className="min-w-[140px] flex-1">
                    <Input value={dep.note} onChange={(e) => setDep((d) => ({ ...d, note: e.target.value }))} />
                  </Field>
                  <Button onClick={saveDeposit} loading={busy} disabled={!Number(dep.amount)}>জমা নিন</Button>
                </div>
              </div>

              {/* lifetime deposit history */}
              {monthly && monthly.deposits.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-stone-500">{bnMonth(accMonth)} — জমার ইতিহাস</p>
                  <div className="space-y-2">
                    {monthly.deposits.map((d) => (
                      <div key={String(d._id)} className="flex items-center justify-between rounded-lg border border-leaf-100 px-4 py-3 text-base">
                        <span className="text-stone-500">
                          {bnDate(d.date)}
                          {d.note && <span className="text-stone-400"> · {d.note}</span>}
                        </span>
                        <span className="num font-semibold text-leaf-700">{taka(d.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
