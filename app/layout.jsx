import './globals.css';
import { Hind_Siliguri, Tiro_Bangla } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth';

const hind = Hind_Siliguri({
  subsets: ['bengali', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-hind',
  display: 'swap',
});

const tiro = Tiro_Bangla({
  subsets: ['bengali', 'latin'],
  weight: '400',
  variable: '--font-tiro',
  display: 'swap',
});

export const metadata = {
  title: 'সফেদ ডেইরি — খাঁটি দুধের হিসাব',
  description: 'খামার থেকে দোকান — সংগ্রহ, বিক্রি, বাকি ও রিপোর্ট, সব হিসাব এক জায়গায়।',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" className={`${hind.variable} ${tiro.variable}`}>
      <body className="font-sans">
        <AuthProvider>
          {children}
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
