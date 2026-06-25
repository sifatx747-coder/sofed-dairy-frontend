'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ClipboardList } from 'lucide-react';
import { api } from '@/lib/api';
import { bn, taka, ORDER_STATUS } from '@/lib/utils';
import { PageHeader, Card, Badge, Button, PageLoader, EmptyState } from '@/components/ui';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    api('/orders/my')
      .then(setOrders)
      .catch((err) => toast.error(err.message));
  }, []);

  if (!orders) return <PageLoader />;

  return (
    <div>
      <PageHeader title="আমার অর্ডার" desc="অর্ডারের অবস্থা এখান থেকে দেখুন" />

      {orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title="এখনো কোনো অর্ডার নেই" desc="দোকান থেকে পছন্দের পণ্য অর্ডার করুন।">
          <Link href="/shop">
            <Button>দোকানে যান</Button>
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map((o) => {
            const st = ORDER_STATUS[o.status] || ORDER_STATUS.pending;
            return (
              <Card key={o._id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-stone-400">
                      অর্ডার #{String(o._id).slice(-6)} ·{' '}
                      {new Date(o.createdAt).toLocaleString('bn-BD', {
                        day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit',
                      })}
                    </p>
                    <p className="num mt-1 font-display text-xl text-leaf-900">{taka(o.total)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {o.status === 'delivered' && (
                      <Badge tone={o.paid ? 'leaf' : 'ghee'}>{o.paid ? 'পরিশোধিত' : 'টাকা বাকি'}</Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 rounded-xl bg-leaf-50/60 p-3.5 text-sm">
                  {o.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>
                        {it.name} <span className="text-stone-400">× {bn(it.quantity)} {it.unit}</span>
                      </span>
                      <span className="num">{taka(it.amount)}</span>
                    </div>
                  ))}
                </div>

                {o.note && <p className="mt-2 text-xs text-stone-500">নোট: {o.note}</p>}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
