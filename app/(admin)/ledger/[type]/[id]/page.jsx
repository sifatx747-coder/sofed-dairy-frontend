'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Printer } from 'lucide-react';
import { api } from '@/lib/api';
import { bn, taka, bnDate } from '@/lib/utils';
import { Button, PageLoader, Badge } from '@/components/ui';

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
            <p className="text-xs font-semibold text-stone-500">{L.dueTitle}</p>
            <p className={`num font-display text-3xl ${totals.due > 0 ? 'text-rose-600' : 'text-leaf-700'}`}>
              {taka(totals.due)}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              মোট {taka(totals.total)} · {L.credit} {taka(totals.paid)}
            </p>
          </div>
        </div>

        {/* khata table */}
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-400">এখনো কোনো লেনদেন নেই</p>
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
                {entries.map((e, i) => (
                  <tr key={i} className="border-t border-leaf-100/70">
                    <td className="whitespace-nowrap px-3 py-2.5 pl-16 text-stone-500">{bnDate(e.date)}</td>
                    <td className="max-w-[320px] px-3 py-2.5">
                      <span className="line-clamp-2">{e.label}</span>
                    </td>
                    <td className="num whitespace-nowrap px-3 py-2.5 text-right">
                      {e.debit > 0 ? taka(e.debit) : '—'}
                    </td>
                    <td className="num whitespace-nowrap px-3 py-2.5 text-right text-leaf-700">
                      {e.credit > 0 ? taka(e.credit) : '—'}
                    </td>
                    <td className="num whitespace-nowrap px-3 py-2.5 text-right font-semibold text-leaf-900">
                      {taka(e.balance)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-leaf-200 bg-leaf-50/70">
                  <td className="px-3 py-3 pl-16 font-display text-leaf-900" colSpan={2}>
                    মোট
                  </td>
                  <td className="num px-3 py-3 text-right font-semibold">{taka(totals.total)}</td>
                  <td className="num px-3 py-3 text-right font-semibold text-leaf-700">{taka(totals.paid)}</td>
                  <td className="num px-3 py-3 text-right font-display text-lg text-rose-600">
                    {taka(totals.due)}
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
