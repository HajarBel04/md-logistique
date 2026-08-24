import Hero from '../../components/Hero/Hero';
import StatsBar from '../../components/StatsBar/StatsBar';
import ServicesSection from '../../components/Services/ServicesSection';
import HowItWorks from '../../components/HowItWorks/HowItWorks';
import WhyUs from '../../components/WhyUs/WhyUs';
import CoverageSection from '../../components/Coverage/CoverageSection';
import PlatformSection from '../../components/Platform/PlatformSection';
import SocialProof from '../../components/SocialProof/SocialProof';
import Contact from '../../components/Contact/Contact';
import PreFooterCTA from '../../components/PreFooterCTA/PreFooterCTA';
import Footer from '../../components/Footer/Footer';
import './Home.css';

export default function Home() {
  return (
    <main className="home">
      <Hero />
      <StatsBar />
      <ServicesSection />
      <HowItWorks />
      <CoverageSection />
      <PlatformSection />
      <WhyUs />
      <SocialProof />
      <Contact />
      <PreFooterCTA />
      <Footer />
    </main>
  );
}
