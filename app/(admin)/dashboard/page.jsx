'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Droplets, Banknote, Wallet, Tractor, UserCog, ClipboardList, ArrowLeft, HandCoins,
  TrendingUp, Users, BadgeDollarSign, CalendarDays, CalendarRange, RotateCcw, Infinity,
  FlaskConical, Home, PackageX,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { bn, taka, bnDate, todayStr, monthStr } from '@/lib/utils';
import {
  PageHeader, StatCard, Card, CardHeader, CardTitle, CardContent,
  PageLoader, Spinner, Button, Input,
} from '@/components/ui';
import { useAuth } from '@/lib/auth';

function currentWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const mon = new Date(today);
  mon.setDate(today.getDate() + (day === 0 ? -6 : 1 - day));
  return { from: mon.toLocaleDateString('en-CA'), to: todayStr() };
}

/* ── stat row inside a panel ── */
function Row({ icon: Icon, label, value, tone = 'default' }) {
  const colors = {
    default: 'text-leaf-900',
    ghee: 'text-ghee-700',
    rose: 'text-rose-600',
    stone: 'text-stone-500',
    leaf: 'text-leaf-700',
  };
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-leaf-100 last:border-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="h-5 w-5 shrink-0 text-stone-400" />
        <span className="text-base text-stone-600 truncate">{label}</span>
      </div>
      <span className={`num text-base font-semibold shrink-0 ${colors[tone]}`}>{value}</span>
    </div>
  );
}

