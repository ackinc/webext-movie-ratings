import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { DemoSection } from "@/components/demo-section";
import { FeaturesSection } from "@/components/features-section";
import { PlatformsSection } from "@/components/platforms-section";
import { DownloadSection } from "@/components/download-section";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <DemoSection />
        <FeaturesSection />
        <PlatformsSection />
        <DownloadSection />
      </main>
      <Footer />
    </div>
  );
}
