'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { FlaskConical, Trash2, Home, PackageX } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { bn, taka, bnDate, todayStr, monthStr, SHIFTS, SHIFT_LABEL, PRODUCTION_TYPES, PRODUCTION_LABEL } from '@/lib/utils';
import {
  PageHeader, Card, CardHeader, CardTitle, CardContent, Button, Input, Field, Select, Tabs,
  Table, THead, TH, TR, TD, Badge, Pagination,
} from '@/components/ui';

const emptyPage = { rows: [], page: 1, pages: 1, total: 0 };

export default function ProductionPage() {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('production');
  const [month, setMonth] = useState(monthStr());

  const [prodData, setProdData] = useState(emptyPage);
  const [adjData, setAdjData] = useState(emptyPage);
  const [prodPage, setProdPage] = useState(1);
  const [adjPage, setAdjPage] = useState(1);

  const [prodForm, setProdForm] = useState({
    date: todayStr(), shift: 'morning', type: 'mishti_doi', milkUsedKg: '', outputQty: '', outputUnit: 'লিটার', note: '',
  });
  const [adjForm, setAdjForm] = useState({
    date: todayStr(), shift: 'morning', type: 'home', quantityKg: '', note: '',
  });
  const [busy, setBusy] = useState(false);

  const loadProd = () =>
    api(`/production?month=${month}&page=${prodPage}`)
      .then(setProdData)
      .catch((err) => toast.error(err.message));
  const loadAdj = () =>
    api(`/adjustments?month=${month}&page=${adjPage}`)
      .then(setAdjData)
      .catch((err) => toast.error(err.message));

  // reset to first page when the month changes
  useEffect(() => {
    setProdPage(1);
    setAdjPage(1);
  }, [month]);

  useEffect(() => {
    loadProd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, prodPage]);

  useEffect(() => {
    loadAdj();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, adjPage]);

  const saveProduction = async () => {
    setBusy(true);
    try {
      await api('/production', {
        method: 'POST',
        body: {
          ...prodForm,
          milkUsedKg: Number(prodForm.milkUsedKg),
          outputQty: Number(prodForm.outputQty) || 0,
        },
      });
      toast.success('উৎপাদন এন্ট্রি সেভ হয়েছে');
      setProdForm((f) => ({ ...f, milkUsedKg: '', outputQty: '', note: '' }));
      if (prodPage === 1) loadProd();
      else setProdPage(1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveAdjustment = async () => {
    setBusy(true);
    try {
      await api('/adjustments', {
        method: 'POST',
        body: { ...adjForm, quantityKg: Number(adjForm.quantityKg) },
      });
      toast.success('এন্ট্রি সেভ হয়েছে');
      setAdjForm((f) => ({ ...f, quantityKg: '', note: '' }));
      if (adjPage === 1) loadAdj();
      else setAdjPage(1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeRow = async (kind, id) => {
    try {
      await api(`/${kind}/${id}`, { method: 'DELETE' });
      toast.success('মুছে ফেলা হয়েছে');
      if (kind === 'production') loadProd();
      else loadAdj();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="উৎপাদন ও বিশেষ হিসাব"
        desc="দই-পনির-ঘি বানাতে কত দুধ গেল, ঘরের দুধ আর লিক/ফেরত — রাতের হিসাব মেলাতে এগুলো লাগে"
      >
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
      </PageHeader>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: 'production', label: 'উৎপাদন (দই/পনির/ঘি)' },
          { value: 'adjustments', label: 'ঘরের দুধ ও লিক/ফেরত' },
        ]}
        className="mb-4"
      />

      {tab === 'production' ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>নতুন উৎপাদন এন্ট্রি</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="তারিখ">
                  <Input type="date" value={prodForm.date} onChange={(e) => setProdForm((f) => ({ ...f, date: e.target.value }))} />
                </Field>
                <Field label="শিফট">
                  <Select value={prodForm.shift} onChange={(e) => setProdForm((f) => ({ ...f, shift: e.target.value }))}>
                    {SHIFTS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="কী বানানো হলো">
                  <Select value={prodForm.type} onChange={(e) => setProdForm((f) => ({ ...f, type: e.target.value }))}>
                    {PRODUCTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="দুধ লেগেছে (কেজি)">
                  <Input
                    type="number" step="0.1" min="0"
                    value={prodForm.milkUsedKg}
                    onChange={(e) => setProdForm((f) => ({ ...f, milkUsedKg: e.target.value }))}
                  />
                </Field>
                <Field label="তৈরি হয়েছে (পরিমাণ)">
                  <Input
                    type="number" step="0.1" min="0"
                    value={prodForm.outputQty}
                    onChange={(e) => setProdForm((f) => ({ ...f, outputQty: e.target.value }))}
                  />
                </Field>
                <Field label="একক">
                  <Select value={prodForm.outputUnit} onChange={(e) => setProdForm((f) => ({ ...f, outputUnit: e.target.value }))}>
                    {['কেজি', 'লিটার', 'কাপ', 'পিস'].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="নোট (ঐচ্ছিক)" className="sm:col-span-2">
                  <Input value={prodForm.note} onChange={(e) => setProdForm((f) => ({ ...f, note: e.target.value }))} />
                </Field>
                <div className="flex items-end">
                  <Button onClick={saveProduction} loading={busy} disabled={!Number(prodForm.milkUsedKg)} className="w-full">
                    সেভ করুন
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>এই মাসের উৎপাদন ({bn(prodData.total)}টি)</CardTitle>
            </CardHeader>
            <CardContent>
              {prodData.rows.length === 0 ? (
                <p className="py-4 text-center text-sm text-stone-400">এই মাসে কোনো এন্ট্রি নেই</p>
              ) : (
                <>
                  <Table>
                    <THead>
                      <tr>
                        <TH>তারিখ</TH>
                        <TH>শিফট</TH>
                        <TH>পণ্য</TH>
                        <TH className="text-right">দুধ লেগেছে</TH>
                        <TH className="text-right">তৈরি হয়েছে</TH>
                        <TH>নোট</TH>
                        {isAdmin && <TH className="w-12" />}
                      </tr>
                    </THead>
                    <tbody>
                      {prodData.rows.map((r) => (
                        <TR key={r._id}>
                          <TD>{bnDate(r.date)}</TD>
                          <TD>{SHIFT_LABEL[r.shift]}</TD>
                          <TD className="font-medium text-leaf-900">{PRODUCTION_LABEL[r.type]}</TD>
                          <TD className="num text-right">{bn(r.milkUsedKg)} কেজি</TD>
                          <TD className="num text-right">{r.outputQty ? `${bn(r.outputQty)} ${r.outputUnit}` : '—'}</TD>
                          <TD className="max-w-[180px] truncate text-stone-500">{r.note || '—'}</TD>
                          {isAdmin && (
                            <TD>
                              <Button variant="dangerGhost" size="icon" onClick={() => removeRow('production', r._id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TD>
                          )}
                        </TR>
                      ))}
                    </tbody>
                  </Table>
                  <Pagination page={prodData.page} pages={prodData.pages} total={prodData.total} onPage={setProdPage} />
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>ঘরের দুধ / লিক-ফেরত এন্ট্রি</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <Field label="তারিখ">
                  <Input type="date" value={adjForm.date} onChange={(e) => setAdjForm((f) => ({ ...f, date: e.target.value }))} />
                </Field>
                <Field label="শিফট">
                  <Select value={adjForm.shift} onChange={(e) => setAdjForm((f) => ({ ...f, shift: e.target.value }))}>
                    {SHIFTS.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="ধরন">
                  <Select value={adjForm.type} onChange={(e) => setAdjForm((f) => ({ ...f, type: e.target.value }))}>
                    <option value="home">ঘরের দুধ</option>
                    <option value="leak">লিক / ফেরত প্যাকেট</option>
                  </Select>
                </Field>
                <Field label="পরিমাণ (কেজি)">
                  <Input
                    type="number" step="0.1" min="0"
                    value={adjForm.quantityKg}
                    onChange={(e) => setAdjForm((f) => ({ ...f, quantityKg: e.target.value }))}
                  />
                </Field>
                <div className="flex items-end">
                  <Button onClick={saveAdjustment} loading={busy} disabled={!Number(adjForm.quantityKg)} className="w-full">
                    সেভ করুন
                  </Button>
                </div>
                <Field label="নোট (ঐচ্ছিক)" className="sm:col-span-2 lg:col-span-3">
                  <Input value={adjForm.note} onChange={(e) => setAdjForm((f) => ({ ...f, note: e.target.value }))} />
                </Field>
              </div>
              <p className="mt-3 text-xs text-stone-400">
                ঘরের দুধ = খাওয়া/ঘর থেকে বিক্রি। লিক/ফেরত = প্যাকেট ছিদ্র বা দোকান থেকে ফেরত আসা দুধ — এটা হিসাব থেকে বাদ যায়।
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>এই মাসের এন্ট্রি ({bn(adjData.total)}টি)</CardTitle>
            </CardHeader>
            <CardContent>
              {adjData.rows.length === 0 ? (
                <p className="py-4 text-center text-sm text-stone-400">এই মাসে কোনো এন্ট্রি নেই</p>
              ) : (
                <>
                  <Table>
                    <THead>
                      <tr>
                        <TH>তারিখ</TH>
                        <TH>শিফট</TH>
                        <TH>ধরন</TH>
                        <TH className="text-right">পরিমাণ</TH>
                        <TH>নোট</TH>
                        {isAdmin && <TH className="w-12" />}
                      </tr>
                    </THead>
                    <tbody>
                      {adjData.rows.map((r) => (
                        <TR key={r._id}>
                          <TD>{bnDate(r.date)}</TD>
                          <TD>{SHIFT_LABEL[r.shift]}</TD>
                          <TD>
                            {r.type === 'home' ? (
                              <Badge tone="leaf"><Home className="h-3 w-3" /> ঘরের দুধ</Badge>
                            ) : (
                              <Badge tone="rose"><PackageX className="h-3 w-3" /> লিক/ফেরত</Badge>
                            )}
                          </TD>
                          <TD className="num text-right">{bn(r.quantityKg)} কেজি</TD>
                          <TD className="max-w-[200px] truncate text-stone-500">{r.note || '—'}</TD>
                          {isAdmin && (
                            <TD>
                              <Button variant="dangerGhost" size="icon" onClick={() => removeRow('adjustments', r._id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TD>
                          )}
                        </TR>
                      ))}
                    </tbody>
                  </Table>
                  <Pagination page={adjData.page} pages={adjData.pages} total={adjData.total} onPage={setAdjPage} />
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
