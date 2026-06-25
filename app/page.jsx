'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Droplets, Milk, Sprout, Truck, ShieldCheck, BadgeCheck,
  ArrowRight, Phone, MapPin, Sparkles, Clock, Repeat, Mail, User,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';

/* ⚠️ আসল তথ্য এখানে বসান */
const OWNER = 'মোঃ সামাল গাজী'; // Md. Samal Gazi
const CONTACT = {
  phone: '+8801XXXXXXXXX',
  phoneLabel: '০১XXX-XXXXXX',
  email: 'info@sofeddairy.com',
  address: 'সফেদ ডেইরি, [এলাকা], বাংলাদেশ',
  hours: 'প্রতিদিন সকাল ও বিকাল',
};

/* what সফেদ ডেইরি sells — কাস্টমার-মুখী, ভেতরের হিসাব নয়
   img: এখন প্লেসহোল্ডার অনলাইন ছবি (Unsplash / Wikimedia)। নিজের আসল ছবি দিতে
   img-এর URL বদলান, অথবা client/public/products/ এ ছবি রেখে '/products/dudh.jpg' এর মতো পথ দিন */
const PRODUCTS = [
  { name: 'খাঁটি দুধ', initial: 'দু', img: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=800&q=80&auto=format&fit=crop', desc: 'প্রতিদিন সকালে খামার থেকে সংগ্রহ করা টাটকা গরুর দুধ।', from: 'from-leaf-100', to: 'to-leaf-50' },
  { name: 'মিষ্টি দই', initial: 'মি', img: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Mishti_Doi.jpg', desc: 'ঐতিহ্যবাহী স্বাদে যত্নে পাতা মিষ্টি দই।', from: 'from-ghee-100', to: 'to-ghee-200/40' },
  { name: 'টক দই', initial: 'ট', img: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=800&q=80&auto=format&fit=crop', desc: 'খাঁটি দুধে পাতা স্বাস্থ্যকর টক দই, ঘরের খাবারে।', from: 'from-leaf-100', to: 'to-ghee-100/50' },
  { name: 'কাপ দই', initial: 'কা', img: 'https://images.unsplash.com/photo-1641494587136-eec74f1944ae?w=800&q=80&auto=format&fit=crop', desc: 'এক কাপেই মিষ্টি দই — সহজে পরিবেশন, সবার পছন্দ।', from: 'from-ghee-200/40', to: 'to-leaf-50' },
  { name: 'পনির', initial: 'প', img: 'https://images.unsplash.com/photo-1631452180539-96aca7d48617?w=800&q=80&auto=format&fit=crop', desc: 'খাঁটি দুধ থেকে তৈরি নরম তাজা পনির — রান্নায় অতুলনীয়।', from: 'from-leaf-50', to: 'to-ghee-100/60' },
  { name: 'ঘি', initial: 'ঘ', img: 'https://images.unsplash.com/photo-1573812461383-e5f8b759d12e?w=800&q=80&auto=format&fit=crop', desc: 'খাঁটি দেশি ঘি — দুধের সর থেকে, ঘ্রাণেই চেনা যায়।', from: 'from-ghee-200/50', to: 'to-ghee-100' },
];

/* কেন সফেদ — গ্রাহকের মূল্যবোধ, প্রতিষ্ঠানের গোপন তথ্য নয় */
const PROMISES = [
  { icon: ShieldCheck, title: '১০০% খাঁটি', desc: 'ভেজাল নেই, পানি মেশানো নেই — কথা দিচ্ছি।' },
  { icon: Sprout, title: 'খামারের তাজা', desc: 'প্রতিদিনের দুধ প্রতিদিন, বাসি কিছু নয়।' },
  { icon: Truck, title: 'ঘরে বা দোকানে', desc: 'বাসা হোক বা দোকান — পৌঁছে যাবে আপনার জায়গায়।' },
  { icon: Repeat, title: 'এককালীন বা মাসিক', desc: 'একবারের অর্ডার, কিংবা প্রতিদিনের জন্য মাসিক সরবরাহ।' },
  { icon: Clock, title: 'সকাল ও বিকাল', desc: 'দুই বেলাই তাজা দুধ — আপনার সময় মতো।' },
  { icon: BadgeCheck, title: 'ন্যায্য দাম', desc: 'সরাসরি খামার থেকে, তাই দাম সবসময় ঠিক।' },
];

const STEPS = [
  { title: 'পছন্দ করুন', desc: 'দোকান থেকে দুধ, দই, পনির বা ঘি বেছে নিন।' },
  { title: 'অর্ডার দিন', desc: 'ঠিকানা দিয়ে কয়েক ক্লিকেই অর্ডার কনফার্ম করুন।' },
  { title: 'বুঝে নিন', desc: 'তাজা পণ্য পৌঁছে যাবে আপনার ঘরে, সময়মতো।' },
];

/* product card — real photo when available, elegant letter-tile fallback */
function ProductCard({ p }) {
  const [imgOk, setImgOk] = useState(Boolean(p.img));
  return (
    <div className="group overflow-hidden rounded-xl2 bg-surface shadow-soft ring-1 ring-leaf-900/5 transition-shadow hover:shadow-lift">
      <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${p.from} ${p.to}`}>
        {imgOk ? (
          <img
            src={p.img}
            alt={p.name}
            loading="lazy"
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-display text-5xl text-leaf-400/80 transition-transform duration-300 group-hover:scale-110">
              {p.initial}
            </span>
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg text-leaf-900">{p.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{p.desc}</p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const appHref = user ? (user.role === 'admin' ? '/dashboard' : '/shop') : '/login';

  return (
    <div className="min-h-screen bg-canvas">
      {/* ---------------------------------------------------------------- nav */}
      <header
        className={`sticky top-0 z-50 border-b transition-colors ${
          scrolled
            ? 'border-white/10 bg-leaf-900/90 shadow-lift backdrop-blur'
            : 'border-transparent bg-leaf-900'
        }`}
      >
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ghee-400 text-leaf-900 shadow-sm">
              <Droplets className="h-5 w-5" />
            </span>
            <span className="font-display text-xl text-white">সফেদ ডেইরি</span>
          </Link>

          <div className="hidden items-center gap-7 text-sm text-leaf-100/80 md:flex">
            <a href="#products" className="transition-colors hover:text-white">পণ্য</a>
            <a href="#why" className="transition-colors hover:text-white">কেন সফেদ</a>
            <a href="#order" className="transition-colors hover:text-white">অর্ডার</a>
          </div>

          <Link href={appHref}>
            <Button variant="accent" size="sm" className="gap-1.5">
              {user ? 'অ্যাপে যান' : 'লগইন'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </nav>
      </header>

      {/* --------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden bg-leaf-900">
        {/* khata-style ruled texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, transparent 0, transparent 47px, #fff 47px, #fff 48px)',
          }}
        />
        {/* soft glow blobs */}
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-leaf-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -top-10 h-72 w-72 rounded-full bg-ghee-400/20 blur-3xl" />

        <div className="relative mx-auto max-w-3xl px-6 pb-28 pt-16 text-center md:pt-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-ghee-200 ring-1 ring-white/15">
            <Sparkles className="h-3.5 w-3.5" />
            খামার থেকে আপনার ঘরে বা দোকানে
          </span>

          <h1 className="mt-6 font-display text-4xl leading-tight text-white md:text-6xl">
            খাঁটি দুধ,
            <br className="hidden sm:block" /> পরিষ্কার বিশ্বাস
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-leaf-100/80 md:text-lg">
            সফেদ ডেইরি — খামারের টাটকা দুধ, মিষ্টি ও টক দই, পনির আর খাঁটি ঘি, ভেজাল ছাড়া।
            অর্ডার করুন, পৌঁছে যাবে আপনার দরজায়।
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href={user ? appHref : '/register'}>
              <Button variant="accent" size="lg" className="gap-2">
                {user ? 'অ্যাপে ফিরে যান' : 'অর্ডার শুরু করুন'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {!user && (
              <Link href="/login">
                <Button size="lg" className="bg-white/10 text-white ring-1 ring-white/20 hover:bg-white/15">
                  লগইন করুন
                </Button>
              </Link>
            )}
          </div>

          {/* trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-leaf-100/70">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-ghee-300" /> ১০০% খাঁটি</span>
            <span className="inline-flex items-center gap-1.5"><Sprout className="h-4 w-4 text-ghee-300" /> খামারের তাজা</span>
            <span className="inline-flex items-center gap-1.5"><Truck className="h-4 w-4 text-ghee-300" /> ঘরে বা দোকানে</span>
            <span className="inline-flex items-center gap-1.5"><Repeat className="h-4 w-4 text-ghee-300" /> এককালীন বা মাসিক</span>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- products */}
      <section id="products" className="mx-auto max-w-6xl px-6">
        {/* cards overlap into the dark hero for a modern lift */}
        <div className="-mt-16 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.name} p={p} />
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------------- why */}
      <section id="why" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold tracking-wide text-leaf-600">কেন সফেদ ডেইরি</p>
          <h2 className="mt-2 font-display text-3xl text-leaf-900 md:text-4xl">
            দুধে খাঁটি, হিসাবে পরিষ্কার
          </h2>
          <p className="mt-3 text-stone-500">
            আমরা বিশ্বাস করি ভালো দুধ মানে ভালো সকাল। তাই প্রতিটি ফোঁটায় থাকে যত্ন আর সততা।
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PROMISES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl2 bg-surface p-6 shadow-soft ring-1 ring-leaf-900/5">
              <span className="mb-4 inline-flex rounded-xl bg-leaf-100 p-3 text-leaf-700">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg text-leaf-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- order */}
      <section id="order" className="bg-leaf-50/60 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold tracking-wide text-leaf-600">সহজ তিন ধাপে</p>
            <h2 className="mt-2 font-display text-3xl text-leaf-900 md:text-4xl">অর্ডার করবেন যেভাবে</h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative rounded-xl2 bg-surface p-6 shadow-soft ring-1 ring-leaf-900/5">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ghee-400 font-display text-xl text-leaf-900 shadow-sm">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-display text-lg text-leaf-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-stone-500">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link href={user ? appHref : '/register'}>
              <Button variant="accent" size="lg" className="gap-2">
                <Milk className="h-4 w-4" />
                {user ? 'দোকানে যান' : 'অ্যাকাউন্ট খুলে অর্ডার করুন'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ suppliers / partner */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="overflow-hidden rounded-xl2 bg-leaf-900 px-7 py-10 shadow-lift md:px-12 md:py-12">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-ghee-200 ring-1 ring-white/15">
                <Sprout className="h-3.5 w-3.5" />
                খামারি ও সরবরাহকারীদের জন্য
              </span>
              <h2 className="mt-4 font-display text-2xl text-white md:text-3xl">
                নিয়মিত দুধ সরবরাহ করতে চান?
              </h2>
              <p className="mt-3 text-leaf-100/80">
                আপনি যদি খামারি হন বা মানসম্মত দুধ সরবরাহ করতে চান — আমাদের সাথে যুক্ত হোন।
                ন্যায্য দর আর সময়মতো হিসাব, কথা দিচ্ছি।
              </p>
            </div>
            <a href={`tel:${CONTACT.phone}`} className="shrink-0">
              <Button variant="accent" size="lg" className="gap-2">
                <Phone className="h-4 w-4" />
                যোগাযোগ করুন
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- footer */}
      <footer className="border-t border-leaf-100 bg-surface">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* brand + owner */}
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-900 text-ghee-300">
                  <Droplets className="h-5 w-5" />
                </span>
                <span className="font-display text-xl text-leaf-900">সফেদ ডেইরি</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-500">
                খাঁটি দুধ, পরিষ্কার হিসাব — খামার থেকে সরাসরি আপনার ঘরে বা দোকানে।
              </p>
              <div className="mt-4 flex items-center gap-3 rounded-xl bg-leaf-50 p-3 ring-1 ring-leaf-900/5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-leaf-700">
                  <User className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs text-stone-400">স্বত্বাধিকারী</p>
                  <p className="text-sm font-semibold text-leaf-900">{OWNER}</p>
                </div>
              </div>
            </div>

            {/* products */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-leaf-900/50">আমাদের পণ্য</p>
              <ul className="mt-3 space-y-2 text-sm text-stone-500">
                {PRODUCTS.map((p) => (
                  <li key={p.name}>
                    <a href="#products" className="hover:text-leaf-700">{p.name}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* quick links */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-leaf-900/50">দ্রুত লিংক</p>
              <ul className="mt-3 space-y-2 text-sm text-stone-500">
                <li><a href="#products" className="hover:text-leaf-700">পণ্য</a></li>
                <li><a href="#why" className="hover:text-leaf-700">কেন সফেদ</a></li>
                <li><a href="#order" className="hover:text-leaf-700">অর্ডার</a></li>
                <li><Link href="/register" className="hover:text-leaf-700">অ্যাকাউন্ট খুলুন</Link></li>
                <li><Link href="/login" className="hover:text-leaf-700">লগইন</Link></li>
              </ul>
            </div>

            {/* contact */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-leaf-900/50">যোগাযোগ</p>
              <ul className="mt-3 space-y-2.5 text-sm text-stone-500">
                <li>
                  <a href={`tel:${CONTACT.phone}`} className="inline-flex items-center gap-2 hover:text-leaf-700">
                    <Phone className="h-3.5 w-3.5 shrink-0" /> {CONTACT.phoneLabel}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-2 hover:text-leaf-700">
                    <Mail className="h-3.5 w-3.5 shrink-0" /> {CONTACT.email}
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{CONTACT.address}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0" /> {CONTACT.hours}
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-leaf-100 pt-6 text-center text-xs text-stone-400 sm:flex-row sm:text-left">
            <p>© {new Date().getFullYear()} সফেদ ডেইরি · সর্বস্বত্ব সংরক্ষিত</p>
            <p>স্বত্বাধিকারী — {OWNER}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
