import type { Metadata } from 'next';
import { getSuccessStories } from '@/lib/success-stories-api';
import { getCatalog } from '@/lib/courses-api';
import { getVacancyCatalog, getVerifiedCompanies } from '@/lib/employer-api';
import { getMentors } from '@/lib/mentorship-api';
import { getActiveDonationProjects } from '@/lib/donation-api';
import { LandingEffects } from '@/components/landing/landing-effects';
import { LandingHero } from '@/components/landing/hero';
import { MarketStatsSection } from '@/components/landing/market-stats-section';
import { BarriersSection } from '@/components/landing/barriers-section';
import { CapabilitiesBento } from '@/components/landing/capabilities-bento';
import { StoriesSection } from '@/components/landing/stories-section';
import { DonateSection } from '@/components/landing/donate-section';

export const metadata: Metadata = {
  title: 'IMKON Digital — inklyuziv raqamli karyera platformasi',
  description:
    'Uydan turib raqamli kasb o‘rganing, ish toping va daromad qiling. O‘zbekistonda nogironligi bor insonlar uchun inklyuziv karyera platformasi.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'IMKON Digital — raqamli kasb, chegarasiz imkoniyat',
    description: 'Nogironligi bor insonlar uchun inklyuziv raqamli karyera platformasi.',
    url: '/',
    siteName: 'IMKON Digital',
    locale: 'uz_UZ',
    type: 'website',
  },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'IMKON Digital',
  url: 'https://imkondigital.uz',
  description:
    'O‘zbekistonda nogironligi bor insonlar uchun inklyuziv raqamli karyera platformasi.',
  areaServed: 'UZ',
  sameAs: ['https://t.me/imkondigital', 'https://instagram.com/imkondigital'],
};

export default async function HomePage() {
  const [stories, catalog, vacancyPage, companies, mentors, donationProjects] = await Promise.all([
    getSuccessStories(),
    getCatalog({}),
    getVacancyCatalog({}),
    getVerifiedCompanies(),
    getMentors(),
    getActiveDonationProjects(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <LandingEffects />
      <LandingHero stories={stories} courseCount={catalog.items.length} vacancyCount={vacancyPage.items.length} />
      <MarketStatsSection />
      <BarriersSection />
      <CapabilitiesBento
        courses={catalog.items}
        vacancies={vacancyPage.items}
        verifiedCompanyCount={companies.length}
        mentorCount={mentors.length}
      />
      <StoriesSection stories={stories} />
      <DonateSection projects={donationProjects} />
    </>
  );
}
