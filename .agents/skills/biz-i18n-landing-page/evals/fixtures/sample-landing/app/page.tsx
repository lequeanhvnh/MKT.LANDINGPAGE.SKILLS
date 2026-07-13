import Hero from "@/components/Hero";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import LeadForm from "@/components/LeadForm";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-5">
      <Hero />
      <Pricing />
      <FAQ />
      <LeadForm />
      <Footer />
    </main>
  );
}
