import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AuthBrandPanel } from '@/components/auth-brand-panel';
import { LoginForm } from '@/components/login-form';

export const metadata: Metadata = {
  title: 'Kirish',
  description: 'IMKON Digital hisobingizga kiring.',
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[0.85fr_1fr]">
      {/* Chap: quyuq brend panel — IMKON Interface.dc.html 4c-blok */}
      <AuthBrandPanel />

      {/* O'ng: kirish formasi */}
      <div className="flex items-center justify-center bg-paper px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <img src="/brand/imkon-mark-color.svg" alt="" aria-hidden="true" width={30} height={30} className="h-[30px] w-[30px] shrink-0" />
            <span className="font-display text-lg font-bold tracking-tight text-ink">IMKON</span>
          </div>

          <div className="mb-6 flex flex-col gap-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Kirish</h1>
            <p className="font-sans text-sm text-ink-soft">
              Hisobingiz yo&apos;qmi?{' '}
              <Link href="/royxatdan-otish" className="font-semibold text-primary underline-offset-4 hover:underline">
                Ro&apos;yxatdan o&apos;ting
              </Link>
            </p>
          </div>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
