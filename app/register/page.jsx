'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Droplets, Eye, EyeOff, PackageCheck, Repeat, BadgeCheck } from 'lucide-react';
import { Button, Input, Field } from '@/components/ui';
import { useAuth } from '@/lib/auth';

const HIGHLIGHTS = [
  { icon: PackageCheck, text: 'দুধ, দই, পনির ও ঘি অর্ডার করুন সহজেই' },
  { icon: Repeat, text: 'এককালীন বা মাসিক সরবরাহ — আপনার পছন্দে' },
  { icon: BadgeCheck, text: 'ন্যায্য দামে খাঁটি পণ্য, সরাসরি খামার থেকে' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', password: '', address: '' });
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== confirm) {
      toast.error('পাসওয়ার্ড দুটি মিলছে না — আবার দেখুন।');
      return;
    }
    setBusy(true);
    try {
      await register({ ...form, name: form.name.trim(), phone: form.phone.trim() });
      toast.success('অ্যাকাউন্ট তৈরি হয়েছে — স্বাগতম!');
      router.replace('/shop');
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── left panel ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-leaf-900 px-12 py-12 lg:flex lg:w-1/2">
        {/* ruled texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'repeating-linear-gradient(to bottom,transparent 0,transparent 47px,#fff 47px,#fff 48px)' }}
        />
        {/* glow blobs */}
        <div className="pointer-events-none absolute -right-16 top-10 h-72 w-72 rounded-full bg-ghee-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-20 h-64 w-64 rounded-full bg-leaf-500/20 blur-3xl" />

        {/* brand */}
        <Link href="/" className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ghee-400 text-leaf-900 shadow-sm">
            <Droplets className="h-6 w-6" />
          </span>
          <span className="font-display text-2xl text-white">সফেদ ডেইরি</span>
        </Link>

        {/* centre content */}
        <div className="relative">
          <p className="text-sm font-semibold tracking-wide text-ghee-300">অ্যাকাউন্ট তৈরি করুন</p>
          <h2 className="mt-3 font-display text-4xl leading-snug text-white">
            তাজা পণ্য,<br />আপনার দরজায়
          </h2>
          <p className="mt-4 max-w-sm text-leaf-100/70">
            সফেদ ডেইরিতে অ্যাকাউন্ট খুলুন এবং প্রতিদিনের তাজা দুধ, দই, পনির ও ঘি অর্ডার করুন — ঘরে বসেই।
          </p>
          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-leaf-100/80">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-ghee-300" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* footer */}
        <p className="relative text-xs text-leaf-100/40">
          © {new Date().getFullYear()} সফেদ ডেইরি · মোঃ সামাল গাজী
        </p>
      </div>

      {/* ── right panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-canvas px-6 py-12">
        {/* mobile brand */}
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-900 text-ghee-300">
            <Droplets className="h-5 w-5" />
          </span>
          <span className="font-display text-xl text-leaf-900">সফেদ ডেইরি</span>
        </Link>

        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl text-leaf-900">নতুন অ্যাকাউন্ট</h1>
          <p className="mt-1 text-sm text-stone-500">
            অ্যাকাউন্ট খুলে দুধ, দই, পনির, ঘি অর্ডার করুন
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Field label="আপনার নাম বা দোকানের নাম" required>
              <Input
                placeholder="যেমন: রাকিব হাসান / মেসার্স হাসান স্টোর"
                value={form.name}
                onChange={set('name')}
                required
              />
            </Field>

            <Field label="মোবাইল নম্বর" required>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChange={set('phone')}
                required
              />
            </Field>

            <Field label="পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)" required>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                  minLength={6}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-leaf-700"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Field label="পাসওয়ার্ড নিশ্চিত করুন" required>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={6}
                  className={`pr-10 ${confirm && confirm !== form.password ? 'border-rose-400 focus:ring-rose-400/60' : confirm && confirm === form.password ? 'border-leaf-400 focus:ring-leaf-400/60' : ''}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-leaf-700"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirm && confirm !== form.password && (
                <p className="mt-1 text-xs text-rose-500">পাসওয়ার্ড মিলছে না</p>
              )}
              {confirm && confirm === form.password && (
                <p className="mt-1 text-xs text-leaf-600">পাসওয়ার্ড মিলেছে ✓</p>
              )}
            </Field>

            <Field label="ঠিকানা (ডেলিভারির জন্য)" required>
              <Input
                placeholder="এলাকা, রোড, বাসা"
                value={form.address}
                onChange={set('address')}
                required
              />
            </Field>

            <Button type="submit" loading={busy} className="w-full">
              অ্যাকাউন্ট খুলুন
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-500">
            আগে থেকেই অ্যাকাউন্ট আছে?{' '}
            <Link href="/login" className="font-semibold text-leaf-700 hover:underline">
              লগইন করুন
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
