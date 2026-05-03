import { LandingNav } from "@/components/landing/LandingNav";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingMarquee } from "@/components/landing/LandingMarquee";
import { LandingFeatures } from "@/components/landing/LandingFeatures";
import { LandingPricing } from "@/components/landing/LandingPricing";
import {
  LandingCta,
  LandingFooter,
} from "@/components/landing/LandingCtaFooter";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-pure-white text-washed-black antialiased">
      <LandingNav />
      <LandingHero />
      <LandingMarquee />
      <LandingFeatures />
      <LandingPricing />
      <LandingCta />
      <LandingFooter />
    </main>
  );
}
