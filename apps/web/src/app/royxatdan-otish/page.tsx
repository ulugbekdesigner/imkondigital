import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthBrandPanel } from '@/components/auth-brand-panel';
import { OnboardingFlow } from '@/components/onboarding-flow';

export const metadata: Metadata = {
  title: "Ro'yxatdan o'tish",
  description: 'IMKON Digital platformasida hisob yarating.',
};

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[0.85fr_1fr]">
      {/* Chap: quyuq brend panel — IMKON Interface.dc.html 4c-blok, kirish
          sahifasi bilan bir xil qolip */}
      <AuthBrandPanel />

      {/* O'ng: ro'yxatdan o'tish narvoni */}
      <div className="flex items-center justify-center bg-mint px-4 py-12">
        <div className="w-full max-w-xl">
          <OnboardingFlow />
          <p className="mt-6 text-center font-sans text-sm text-ink-soft">
            Hisobingiz bormi?{' '}
            <Link href="/kirish" className="font-semibold text-primary underline-offset-4 hover:underline">
              Kirish
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
