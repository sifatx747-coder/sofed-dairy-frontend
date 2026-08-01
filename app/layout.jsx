import './globals.css';
import { Noto_Sans_Bengali, Baloo_Da_2 } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth';

const noto = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-noto',
  display: 'swap',
});

const baloo = Baloo_Da_2({
  subsets: ['bengali'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-baloo',
  display: 'swap',
});

export const metadata = {
  title: 'সফেদ ডেইরি — খাঁটি দুধের হিসাব',
  description: 'খামার থেকে দোকান — সংগ্রহ, বিক্রি, বাকি ও রিপোর্ট, সব হিসাব এক জায়গায়।',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" className={`${noto.variable} ${baloo.variable}`}>
      <body className="font-sans">
        <AuthProvider>
          {children}
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
