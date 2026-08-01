'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Printer, Download } from 'lucide-react';
import { api } from '@/lib/api';

/* ── CSV helpers ── */
function csvRow(cells) {
  return cells.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',');
}
function downloadCsv(filename, rows) {
  const bom = '\uFEFF';
  const content = bom + rows.map(csvRow).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function buildDailyCsv(data, date) {
  const rows = [['সফেদ ডেইরি — দৈনিক রিপোর্ট', date]];
  rows.push([]);
  rows.push(['বিভাগ', 'বিবরণ', 'পরিমাণ']);
  rows.push(['সংগ্রহ', 'মোট কেজি', data.collections.totalKg]);
  rows.push(['সংগ্রহ', 'মোট টাকা', data.collections.totalAmount]);
  rows.push(['বিক্রি', 'মোট টাকা', data.sales.total]);
  rows.push(['বিক্রি', 'নগদ', data.sales.paid]);
  rows.push(['বিক্রি', 'বাকি', data.sales.due]);
  rows.push(['নগদ', 'বিক্রি থেকে', data.cash.fromSales]);
  rows.push(['নগদ', 'বকেয়া আদায়', data.cash.duesCollected]);
  rows.push(['নগদ', 'মোট এসেছে', data.cash.totalIn]);
  rows.push(['নগদ', 'ফার্মকে দেওয়া', data.cash.farmPaid]);
  rows.push([]);
  rows.push(['ফার্ম সংগ্রহ', 'ফার্ম', 'শিফট', 'কেজি', 'দর', 'টাকা']);
  ['morning', 'afternoon'].forEach((shift) =>
    data.collections[shift].rows.forEach((r) =>
      rows.push(['', r.farm, shift === 'morning' ? 'সকাল' : 'বিকাল', r.kg, r.kg > 0 ? (r.amount / r.kg).toFixed(2) : 0, r.amount])
    )
  );
  rows.push([]);
  rows.push(['বিক্রি বিবরণ', 'কাস্টমার', 'কেজি', 'মোট', 'নগদ', 'বাকি']);
  data.sales.bySeller.forEach((s) =>
    rows.push(['', s.label, s.kg || 0, s.total, s.paid, s.due || 0])
  );
  return rows;
}

function buildMonthlyCsv(data, label) {
  const grossProfit = (data.sales.total || 0) - (data.collections.amount || 0);
  const rows = [['সফেদ ডেইরি — মাসিক রিপোর্ট', label]];
  rows.push([]);
  rows.push(['P&L সারসংক্ষেপ', '']);
  rows.push(['মোট বিক্রি', data.sales.total]);
  rows.push(['দুধ কেনার খরচ', data.collections.amount]);
  rows.push(['গ্রোস প্রফিট', grossProfit]);
  rows.push(['নগদ এসেছে', data.cashIn]);
  rows.push(['বকেয়া আদায়', data.duesCollected]);
  rows.push(['মাসে নতুন বাকি', data.sales.due]);
  rows.push([]);
  rows.push(['ফার্ম', 'কেজি', 'গড় দর', 'মোট বিল', 'দেওয়া হয়েছে', 'বাকি']);
  data.collections.byFarm.forEach((f) => {
    const rate = f.kg > 0 ? (f.amount / f.kg).toFixed(2) : 0;
    rows.push([f.name, f.kg, rate, f.amount, f.paid || 0, (f.amount || 0) - (f.paid || 0)]);
  });
  rows.push([]);
  rows.push(['কাস্টমার', 'কেজি', 'গড় দর', 'মোট বিক্রি', 'নগদ', 'বাকি', 'আদায় %']);
  data.sales.byCustomer.forEach((c) => {
    const rate = c.kg > 0 ? (c.total / c.kg).toFixed(2) : 0;
    const pct = c.total > 0 ? (((c.paid || 0) / c.total) * 100).toFixed(1) : 0;
    rows.push([c.name, c.kg || 0, rate, c.total, c.paid, c.due || 0, pct + '%']);
  });
  rows.push([]);
  rows.push(['উৎপাদন', 'ধরন', 'দুধ ব্যবহার (কেজি)', 'আউটপুট']);
  data.production.forEach((p) =>
    rows.push(['', p.type, p.milkUsedKg, p.outputQty ? `${p.outputQty} ${p.outputUnit}` : ''])
  );
  rows.push([]);
  rows.push(['কর্মচারী জমা', 'নাম', 'টাকা']);
  data.deposits.forEach((d) => rows.push(['', d.name, d.amount]));
  return rows;
}
import {
  bn, taka, bnDate, todayStr, monthStr, SHIFT_LABEL, PRODUCTION_LABEL,
} from '@/lib/utils';
import {
  PageHeader, Card, CardHeader, CardTitle, CardContent, Button, Input, Tabs,
  Table, THead, TH, TR, TD, PageLoader, StatCard, Badge,
} from '@/components/ui';
import {
  Droplets, Banknote, Wallet, Tractor, TrendingUp, Users, BadgeDollarSign, ArrowRightLeft,
} from 'lucide-react';

/* ── dashboard-style quick panel ── */
function QRow({ icon: Icon, label, value, tone = 'default' }) {
  const colors = {
    default: 'text-leaf-900', ghee: 'text-ghee-700', rose: 'text-rose-600',
    stone: 'text-stone-500', leaf: 'text-leaf-700',
  };
  return (
    <div className="flex items-center justify-between gap-3 border-b border-leaf-100 py-2.5 last:border-0">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-stone-400" />
        <span className="text-sm text-stone-600 truncate">{label}</span>
      </div>
      <span className={`num text-sm font-semibold shrink-0 ${colors[tone]}`}>{value}</span>
    </div>
  );
}

function DailyQuickPanel({ data }) {
  const due = (data.sales.total || 0) - (data.sales.paid || 0);
  const duesAdai = (data.cash.totalIn || 0) - (data.cash.fromSales || 0);
  const netCash = (data.cash.totalIn || 0) - (data.cash.farmPaid || 0);
  return (
    <Card className="border-leaf-200 bg-leaf-50/40">
      <CardHeader><CardTitle className="text-base">এক নজরে আজকের হিসাব</CardTitle></CardHeader>
      <CardContent className="pt-0">
        <QRow icon={Droplets} label="দুধ সংগ্রহ" value={`${bn(data.collections.totalKg)} কেজি`} />
        <QRow icon={Droplets} label="সকাল / বিকাল" value={`${bn(data.collections.morning?.kg || 0)} / ${bn(data.collections.afternoon?.kg || 0)} কেজি`} tone="stone" />
        <QRow icon={Banknote} label="বিক্রি (মোট)" value={taka(data.sales.total)} />
        <QRow icon={Banknote} label="বিক্রি (দুধ)" value={`${bn(data.recon?.total?.sold || 0)} কেজি`} tone="stone" />
        <QRow icon={Wallet} label="নগদ এসেছে" value={taka(data.cash.totalIn)} tone="ghee" />
        <QRow icon={BadgeDollarSign} label="নতুন বাকি" value={taka(due)} tone="rose" />
        <QRow icon={Users} label="বকেয়া আদায়" value={taka(duesAdai)} tone="leaf" />
        <QRow icon={ArrowRightLeft} label="নেট নগদ প্রবাহ" value={taka(netCash)} tone={netCash >= 0 ? 'leaf' : 'rose'} />
      </CardContent>
    </Card>
  );
}

function RangeQuickPanel({ data, label }) {
  const empTotal = data.deposits?.reduce((s, x) => s + x.amount, 0) ?? 0;
  const grossProfit = (data.sales.total || 0) - (data.collections.amount || 0);
  return (
    <Card className="border-ghee-200 bg-ghee-50/30">
      <CardHeader><CardTitle className="text-base">{label}</CardTitle></CardHeader>
      <CardContent className="pt-0">
        <QRow icon={Droplets} label="দুধ সংগ্রহ" value={`${bn(data.collections.kg)} কেজি`} />
        <QRow icon={Tractor} label="সংগ্রহ খরচ" value={taka(data.collections.amount)} tone="stone" />
        <QRow icon={Banknote} label="বিক্রি (মোট)" value={taka(data.sales.total)} />
        <QRow icon={Wallet} label="নগদ এসেছে" value={taka(data.cashIn)} tone="ghee" />
        <QRow icon={BadgeDollarSign} label="বাকি" value={taka(data.sales.due)} tone="rose" />
        <QRow icon={Users} label="কর্মচারী জমা" value={taka(empTotal)} tone="stone" />
        <QRow icon={TrendingUp} label="আনুমানিক লাভ" value={taka(grossProfit)} tone={grossProfit >= 0 ? 'leaf' : 'rose'} />
      </CardContent>
    </Card>
  );
}

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
  const totalKg = data.collections.totalKg || 0;
  const totalAmount = data.collections.totalAmount || 0;
  const soldKg = data.recon.total.sold || 0;
  const avgBuyRate = totalKg > 0 ? totalAmount / totalKg : 0;
  const avgSellRate = soldKg > 0 ? data.sales.total / soldKg : 0;
  const netCash = (data.cash.totalIn || 0) - (data.cash.farmPaid || 0);
  const efficiency = totalKg > 0 ? (soldKg / totalKg) * 100 : 0;
  const customersServed = data.sales.bySeller?.length || 0;

  return (
    <div className="space-y-6">
      {/* ৬টি KPI কার্ড */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="গড় কেনার দর"
          value={`${taka(avgBuyRate)} / কেজি`}
          sub={`মোট ${bn(totalKg)} কেজি · ${taka(totalAmount)}`}
          tone="stone"
        />
        <StatCard
          label="গড় বিক্রির দর"
          value={`${taka(avgSellRate)} / কেজি`}
          sub={`মোট বিক্রি ${taka(data.sales.total)}`}
        />
        <StatCard
          label="নেট নগদ প্রবাহ"
          value={taka(netCash)}
          sub={`এসেছে ${taka(data.cash.totalIn)} − ফার্ম ${taka(data.cash.farmPaid)}`}
          tone={netCash >= 0 ? 'leaf' : 'rose'}
        />
        <StatCard
          label="দুধ বিক্রির হার"
          value={`${bn(efficiency)}%`}
          sub={`${bn(soldKg)} কেজি বিক্রি / ${bn(totalKg)} কেজি সংগ্রহ`}
          tone={efficiency >= 90 ? 'leaf' : efficiency >= 70 ? 'ghee' : 'rose'}
        />
        <StatCard
          label="কাস্টমার সংখ্যা"
          value={`${bn(customersServed)} জন`}
          sub={`নগদ ${taka(data.sales.paid)} · বাকি ${taka(data.sales.due)}`}
          tone="ghee"
        />
        <StatCard
          label="হিসাব মেলানো"
          value={bal === 0 ? 'মিলেছে ✓' : bal > 0 ? `+${bn(bal)} কেজি উদ্বৃত্ত` : `${bn(bal)} কেজি ঘাটতি`}
          sub={`ব্যালেন্স ${bal > 0 ? '+' : ''}${bn(bal)} কেজি`}
          tone={bal === 0 ? 'leaf' : bal > 0 ? 'ghee' : 'rose'}
        />
      </div>

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
            <Table>
              <THead>
                <tr>
                  <TH>ফার্ম</TH>
                  <TH>শিফট</TH>
                  <TH className="text-right">কেজি</TH>
                  <TH className="text-right">দর</TH>
                  <TH className="text-right">টাকা</TH>
                </tr>
              </THead>
              <tbody>
                {['morning', 'afternoon'].flatMap((shift) =>
                  data.collections[shift].rows.map((r) => (
                    <TR key={r._id}>
                      <TD className="font-medium text-leaf-900">{r.farm}</TD>
                      <TD className="text-stone-400">{SHIFT_LABEL[shift]}</TD>
                      <TD className="num text-right">{bn(r.kg)}</TD>
                      <TD className="num text-right text-stone-500">{taka(r.kg > 0 ? r.amount / r.kg : 0)}</TD>
                      <TD className="num text-right">{taka(r.amount)}</TD>
                    </TR>
                  ))
                )}
                {data.collections.totalKg > 0 && (
                  <TR className="bg-leaf-50/60 font-semibold">
                    <TD className="font-display text-leaf-900" colSpan={2}>মোট</TD>
                    <TD className="num text-right text-leaf-900">{bn(data.collections.totalKg)}</TD>
                    <TD className="num text-right text-stone-500">{taka(avgBuyRate)}</TD>
                    <TD className="num text-right text-leaf-900">{taka(data.collections.totalAmount)}</TD>
                  </TR>
                )}
              </tbody>
            </Table>
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
            {data.sales.bySeller.length === 0 ? (
              <p className="text-xs text-stone-400">কোনো বিক্রি নেই</p>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>কাস্টমার</TH>
                    <TH className="text-right">কেজি</TH>
                    <TH className="text-right">দর</TH>
                    <TH className="text-right">মোট</TH>
                    <TH className="text-right">নগদ</TH>
                    <TH className="text-right">বাকি</TH>
                  </tr>
                </THead>
                <tbody>
                  {data.sales.bySeller.map((s) => {
                    const rate = s.kg > 0 ? s.total / s.kg : 0;
                    return (
                      <TR key={s.label}>
                        <TD className="font-medium text-leaf-900">{s.label}</TD>
                        <TD className="num text-right">{s.kg > 0 ? bn(s.kg) : '—'}</TD>
                        <TD className="num text-right text-stone-500">{rate > 0 ? taka(rate) : '—'}</TD>
                        <TD className="num text-right">{taka(s.total)}</TD>
                        <TD className="num text-right text-leaf-700">{taka(s.paid)}</TD>
                        <TD className="num text-right">
                          {s.due > 0 ? <span className="font-semibold text-rose-600">{taka(s.due)}</span> : '—'}
                        </TD>
                      </TR>
                    );
                  })}
                  <TR className="bg-leaf-50/60">
                    <TD className="font-display text-leaf-900" colSpan={2}>মোট</TD>
                    <TD className="num text-right text-stone-500">{taka(avgSellRate)}</TD>
                    <TD className="num text-right font-semibold text-leaf-900">{taka(data.sales.total)}</TD>
                    <TD className="num text-right font-semibold text-leaf-700">{taka(data.sales.paid)}</TD>
                    <TD className="num text-right font-semibold text-rose-600">{taka(data.sales.due)}</TD>
                  </TR>
                </tbody>
              </Table>
            )}
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
      {/* এক নজরে হিসাব */}
      <DailyQuickPanel data={data} />
    </div>
  );
}

function MonthlyReport({ data, rangeLabel }) {
  const activeDays = data.dailySummary?.length || 0;
  const avgDailyKg = activeDays > 0 ? (data.collections.kg || 0) / activeDays : 0;
  const avgDailySales = activeDays > 0 ? (data.sales.total || 0) / activeDays : 0;
  const grossProfit = (data.sales.total || 0) - (data.collections.amount || 0);
  const grossMargin = data.sales.total > 0 ? (grossProfit / data.sales.total) * 100 : 0;
  const avgBuyRate = data.collections.kg > 0 ? data.collections.amount / data.collections.kg : 0;
  const avgSellRate = data.sales.kg > 0 ? data.sales.total / data.sales.kg : 0;

  const bestDay = data.dailySummary?.reduce((a, b) => (b.salesTotal > a.salesTotal ? b : a), data.dailySummary?.[0]);
  const worstDay = data.dailySummary?.reduce((a, b) => (b.salesTotal < a.salesTotal ? b : a), data.dailySummary?.[0]);

  return (
    <div className="space-y-6">
      {/* P&L সারসংক্ষেপ */}
      <Card className="border-leaf-300 bg-leaf-50/40">
        <CardHeader>
          <CardTitle>মাসিক P&L সারসংক্ষেপ</CardTitle>
          <Badge tone={grossProfit >= 0 ? 'leaf' : 'rose'}>
            {grossProfit >= 0 ? 'লাভ' : 'লোকসান'} {taka(Math.abs(grossProfit))}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="মোট বিক্রি" value={taka(data.sales.total)} sub={`দুধ ${bn(data.sales.kg)} কেজি · অনলাইন ${taka(data.sales.online.total)}`} />
            <StatCard label="দুধ কেনার খরচ" value={taka(data.collections.amount)} sub={`${bn(data.collections.kg)} কেজি · গড় ${taka(avgBuyRate)}/কেজি`} tone="stone" />
            <StatCard
              label="গ্রোস প্রফিট"
              value={taka(grossProfit)}
              sub={`মার্জিন ${bn(grossMargin)}% · গড় বিক্রি ${taka(avgSellRate)}/কেজি`}
              tone={grossProfit >= 0 ? 'leaf' : 'rose'}
            />
            <StatCard label="নগদ এসেছে" value={taka(data.cashIn)} sub={`বকেয়া আদায় ${taka(data.duesCollected)} সহ`} tone="ghee" />
            <StatCard label="সক্রিয় দিন" value={`${bn(activeDays)} দিন`} sub={`মাসে বিক্রি হয়েছে এমন দিন`} tone="stone" />
            <StatCard label="গড় দৈনিক সংগ্রহ" value={`${bn(avgDailyKg)} কেজি`} sub={`মোট ${bn(data.collections.kg)} কেজি / ${bn(activeDays)} দিন`} />
            <StatCard label="গড় দৈনিক বিক্রি" value={taka(avgDailySales)} sub={`মোট ${taka(data.sales.total)} / ${bn(activeDays)} দিন`} tone="ghee" />
            <StatCard label="মাসে নতুন বাকি" value={taka(data.sales.due)} tone="rose" />
          </div>
          {(bestDay || worstDay) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {bestDay && (
                <div className="rounded-xl bg-leaf-100/60 px-4 py-3 text-sm">
                  <p className="text-xs font-semibold text-leaf-700">সর্বোচ্চ বিক্রির দিন</p>
                  <p className="num font-semibold text-leaf-900">{taka(bestDay.salesTotal)}</p>
                  <p className="text-stone-500">{bnDate(bestDay.date)}</p>
                </div>
              )}
              {worstDay && activeDays > 1 && (
                <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm">
                  <p className="text-xs font-semibold text-rose-600">সর্বনিম্ন বিক্রির দিন</p>
                  <p className="num font-semibold text-rose-700">{taka(worstDay.salesTotal)}</p>
                  <p className="text-stone-500">{bnDate(worstDay.date)}</p>
                </div>
              )}
            </div>
          )}
          {data.recon && (
            <div className="mt-4 rounded-xl border border-leaf-100 bg-white px-4 py-3 text-sm">
              <span className="font-semibold text-leaf-900">দুধের ব্যালেন্স: </span>
              <span className={data.recon.balance === 0 ? 'text-leaf-700' : data.recon.balance > 0 ? 'text-ghee-700' : 'text-rose-600'}>
                {data.recon.balance > 0 ? '+' : ''}{bn(data.recon.balance)} কেজি
              </span>
              <span className="ml-3 text-stone-400">সংগ্রহ {bn(data.recon.collected)} − ব্যবহার {bn(data.recon.out)} কেজি</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>ফার্ম অনুযায়ী কেনা</CardTitle>
          </CardHeader>
          <CardContent>
            {data.collections.byFarm.length === 0 ? (
              <p className="text-xs text-stone-400">কোনো সংগ্রহ নেই</p>
            ) : (() => {
              const farmTotal = { kg: 0, amount: 0, paid: 0 };
              data.collections.byFarm.forEach((f) => {
                farmTotal.kg += f.kg || 0;
                farmTotal.amount += f.amount || 0;
                farmTotal.paid += f.paid || 0;
              });
              const farmDue = farmTotal.amount - farmTotal.paid;
              return (
                <Table>
                  <THead>
                    <tr>
                      <TH>ফার্ম</TH>
                      <TH className="text-right">কেজি</TH>
                      <TH className="text-right">গড় দর</TH>
                      <TH className="text-right">মোট বিল</TH>
                      <TH className="text-right">দেওয়া হয়েছে</TH>
                      <TH className="text-right">বাকি</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {data.collections.byFarm.map((f) => {
                      const rate = f.kg > 0 ? f.amount / f.kg : 0;
                      const due = (f.amount || 0) - (f.paid || 0);
                      return (
                        <TR key={f.name}>
                          <TD className="font-medium text-leaf-900">{f.name}</TD>
                          <TD className="num text-right">{bn(f.kg)} কেজি</TD>
                          <TD className="num text-right text-stone-500">{taka(rate)}</TD>
                          <TD className="num text-right">{taka(f.amount)}</TD>
                          <TD className="num text-right text-leaf-700">{taka(f.paid || 0)}</TD>
                          <TD className="num text-right">
                            {due > 0 ? <span className="font-semibold text-rose-600">{taka(due)}</span> : <span className="text-stone-400">—</span>}
                          </TD>
                        </TR>
                      );
                    })}
                    <TR className="bg-leaf-50/60">
                      <TD className="font-display text-leaf-900">মোট</TD>
                      <TD className="num text-right font-semibold text-leaf-900">{bn(farmTotal.kg)} কেজি</TD>
                      <TD className="num text-right text-stone-500">{taka(farmTotal.kg > 0 ? farmTotal.amount / farmTotal.kg : 0)}</TD>
                      <TD className="num text-right font-semibold text-leaf-900">{taka(farmTotal.amount)}</TD>
                      <TD className="num text-right font-semibold text-leaf-700">{taka(farmTotal.paid)}</TD>
                      <TD className="num text-right font-semibold text-rose-600">{farmDue > 0 ? taka(farmDue) : '—'}</TD>
                    </TR>
                  </tbody>
                </Table>
              );
            })()}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>কাস্টমার অনুযায়ী বিক্রি</CardTitle>
          </CardHeader>
          <CardContent>
            {data.sales.byCustomer.length === 0 ? (
              <p className="text-xs text-stone-400">কোনো বিক্রি নেই</p>
            ) : (() => {
              const custTotal = { kg: 0, total: 0, paid: 0, due: 0 };
              data.sales.byCustomer.forEach((c) => {
                custTotal.kg += c.kg || 0;
                custTotal.total += c.total || 0;
                custTotal.paid += c.paid || 0;
                custTotal.due += c.due || 0;
              });
              return (
                <Table>
                  <THead>
                    <tr>
                      <TH>কাস্টমার</TH>
                      <TH className="text-right">কেজি</TH>
                      <TH className="text-right">গড় দর</TH>
                      <TH className="text-right">মোট বিক্রি</TH>
                      <TH className="text-right">নগদ</TH>
                      <TH className="text-right">বাকি</TH>
                      <TH className="text-right">আদায় %</TH>
                    </tr>
                  </THead>
                  <tbody>
                    {data.sales.byCustomer.map((c) => {
                      const rate = c.kg > 0 ? c.total / c.kg : 0;
                      const collectionPct = c.total > 0 ? ((c.paid || 0) / c.total) * 100 : 0;
                      return (
                        <TR key={c.name}>
                          <TD className="font-medium text-leaf-900">{c.name}</TD>
                          <TD className="num text-right">{c.kg > 0 ? `${bn(c.kg)} কেজি` : '—'}</TD>
                          <TD className="num text-right text-stone-500">{rate > 0 ? taka(rate) : '—'}</TD>
                          <TD className="num text-right">{taka(c.total)}</TD>
                          <TD className="num text-right text-leaf-700">{taka(c.paid)}</TD>
                          <TD className="num text-right">
                            {c.due > 0 ? <span className="font-semibold text-rose-600">{taka(c.due)}</span> : <span className="text-stone-400">—</span>}
                          </TD>
                          <TD className="num text-right">
                            <span className={collectionPct >= 90 ? 'text-leaf-700' : collectionPct >= 60 ? 'text-ghee-700' : 'text-rose-600'}>
                              {bn(collectionPct)}%
                            </span>
                          </TD>
                        </TR>
                      );
                    })}
                    <TR className="bg-leaf-50/60">
                      <TD className="font-display text-leaf-900">মোট</TD>
                      <TD className="num text-right font-semibold text-leaf-900">{custTotal.kg > 0 ? `${bn(custTotal.kg)} কেজি` : '—'}</TD>
                      <TD className="num text-right text-stone-500">{custTotal.kg > 0 ? taka(custTotal.total / custTotal.kg) : '—'}</TD>
                      <TD className="num text-right font-semibold text-leaf-900">{taka(custTotal.total)}</TD>
                      <TD className="num text-right font-semibold text-leaf-700">{taka(custTotal.paid)}</TD>
                      <TD className="num text-right font-semibold text-rose-600">{custTotal.due > 0 ? taka(custTotal.due) : '—'}</TD>
                      <TD className="num text-right font-semibold">
                        <span className={custTotal.total > 0 && (custTotal.paid / custTotal.total) >= 0.9 ? 'text-leaf-700' : 'text-ghee-700'}>
                          {custTotal.total > 0 ? `${bn((custTotal.paid / custTotal.total) * 100)}%` : '—'}
                        </span>
                      </TD>
                    </TR>
                  </tbody>
                </Table>
              );
            })()}
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
      {/* এক নজরে হিসাব */}
      <RangeQuickPanel data={data} label={rangeLabel || 'এক নজরে মাসিক হিসাব'} />
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
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (tab === 'daily' && daily) downloadCsv(`sofed-daily-${date}.csv`, buildDailyCsv(daily, date));
              else if (tab === 'monthly' && monthly) downloadCsv(`sofed-monthly-${month}.csv`, buildMonthlyCsv(monthly, month));
              else if (tab === 'range' && ranged) downloadCsv(`sofed-range-${range.from}-${range.to}.csv`, buildMonthlyCsv(ranged, `${range.from} to ${range.to}`));
            }}
          >
            <Download className="h-4 w-4" />
            CSV
          </Button>
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
          <MonthlyReport data={ranged} rangeLabel={`${bnDate(range.from)} — ${bnDate(range.to)}`} />
        ) : (
          <PageLoader />
        )}
      </div>
    </div>
  );
}
