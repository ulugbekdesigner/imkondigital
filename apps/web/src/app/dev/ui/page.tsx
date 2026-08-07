import type { Metadata } from 'next';
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  StepBadge,
  Skeleton,
  CountUp,
  GirihDivider,
} from '@imkon/ui';
import { CelebrationShowcase } from './celebration-showcase';
import { ToastShowcase } from './toast-showcase';

export const metadata: Metadata = {
  title: "UI ko'rgazma",
  description: 'Firuza dizayn tizimi 2.0 — tokenlar va komponentlar.',
};

const brandTokens = [
  { name: 'deep', cls: 'bg-deep' },
  { name: 'primary', cls: 'bg-primary' },
  { name: 'bright', cls: 'bg-bright' },
  { name: 'mint', cls: 'bg-mint' },
] as const;

const nationalTokens = [
  { name: 'gold (zarhal)', cls: 'bg-gold' },
  { name: 'coral (marjon)', cls: 'bg-coral' },
] as const;

const neutralTokens = [
  { name: 'ink', cls: 'bg-ink' },
  { name: 'ink-soft', cls: 'bg-ink-soft' },
  { name: 'paper', cls: 'bg-paper' },
  { name: 'line', cls: 'bg-line' },
] as const;

const semanticTokens = [
  { name: 'warn', cls: 'bg-warn' },
  { name: 'error', cls: 'bg-error' },
  { name: 'info', cls: 'bg-info' },
] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-ink mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ name, cls }: { name: string; cls: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className={`border-line h-16 w-full rounded border ${cls}`} />
      <span className="text-ink-soft font-mono text-xs">{name}</span>
    </div>
  );
}

export default function DevUiPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-ink-soft font-mono text-xs uppercase tracking-widest">Dev · ko'rgazma</p>
      <h1 className="font-display text-ink mt-2 text-2xl font-bold">Firuza dizayn tizimi 2.0</h1>
      <p className="text-ink-soft mt-2 font-sans text-base">
        Yuqoridagi panel orqali rang rejimi, yuqori kontrast, matn o'lchovi va — vaqtinchalik —
        Firuza/Lazurit palitrasini sinab ko'ring. Bu sahifadagi barcha elementlar real vaqtda
        o'zgaradi.
      </p>

      <Section title="Rang tokenlari — brend">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {brandTokens.map((t) => (
            <Swatch key={t.name} {...t} />
          ))}
        </div>
      </Section>

      <Section title="Rang tokenlari — milliy mikro-detal (V2 A3)">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {nationalTokens.map((t) => (
            <Swatch key={t.name} {...t} />
          ))}
        </div>
      </Section>

      <Section title="Rang tokenlari — neytral">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {neutralTokens.map((t) => (
            <Swatch key={t.name} {...t} />
          ))}
        </div>
      </Section>

      <Section title="Rang tokenlari — semantik">
        <div className="grid grid-cols-3 gap-4">
          {semanticTokens.map((t) => (
            <Swatch key={t.name} {...t} />
          ))}
        </div>
      </Section>

      <Section title="Narvon pog'onalari (0→4)">
        <div className="flex flex-wrap items-center gap-3">
          {([0, 1, 2, 3, 4] as const).map((s) => (
            <StepBadge key={s} step={s} />
          ))}
        </div>
      </Section>

      <Section title="Girih chizgisi (bo'lim ajratkichi)">
        <GirihDivider className="border-line h-16 rounded border" />
      </Section>

      <Section title="Tipografika">
        <div className="flex flex-col gap-3">
          <p className="font-display text-hero text-ink font-bold">Onest — hero sarlavha</p>
          <p className="font-display text-ink text-2xl font-bold">Onest — sarlavha (display)</p>
          <p className="text-md text-ink font-sans">
            Inter — asosiy matn. Ochiq, o'qiladigan, to'liq lotin va kirill.
          </p>
          <p className="text-ink font-mono text-base">
            JetBrains Mono — raqamlar: <CountUp value={3840000} />
            {" so'm"}
          </p>
        </div>
      </Section>

      <Section title="Tugmalar">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Kursni boshlash</Button>
          <Button variant="secondary">Batafsil</Button>
          <Button variant="outline">Ko'rish</Button>
          <Button variant="ghost">Bekor qilish</Button>
          <Button variant="danger">O'chirish</Button>
          <Button disabled>Yuklanmoqda</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Kichik</Button>
          <Button size="md">O'rta</Button>
          <Button size="lg">Katta</Button>
        </div>
      </Section>

      <Section title="Kiritish maydonlari">
        <div className="grid max-w-md gap-5">
          <Input label="To'liq ism" placeholder="Ism Familiya" hint="Pasportdagidek yozing" />
          <Input
            label="Telefon raqami"
            required
            defaultValue="90"
            error="Raqam +998 bilan boshlanishi kerak"
          />
        </div>
      </Section>

      <Section title="Kartochka va yorliqlar">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Grafik dizayn kursi</CardTitle>
            <CardDescription>Pog'ona 2 — raqamli mutaxassisliklar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">Bepul</Badge>
              <Badge>SMM</Badge>
              <Badge variant="info">Yangi</Badge>
              <Badge variant="warn">Moderatsiyada</Badge>
            </div>
          </CardContent>
        </Card>
      </Section>

      <Section title="Yuklanish holati (shimmer skeleton)">
        <div role="status" aria-label="Yuklanmoqda…" className="grid max-w-md gap-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </Section>

      <Section title="Tabrik ekranlari — 4 rol (5b-blok)">
        <CelebrationShowcase />
      </Section>

      <Section title="O'tkinchi bildirishnomalar — toast (5b-blok)">
        <ToastShowcase />
      </Section>
    </div>
  );
}
