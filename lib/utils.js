import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

/* ---------- Bengali formatting ---------- */
export const bn = (n) =>
  Number(n ?? 0).toLocaleString('bn-BD', { maximumFractionDigits: 2 });

export const taka = (n) => `৳${bn(n)}`;

export const bnDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const bnDateFull = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('bn-BD', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

/* local YYYY-MM-DD (device timezone — Bangladesh for the owner) */
export const todayStr = () => new Date().toLocaleDateString('en-CA');
export const monthStr = () => todayStr().slice(0, 7);

/* ---------- domain constants ---------- */
export const SHIFTS = [
  { value: 'morning', label: 'সকাল' },
  { value: 'afternoon', label: 'বিকাল' },
];
export const SHIFT_LABEL = { morning: 'সকাল', afternoon: 'বিকাল' };

export const CATEGORY_LABEL = {
  milk: 'দুধ',
  doi: 'দই',
  ponir: 'পনির',
  ghee: 'ঘি',
  other: 'অন্যান্য',
};

export const PRODUCTION_TYPES = [
  { value: 'mishti_doi', label: 'মিষ্টি দই' },
  { value: 'tok_doi', label: 'টক দই' },
  { value: 'ponir', label: 'পনির' },
  { value: 'ghee', label: 'ঘি' },
  { value: 'other', label: 'অন্যান্য' },
];
export const PRODUCTION_LABEL = Object.fromEntries(PRODUCTION_TYPES.map((t) => [t.value, t.label]));

export const CUSTOMER_TYPES = [
  { value: 'shop', label: 'দোকান' },
  { value: 'factory', label: 'ফ্যাক্টরি' },
  { value: 'individual', label: 'ব্যক্তি' },
];
export const CUSTOMER_TYPE_LABEL = Object.fromEntries(CUSTOMER_TYPES.map((t) => [t.value, t.label]));

export const ORDER_STATUS = {
  pending: { label: 'নতুন', tone: 'ghee' },
  confirmed: { label: 'কনফার্ম', tone: 'leaf' },
  delivered: { label: 'ডেলিভারড', tone: 'leaf' },
  cancelled: { label: 'বাতিল', tone: 'rose' },
};

/* effective rate: customer's custom rate → product default */
export const rateFor = (customer, productId, fallback) => {
  const hit = customer?.rates?.find((r) => String(r.product) === String(productId));
  return hit ? hit.rate : fallback;
};
