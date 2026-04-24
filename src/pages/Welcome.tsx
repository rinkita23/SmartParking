import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicHeader from "@/components/PublicHeader";

const Welcome = () => {
  const navigate = useNavigate();
  const [hovering, setHovering] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 gradient-hero flex flex-col items-center justify-center relative overflow-hidden">
        <PublicHeader />

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center px-6 animate-fade-in py-24">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl gradient-primary mb-8 shadow-elevated">
            <Car className="w-12 h-12 text-primary-foreground" />
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-primary-foreground mb-4 tracking-tight">
            SMART PARKING
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/70 max-w-lg mx-auto mb-12">
            Find, book, and manage parking slots in real time. Save time, reduce congestion.
          </p>

          <Button
            size="lg"
            className="gradient-primary text-primary-foreground px-10 py-6 text-lg rounded-xl shadow-elevated hover:scale-105 transition-transform"
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
            onClick={() => navigate("/login")}
          >
            Get Started
            <ArrowRight className={`ml-2 w-5 h-5 transition-transform ${hovering ? "translate-x-1" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
