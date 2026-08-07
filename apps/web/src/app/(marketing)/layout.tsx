import { PublicHeader } from '@/components/public-header';
import { SiteFooter } from '@/components/site-footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      {children}
      <SiteFooter />
    </>
  );
}
