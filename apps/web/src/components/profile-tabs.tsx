'use client';
/* ============================================================
   IMKON DIGITAL — ProfileTabs
   /profil sahifasining 9 ta GlassCard'ini (avval bitta uzun ustunda
   tartibsiz ketma-ket edi) 4 ta mantiqiy guruhga ajratadi. Har bir
   pastki komponent (PersonalInfoForm, PassportSettings va h.k.)
   o'zgarishsiz qoladi — faqat QAYERDA render bo'lishi o'zgardi.
   URL hash (#shaxsiy-malumotlar, #sozlamalar) orqali to'g'ridan-to'g'ri
   kerakli tabga o'tish qo'llab-quvvatlanadi (ProfileCompleteness va
   AppShell "Sozlamalar" havolasi shu hashlarga tayanadi).
   ============================================================ */
import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from 'react';
import { GlassCard, CardHeader, CardTitle, CardDescription, Badge, buttonVariants } from '@imkon/ui';
import Link from 'next/link';
import {
  BookIcon,
  BriefcaseIcon,
  ClipboardIcon,
  GearIcon,
  StarIcon,
  UserIcon,
  WalletIcon,
} from '@/components/shell-icons';
import { EmptyState } from '@/components/state-panels';
import { PersonalInfoForm } from '@/components/personal-info-form';
import { PassportSettings } from '@/components/passport-settings';
import { DisabilityProfileSection } from '@/components/disability-profile-section';
import { PortfolioManager } from '@/components/portfolio-manager';
import { CertificateCard } from '@/components/certificate-card';
import { LadderPath } from '@/components/ladder-path';
import { TelegramLinkPanel } from '@/components/telegram-link-panel';
import { DataExportButton } from '@/components/data-export-button';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { AccessibilitySettingsCard } from '@/components/accessibility-settings-card';
import { AccountDeactivateCard } from '@/components/account-deactivate-card';
import type {
  Me,
  Region,
  Certificate,
  PortfolioItem,
  ApplicationOut,
  OrderCard,
  MyEnrollment,
  MySubmissionOut,
} from '@/lib/types';

const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Davom etmoqda',
  completed: 'Tugallangan',
};

const SUBMISSION_STATUS_LABELS: Record<string, string> = {
  submitted: 'Koʼrib chiqilmoqda',
  approved: 'Tasdiqlangan',
  rejected: "Qayta ishlash kerak",
};

const APPLICATION_STATUS_LABELS: Record<string, string> = {
  submitted: 'Yuborilgan',
  viewed: "Ko'rilgan",
  interview: 'Suhbatda',
  accepted: 'Qabul qilingan',
  rejected: 'Rad etilgan',
};

const VERIFY_LABELS: Record<string, string> = {
  none: "To'ldirilmagan",
  pending: 'Tekshiruvda',
  verified: 'Tasdiqlangan',
  rejected: 'Rad etilgan',
};

type TabKey = 'malumotlar' | 'yutuqlarim' | 'faoliyatim' | 'sozlamalar';

const TABS: {
  key: TabKey;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  hash: string;
}[] = [
  { key: 'malumotlar', label: "Ma'lumotlar", Icon: UserIcon, hash: 'shaxsiy-malumotlar' },
  { key: 'yutuqlarim', label: 'Yutuqlarim', Icon: StarIcon, hash: 'yutuqlarim' },
  { key: 'faoliyatim', label: 'Faoliyatim', Icon: ClipboardIcon, hash: 'faoliyatim' },
  { key: 'sozlamalar', label: 'Sozlamalar', Icon: GearIcon, hash: 'sozlamalar' },
];

function tabForHash(hash: string): TabKey | null {
  const clean = hash.replace('#', '');
  if (clean === 'shaxsiy-malumotlar') return 'malumotlar';
  const found = TABS.find((t) => t.hash === clean);
  return found ? found.key : null;
}

