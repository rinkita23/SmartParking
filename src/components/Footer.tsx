import { Link } from "react-router-dom";
import { Car, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 font-display font-bold text-foreground mb-3">
              <Car className="w-5 h-5 text-primary" />
              <span>Smart Parking</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Real-time slot tracking and digital booking for modern parking management.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Quick Links</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors story-link">
                  About
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="text-muted-foreground hover:text-primary transition-colors story-link">
                  Feedback
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors story-link">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Get in Touch</h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-primary" />
                support@smartparking.app
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Available 24/7 online
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-border text-center text-xs text-muted-foreground">
          © 2026 Smart Parking System. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
