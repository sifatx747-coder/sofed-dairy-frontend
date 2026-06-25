'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Droplets, Banknote, Wallet, Tractor, UserCog, ClipboardList, ArrowLeft,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { bn, taka, bnDate, todayStr } from '@/lib/utils';
import { PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent, PageLoader, Button, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    api(`/reports/dashboard?date=${date}`)
      .then(setData)
      .catch((err) => toast.error(err.message));
  }, [date]);

  if (!data) return <PageLoader />;

  const chartData = data.chart.map((d) => ({
    ...d,
    label: new Date(`${d.date}T00:00:00`).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }),
  }));

  return (
    <div>
      <PageHeader
        title={`শুভদিন, ${user?.name || ''}!`}
        desc={`${bnDate(data.today)} — এক নজরে হিসাব`}
      >
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        {date !== todayStr() && (
          <Button variant="ghost" size="sm" onClick={() => setDate(todayStr())}>আজ</Button>
        )}
        <Link href="/collections"><Button variant="outline">দুধ সংগ্রহ</Button></Link>
        <Link href="/sales"><Button>বিক্রি</Button></Link>
      </PageHeader>

      {data.pendingOrders > 0 && (
        <Link
          href="/orders"
          className="mb-5 flex items-center justify-between gap-3 rounded-xl2 bg-ghee-100 px-5 py-3.5 text-sm font-medium text-ghee-700 ring-1 ring-ghee-300/60 transition hover:bg-ghee-200/70"
        >
          <span className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            {bn(data.pendingOrders)}টি নতুন অনলাইন অর্ডার অপেক্ষায় আছে
          </span>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Droplets}
          label="আজ দুধ সংগ্রহ"
          value={`${bn(data.collections.kg)} কেজি`}
          sub={`সকাল ${bn(data.collections.morning.kg)} + বিকাল ${bn(data.collections.afternoon.kg)} · দাম ${taka(data.collections.amount)}`}
        />
        <StatCard
          icon={Banknote}
          label="আজ বিক্রি"
          value={taka(data.sales.total)}
          sub={`দুধ ${bn(data.sales.kg)} কেজি · নগদ ${taka(data.sales.paid)}`}
        />
        <StatCard
          icon={Wallet}
          label="আজ নগদ এসেছে"
          value={taka(data.cashIn)}
          sub="বিক্রির নগদ + বকেয়া আদায়"
          tone="ghee"
        />
        <StatCard
          icon={Wallet}
          label="দোকানে বাকি (পাবো)"
          value={taka(data.dues.customers)}
          tone="rose"
        />
        <StatCard
          icon={Tractor}
          label="ফার্মকে দিতে হবে"
          value={taka(data.dues.farms)}
          tone="ghee"
        />
        <StatCard
          icon={UserCog}
          label="কর্মচারীর হাতে"
          value={taka(data.employeesInHand)}
          sub="নগদ তুলেছে, এখনো জমা দেয়নি"
          tone="stone"
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>গত ৭ দিন — সংগ্রহ বনাম বিক্রি (কেজি)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gCol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E704D" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1E704D" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="gSold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E5AC46" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#E5AC46" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCEEE3" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#57534e' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#57534e' }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value, name) => [`${bn(value)} কেজি`, name]}
                  labelStyle={{ fontWeight: 600 }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #DCEEE3' }}
                />
                <Legend />
                <Area type="monotone" dataKey="collectedKg" name="সংগ্রহ" stroke="#1E704D" strokeWidth={2} fill="url(#gCol)" />
                <Area type="monotone" dataKey="soldKg" name="বিক্রি" stroke="#D18F22" strokeWidth={2} fill="url(#gSold)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
