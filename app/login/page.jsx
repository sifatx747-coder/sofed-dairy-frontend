'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Droplets, Eye, EyeOff, ShieldCheck, Sprout, Truck } from 'lucide-react';
import { Button, Input, Field } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const HIGHLIGHTS = [
  { icon: ShieldCheck, text: '১০০% খাঁটি দুধ ও দুগ্ধজাত পণ্য' },
  { icon: Sprout, text: 'প্রতিদিন খামার থেকে সংগ্রহ' },
  { icon: Truck, text: 'ঘরে বা দোকানে ডেলিভারি' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const user = await login(phone.trim(), password);
      toast.success(`স্বাগতম, ${user.name}!`);
      router.replace(user.role === 'customer' ? '/shop' : '/dashboard');
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
        <div className="pointer-events-none absolute -left-20 top-10 h-72 w-72 rounded-full bg-leaf-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-20 h-64 w-64 rounded-full bg-ghee-400/20 blur-3xl" />

        {/* brand */}
        <Link href="/" className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ghee-400 text-leaf-900 shadow-sm">
            <Droplets className="h-6 w-6" />
          </span>
          <span className="font-display text-2xl text-white">সফেদ ডেইরি</span>
        </Link>

        {/* centre content */}
        <div className="relative">
          <p className="text-sm font-semibold tracking-wide text-ghee-300">আপনার অ্যাকাউন্টে স্বাগতম</p>
          <h2 className="mt-3 font-display text-4xl leading-snug text-white">
            খাঁটি দুধ,<br />পরিষ্কার বিশ্বাস
          </h2>
          <p className="mt-4 max-w-sm text-leaf-100/70">
            সফেদ ডেইরির সাথে থাকুন — প্রতিদিনের তাজা দুধ, দই, পনির আর ঘি পৌঁছে যাবে আপনার দরজায়।
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
          <h1 className="font-display text-2xl text-leaf-900">লগইন করুন</h1>
          <p className="mt-1 text-sm text-stone-500">মোবাইল নম্বর ও পাসওয়ার্ড দিন</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <Field label="মোবাইল নম্বর" required>
              <Input
                type="tel"
                inputMode="numeric"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </Field>

            <Field label="পাসওয়ার্ড" required>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

            <Button type="submit" loading={busy} className="w-full">
              লগইন
            </Button>
          </form>

          <p className="mt-5 text-center text-sm text-stone-500">
            নতুন কাস্টমার?{' '}
            <Link href="/register" className="font-semibold text-leaf-700 hover:underline">
              অ্যাকাউন্ট খুলুন
            </Link>
          </p>

          <div className="mt-6 rounded-xl bg-leaf-100/60 p-4 text-xs leading-relaxed text-leaf-900/70">
            <p className="font-semibold text-leaf-900">ডেমো লগইন (সিড করার পর):</p>
            <p>মালিক: 01700000000 / admin123</p>
            <p>কাস্টমার: 01800000000 / customer123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
