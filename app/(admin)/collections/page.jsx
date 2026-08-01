'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Droplets, Trash2, Save, Banknote, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { bn, taka, todayStr } from '@/lib/utils';
import {
  PageHeader, Card, CardHeader, CardTitle, CardContent, Button, Input,
  Table, THead, TH, TR, TD, DayShiftPicker, PageLoader, EmptyState,
  Dialog, DialogContent, DialogClose,
} from '@/components/ui';

export default function CollectionsPage() {
  const { isAdmin } = useAuth();
  const [date, setDate] = useState(todayStr());
  const [farms, setFarms] = useState(null);
  const [allFarms, setAllFarms] = useState({}); // id -> farm with lifetime due
  const [dayEntries, setDayEntries] = useState([]);
  const [daySummary, setDaySummary] = useState({}); // farmId -> { dayAmount, dayPaid, dayDue }
  const [qty, setQty] = useState({ morning: {}, afternoon: {} });
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [payTarget, setPayTarget] = useState(null);
  const [pay, setPay] = useState({ date: todayStr(), amount: '', note: '' });
  const [paying, setPaying] = useState(false);

  const loadFarms = () =>
    api('/farms?all=1')
      .then((list) => {
        setFarms(list.filter((f) => f.active));
        setAllFarms(Object.fromEntries(list.map((f) => [f._id, f])));
      })
      .catch((err) => toast.error(err.message));

  useEffect(() => { loadFarms(); }, []);

  const loadDay = (d) =>
    Promise.all([
      api(`/collections?date=${d}`),
      api(`/collections/day-summary?date=${d}`),
    ])
      .then(([entries, summary]) => { setDayEntries(entries); setDaySummary(summary); })
      .catch((err) => toast.error(err.message));

  useEffect(() => { loadDay(date); }, [date]);

  // prefill both shifts from saved entries
  useEffect(() => {
    if (!farms) return;
    const q = { morning: {}, afternoon: {} };
    for (const f of farms) {
      for (const shift of ['morning', 'afternoon']) {
        const e = dayEntries.find((x) => x.shift === shift && x.farm?._id === f._id);
        q[shift][f._id] = e ? e.quantityKg : '';
      }
    }
    setQty(q);
  }, [farms, dayEntries]);

  const totals = useMemo(() => {
    if (!farms) return { morning: 0, afternoon: 0, total: 0, morningAmount: 0, afternoonAmount: 0 };
    let morning = 0, afternoon = 0, morningAmount = 0, afternoonAmount = 0;
    for (const f of farms) {
      const m = Number(qty.morning[f._id]) || 0;
      const a = Number(qty.afternoon[f._id]) || 0;
      morning += m;
      afternoon += a;
      morningAmount += m * f.ratePerKg;
      afternoonAmount += a * f.ratePerKg;
    }
    return { morning, afternoon, total: morning + afternoon, morningAmount, afternoonAmount };
  }, [farms, qty]);

  const save = async () => {
    setSaving(true);
    try {
      for (const shift of ['morning', 'afternoon']) {
        const entries = farms.map((f) => ({
          farm: f._id,
          quantityKg: Number(qty[shift][f._id]) || 0,
          ratePerKg: f.ratePerKg,
        }));
        const saved = await api('/collections/batch', { method: 'POST', body: { date, shift, entries } });
        setDayEntries(saved);
      }
      toast.success('সকাল ও বিকালের সংগ্রহ সেভ হয়েছে');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeEntry = async (id) => {
    try {
      await api(`/collections/${id}`, { method: 'DELETE' });
      setDayEntries((list) => list.filter((e) => e._id !== id));
      toast.success('এন্ট্রি মুছে ফেলা হয়েছে');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConfirmDelete(null);
    }
  };

  const openPay = (farmId, name, due, prefillAmount = '') => {
    setPay({ date: date, amount: prefillAmount, note: '' });
    setPayTarget({ farmId, name, due });
  };

  const savePayment = async () => {
    setPaying(true);
    try {
      await api(`/farms/${payTarget.farmId}/payments`, {
        method: 'POST',
        body: { date: pay.date, amount: Number(pay.amount), note: pay.note },
      });
      toast.success(`${payTarget.name}-কে ${taka(pay.amount)} দেওয়া হয়েছে`);
      setPayTarget(null);
      loadFarms();
      loadDay(date);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPaying(false);
    }
  };

  if (!farms) return <PageLoader />;

  const SHIFT_BN = { morning: 'সকাল', afternoon: 'বিকাল' };

  return (
    <div>
      <PageHeader title="দুধ সংগ্রহ" desc="সব ফার্মের সকাল ও বিকালের দুধ এক স্ক্রিনে লিখে সেভ করুন">
        <DayShiftPicker date={date} onDate={setDate} showShift={false} />
      </PageHeader>

      {farms.length === 0 ? (
        <EmptyState icon={Droplets} title="কোনো ফার্ম নেই" desc="আগে 'ফার্ম' পাতা থেকে ফার্ম যোগ করুন।" />
      ) : (
        <Card>
          <CardHeader className="flex-wrap gap-2">
            <CardTitle>
              দুধ সংগ্রহ — {bn(farms.length)}টি ফার্ম
            </CardTitle>
            <Button onClick={save} loading={saving} className="gap-2">
              <Save className="h-4 w-4" />
              সেভ করুন
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <tr>
                  <TH>ফার্ম</TH>
                  <TH className="w-20 text-sky-600 bg-sky-50">সকাল (কেজি)</TH>
                  <TH className="text-right w-24 text-sky-600 bg-sky-50">সকালের দাম</TH>
                  <TH className="w-2 bg-stone-100" />
                  <TH className="w-20 text-orange-500 bg-orange-50">বিকাল (কেজি)</TH>
                  <TH className="text-right w-24 text-orange-500 bg-orange-50">বিকালের দাম</TH>
                  <TH className="text-right w-24 text-violet-600">মোট (কেজি)</TH>
                  <TH className="text-right w-24 text-emerald-600">মোট দাম</TH>
                </tr>
              </THead>
              <tbody>
                {farms.map((f) => {
                  const m = Number(qty.morning[f._id]) || 0;
                  const a = Number(qty.afternoon[f._id]) || 0;
                  return (
                    <TR key={f._id}>
                      <TD className="font-medium text-leaf-900">{f.name}</TD>
                      <TD className="bg-sky-50 px-1">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="০"
                          value={qty.morning[f._id] ?? ''}
                          onChange={(e) => setQty((q) => ({ ...q, morning: { ...q.morning, [f._id]: e.target.value } }))}
                          className="h-8 w-20 px-2"
                        />
                      </TD>
                      <TD className="num text-right font-semibold text-sky-600 bg-sky-50">{taka(m * f.ratePerKg)}</TD>
                      <TD className="bg-stone-100" />
                      <TD className="bg-orange-50 px-1">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="০"
                          value={qty.afternoon[f._id] ?? ''}
                          onChange={(e) => setQty((q) => ({ ...q, afternoon: { ...q.afternoon, [f._id]: e.target.value } }))}
                          className="h-8 w-20 px-2"
                        />
                      </TD>
                      <TD className="num text-right font-semibold text-orange-500 bg-orange-50">{taka(a * f.ratePerKg)}</TD>
                      <TD className="num text-right font-bold text-violet-600 text-base">{bn(m + a)} কেজি</TD>
                      <TD className="num text-right font-bold text-emerald-600 text-base">{taka((m + a) * f.ratePerKg)}</TD>
                    </TR>
                  );
                })}
                <TR className="bg-leaf-50/60">
                  <TD className="font-display text-leaf-900">মোট</TD>
                  <TD className="num font-semibold text-sky-600 bg-sky-50">{bn(totals.morning)} কেজি</TD>
                  <TD className="num text-right font-display text-sky-600 bg-sky-50">{taka(totals.morningAmount)}</TD>
                  <TD className="bg-stone-100" />
                  <TD className="num font-semibold text-orange-500 bg-orange-50">{bn(totals.afternoon)} কেজি</TD>
                  <TD className="num text-right font-display text-orange-500 bg-orange-50">{taka(totals.afternoonAmount)}</TD>
                  <TD className="num text-right font-display text-xl text-violet-600">{bn(totals.total)} কেজি</TD>
                  <TD className="num text-right font-display text-xl text-emerald-600">{taka(totals.morningAmount + totals.afternoonAmount)}</TD>
                </TR>
              </tbody>
            </Table>
            <p className="mt-3 text-xs text-stone-400">
              টিপস: কোনো ফার্ম থেকে দুধ না এলে ঘরটা খালি/০ রাখুন — সেভ করলে সেই এন্ট্রি মুছে যাবে।
            </p>
          </CardContent>
        </Card>
      )}

      {/* day's saved entries — grouped by farm */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>এই দিনের সব এন্ট্রি</CardTitle>
        </CardHeader>
        <CardContent>
          {dayEntries.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-400">এখনো কোনো এন্ট্রি নেই</p>
          ) : (() => {
            const farmMap = {};
            for (const e of dayEntries) {
              const id = e.farm?._id || 'unknown';
              if (!farmMap[id]) farmMap[id] = { id, name: e.farm?.name || '—', morning: null, afternoon: null };
              farmMap[id][e.shift] = e;
            }
            const rows = Object.values(farmMap);
            const grandMorning = rows.reduce((s, r) => s + (r.morning?.amount || 0), 0);
            const grandAfternoon = rows.reduce((s, r) => s + (r.afternoon?.amount || 0), 0);

            return (
              <>
                {/* ── Mobile cards (hidden on md+) ── */}
                <div className="space-y-3 md:hidden">
                  {rows.map((r) => {
                    const ds = daySummary[r.id] || { dayAmount: 0, dayPaid: 0, dayDue: 0 };
                    const farmData = allFarms[r.id];
                    const totalDue = farmData?.due ?? 0;
                    const totalPaid = farmData?.paid ?? 0;
                    return (
                      <div key={r.id} className="rounded-xl border border-leaf-100 bg-white p-3 shadow-sm space-y-2">
                        <p className="font-semibold text-leaf-900">{r.name}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-sky-50 p-2">
                            <p className="text-xs text-sky-600 font-semibold mb-0.5">সকাল</p>
                            {r.morning
                              ? <><p className="text-sm text-sky-700">{bn(r.morning.quantityKg)} কেজি</p><p className="text-sm font-bold text-sky-600">{taka(r.morning.amount)}</p></>
                              : <p className="text-sm text-stone-400">—</p>}
                            {isAdmin && r.morning && (
                              <button className="mt-1 text-rose-500 text-xs flex items-center gap-0.5" onClick={() => setConfirmDelete({ id: r.morning._id, label: `${r.name} — সকাল` })}>
                                <Trash2 className="h-3 w-3" /> মুছুন
                              </button>
                            )}
                          </div>
                          <div className="rounded-lg bg-orange-50 p-2">
                            <p className="text-xs text-orange-500 font-semibold mb-0.5">বিকাল</p>
                            {r.afternoon
                              ? <><p className="text-sm text-orange-600">{bn(r.afternoon.quantityKg)} কেজি</p><p className="text-sm font-bold text-orange-500">{taka(r.afternoon.amount)}</p></>
                              : <p className="text-sm text-stone-400">—</p>}
                            {isAdmin && r.afternoon && (
                              <button className="mt-1 text-rose-500 text-xs flex items-center gap-0.5" onClick={() => setConfirmDelete({ id: r.afternoon._id, label: `${r.name} — বিকাল` })}>
                                <Trash2 className="h-3 w-3" /> মুছুন
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-leaf-100">
                          <div>
                            <p className="text-xs text-stone-500">দিনের বাকি</p>
                            {ds.dayDue > 0
                              ? <p className="font-semibold text-rose-600">{taka(ds.dayDue)}</p>
                              : <p className="text-xs text-emerald-600 flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" />পরিশোধ</p>}
                            {isAdmin && ds.dayDue > 0 && (
                              <Button variant="accent" size="sm" className="mt-1 gap-1 h-7 px-2 text-xs font-semibold w-full" onClick={() => openPay(r.id, r.name, totalDue, ds.dayDue)}>
                                <Banknote className="h-3.5 w-3.5" />জমা দিন
                              </Button>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-stone-500">দিনের জমা</p>
                            <p className="font-semibold text-leaf-700">{taka(ds.dayPaid)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-stone-500">মোট বাকি</p>
                            {totalDue > 0
                              ? <p className="font-semibold text-rose-600">{taka(totalDue)}</p>
                              : <p className="text-xs text-emerald-600 flex items-center gap-0.5"><CheckCircle2 className="h-3 w-3" />পরিশোধ</p>}
                            {isAdmin && totalDue > 0 && (
                              <Button variant="danger" size="sm" className="mt-1 gap-1 h-7 px-2 text-xs font-semibold w-full" onClick={() => openPay(r.id, r.name, totalDue)}>
                                <Banknote className="h-3.5 w-3.5" />জমা দিন
                              </Button>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-stone-500">মোট পরিশোধ</p>
                            <p className="font-semibold text-leaf-700">{taka(totalPaid)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div className="rounded-xl bg-leaf-50 p-3 flex justify-between text-sm font-semibold">
                    <span className="text-leaf-900">মোট</span>
                    <span className="text-sky-600">সকাল: {taka(grandMorning)}</span>
                    <span className="text-orange-500">বিকাল: {taka(grandAfternoon)}</span>
                  </div>
                </div>

                {/* ── Desktop table (hidden on mobile) ── */}
                <div className="hidden md:block">
                  <Table>
                    <THead>
                      <tr>
                        <TH>ফার্ম</TH>
                        <TH className="text-right text-sky-600 bg-sky-50">সকাল</TH>
                        {isAdmin && <TH className="w-8 bg-sky-50" />}
                        <TH className="text-right text-orange-500 bg-orange-50">বিকাল</TH>
                        {isAdmin && <TH className="w-8 bg-orange-50" />}
                        <TH className="text-right">দিনের বাকি</TH>
                        <TH className="text-right text-leaf-700">দিনের জমা</TH>
                        <TH className="text-right text-rose-500">মোট বাকি</TH>
                        <TH className="text-right text-leaf-700">মোট পরিশোধ</TH>
                      </tr>
                    </THead>
                    <tbody>
                      {rows.map((r) => {
                        const ds = daySummary[r.id] || { dayAmount: 0, dayPaid: 0, dayDue: 0 };
                        const farmData = allFarms[r.id];
                        const totalDue = farmData?.due ?? 0;
                        const totalPaid = farmData?.paid ?? 0;
                        return (
                          <TR key={r.name}>
                            <TD className="font-medium text-leaf-900">{r.name}</TD>
                            <TD className="num text-right bg-sky-50">
                              {r.morning
                                ? <span className="text-sky-700">{bn(r.morning.quantityKg)} কেজি <span className="text-stone-300">—</span> <span className="font-semibold text-sky-600">{taka(r.morning.amount)}</span></span>
                                : '—'}
                            </TD>
                            {isAdmin && (
                              <TD className="bg-sky-50">
                                {r.morning ? (
                                  <Button variant="dangerGhost" size="icon" onClick={() => setConfirmDelete({ id: r.morning._id, label: `${r.name} — সকাল` })} title="সকাল মুছুন">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                ) : null}
                              </TD>
                            )}
                            <TD className="num text-right bg-orange-50">
                              {r.afternoon
                                ? <span className="text-orange-600">{bn(r.afternoon.quantityKg)} কেজি <span className="text-stone-300">—</span> <span className="font-semibold text-orange-500">{taka(r.afternoon.amount)}</span></span>
                                : '—'}
                            </TD>
                            {isAdmin && (
                              <TD className="bg-orange-50">
                                {r.afternoon ? (
                                  <Button variant="dangerGhost" size="icon" onClick={() => setConfirmDelete({ id: r.afternoon._id, label: `${r.name} — বিকাল` })} title="বিকাল মুছুন">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                ) : null}
                              </TD>
                            )}
                            <TD className="num text-right">
                              {ds.dayDue > 0
                                ? (
                                  <div className="flex flex-col items-end gap-0.5">
                                    <span className="font-semibold text-rose-600">{taka(ds.dayDue)}</span>
                                    {isAdmin && (
                                      <Button variant="accent" size="sm" className="gap-1 h-7 px-3 text-xs font-semibold" onClick={() => openPay(r.id, r.name, totalDue, ds.dayDue)}>
                                        <Banknote className="h-3.5 w-3.5" />জমা দিন
                                      </Button>
                                    )}
                                  </div>
                                )
                                : <span className="flex items-center justify-end gap-1 text-emerald-600 text-xs font-medium"><CheckCircle2 className="h-3.5 w-3.5" />পরিশোধ</span>}
                            </TD>
                            <TD className="num text-right text-leaf-700">{taka(ds.dayPaid)}</TD>
                            <TD className="num text-right">
                              <div className="flex flex-col items-end gap-0.5">
                                {totalDue > 0
                                  ? <span className="font-semibold text-rose-600">{taka(totalDue)}</span>
                                  : <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><CheckCircle2 className="h-3.5 w-3.5" />পরিশোধ</span>}
                                {isAdmin && totalDue > 0 && (
                                  <Button variant="danger" size="sm" className="gap-1 h-7 px-3 text-xs font-semibold" onClick={() => openPay(r.id, r.name, totalDue)}>
                                    <Banknote className="h-3.5 w-3.5" />জমা দিন
                                  </Button>
                                )}
                              </div>
                            </TD>
                            <TD className="num text-right text-leaf-700">{taka(totalPaid)}</TD>
                          </TR>
                        );
                      })}
                      <TR className="bg-leaf-50/60">
                        <TD className="font-display text-leaf-900">মোট</TD>
                        <TD className="num text-right font-display text-sky-600 bg-sky-50">{taka(grandMorning)}</TD>
                        {isAdmin && <TD className="bg-sky-50" />}
                        <TD className="num text-right font-display text-orange-500 bg-orange-50">{taka(grandAfternoon)}</TD>
                        {isAdmin && <TD className="bg-orange-50" />}
                        <TD /><TD /><TD /><TD />
                      </TR>
                    </tbody>
                  </Table>
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>
      {/* payment modal */}
      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent
          title={`${payTarget?.name || ''} — বিল পরিশোধ`}
          description={payTarget ? `এখন পর্যন্ত মোট বাকি: ${taka(payTarget.due)}` : ''}
        >
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-leaf-900/80">তারিখ</label>
                <Input type="date" value={pay.date} onChange={(e) => setPay((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-leaf-900/80">টাকার পরিমাণ (৳)</label>
                <Input type="number" step="1" min="0" value={pay.amount} onChange={(e) => setPay((p) => ({ ...p, amount: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-leaf-900/80">নোট (ঐচ্ছিক)</label>
              <Input value={pay.note} onChange={(e) => setPay((p) => ({ ...p, note: e.target.value }))} placeholder="যেমন: স্লিপ নম্বর" />
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild><Button variant="outline">বাতিল</Button></DialogClose>
              <Button onClick={savePayment} loading={paying} disabled={!Number(pay.amount)}>
                <Banknote className="h-4 w-4" />
                টাকা দিন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* confirm delete modal */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent title="এন্ট্রি মুছবেন?" description={`"${confirmDelete?.label}" এর এন্ট্রি স্থায়ীভাবে মুছে যাবে।`}>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">বাতিল</Button>
            </DialogClose>
            <Button variant="danger" onClick={() => removeEntry(confirmDelete.id)}>
              <Trash2 className="h-4 w-4" />
              হ্যাঁ, মুছুন
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
