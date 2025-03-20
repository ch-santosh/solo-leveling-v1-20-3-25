import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section
      className="relative py-12 md:py-24 lg:py-32 xl:py-48"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/60 z-0"></div>

      <div className="relative container px-4 md:px-6 mx-auto z-10">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-white" data-aos="fade-in" data-aos-duration="1000">
              Empowering Athletes, Connecting Coaches & Recruiters
            </h1>
            <p className="mx-auto max-w-[700px] text-white md:text-xl" data-aos="fade-in" data-aos-duration="2000">
              Transform your athletic journey with personalized training, expert
              guidance, and exclusive opportunities.
            </p>
          </div>
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10" data-aos="fade-in" data-aos-duration="2000">
            <Link href="/login" className="w-full">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg" className="px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
