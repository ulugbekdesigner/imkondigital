import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthBrandPanel } from '@/components/auth-brand-panel';
import { ResetPasswordForm } from '@/components/reset-password-form';

export const metadata: Metadata = {
  title: 'Parolni tiklash',
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[0.85fr_1fr]">
      <AuthBrandPanel />

      <div className="flex items-center justify-center bg-paper px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <img
              src="/brand/imkon-mark-color.svg"
              alt=""
              aria-hidden="true"
              width={30}
              height={30}
              className="h-[30px] w-[30px] shrink-0"
            />
            <span className="font-display text-lg font-bold tracking-tight text-ink">IMKON</span>
          </div>

          <div className="mb-6 flex flex-col gap-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink">
              Parolni tiklash
            </h1>
            <p className="font-sans text-sm text-ink-soft">Yangi parolingizni kiriting.</p>
          </div>

          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
