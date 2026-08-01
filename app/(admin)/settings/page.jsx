'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck, Truck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  PageHeader, Card, CardHeader, CardTitle, CardContent, Button, Input, Field,
} from '@/components/ui';

export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  const [deliveryCharge, setDeliveryCharge] = useState('');
  const [dcBusy, setDcBusy] = useState(false);

  useEffect(() => {
    api('/settings')
      .then((s) => setDeliveryCharge(String(s.deliveryCharge ?? 0)))
      .catch(() => {});
  }, []);

  const saveDeliveryCharge = async (e) => {
    e.preventDefault();
    const val = Number(deliveryCharge);
    if (isNaN(val) || val < 0) { toast.error('সঠিক পরিমাণ দিন'); return; }
    setDcBusy(true);
    try {
      await api('/settings', { method: 'PUT', body: { deliveryCharge: val } });
      toast.success('ডেলিভারি চার্জ সেভ হয়েছে');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDcBusy(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      toast.error('নতুন পাসওয়ার্ড দুই জায়গায় মেলেনি');
      return;
    }
    setBusy(true);
    try {
      await api('/auth/password', { method: 'PUT', body: { current: form.current, next: form.next } });
      toast.success('পাসওয়ার্ড বদলানো হয়েছে');
      setForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="সেটিংস" desc="অ্যাকাউন্ট ও নিরাপত্তা" />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Delivery charge card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-leaf-600" />
              ডেলিভারি চার্জ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveDeliveryCharge} className="space-y-4">
              <Field label="ক্যাম্পেইন অর্ডারে ডেলিভারি চার্জ (টাকা)">
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  placeholder="০ = বিনামূল্যে"
                />
              </Field>
              <p className="text-xs text-stone-400">
                ০ রাখলে ক্যাম্পেইন পেজে &quot;বিনামূল্যে ডেলিভারি&quot; দেখাবে।
              </p>
              <Button type="submit" loading={dcBusy}>
                সেভ করুন
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>আমার অ্যাকাউন্ট</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">নাম</span>
              <span className="font-medium text-leaf-900">{user?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">মোবাইল</span>
              <span className="num font-medium text-leaf-900">{user?.phone}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">ভূমিকা</span>
              <span className="font-medium text-leaf-900">{user?.role === 'admin' ? 'মালিক' : 'কাস্টমার'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-leaf-600" />
              পাসওয়ার্ড বদলান
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <Field label="বর্তমান পাসওয়ার্ড">
                <Input
                  type="password"
                  value={form.current}
                  onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
                  required
                />
              </Field>
              <Field label="নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)">
                <Input
                  type="password"
                  minLength={6}
                  value={form.next}
                  onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
                  required
                />
              </Field>
              <Field label="নতুন পাসওয়ার্ড আবার">
                <Input
                  type="password"
                  minLength={6}
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  required
                />
              </Field>
              <Button type="submit" loading={busy}>
                পাসওয়ার্ড বদলান
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
