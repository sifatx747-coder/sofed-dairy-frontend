'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  PageHeader, Card, CardHeader, CardTitle, CardContent, Button, Input, Field,
} from '@/components/ui';

export default function SettingsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);

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
