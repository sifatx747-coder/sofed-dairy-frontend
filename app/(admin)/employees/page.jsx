'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserCog, Plus, Pencil, Wallet, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import { bn, taka, todayStr, bnDate, SHIFT_LABEL } from '@/lib/utils';
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
  const [accDate, setAccDate] = useState(todayStr());
  const [account, setAccount] = useState(null);
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

  const openAccount = (emp) => {
    setAccTarget(emp);
    setAccDate(todayStr());
    setDep({ amount: '', note: '' });
    loadAccount(emp, todayStr());
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
      loadAccount(accTarget, accDate);
      load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!employees) return <PageLoader />;

  const ShiftCard = ({ label, s }) => (
    <div className="rounded-xl bg-leaf-50/70 p-3.5">
      <p className="text-xs font-semibold text-leaf-900/70">{label}</p>
      <p className="num mt-1 font-display text-lg text-leaf-900">{taka(s.total)}</p>
      <p className="text-[11px] text-stone-500">
        {bn(s.count)}টি দোকান · {bn(s.kg)} কেজি · নগদ {taka(s.paid)}
        {s.due > 0 && <span className="text-rose-600"> · বাকি {taka(s.due)}</span>}
      </p>
    </div>
  );

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
            <Card key={e._id} className={`p-5 ${!e.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-leaf-900">{e.name}</p>
                  {e.phone && <p className="text-xs text-stone-400">{e.phone}</p>}
                  <div className="mt-1">
                    {e.hasLogin ? (
                      <Badge tone="leaf">লগইন আছে</Badge>
                    ) : (
                      <Badge tone="stone">লগইন নেই</Badge>
                    )}
                  </div>
                </div>
                <Switch checked={e.active} onChange={(v) => toggleActive(e, v)} />
              </div>
              <div className="mt-4 rounded-xl bg-ghee-100/70 p-3.5">
                <p className="text-xs font-semibold text-ghee-700">হাতে আছে (জমা দেয়নি)</p>
                <p className="num mt-0.5 font-display text-2xl text-leaf-900">{taka(e.inHand)}</p>
              </div>
              <p className="mt-3 text-xs text-stone-500">
                মোট বিক্রি {taka(e.totalSales)} · নগদ তুলেছে {taka(e.cashCollected)} · জমা দিয়েছে{' '}
                {taka(e.deposited)}
              </p>
              <div className="mt-4 flex gap-2">
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
        <DialogContent
          wide
          title={`${accTarget?.name || ''} — হিসাব`}
          description="দিন বেছে নিয়ে সকালের ও বিকালের বিক্রি দেখুন, নগদ জমা নিন"
        >
          <div className="space-y-4">
            <Input
              type="date"
              value={accDate}
              onChange={(e) => {
                setAccDate(e.target.value);
                if (accTarget) loadAccount(accTarget, e.target.value);
              }}
              className="w-auto"
            />

            {!account ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ShiftCard label={`${SHIFT_LABEL.morning} (${bnDate(accDate)})`} s={account.day.morning} />
                  <ShiftCard label={`${SHIFT_LABEL.afternoon}`} s={account.day.afternoon} />
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-xl border border-leaf-100 p-3.5 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-[11px] text-stone-400">মোট বিক্রি</p>
                    <p className="num font-semibold text-leaf-900">{taka(account.totals.totalSales)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-stone-400">নগদ তুলেছে</p>
                    <p className="num font-semibold text-leaf-900">{taka(account.totals.cashCollected)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-stone-400">জমা দিয়েছে</p>
                    <p className="num font-semibold text-leaf-700">{taka(account.totals.deposited)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-stone-400">হাতে আছে</p>
                    <p className="num font-semibold text-ghee-600">{taka(account.totals.inHand)}</p>
                  </div>
                </div>

                {/* deposit form */}
                <div className="rounded-xl bg-leaf-50/70 p-4">
                  <p className="mb-3 text-sm font-semibold text-leaf-900">নগদ জমা নিন ({bnDate(accDate)})</p>
                  <div className="flex flex-wrap items-end gap-2">
                    <Field label="টাকা (৳)" className="w-32">
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={dep.amount}
                        onChange={(e) => setDep((d) => ({ ...d, amount: e.target.value }))}
                      />
                    </Field>
                    <Field label="নোট (ঐচ্ছিক)" className="min-w-[160px] flex-1">
                      <Input value={dep.note} onChange={(e) => setDep((d) => ({ ...d, note: e.target.value }))} />
                    </Field>
                    <Button onClick={saveDeposit} loading={busy} disabled={!Number(dep.amount)}>
                      জমা নিন
                    </Button>
                  </div>
                </div>

                {account.deposits.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-stone-500">সাম্প্রতিক জমা</p>
                    <div className="space-y-1.5">
                      {account.deposits.map((d) => (
                        <div
                          key={d._id}
                          className="flex items-center justify-between rounded-lg border border-leaf-100 px-3 py-2 text-sm"
                        >
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
