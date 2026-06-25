'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';
import { api } from '@/lib/api';
import {
  bn, taka, bnDate, todayStr, monthStr, SHIFT_LABEL, PRODUCTION_LABEL,
} from '@/lib/utils';
import {
  PageHeader, Card, CardHeader, CardTitle, CardContent, Button, Input, Tabs,
  Table, THead, TH, TR, TD, PageLoader, StatCard, Badge,
} from '@/components/ui';

/* one shift's reconciliation line — full breakdown */
function ReconRow({ label, r, strong }) {
  return (
    <TR className={strong ? 'bg-leaf-50/60' : ''}>
      <TD className={strong ? 'font-display text-leaf-900' : 'font-medium text-leaf-900'}>{label}</TD>
      <TD className="num text-right">{bn(r.collected)}</TD>
      <TD className="num text-right">{bn(r.sold)}</TD>
      <TD className="num text-right">{bn(r.productionMilk)}</TD>
      <TD className="num text-right">{bn(r.home)}</TD>
      <TD className="num text-right text-rose-600">{r.leak ? `−${bn(r.leak)}` : '০'}</TD>
      <TD
        className={`num text-right font-semibold ${
          r.balance > 0 ? 'text-leaf-700' : r.balance < 0 ? 'text-rose-600' : 'text-stone-500'
        }`}
      >
        {r.balance > 0 ? `+${bn(r.balance)}` : bn(r.balance)}
      </TD>
    </TR>
  );
}

