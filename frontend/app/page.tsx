import { Appbar } from "@/components/Appbar";
import { Hero } from "@/components/Hero";
import { HeroVideo } from "@/components/HeroVideo";
import { TrustedBy } from "@/components/TrustedBy";
import { FeaturesSection } from "@/components/FeaturesSection";
import { CtaBanner } from "@/components/CtaBanner";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Appbar/>
       <Hero />
    <HeroVideo />
    <TrustedBy />
    <FeaturesSection />
    <CtaBanner />
    <Footer />
    </main>
  );
}
