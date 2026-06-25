'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Tractor, Plus, Pencil, Banknote, NotebookText } from 'lucide-react';
import { api } from '@/lib/api';
import { bn, taka, todayStr } from '@/lib/utils';
import {
  PageHeader, Card, CardContent, Button, Input, Field, Switch, Textarea,
  Table, THead, TH, TR, TD, PageLoader, EmptyState,
  Dialog, DialogContent, DialogClose,
} from '@/components/ui';

const emptyForm = { name: '', ratePerKg: '', phone: '', address: '', note: '' };

export default function FarmsPage() {
  const [farms, setFarms] = useState(null);
  const [editTarget, setEditTarget] = useState(null); // null | 'new' | farm object
  const [payTarget, setPayTarget] = useState(null); // farm object
  const [form, setForm] = useState(emptyForm);
  const [pay, setPay] = useState({ date: todayStr(), amount: '', note: '' });
  const [busy, setBusy] = useState(false);

  const load = () =>
    api('/farms?all=1')
      .then(setFarms)
      .catch((err) => toast.error(err.message));

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditTarget('new');
  };
  const openEdit = (f) => {
    setForm({ name: f.name, ratePerKg: f.ratePerKg, phone: f.phone || '', address: f.address || '', note: f.note || '' });
    setEditTarget(f);
  };
  const openPay = (f) => {
    setPay({ date: todayStr(), amount: '', note: '' });
    setPayTarget(f);
  };

  const saveFarm = async () => {
    setBusy(true);
    try {
      const body = { ...form, ratePerKg: Number(form.ratePerKg) };
      if (editTarget === 'new') {
        await api('/farms', { method: 'POST', body });
        toast.success('ফার্ম যোগ হয়েছে');
      } else {
        await api(`/farms/${editTarget._id}`, { method: 'PUT', body });
        toast.success('ফার্ম আপডেট হয়েছে');
      }
      setEditTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (f, active) => {
    try {
      await api(`/farms/${f._id}`, { method: 'PUT', body: { active } });
      setFarms((list) => list.map((x) => (x._id === f._id ? { ...x, active } : x)));
      toast.success(active ? `${f.name} চালু হলো` : `${f.name} বন্ধ হলো`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const savePayment = async () => {
    setBusy(true);
    try {
      await api(`/farms/${payTarget._id}/payments`, {
        method: 'POST',
        body: { date: pay.date, amount: Number(pay.amount), note: pay.note },
      });
      toast.success(`${payTarget.name}-কে ${taka(pay.amount)} দেওয়া হয়েছে`);
      setPayTarget(null);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!farms) return <PageLoader />;

  const totalDue = farms.reduce((s, f) => s + f.due, 0);

  return (
    <div>
      <PageHeader title="ফার্ম" desc={`মোট ${bn(farms.length)}টি ফার্ম · সব মিলিয়ে দিতে হবে ${taka(totalDue)}`}>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" />
          নতুন ফার্ম
        </Button>
      </PageHeader>

      {farms.length === 0 ? (
        <EmptyState icon={Tractor} title="কোনো ফার্ম নেই" desc="যেসব ফার্ম থেকে দুধ আনেন, সেগুলো যোগ করুন।">
          <Button onClick={openNew}>ফার্ম যোগ করুন</Button>
        </EmptyState>
      ) : (
        <Card>
          <CardContent className="pt-5">
            <Table>
              <THead>
                <tr>
                  <TH>ফার্ম</TH>
                  <TH className="text-right">দর</TH>
                  <TH className="text-right">মোট দুধ</TH>
                  <TH className="text-right">মোট টাকা</TH>
                  <TH className="text-right">পরিশোধ</TH>
                  <TH className="text-right">বাকি</TH>
                  <TH>চালু</TH>
                  <TH className="text-right">অ্যাকশন</TH>
                </tr>
              </THead>
              <tbody>
                {farms.map((f) => (
                  <TR key={f._id} className={!f.active ? 'opacity-50' : ''}>
                    <TD>
                      <p className="font-medium text-leaf-900">{f.name}</p>
                      {f.phone && <p className="text-[11px] text-stone-400">{f.phone}</p>}
                    </TD>
                    <TD className="num text-right">{taka(f.ratePerKg)}/কেজি</TD>
                    <TD className="num text-right">{bn(f.totalKg)} কেজি</TD>
                    <TD className="num text-right">{taka(f.totalAmount)}</TD>
                    <TD className="num text-right text-leaf-700">{taka(f.paid)}</TD>
                    <TD className="num text-right">
                      {f.due > 0 ? <span className="font-semibold text-rose-600">{taka(f.due)}</span> : '—'}
                    </TD>
                    <TD>
                      <Switch checked={f.active} onChange={(v) => toggleActive(f, v)} />
                    </TD>
                    <TD>
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openPay(f)}>
                          <Banknote className="h-3.5 w-3.5" />
                          টাকা দিন
                        </Button>
                        <Link href={`/ledger/farm/${f._id}`}>
                          <Button variant="ghost" size="icon" title="খাতা">
                            <NotebookText className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(f)} title="এডিট">
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
        <DialogContent title={editTarget === 'new' ? 'নতুন ফার্ম' : 'ফার্ম এডিট'}>
          <div className="space-y-4">
            <Field label="ফার্মের নাম">
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="দর (৳ প্রতি কেজি)">
              <Input
                type="number"
                step="0.5"
                min="0"
                value={form.ratePerKg}
                onChange={(e) => setForm((f) => ({ ...f, ratePerKg: e.target.value }))}
              />
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
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost">বাতিল</Button>
              </DialogClose>
              <Button onClick={saveFarm} loading={busy} disabled={!form.name || !form.ratePerKg}>
                সেভ করুন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* payment dialog */}
      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent
          title={`${payTarget?.name || ''} — বিল পরিশোধ`}
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
            <Field label="নোট (যেমন: স্লিপ নম্বর)">
              <Input value={pay.note} onChange={(e) => setPay((p) => ({ ...p, note: e.target.value }))} />
            </Field>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button variant="ghost">বাতিল</Button>
              </DialogClose>
              <Button onClick={savePayment} loading={busy} disabled={!Number(pay.amount)}>
                টাকা দিন
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
