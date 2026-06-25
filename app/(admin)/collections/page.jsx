'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Droplets, Trash2, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { bn, taka, SHIFT_LABEL, todayStr } from '@/lib/utils';
import {
  PageHeader, Card, CardHeader, CardTitle, CardContent, Button, Input,
  Table, THead, TH, TR, TD, DayShiftPicker, PageLoader, EmptyState,
} from '@/components/ui';

export default function CollectionsPage() {
  const { isAdmin } = useAuth();
  const [date, setDate] = useState(todayStr());
  const [shift, setShift] = useState('morning');
  const [farms, setFarms] = useState(null);
  const [dayEntries, setDayEntries] = useState([]);
  const [qty, setQty] = useState({});
  const [rate, setRate] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api('/farms')
      .then((list) => setFarms(list.filter((f) => f.active)))
      .catch((err) => toast.error(err.message));
  }, []);

  const loadDay = (d) =>
    api(`/collections?date=${d}`)
      .then(setDayEntries)
      .catch((err) => toast.error(err.message));

  useEffect(() => {
    loadDay(date);
  }, [date]);

  // prefill the grid from saved entries for this shift
  useEffect(() => {
    if (!farms) return;
    const q = {};
    const r = {};
    for (const f of farms) {
      const e = dayEntries.find((x) => x.shift === shift && x.farm?._id === f._id);
      q[f._id] = e ? e.quantityKg : '';
      r[f._id] = e ? e.ratePerKg : f.ratePerKg;
    }
    setQty(q);
    setRate(r);
  }, [farms, dayEntries, shift]);

  const totals = useMemo(() => {
    if (!farms) return { kg: 0, amount: 0 };
    let kg = 0;
    let amount = 0;
    for (const f of farms) {
      const q = Number(qty[f._id]) || 0;
      const r = Number(rate[f._id]) || f.ratePerKg;
      kg += q;
      amount += q * r;
    }
    return { kg, amount };
  }, [farms, qty, rate]);

  const save = async () => {
    setSaving(true);
    try {
      const entries = farms.map((f) => ({
        farm: f._id,
        quantityKg: Number(qty[f._id]) || 0,
        ratePerKg: Number(rate[f._id]) || f.ratePerKg,
      }));
      const saved = await api('/collections/batch', { method: 'POST', body: { date, shift, entries } });
      setDayEntries(saved);
      toast.success(`${SHIFT_LABEL[shift]}ের সংগ্রহ সেভ হয়েছে`);
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
    }
  };

  if (!farms) return <PageLoader />;

  return (
    <div>
      <PageHeader title="দুধ সংগ্রহ" desc="সব ফার্মের দুধ এক স্ক্রিনে লিখে এক ক্লিকে সেভ করুন">
        <DayShiftPicker date={date} onDate={setDate} shift={shift} onShift={setShift} />
      </PageHeader>

      {farms.length === 0 ? (
        <EmptyState icon={Droplets} title="কোনো ফার্ম নেই" desc="আগে ‘ফার্ম’ পাতা থেকে ফার্ম যোগ করুন।" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {SHIFT_LABEL[shift]}ের সংগ্রহ — {bn(farms.length)}টি ফার্ম
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
                  <TH className="w-32">দর (৳/কেজি)</TH>
                  <TH className="w-32">দুধ (কেজি)</TH>
                  <TH className="text-right">দাম</TH>
                </tr>
              </THead>
              <tbody>
                {farms.map((f) => {
                  const q = Number(qty[f._id]) || 0;
                  const r = Number(rate[f._id]) || f.ratePerKg;
                  return (
                    <TR key={f._id}>
                      <TD className="font-medium text-leaf-900">{f.name}</TD>
                      <TD>
                        {isAdmin ? (
                          <Input
                            type="number"
                            step="0.5"
                            min="0"
                            value={rate[f._id] ?? ''}
                            onChange={(e) => setRate((m) => ({ ...m, [f._id]: e.target.value }))}
                            className="h-9"
                          />
                        ) : (
                          <span className="num text-stone-600">{taka(r)}</span>
                        )}
                      </TD>
                      <TD>
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="0"
                          value={qty[f._id] ?? ''}
                          onChange={(e) => setQty((m) => ({ ...m, [f._id]: e.target.value }))}
                          className="h-9"
                        />
                      </TD>
                      <TD className="num text-right font-semibold text-leaf-900">{taka(q * r)}</TD>
                    </TR>
                  );
                })}
                <TR className="bg-leaf-50/60">
                  <TD className="font-display text-leaf-900">মোট</TD>
                  <TD />
                  <TD className="num font-semibold">{bn(totals.kg)} কেজি</TD>
                  <TD className="num text-right font-display text-lg text-leaf-900">{taka(totals.amount)}</TD>
                </TR>
              </tbody>
            </Table>
            <p className="mt-3 text-xs text-stone-400">
              টিপস: কোনো ফার্ম থেকে আজ দুধ না এলে ঘরটা খালি/০ রাখুন — সেভ করলে সেই এন্ট্রি মুছে যাবে।
            </p>
          </CardContent>
        </Card>
      )}

      {/* day's saved entries */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>এই দিনের সব এন্ট্রি</CardTitle>
        </CardHeader>
        <CardContent>
          {dayEntries.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-400">এখনো কোনো এন্ট্রি নেই</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>শিফট</TH>
                  <TH>ফার্ম</TH>
                  <TH className="text-right">দুধ</TH>
                  <TH className="text-right">দর</TH>
                  <TH className="text-right">দাম</TH>
                  {isAdmin && <TH className="w-12" />}
                </tr>
              </THead>
              <tbody>
                {dayEntries.map((e) => (
                  <TR key={e._id}>
                    <TD>{SHIFT_LABEL[e.shift]}</TD>
                    <TD className="font-medium text-leaf-900">{e.farm?.name || '—'}</TD>
                    <TD className="num text-right">{bn(e.quantityKg)} কেজি</TD>
                    <TD className="num text-right">{taka(e.ratePerKg)}</TD>
                    <TD className="num text-right font-semibold">{taka(e.amount)}</TD>
                    {isAdmin && (
                      <TD>
                        <Button variant="dangerGhost" size="icon" onClick={() => removeEntry(e._id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TD>
                    )}
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