/* ── panel wrapper ── */
function Panel({ title, icon: Icon, iconColor = 'text-leaf-600', border = 'border-leaf-200', bg = 'bg-leaf-50/40', controls, loading, children }) {
  return (
    <div className={`rounded-xl2 border ${border} ${bg} p-5`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${iconColor}`} />
          <span className="font-display text-lg font-semibold text-leaf-900">{title}</span>
        </div>
        {controls}
      </div>
      {loading
        ? <div className="flex justify-center py-6"><Spinner /></div>
        : children
      }
    </div>
  );
}

/* ── daily stat cards ── */
function DailyStats({ data }) {
  // total cash physically received today = sales cash + baki adai + employee deposits
  const todayHateAche = Math.round((data.cashIn + (data.todayEmpDeposits || 0)) * 100) / 100;
  return (
    <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="আজের দুধ সংগ্রহ" value={`${bn(data.collections.kg)} কেজি`} sub={`সকাল ${bn(data.collections.morning.kg)} / বিকাল ${bn(data.collections.afternoon.kg)}`} tone="leaf" />
      <StatCard label="আজের বিক্রি" value={taka(data.sales.total)} sub={`নগদ পাওয়া ${taka(data.sales.paid)}`} tone="ghee" />
      <StatCard label="আজ নগদ এসেছে" value={taka(data.cashIn)} sub="বিক্রি + বকেয়া আদায়" tone="leaf" />
      <StatCard label="আজ হাতে আছে" value={taka(todayHateAche)} sub="বিক্রি + বকেয়া + কর্মচারী জমা" tone="leaf" />
    </div>
  );
}

/* ── daily panel ── */
function DailyPanel({ data, date, setDate }) {
  const newDue = Math.max(0, data.sales.total - data.sales.paid);
  const overpaid = Math.max(0, data.sales.paid - data.sales.total);
  // baki adai = customer due payments received today (cashIn = sales.paid + custPayToday)
  const bokeyaAdai = Math.max(0, data.cashIn - data.sales.paid);
  const bal = data.recon?.balance ?? 0;
  return (
    <Panel
      title="আজকের হিসাব"
      icon={CalendarDays}
      border="border-leaf-200"
      bg="bg-leaf-50/40"
      controls={
        <div className="flex items-center gap-1.5">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-8 w-auto text-xs px-2" />
          {date !== todayStr() && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => setDate(todayStr())}>আজ</Button>
          )}
        </div>
      }
    >
      <Row icon={Droplets} label="দুধ সংগ্রহ" value={`${bn(data.collections.kg)} কেজি — ${taka(data.collections.amount)}`} />
      <Row icon={Droplets} label="সকাল / বিকাল" value={`${bn(data.collections.morning.kg)} (${taka(data.collections.morning.amount)}) / ${bn(data.collections.afternoon.kg)} (${taka(data.collections.afternoon.amount)})`} tone="stone" />
      <Row icon={Banknote} label="বিক্রি" value={`${bn(data.sales.kg)} কেজি — ${taka(data.sales.total)}`} />
      {data.production?.totalMilkKg > 0 && (
        <Row icon={FlaskConical} label="উৎপাদনে দুধ" value={`${bn(data.production.totalMilkKg)} কেজি`} tone="stone" />
      )}
      {data.adjustments?.homeKg > 0 && (
        <Row icon={Home} label="ঘরের দুধ" value={`${bn(data.adjustments.homeKg)} কেজি`} tone="stone" />
      )}
      {data.adjustments?.leakKg > 0 && (
        <Row icon={PackageX} label="লিক/ফেরত" value={`−${bn(data.adjustments.leakKg)} কেজি`} tone="rose" />
      )}
      <Row
        icon={Droplets}
        label="দুধের ব্যালেন্স"
        value={`${bal > 0 ? '+' : ''}${bn(bal)} কেজি`}
        tone={bal === 0 ? 'leaf' : bal > 0 ? 'ghee' : 'rose'}
      />
      <Row icon={Wallet} label="নগদ এসেছে" value={taka(data.cashIn)} tone="ghee" />
      {(data.todayEmpDeposits || 0) > 0 && (
        <Row icon={Users} label="কর্মচারী জমা পেয়েছি" value={taka(data.todayEmpDeposits)} tone="leaf" />
      )}
      {(data.todayFarmPaid || 0) > 0 && (
        <Row icon={Tractor} label="ফার্মকে দিয়েছি" value={`−${taka(data.todayFarmPaid)}`} tone="stone" />
      )}
      <Row
        icon={HandCoins}
        label="আজ হাতে আছে"
        value={taka(data.cashIn + (data.todayEmpDeposits || 0))}
        tone="ghee"
      />
      <Row icon={Tractor} label="ফার্ম বাকি (আজকের)" value={taka(Math.max(0, data.collections.amount - (data.todayFarmPaid || 0)))} tone="rose" />
      {newDue > 0 && (
        <Row icon={BadgeDollarSign} label="নতুন বাকি" value={taka(newDue)} tone="rose" />
      )}
      {overpaid > 0 && (
        <Row icon={BadgeDollarSign} label="অতিরিক্ত পেমেন্ট" value={taka(overpaid)} tone="ghee" />
      )}
      {bokeyaAdai > 0 && (
        <Row icon={Users} label="বকেয়া আদায়" value={taka(bokeyaAdai)} tone="leaf" />
      )}
    </Panel>
  );
}

/* ── monthly panel ── */
function MonthlyPanel() {
  const [month, setMonth] = useState(monthStr());
  const [input, setInput] = useState(monthStr());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = (m) => {
    setLoading(true); setData(null);
    api(`/reports/monthly?month=${m}`)
      .then(setData).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(month); }, [month]);

  const apply = () => setMonth(input);
  const reset = () => { const m = monthStr(); setInput(m); setMonth(m); };

  const label = (() => {
    try { return new Date(`${month}-01T00:00:00`).toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' }); }
    catch { return month; }
  })();

  const empTotal = data?.deposits?.reduce((s, x) => s + x.amount, 0) ?? 0;

  return (
    <Panel
      title={`মাসিক — ${label}`}
      icon={CalendarRange}
      iconColor="text-ghee-600"
      border="border-ghee-200"
      bg="bg-ghee-50/30"
      loading={loading}
      controls={
        <div className="flex items-center gap-1.5">
          <Input type="month" value={input} onChange={(e) => setInput(e.target.value)} className="h-8 w-auto text-xs px-2" />
          <Button size="sm" className="h-8 px-2.5 text-xs" onClick={apply} disabled={loading}>দেখুন</Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={reset} disabled={loading}><RotateCcw className="h-3 w-3" /></Button>
        </div>
      }
    >
      {data && <>
        <Row icon={Droplets} label="দুধ সংগ্রহ" value={`${bn(data.collections.kg)} কেজি`} />
        <Row icon={Tractor} label="সংগ্রহ খরচ" value={taka(data.collections.amount)} tone="stone" />
        <Row icon={Banknote} label="বিক্রি (মোট)" value={taka(data.sales.total)} />
        <Row icon={Wallet} label="নগদ এসেছে" value={taka(data.cashIn)} tone="ghee" />
        <Row icon={BadgeDollarSign} label="বাকি" value={taka(data.sales.due)} tone="rose" />
        <Row icon={Users} label="কর্মচারী জমা" value={taka(empTotal)} tone="stone" />
        <Row icon={TrendingUp} label="আনুমানিক লাভ" value={taka(data.profitEstimate)} tone="leaf" />
      </>}
    </Panel>
  );
}

/* ── weekly panel ── */
function WeeklyPanel() {
  const def = currentWeekRange();
  const [from, setFrom] = useState(def.from);
  const [to, setTo] = useState(def.to);
  const [pendingFrom, setPendingFrom] = useState(def.from);
  const [pendingTo, setPendingTo] = useState(def.to);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const load = (f, t) => {
    setLoading(true); setData(null);
    api(`/reports/range?from=${f}&to=${t}`)
      .then(setData).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(from, to); }, [from, to]);

  const apply = () => { if (pendingFrom <= pendingTo) { setFrom(pendingFrom); setTo(pendingTo); } };
  const reset = () => {
    const r = currentWeekRange();
    setPendingFrom(r.from); setPendingTo(r.to);
    setFrom(r.from); setTo(r.to);
  };

  const empTotal = data?.deposits?.reduce((s, x) => s + x.amount, 0) ?? 0;

  return (
    <Panel
      title="সাপ্তাহিক হিসাব"
      icon={CalendarDays}
      border="border-leaf-200"
      bg="bg-leaf-50/40"
      loading={loading}
      controls={
        <div className="flex flex-wrap items-center gap-1.5">
          <Input type="date" value={pendingFrom} onChange={(e) => setPendingFrom(e.target.value)} className="h-8 w-auto text-xs px-2" />
          <span className="text-stone-400 text-xs">—</span>
          <Input type="date" value={pendingTo} onChange={(e) => setPendingTo(e.target.value)} className="h-8 w-auto text-xs px-2" />
          <Button size="sm" className="h-8 px-2.5 text-xs" onClick={apply} disabled={loading || pendingFrom > pendingTo}>দেখুন</Button>
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={reset} disabled={loading}><RotateCcw className="h-3 w-3" /></Button>
        </div>
      }
    >
      {data && <>
        {(from !== def.from || to !== def.to) && (
          <p className="mb-2 text-xs text-stone-400">{bnDate(from)} – {bnDate(to)}</p>
        )}
        <Row icon={Droplets} label="দুধ সংগ্রহ" value={`${bn(data.collections.kg)} কেজি`} />
        <Row icon={Tractor} label="সংগ্রহ খরচ" value={taka(data.collections.amount)} tone="stone" />
        <Row icon={Banknote} label="বিক্রি (মোট)" value={taka(data.sales.total)} />
        <Row icon={Wallet} label="নগদ এসেছে" value={taka(data.cashIn)} tone="ghee" />
        <Row icon={BadgeDollarSign} label="বাকি" value={taka(data.sales.due)} tone="rose" />
        <Row icon={Users} label="কর্মচারী জমা" value={taka(empTotal)} tone="stone" />
        <Row icon={TrendingUp} label="আনুমানিক লাভ" value={taka(data.profitEstimate)} tone="leaf" />
      </>}
    </Panel>
  );
}

/* ── all-time panel ── */
function AllTimePanel({ data }) {
  return (
    <Panel
      title="সর্বকালীন সারসংক্ষেপ"
      icon={Infinity}
      iconColor="text-stone-500"
      border="border-stone-200"
      bg="bg-stone-50/40"
    >
      <Row icon={Droplets} label="মোট সংগ্রহ খরচ" value={taka(data.allTime.collectionAmount)} tone="stone" />
      <Row icon={Banknote} label="মোট বিক্রি" value={taka(data.allTime.salesTotal)} />
      <Row icon={TrendingUp} label="আনুমানিক মোট লাভ" value={taka(data.allTime.profitEstimate)} tone="leaf" />
      <Row icon={Wallet} label="দোকানে বাকি (পাবো)" value={taka(data.dues.customers)} tone="rose" />
      <Row icon={Tractor} label="ফার্মকে দিতে হবে" value={taka(data.dues.farms)} tone="ghee" />
      <Row icon={HandCoins} label="মালিকের হাতে নগদ" value={taka(data.adminCashInHand)} tone="leaf" />
      <Row icon={UserCog} label="কর্মচারীর হাতে" value={taka(data.employeesInHand)} tone="stone" />
    </Panel>
  );
}

/* ── main ── */
export default function DashboardPage() {
  const { user } = useAuth();
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    api(`/reports/dashboard?date=${date}`)
      .then(setData).catch((e) => toast.error(e.message));
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

      {/* Daily stat cards */}
      <DailyStats data={data} />

      {/* Row 1: Daily | Monthly */}
      <div className="grid gap-5 lg:grid-cols-2">
        <DailyPanel data={data} date={date} setDate={setDate} />
        <MonthlyPanel />
      </div>

      {/* Row 2: Weekly | All-time */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <WeeklyPanel />
        <AllTimePanel data={data} />
      </div>

      {/* Row 3: Employee deposits (left) + Production (right) */}
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* কর্মচারী জমা */}
        <Card>
          <CardHeader><CardTitle>সাম্প্রতিক কর্মচারী জমা</CardTitle></CardHeader>
          <CardContent>
            {data.recentDeposits?.length > 0 ? (
              <>
                <div className="space-y-2">
                  {data.recentDeposits.map((d) => (
                    <div key={d._id} className="flex items-center justify-between rounded-lg border border-leaf-100 px-3 py-2 text-sm">
                      <span className="text-stone-600">
                        <span className="font-medium text-leaf-900">{d.employeeName}</span>
                        <span className="mx-1.5 text-stone-300">·</span>
                        {bnDate(d.date)}
                        {d.note && <span className="text-stone-400"> · {d.note}</span>}
                      </span>
                      <span className="num font-semibold text-leaf-700">{taka(d.amount)}</span>
                    </div>
                  ))}
                </div>
                <Link href="/employees" className="mt-3 block text-center text-xs text-leaf-600 hover:underline">
                  সব কর্মচারীর হিসাব দেখুন →
                </Link>
              </>
            ) : (
              <p className="py-4 text-center text-sm text-stone-400">কোনো জমা নেই</p>
            )}
          </CardContent>
        </Card>

        {/* উৎপাদন */}
        <Card>
          <CardHeader>
            <CardTitle>আজকের উৎপাদন</CardTitle>
            <Link href="/production" className="text-xs text-leaf-600 hover:underline">সব দেখুন →</Link>
          </CardHeader>
          <CardContent>
            {data.production?.rows?.length > 0 ? (
              <div className="space-y-2">
                {data.production.rows.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-leaf-100 px-3 py-2 text-sm">
                    <span className="font-medium text-leaf-900">{p.type}</span>
                    <div className="flex items-center gap-3 text-stone-500">
                      {p.outputQty > 0 && (
                        <span className="num">{bn(p.outputQty)} {p.outputUnit}</span>
                      )}
                      <span className="num text-stone-400">{bn(p.milkUsedKg)} কেজি দুধ</span>
                    </div>
                  </div>
                ))}
                <div className="mt-1 flex items-center justify-between rounded-lg bg-leaf-50 px-3 py-2 text-sm font-semibold">
                  <span className="text-leaf-800">মোট দুধ ব্যবহার</span>
                  <span className="num text-leaf-900">{bn(data.production.totalMilkKg)} কেজি</span>
                </div>
              </div>
            ) : (
              <p className="py-2 text-sm text-stone-400">আজ কোনো উৎপাদন নেই</p>
            )}
            {(data.adjustments?.homeKg > 0 || data.adjustments?.leakKg > 0) && (
              <div className="mt-3 space-y-1.5 border-t border-leaf-100 pt-3">
                {data.adjustments.homeKg > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-stone-500"><Home className="h-4 w-4" /> ঘরের দুধ</span>
                    <span className="num font-medium text-stone-700">{bn(data.adjustments.homeKg)} কেজি</span>
                  </div>
                )}
                {data.adjustments.leakKg > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-rose-500"><PackageX className="h-4 w-4" /> লিক/ফেরত</span>
                    <span className="num font-medium text-rose-600">−{bn(data.adjustments.leakKg)} কেজি</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="mt-5">
        <CardHeader><CardTitle>গত ৭ দিন — সংগ্রহ বনাম বিক্রি (কেজি)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64 w-full">
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
                  formatter={(v, n) => [`${bn(v)} কেজি`, n]}
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