export function ProfileTabs({
  me,
  regions,
  certificates,
  portfolio,
  applications,
  orders,
  enrollments,
  submissions,
  telegramLinked,
  disabilityRejectionReason,
  disabilityDocUrl,
}: {
  me: Me;
  regions: Region[];
  certificates: Certificate[];
  portfolio: PortfolioItem[];
  applications: ApplicationOut[];
  orders: OrderCard[];
  enrollments: MyEnrollment[];
  submissions: MySubmissionOut[];
  telegramLinked: boolean;
  disabilityRejectionReason: string | null;
  disabilityDocUrl: string | null;
}) {
  const [tab, setTab] = useState<TabKey>('malumotlar');

  useEffect(() => {
    function syncFromHash() {
      const match = tabForHash(window.location.hash);
      if (match) {
        setTab(match);
        // Panel endi ko'rinadi — brauzer birinchi urinishda topolmagan
        // elementga hozir sakraydi (tab almashguncha u hidden edi).
        requestAnimationFrame(() => {
          document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'start' });
        });
      }
    }
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const verify = me.disability_verified_status;
  const skills = Array.from(new Set(portfolio.flatMap((p) => p.skills)));

  return (
    <div className="mt-8">
      <div role="tablist" aria-label="Profil bo'limlari" className="flex flex-wrap gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex min-h-touch items-center gap-2 border-b-2 px-3 py-2 font-sans text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-inset motion-reduce:transition-none ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            <t.Icon width={16} height={16} />
            {t.label}
          </button>
        ))}
      </div>

      <TabPanel active={tab === 'malumotlar'} id="shaxsiy-malumotlar">
        <GlassCard className="scroll-mt-8 p-6">
          <CardHeader>
            <CardTitle>Shaxsiy ma'lumotlar</CardTitle>
            <CardDescription>Bu ma'lumotlar faqat siz uchun — profilni to'ldirish uchun.</CardDescription>
          </CardHeader>
          <PersonalInfoForm me={me} regions={regions} />
        </GlassCard>

        <GlassCard className="mt-6 p-6">
          <CardHeader>
            <CardTitle>Nogironlik profili</CardTitle>
            <CardDescription>
              Holat: {verify ? (VERIFY_LABELS[verify] ?? verify) : VERIFY_LABELS.none}
            </CardDescription>
          </CardHeader>
          <DisabilityProfileSection
            verifiedStatus={verify}
            rejectionReason={disabilityRejectionReason}
            docUrl={disabilityDocUrl}
          />
        </GlassCard>
      </TabPanel>

      <TabPanel active={tab === 'yutuqlarim'} id="yutuqlarim">
        <GlassCard className="p-6">
          <CardHeader>
            <CardTitle>Sertifikatlarim</CardTitle>
            <CardDescription>Kurslarni tugatganda avtomatik beriladi (PDF + QR).</CardDescription>
          </CardHeader>
          {certificates.length > 0 ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {certificates.map((c) => (
                <CertificateCard key={c.uid} cert={c} variant="compact" />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<StarIcon width={24} height={24} />}
              title="Hali sertifikat yo'q"
              description="Bir kursni oxirigacha o'qing — sertifikat avtomatik beriladi."
              action={
                <Link href="/kurslar" className={buttonVariants({ size: 'sm' })}>
                  Kurslarni ko'rish
                </Link>
              }
            />
          )}
        </GlassCard>

        <GlassCard className="mt-6 p-6">
          <CardHeader>
            <CardTitle>Ko'nikmalarim va o'sish</CardTitle>
            <CardDescription>Portfolio ishlaringizdagi ko'nikmalar va Narvondagi joriy pog'onangiz.</CardDescription>
          </CardHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-2xl border border-line p-4">
              <span className="font-sans text-xs font-bold uppercase tracking-wide text-ink-soft">
                Ko'nikma
              </span>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-surface-2 px-[11px] py-1.5 font-sans text-xs font-semibold text-ink"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-sans text-sm text-ink-soft">
                  Portfolio ishi qo'shsangiz, ko'nikmalaringiz shu yerda ko'rinadi.
                </p>
              )}
            </div>
            <LadderPath ladderStep={me.ladder_step} />
          </div>
        </GlassCard>

        <GlassCard className="mt-6 p-6">
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
            <CardDescription>
              Ishlaringizni qo'shing yoki tasdiqlangan kurs topshiriqlaridan avtomatik to'ldiring.
            </CardDescription>
          </CardHeader>
          <PortfolioManager initialItems={portfolio} />
        </GlassCard>
      </TabPanel>

      <TabPanel active={tab === 'faoliyatim'} id="faoliyatim">
        <GlassCard className="p-6">
          <CardHeader>
            <CardTitle>Arizalarim</CardTitle>
            <CardDescription>Vakansiyalarga bergan arizalaringiz holati.</CardDescription>
          </CardHeader>
          {applications.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {applications.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-line px-3 py-2"
                >
                  <div>
                    <Link
                      href={`/vakansiyalar/${a.vacancy_id}`}
                      className="font-sans text-base font-medium text-ink underline-offset-4 hover:underline"
                    >
                      {a.vacancy_title}
                    </Link>
                    <p className="font-sans text-xs text-ink-soft">{a.company_name}</p>
                  </div>
                  <Badge
                    variant={
                      a.status === 'accepted' ? 'primary' : a.status === 'rejected' ? 'error' : 'neutral'
                    }
                  >
                    {APPLICATION_STATUS_LABELS[a.status] ?? a.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<BriefcaseIcon width={24} height={24} />}
              title="Hali ariza bermagansiz"
              description="Sizga mos vakansiyalarni ko'rib chiqing va birinchi arizangizni yuboring."
              action={
                <Link href="/vakansiyalar" className={buttonVariants({ size: 'sm' })}>
                  Vakansiyalarni ko'rish
                </Link>
              }
            />
          )}
        </GlassCard>

        <GlassCard className="mt-6 p-6">
          <CardHeader>
            <CardTitle>Kurslarim</CardTitle>
            <CardDescription>Yozilgan kurslaringizdagi progressingiz.</CardDescription>
          </CardHeader>
          {enrollments.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {enrollments.map(({ enrollment, course_title, course_slug }) => (
                <li
                  key={enrollment.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-line px-3 py-2"
                >
                  <div className="flex min-w-[200px] flex-1 flex-col gap-1">
                    <Link
                      href={`/kurslar/${course_slug}`}
                      className="font-sans text-base font-medium text-ink underline-offset-4 hover:underline"
                    >
                      {course_title}
                    </Link>
                    <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-bright"
                        style={{ width: `${enrollment.progress_pct}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant={enrollment.status === 'completed' ? 'success' : 'neutral'}>
                    {ENROLLMENT_STATUS_LABELS[enrollment.status] ?? enrollment.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<BookIcon width={24} height={24} />}
              title="Hali kursga yozilmagansiz"
              description="Kurslar katalogidan birini tanlang — progressingiz shu yerda ko'rinadi."
              action={
                <Link href="/kurslar" className={buttonVariants({ size: 'sm' })}>
                  Kurslarni ko'rish
                </Link>
              }
            />
          )}
        </GlassCard>

        <GlassCard className="mt-6 p-6">
          <CardHeader>
            <CardTitle>Topshiriqlarim</CardTitle>
            <CardDescription>Barcha kurslar bo'yicha yuborgan topshiriqlaringiz.</CardDescription>
          </CardHeader>
          {submissions.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {submissions.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-line px-3 py-2"
                >
                  <div>
                    <p className="font-sans text-base font-medium text-ink">{s.assignment_title}</p>
                    <Link
                      href={`/kurslar/${s.course_slug}`}
                      className="font-sans text-xs text-ink-soft underline-offset-4 hover:underline"
                    >
                      {s.course_title}
                    </Link>
                  </div>
                  <Badge
                    variant={
                      s.status === 'approved' ? 'success' : s.status === 'rejected' ? 'error' : 'neutral'
                    }
                  >
                    {SUBMISSION_STATUS_LABELS[s.status] ?? s.status}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<ClipboardIcon width={24} height={24} />}
              title="Hali topshiriq yubormagansiz"
              description="Kursdagi topshiriqlarni bajarganingizda, ular shu yerda ko'rinadi."
              action={
                <Link href="/mening-yolim" className={buttonVariants({ size: 'sm' })}>
                  Kurslarimga o'tish
                </Link>
              }
            />
          )}
        </GlassCard>

        <GlassCard className="mt-6 p-6">
          <CardHeader>
            <CardTitle>Buyurtmalarim</CardTitle>
            <CardDescription>Freelancer marketplace orqali bergan yoki qabul qilgan buyurtmalar.</CardDescription>
          </CardHeader>
          {orders.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {orders.slice(0, 5).map((o) => (
                <li
                  key={o.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-line px-3 py-2"
                >
                  <Link
                    href={`/buyurtmalarim/${o.id}`}
                    className="font-sans text-base font-medium text-ink underline-offset-4 hover:underline"
                  >
                    {o.title}
                  </Link>
                  <OrderStatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={<WalletIcon width={24} height={24} />}
              title="Hali buyurtmangiz yo'q"
              description="Freelancer marketplace'dagi xizmatlarni ko'rib chiqing."
              action={
                <Link href="/gigs" className={buttonVariants({ size: 'sm' })}>
                  Xizmatlarni ko'rish
                </Link>
              }
            />
          )}
          {orders.length > 0 && (
            <div className="mt-4">
              <Link href="/buyurtmalarim" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                Barchasini ko'rish
              </Link>
            </div>
          )}
        </GlassCard>
      </TabPanel>

      <TabPanel active={tab === 'sozlamalar'} id="sozlamalar">
        <GlassCard className="p-6">
          <CardHeader>
            <CardTitle>Qulaylik sozlamalari</CardTitle>
            <CardDescription>
              Yuqori kontrast va animatsiyani kamaytirish — sahifaning yuqorisidagi qulaylik
              panelidagi bilan bog'langan.
            </CardDescription>
          </CardHeader>
          <AccessibilitySettingsCard />
        </GlassCard>

        <GlassCard id="passport" className="mt-6 scroll-mt-8 p-6">
          <CardHeader>
            <CardTitle>Skills Passport ko'rinishi</CardTitle>
            <CardDescription>Ommaviy sahifangiz va kim uni ko'ra olishi.</CardDescription>
          </CardHeader>
          <PassportSettings me={me} />
        </GlassCard>

        <GlassCard className="mt-6 p-6">
          <CardHeader>
            <CardTitle>Telegram bildirishnomalar</CardTitle>
            <CardDescription>
              Ariza holati, topshiriq javoblari, buyurtma yangilanishlari va sertifikatlar haqida
              Telegram orqali xabar oling.
            </CardDescription>
          </CardHeader>
          <TelegramLinkPanel initiallyLinked={telegramLinked} />
        </GlassCard>

        <GlassCard className="mt-6 p-6">
          <CardHeader>
            <CardTitle>Mening ma'lumotlarim</CardTitle>
            <CardDescription>
              Profilingiz, kurslaringiz, sertifikatlaringiz va boshqa shaxsiy ma'lumotlaringizning
              to'liq arxivini yuklab oling.
            </CardDescription>
          </CardHeader>
          <DataExportButton />
        </GlassCard>

        <div className="mt-6">
          <AccountDeactivateCard />
        </div>
      </TabPanel>
    </div>
  );
}

function TabPanel({ active, id, children }: { active: boolean; id: string; children: ReactNode }) {
  return (
    <div id={id} role="tabpanel" hidden={!active} className="scroll-mt-8 pt-6">
      {children}
    </div>
  );
}
