'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { bn, taka, bnDate } from '@/lib/utils';
import {
  PageHeader, Card, CardHeader, CardTitle, CardContent, StatCard,
  Table, THead, TH, TR, TD, PageLoader,
} from '@/components/ui';

export default function AccountPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api('/shop/account')
      .then(setData)
      .catch((err) => toast.error(err.message));
  }, []);

  if (!data) return <PageLoader />;

  return (
    <div>
      <PageHeader title="আমার হিসাব" desc="কেনাকাটা, জমা আর বাকির পুরো খতিয়ান" />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="মোট কেনাকাটা" value={taka(data.totals.total)} />
        <StatCard label="মোট জমা" value={taka(data.totals.paid)} />
        <StatCard
          icon={Wallet}
          label="বাকি আছে"
          value={taka(data.totals.due)}
          tone={data.totals.due > 0 ? 'rose' : 'leaf'}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>সাম্প্রতিক লেনদেন</CardTitle>
        </CardHeader>
        <CardContent>
          {data.entries.length === 0 ? (
            <p className="py-4 text-center text-sm text-stone-400">এখনো কোনো লেনদেন নেই</p>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>তারিখ</TH>
                  <TH>বিবরণ</TH>
                  <TH className="text-right">কেনা</TH>
                  <TH className="text-right">জমা</TH>
                  <TH className="text-right">ব্যালেন্স</TH>
                </tr>
              </THead>
              <tbody>
                {data.entries.map((e, i) => (
                  <TR key={i}>
                    <TD className="text-stone-500">{bnDate(e.date)}</TD>
                    <TD className="max-w-[280px] truncate" title={e.label}>
                      {e.label}
                    </TD>
                    <TD className="num text-right">{e.debit > 0 ? taka(e.debit) : '—'}</TD>
                    <TD className="num text-right text-leaf-700">{e.credit > 0 ? taka(e.credit) : '—'}</TD>
                    <TD className="num text-right font-semibold text-leaf-900">{taka(e.balance)}</TD>
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
