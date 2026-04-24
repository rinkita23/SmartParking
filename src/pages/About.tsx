import { Car, MapPin, Calendar, Receipt, ShieldCheck, TrendingDown, Clock, Gauge, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";

const features = [
  { icon: MapPin, title: "Real-time slot availability", desc: "Live status for every parking slot, refreshed continuously." },
  { icon: Calendar, title: "Online reservation system", desc: "Reserve in advance with flexible start and end times." },
  { icon: Receipt, title: "E-receipt generation", desc: "Instant digital receipts you can download as PDF." },
  { icon: ShieldCheck, title: "Admin monitoring & analytics", desc: "Powerful dashboard for entry/exit logs and revenue insights." },
];

const benefits = [
  { icon: TrendingDown, title: "Reduces traffic congestion", desc: "Direct drivers to free spots instantly — no aimless searching." },
  { icon: Clock, title: "Saves user time", desc: "Skip the queues and walk straight to your reserved slot." },
  { icon: Gauge, title: "Efficient space utilization", desc: "Maximize occupancy with intelligent slot management." },
  { icon: Sparkles, title: "Improved user experience", desc: "Clean, modern interface that works seamlessly on every device." },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col animate-fade-in">
      {/* Hero */}
      <div className="relative gradient-hero pb-16 sm:pb-24 pt-24 sm:pt-32 px-4 sm:px-6 overflow-hidden">
        <PublicHeader />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-foreground/10 backdrop-blur-sm mb-5">
            <Car className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-primary-foreground mb-5 tracking-tight">
            About Smart Parking
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto leading-relaxed">
            Smart Parking Management System is designed to simplify parking management
            through real-time slot tracking and digital booking.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full">
        {/* Introduction */}
        <section className="mb-16 max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-muted-foreground leading-relaxed">
            We bring transparency and efficiency to urban parking by combining live data,
            seamless online reservations, and powerful analytics — all in one elegant platform
            built for both drivers and operators.
          </p>
        </section>

        {/* Features */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold mb-2">Key Features</h2>
            <p className="text-muted-foreground">Everything you need to manage parking, end to end.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {features.map((f, i) => (
              <Card
                key={f.title}
                className="shadow-card border-0 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <CardContent className="pt-6 flex gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-sm">
                    <f.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1.5">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section>
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold mb-2">Benefits</h2>
            <p className="text-muted-foreground">Why teams and drivers choose Smart Parking.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {benefits.map((b, i) => (
              <Card
                key={b.title}
                className="shadow-card border-0 text-center hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <CardContent className="pt-7 pb-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                    <b.icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-semibold mb-1.5">{b.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