function DailyReport({ data }) {
  const bal = data.recon.total.balance;
  return (
    <div className="space-y-6">
      {/* হিসাব মেলানো — the khata card */}
      <Card>
        <CardHeader>
          <CardTitle>হিসাব মেলানো (দুধের ব্যালেন্স) — {bnDate(data.date)}</CardTitle>
          <Badge tone={bal === 0 ? 'leaf' : bal > 0 ? 'ghee' : 'rose'}>
            ব্যালেন্স: {bal > 0 ? '+' : ''}
            {bn(bal)} কেজি
          </Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>শিফট</TH>
                <TH className="text-right">সংগ্রহ</TH>
                <TH className="text-right">বিক্রি</TH>
                <TH className="text-right">উৎপাদন</TH>
                <TH className="text-right">ঘরের</TH>
                <TH className="text-right">লিক/ফেরত</TH>
                <TH className="text-right">ব্যালেন্স</TH>
              </tr>
            </THead>
            <tbody>
              <ReconRow label={SHIFT_LABEL.morning} r={data.recon.morning} />
              <ReconRow label={SHIFT_LABEL.afternoon} r={data.recon.afternoon} />
              <ReconRow label="সারাদিন" r={data.recon.total} strong />
            </tbody>
          </Table>
          <p className="mt-3 text-xs text-stone-400">
            ব্যালেন্স = সংগ্রহ − (বিক্রি + উৎপাদনে ব্যবহার + ঘরের দুধ − লিক/ফেরত)। শূন্যের কাছাকাছি হলে হিসাব মিলেছে;
            ধনাত্মক হলে কিছু দুধ উদ্বৃত্ত/অহিসাবি, ঋণাত্মক হলে সংগ্রহের চেয়ে বেশি বেরিয়েছে (স্যাম্পল যোগ)।
            {data.recon.online?.sold ? ` অনলাইন বিক্রি ${bn(data.recon.online.sold)} কেজি সারাদিনে ধরা হয়েছে।` : ''}
          </p>
        </CardContent>
      </Card>

      {/* টাকার হিসাব */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="বিক্রি থেকে নগদ" value={taka(data.cash.fromSales)} />
        <StatCard label="বকেয়া আদায়" value={taka(data.cash.duesCollected)} tone="ghee" />
        <StatCard label="মোট নগদ এসেছে" value={taka(data.cash.totalIn)} tone="leaf" />
        <StatCard label="ফার্মকে দেওয়া হয়েছে" value={taka(data.cash.farmPaid)} tone="rose" />
      </div>

      {/* সংগ্রহ + বিক্রেতা ভাগ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              দুধ সংগ্রহ — {bn(data.collections.totalKg)} কেজি ({taka(data.collections.totalAmount)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {['morning', 'afternoon'].map((shift) => (
              <div key={shift} className="mb-3">
                <p className="mb-1 text-xs font-semibold text-stone-500">
                  {SHIFT_LABEL[shift]} — {bn(data.collections[shift].kg)} কেজি
                </p>
                {data.collections[shift].rows.length === 0 ? (
                  <p className="text-xs text-stone-400">কোনো এন্ট্রি নেই</p>
                ) : (
                  <div className="space-y-1">
                    {data.collections[shift].rows.map((r) => (
                      <div key={r._id} className="flex items-center justify-between text-sm">
                        <span>{r.farm}</span>
                        <span className="num text-stone-600">
                          {bn(r.kg)} কেজি · {taka(r.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>বিক্রি — {taka(data.sales.total)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-3 gap-2 text-center text-sm">
              {['morning', 'afternoon'].map((shift) => (
                <div key={shift} className="rounded-xl bg-leaf-50/70 p-3">
                  <p className="text-[11px] text-stone-500">{SHIFT_LABEL[shift]}</p>
                  <p className="num font-semibold text-leaf-900">{taka(data.sales[shift].total)}</p>
                  <p className="text-[11px] text-stone-400">{bn(data.sales[shift].kg)} কেজি</p>
                </div>
              ))}
              <div className="rounded-xl bg-ghee-100/70 p-3">
                <p className="text-[11px] text-ghee-700">অনলাইন</p>
                <p className="num font-semibold text-leaf-900">{taka(data.sales.online.total)}</p>
                <p className="text-[11px] text-stone-400">{bn(data.sales.online.count)}টি</p>
              </div>
            </div>
            <p className="mb-1 text-xs font-semibold text-stone-500">বিক্রেতা অনুযায়ী</p>
            <div className="space-y-1">
              {data.sales.bySeller.length === 0 ? (
                <p className="text-xs text-stone-400">কোনো বিক্রি নেই</p>
              ) : (
                data.sales.bySeller.map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-sm">
                    <span>{s.label}</span>
                    <span className="num text-stone-600">
                      {taka(s.total)} · নগদ {taka(s.paid)}
                      {s.due > 0 && <span className="text-rose-600"> · বাকি {taka(s.due)}</span>}
                    </span>
                  </div>
                ))
              )}
            </div>
            <p className="mt-3 border-t border-leaf-100 pt-2 text-right text-sm">
              নগদ <span className="num font-semibold text-leaf-700">{taka(data.sales.paid)}</span> · আজ নতুন বাকি{' '}
              <span className="num font-semibold text-rose-600">{taka(data.sales.due)}</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* উৎপাদন + বিশেষ + পেমেন্ট */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>উৎপাদন ও বিশেষ হিসাব</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.production.rows.length === 0 && data.adjustments.rows.length === 0 ? (
              <p className="text-xs text-stone-400">আজ কোনো এন্ট্রি নেই</p>
            ) : (
              <>
                {data.production.rows.map((r) => (
                  <div key={r._id} className="flex items-center justify-between">
                    <span>
                      {PRODUCTION_LABEL[r.type]} <span className="text-stone-400">({SHIFT_LABEL[r.shift]})</span>
                    </span>
                    <span className="num text-stone-600">দুধ {bn(r.milkUsedKg)} কেজি</span>
                  </div>
                ))}
                {data.adjustments.rows.map((r) => (
                  <div key={r._id} className="flex items-center justify-between">
                    <span>
                      {r.type === 'home' ? 'ঘরের দুধ' : 'লিক/ফেরত'}{' '}
                      <span className="text-stone-400">({SHIFT_LABEL[r.shift]})</span>
                    </span>
                    <span className={`num ${r.type === 'leak' ? 'text-rose-600' : 'text-stone-600'}`}>
                      {r.type === 'leak' ? '−' : ''}
                      {bn(r.quantityKg)} কেজি
                    </span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>আজকের পেমেন্ট</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.payments.customers.length === 0 && data.payments.farms.length === 0 ? (
              <p className="text-xs text-stone-400">আজ কোনো পেমেন্ট নেই</p>
            ) : (
              <>
                {data.payments.customers.map((p, i) => (
                  <div key={`c${i}`} className="flex items-center justify-between">
                    <span>
                      {p.name} <Badge tone="leaf">আদায়</Badge>
                    </span>
                    <span className="num text-leaf-700">{taka(p.amount)}</span>
                  </div>
                ))}
                {data.payments.farms.map((p, i) => (
                  <div key={`f${i}`} className="flex items-center justify-between">
                    <span>
                      {p.name} <Badge tone="ghee">ফার্ম বিল</Badge>
                    </span>
                    <span className="num text-rose-600">−{taka(p.amount)}</span>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MonthlyReport({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="দুধ সংগ্রহ"
          value={`${bn(data.collections.kg)} কেজি`}
          sub={`কেনা দাম ${taka(data.collections.amount)} · ফার্মকে দেওয়া ${taka(data.farmPaid)}`}
        />
        <StatCard
          label="মোট বিক্রি"
          value={taka(data.sales.total)}
          sub={`দুধ ${bn(data.sales.kg)} কেজি · অনলাইন ${taka(data.sales.online.total)} (${bn(data.sales.online.count)}টি)`}
        />
        <StatCard label="নগদ এসেছে" value={taka(data.cashIn)} sub={`বকেয়া আদায় ${taka(data.duesCollected)} সহ`} tone="ghee" />
        <StatCard label="মাসে নতুন বাকি" value={taka(data.sales.due)} tone="rose" />
        <StatCard
          label="ঘরের দুধ / লিক"
          value={`${bn(data.adjustments.homeKg)} / ${bn(data.adjustments.leakKg)} কেজি`}
          tone="stone"
        />
        {data.recon && (
          <StatCard
            label="দুধের ব্যালেন্স"
            value={`${data.recon.balance > 0 ? '+' : ''}${bn(data.recon.balance)} কেজি`}
            sub={`সংগ্রহ ${bn(data.recon.collected)} − ব্যবহার ${bn(data.recon.out)}`}
            tone={data.recon.balance === 0 ? 'leaf' : data.recon.balance > 0 ? 'ghee' : 'rose'}
          />
        )}
        <StatCard
          label="আনুমানিক লাভ (মোটা হিসাব)"
          value={taka(data.profitEstimate)}
          sub="বিক্রি − দুধ কেনা · অন্যান্য খরচ বাদ যায়নি"
          tone={data.profitEstimate >= 0 ? 'leaf' : 'rose'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ফার্ম অনুযায়ী কেনা</CardTitle>
          </CardHeader>
          <CardContent>
            {data.collections.byFarm.length === 0 ? (
              <p className="text-xs text-stone-400">কোনো সংগ্রহ নেই</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>ফার্ম</TH>
                    <TH className="text-right">দুধ</TH>
                    <TH className="text-right">টাকা</TH>
                  </tr>
                </THead>
                <tbody>
                  {data.collections.byFarm.map((f) => (
                    <TR key={f.name}>
                      <TD className="font-medium text-leaf-900">{f.name}</TD>
                      <TD className="num text-right">{bn(f.kg)} কেজি</TD>
                      <TD className="num text-right">{taka(f.amount)}</TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>কাস্টমার অনুযায়ী বিক্রি</CardTitle>
          </CardHeader>
          <CardContent>
            {data.sales.byCustomer.length === 0 ? (
              <p className="text-xs text-stone-400">কোনো বিক্রি নেই</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>কাস্টমার</TH>
                    <TH className="text-right">বিক্রি</TH>
                    <TH className="text-right">জমা</TH>
                    <TH className="text-right">বাকি</TH>
                  </tr>
                </THead>
                <tbody>
                  {data.sales.byCustomer.map((c) => (
                    <TR key={c.name}>
                      <TD className="font-medium text-leaf-900">{c.name}</TD>
                      <TD className="num text-right">{taka(c.total)}</TD>
                      <TD className="num text-right text-leaf-700">{taka(c.paid)}</TD>
                      <TD className="num text-right">
                        {c.due > 0 ? <span className="font-semibold text-rose-600">{taka(c.due)}</span> : '—'}
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>উৎপাদন (মাস)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.production.length === 0 ? (
              <p className="text-xs text-stone-400">কোনো উৎপাদন নেই</p>
            ) : (
              data.production.map((p) => (
                <div key={p.type} className="flex items-center justify-between">
                  <span>{PRODUCTION_LABEL[p.type]}</span>
                  <span className="num text-stone-600">
                    দুধ {bn(p.milkUsedKg)} কেজি{p.outputQty ? ` → ${bn(p.outputQty)} ${p.outputUnit}` : ''}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>কর্মচারীর জমা (মাস)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.deposits.length === 0 ? (
              <p className="text-xs text-stone-400">কোনো জমা নেই</p>
            ) : (
              data.deposits.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <span>{d.name}</span>
                  <span className="num font-semibold text-leaf-700">{taka(d.amount)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState('daily');
  const [date, setDate] = useState(todayStr());
  const [month, setMonth] = useState(monthStr());
  const [range, setRange] = useState({ from: monthStr() + '-01', to: todayStr() });
  const [daily, setDaily] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [ranged, setRanged] = useState(null);

  useEffect(() => {
    setDaily(null);
    api(`/reports/daily?date=${date}`)
      .then(setDaily)
      .catch((err) => toast.error(err.message));
  }, [date]);

  useEffect(() => {
    setMonthly(null);
    api(`/reports/monthly?month=${month}`)
      .then(setMonthly)
      .catch((err) => toast.error(err.message));
  }, [month]);

  useEffect(() => {
    if (tab !== 'range' || !range.from || !range.to) return;
    setRanged(null);
    api(`/reports/range?from=${range.from}&to=${range.to}`)
      .then(setRanged)
      .catch((err) => toast.error(err.message));
  }, [tab, range.from, range.to]);

  return (
    <div>
      <div className="no-print">
        <PageHeader title="রিপোর্ট" desc="রাতের হিসাব মেলানো, মাস শেষের চিত্র, আর যেকোনো তারিখের কাস্টম রিপোর্ট">
          {tab === 'daily' && (
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
          )}
          {tab === 'monthly' && (
            <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-auto" />
          )}
          {tab === 'range' && (
            <>
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
            </>
          )}
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            প্রিন্ট
          </Button>
        </PageHeader>

        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: 'daily', label: 'দৈনিক হিসাব' },
            { value: 'monthly', label: 'মাসিক রিপোর্ট' },
            { value: 'range', label: 'কাস্টম তারিখ' },
          ]}
          className="mb-5"
        />
      </div>

      <div id="print-area">
        <p className="mb-4 hidden font-display text-xl text-leaf-900 print:block">
          সফেদ ডেইরি —{' '}
          {tab === 'daily'
            ? `দৈনিক হিসাব, ${bnDate(date)}`
            : tab === 'monthly'
            ? `মাসিক রিপোর্ট, ${month}`
            : `${bnDate(range.from)} — ${bnDate(range.to)}`}
        </p>
        {tab === 'daily' ? (
          daily ? <DailyReport data={daily} /> : <PageLoader />
        ) : tab === 'monthly' ? (
          monthly ? <MonthlyReport data={monthly} /> : <PageLoader />
        ) : ranged ? (
          <MonthlyReport data={ranged} />
        ) : (
          <PageLoader />
        )}
      </div>
    </div>
  );
}
