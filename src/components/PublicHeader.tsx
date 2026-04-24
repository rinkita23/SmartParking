import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Car, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PublicHeader = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/feedback", label: "Feedback" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isHome
          ? "bg-transparent"
          : "bg-card/90 backdrop-blur-md border-b border-border shadow-sm"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <Link
          to="/"
          className={cn(
            "flex items-center gap-2 font-display font-bold transition-colors",
            isHome ? "text-primary-foreground" : "text-foreground hover:text-primary"
          )}
        >
          <Car className="w-6 h-6" />
          <span>Smart Parking</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:scale-[1.03]",
                  isHome
                    ? isActive
                      ? "bg-primary-foreground/15 text-primary-foreground"
                      : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    : isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop auth buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "transition-all hover:scale-[1.03]",
              isHome
                ? "text-primary-foreground hover:bg-primary-foreground/10"
                : "text-foreground hover:bg-muted"
            )}
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
          <Button
            size="sm"
            className={cn(
              "transition-all hover:scale-[1.03] shadow-sm",
              isHome
                ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                : "gradient-primary text-primary-foreground"
            )}
            onClick={() => navigate("/login?mode=signup")}
          >
            Sign Up
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className={cn(
            "md:hidden p-2 rounded-md transition-colors",
            isHome ? "text-primary-foreground hover:bg-primary-foreground/10" : "text-foreground hover:bg-muted"
          )}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-card/95 backdrop-blur-md border-b border-border shadow-md px-4 pb-4 pt-2 space-y-1 animate-fade-in">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  "block px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => { navigate("/login"); setMenuOpen(false); }}
            >
              Login
            </Button>
            <Button
              size="sm"
              className="flex-1 gradient-primary text-primary-foreground"
              onClick={() => { navigate("/login?mode=signup"); setMenuOpen(false); }}
            >
              Sign Up
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicHeader;
