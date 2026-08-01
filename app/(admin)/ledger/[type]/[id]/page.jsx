'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { bn, taka, bnDate } from '@/lib/utils';
import { Button, PageLoader, Badge } from '@/components/ui';

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/* derive sorted unique months from all entries */
function getMonths(entries) {
  const set = new Set(entries.map((e) => e.date.slice(0, 7)));
  return [...set].sort().reverse();
}

function bnMonth(ym) {
  const [y, m] = ym.split('-');
  return new Date(`${y}-${m}-01T00:00:00`).toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' });
}

function MonthSelector({ months, value, onChange }) {
  return (
    <div className="no-print mb-4 flex flex-wrap items-center gap-2">
      <button
        onClick={() => onChange('')}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
          value === '' ? 'bg-leaf-700 text-white' : 'bg-leaf-50 text-leaf-700 hover:bg-leaf-100'
        }`}
      >
        সব সময়
      </button>
      {months.map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            value === m ? 'bg-leaf-700 text-white' : 'bg-leaf-50 text-leaf-700 hover:bg-leaf-100'
          }`}
        >
          {bnMonth(m)}
        </button>
      ))}
    </div>
  );
}

function FarmLedgerTable({ entries, month }) {
  const filtered = month ? entries.filter((e) => e.date.startsWith(month)) : entries;

  // carry-forward: due from all entries before this month
  let prevDue = 0;
  if (month) {
    for (const e of entries) {
      if (e.date.startsWith(month)) break;
      prevDue = r2(prevDue + e.debit - e.credit);
    }
  }

  // group filtered entries by date
  const rows = [];
  const dateMap = {};
  for (const e of filtered) {
    if (!dateMap[e.date]) {
      dateMap[e.date] = { date: e.date, morning: null, afternoon: null, payments: 0 };
      rows.push(dateMap[e.date]);
    }
    const d = dateMap[e.date];
    if (e.type === 'collection') {
      const c = { qty: e.quantityKg, rate: e.ratePerKg, amount: e.debit };
      if (e.shift === 'morning') d.morning = c;
      else d.afternoon = c;
    } else {
      d.payments = r2(d.payments + e.credit);
    }
  }

  // running balance starting from prevDue
  let balance = prevDue;
  let monthDebit = 0, monthPaid = 0;
  for (const row of rows) {
    const debit = r2((row.morning?.amount || 0) + (row.afternoon?.amount || 0));
    balance = r2(balance + debit - row.payments);
    row.debit = debit;
    row.balance = balance;
    monthDebit = r2(monthDebit + debit);
    monthPaid = r2(monthPaid + row.payments);
  }

  const cell = (c) =>
    c ? (
      <span>
        {bn(c.qty)}কেজি × ৳{bn(c.rate)}
        <br />
        <span className="font-semibold">{taka(c.amount)}</span>
      </span>
    ) : '—';

  return (
    <div className="overflow-x-auto rounded-xl border border-leaf-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-leaf-900/60">
            <th className="px-3 py-2.5 font-semibold">তারিখ</th>
            <th className="px-3 py-2.5 font-semibold">সকাল</th>
            <th className="px-3 py-2.5 font-semibold">বিকাল</th>
            <th className="px-3 py-2.5 text-right font-semibold">মোট</th>
            <th className="px-3 py-2.5 text-right font-semibold">পরিশোধ</th>
            <th className="px-3 py-2.5 text-right font-semibold">বাকি</th>
          </tr>
        </thead>
        <tbody>
          {month && prevDue !== 0 && (
            <tr className="border-t border-leaf-100/70 bg-amber-50/60">
              <td className="px-3 py-2 text-xs text-stone-400" colSpan={5}>আগের বাকি</td>
              <td className="num px-3 py-2 text-right text-xs font-semibold text-rose-500">{taka(prevDue)}</td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-leaf-100/70">
              <td className="whitespace-nowrap px-3 py-2.5 text-stone-500">{bnDate(row.date)}</td>
              <td className="px-3 py-2.5 text-stone-700">{cell(row.morning)}</td>
              <td className="px-3 py-2.5 text-stone-700">{cell(row.afternoon)}</td>
              <td className="num whitespace-nowrap px-3 py-2.5 text-right">{row.debit > 0 ? taka(row.debit) : '—'}</td>
              <td className="num whitespace-nowrap px-3 py-2.5 text-right text-leaf-700">{row.payments > 0 ? taka(row.payments) : '—'}</td>
              <td className="num whitespace-nowrap px-3 py-2.5 text-right font-semibold text-leaf-900">{taka(row.balance)}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-leaf-200 bg-leaf-50/70">
            <td className="px-3 py-3 font-display text-leaf-900" colSpan={3}>
              {month ? `${bnMonth(month)} মোট` : 'মোট'}
            </td>
            <td className="num px-3 py-3 text-right font-semibold">{taka(monthDebit)}</td>
            <td className="num px-3 py-3 text-right font-semibold text-leaf-700">{taka(monthPaid)}</td>
            <td className={`num px-3 py-3 text-right font-display text-lg ${balance > 0 ? 'text-rose-600' : 'text-leaf-700'}`}>{taka(balance)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const LABELS = {
  farm: {
    back: '/farms',
    backLabel: 'ফার্ম তালিকায় ফিরুন',
    debit: 'দুধের মূল্য',
    credit: 'পরিশোধ',
    balance: 'বাকি (দিতে হবে)',
    dueTitle: 'এখন দিতে হবে',
  },
  customer: {
    back: '/customers',
    backLabel: 'কাস্টমার তালিকায় ফিরুন',
    debit: 'বিক্রি',
    credit: 'জমা',
    balance: 'বাকি (পাবো)',
    dueTitle: 'এখন পাবো',
  },
};

export default function LedgerPage() {
  const { type, id } = useParams();
  const [data, setData] = useState(null);
  const [month, setMonth] = useState('');
  const L = LABELS[type] || LABELS.customer;

  useEffect(() => {
    if (!type || !id) return;
    const path = type === 'farm' ? `/farms/${id}/ledger` : `/customers/${id}/ledger`;
    api(path)
      .then(setData)
      .catch((err) => toast.error(err.message));
  }, [type, id]);

  if (!data) return <PageLoader />;

  const { party, entries, totals } = data;
  const months = getMonths(entries);

  // filtered entries + carry-forward for customer view
  const filteredEntries = month ? entries.filter((e) => e.date.startsWith(month)) : entries;
  let prevDue = 0;
  if (month) {
    for (const e of entries) {
      if (e.date.startsWith(month)) break;
      prevDue = r2(prevDue + e.debit - e.credit);
    }
  }
  const filteredTotals = {
    total: r2(filteredEntries.reduce((s, e) => s + e.debit, 0)),
    paid: r2(filteredEntries.reduce((s, e) => s + e.credit, 0)),
    due: r2(prevDue + filteredEntries.reduce((s, e) => s + e.debit - e.credit, 0)),
  };

  return (
    <div>
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={L.back} className="flex items-center gap-1.5 text-sm font-medium text-leaf-700 hover:underline">
          <ArrowRight className="h-4 w-4" />
          {L.backLabel}
        </Link>
        <Button variant="outline" className="gap-2" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          প্রিন্ট করুন
        </Button>
      </div>

      <div id="print-area" className="rounded-xl2 bg-surface p-6 shadow-soft ring-1 ring-leaf-900/5 md:p-8">
        {/* header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-leaf-100 pb-5">
          <div>
            <p className="text-xs font-semibold tracking-wide text-ghee-600">সফেদ ডেইরি · খাতা</p>
            <h1 className="mt-1 font-display text-2xl text-leaf-900 md:text-3xl">{party.name}</h1>
            <p className="mt-1 text-sm text-stone-500">
              {party.phone && <span>{party.phone} · </span>}
              {party.address || (type === 'farm' ? 'ফার্ম' : 'কাস্টমার')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-stone-500">{month ? bnMonth(month) + ' বাকি' : L.dueTitle}</p>
            <p className={`num font-display text-3xl ${filteredTotals.due > 0 ? 'text-rose-600' : 'text-leaf-700'}`}>
              {taka(filteredTotals.due)}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              মোট {taka(filteredTotals.total)} · {L.credit} {taka(filteredTotals.paid)}
            </p>
          </div>
        </div>

        {/* month selector */}
        {entries.length > 0 && <MonthSelector months={months} value={month} onChange={setMonth} />}

        {/* khata table */}
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">এখনো কোনো লেনদেন নেই</p>
        ) : type === 'farm' ? (
          <FarmLedgerTable entries={entries} month={month} />
        ) : (
          <div className="khata overflow-x-auto rounded-xl border border-leaf-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-leaf-900/60">
                  <th className="px-3 py-2.5 pl-16 font-semibold">তারিখ</th>
                  <th className="px-3 py-2.5 font-semibold">বিবরণ</th>
                  <th className="px-3 py-2.5 text-right font-semibold">{L.debit}</th>
                  <th className="px-3 py-2.5 text-right font-semibold">{L.credit}</th>
                  <th className="px-3 py-2.5 text-right font-semibold">{L.balance}</th>
                </tr>
              </thead>
              <tbody>
                {month && prevDue !== 0 && (
                  <tr className="border-t border-leaf-100/70 bg-amber-50/60">
                    <td className="px-3 py-2 pl-16 text-xs text-stone-400" colSpan={4}>আগের বাকি</td>
                    <td className="num px-3 py-2 text-right text-xs font-semibold text-rose-500">{taka(prevDue)}</td>
                  </tr>
                )}
                {filteredEntries.map((e, i) => {
                  let runBal = prevDue;
                  for (let j = 0; j <= i; j++) runBal = r2(runBal + filteredEntries[j].debit - filteredEntries[j].credit);
                  return (
                    <tr key={i} className="border-t border-leaf-100/70">
                      <td className="whitespace-nowrap px-3 py-2.5 pl-16 text-stone-500">{bnDate(e.date)}</td>
                      <td className="max-w-[320px] px-3 py-2.5"><span className="line-clamp-2">{e.label}</span></td>
                      <td className="num whitespace-nowrap px-3 py-2.5 text-right">{e.debit > 0 ? taka(e.debit) : '—'}</td>
                      <td className="num whitespace-nowrap px-3 py-2.5 text-right text-leaf-700">{e.credit > 0 ? taka(e.credit) : '—'}</td>
                      <td className="num whitespace-nowrap px-3 py-2.5 text-right font-semibold text-leaf-900">{taka(runBal)}</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-leaf-200 bg-leaf-50/70">
                  <td className="px-3 py-3 pl-16 font-display text-leaf-900" colSpan={2}>
                    {month ? `${bnMonth(month)} মোট` : 'মোট'}
                  </td>
                  <td className="num px-3 py-3 text-right font-semibold">{taka(filteredTotals.total)}</td>
                  <td className="num px-3 py-3 text-right font-semibold text-leaf-700">{taka(filteredTotals.paid)}</td>
                  <td className={`num px-3 py-3 text-right font-display text-lg ${filteredTotals.due > 0 ? 'text-rose-600' : 'text-leaf-700'}`}>
                    {taka(filteredTotals.due)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-4 text-center text-[11px] text-stone-400">
          {bn(entries.length)}টি লেনদেন · সফেদ ডেইরি ম্যানেজমেন্ট থেকে তৈরি
        </p>
      </div>
    </div>
  );
}
