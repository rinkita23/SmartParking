import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car, ParkingCircle, CalendarDays, Clock, Search, History, User, Bell,
  CreditCard, LogOut, AlertTriangle, TimerReset, Receipt, Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getCurrentUser, getSlots, getBookings, logout, checkAndExpireBookings,
  checkNearExpiryBookings, addNotification, getNotifications,
} from "@/lib/parking-store";
import { Booking } from "@/types/parking";
import CountdownTimer from "@/components/CountdownTimer";
import EReceipt from "@/components/EReceipt";
import { toast } from "sonner";
import { formatCurrency, INR_PER_HOUR } from "@/lib/currency";
import { navigateToParking } from "@/lib/navigation";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser());
  const slots = getSlots();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showBookings, setShowBookings] = useState(false);
  const [expiryAlert, setExpiryAlert] = useState<string | null>(null);
  const [nearExpiryAlert, setNearExpiryAlert] = useState<string | null>(null);
  const [extendDialog, setExtendDialog] = useState<Booking | null>(null);
  const [extendHours, setExtendHours] = useState("1");
  const [selectedReceipt, setSelectedReceipt] = useState<Booking | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshBookings = useCallback(() => {
    if (!user) return;

    const expired = checkAndExpireBookings();
    if (expired.some((b) => b.userId === user.id)) {
      setExpiryAlert("Your parking time has expired. Please vacate or extend your booking.");
    }

    const nearExpiry = checkNearExpiryBookings(user.id);
    if (nearExpiry.length > 0) {
      nearExpiry.forEach((b) => {
        addNotification(user.id, `Your parking time is about to end for Slot ${b.slotNumber}`, "expiry_warning", b.id);
      });
      setNearExpiryAlert("Your parking time is about to end. Consider extending your booking.");
    } else {
      setNearExpiryAlert(null);
    }

    setBookings(getBookings().filter((b) => b.userId === user.id));
    setUnreadCount(getNotifications(user.id).filter((n) => !n.read).length);
  }, [user]);

  useEffect(() => {
    if (!user || user.role === "admin") {
      navigate(user?.role === "admin" ? "/admin" : "/login");
      return;
    }
    refreshBookings();
    const interval = setInterval(refreshBookings, 5000);
    return () => clearInterval(interval);
  }, [user, navigate, refreshBookings]);

  const available = slots.filter((s) => s.status === "available").length;
  const occupied = slots.filter((s) => s.status === "occupied").length;
  const reserved = slots.filter((s) => s.status === "reserved").length;

  const allBookings = [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const activeBookings = allBookings.filter((b) => b.status === "reserved" || b.status === "booked");
  const primaryActiveBooking = activeBookings[0] || null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleExtend = () => {
    if (!extendDialog) return;
    const hours = parseFloat(extendHours);
    if (isNaN(hours) || hours <= 0) {
      toast.error("Enter valid hours");
      return;
    }
    const id = extendDialog.id;
    setExtendDialog(null);
    navigate(`/extend/${id}?hours=${hours}`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-primary px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="w-6 h-6 text-primary-foreground" />
          <h1 className="font-display text-lg sm:text-xl font-bold text-primary-foreground">Smart Parking</h1>
        </div>
        <nav className="flex items-center gap-1">
          {/* Icon-only on mobile, icon+label on sm+ */}
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 px-2" onClick={() => navigate("/profile")}>
            <User className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Profile</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 relative px-2" onClick={() => navigate("/notifications")}>
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 px-2" onClick={() => navigate("/payment-history")}>
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Payment</span>
          </Button>
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 px-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Logout</span>
          </Button>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <p className="text-muted-foreground mb-6">Welcome back, <span className="font-semibold text-foreground">{user.name}</span>!</p>

        {expiryAlert && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Parking Expired</AlertTitle>
            <AlertDescription>{expiryAlert}</AlertDescription>
          </Alert>
        )}
        {nearExpiryAlert && !expiryAlert && (
          <Alert className="mb-4 border-yellow-500/50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-700">Expiry Warning</AlertTitle>
            <AlertDescription className="text-yellow-600">{nearExpiryAlert}</AlertDescription>
          </Alert>
        )}

        {primaryActiveBooking && (
          <div className="mb-6 space-y-4">
            <EReceipt booking={primaryActiveBooking} />
            <Card className="shadow-card border-0">
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-3">
                  <Button className="gradient-primary text-primary-foreground" onClick={() => navigateToParking()}>
                    <Navigation className="w-4 h-4 mr-2" /> Navigate to Parking
                  </Button>
                  {primaryActiveBooking.status === "booked" ? (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setExtendDialog(primaryActiveBooking);
                        setExtendHours("1");
                      }}
                    >
                      <TimerReset className="w-4 h-4 mr-2" /> Extend Booking Time
                    </Button>
                  ) : (
                    <Button variant="outline" disabled>
                      <TimerReset className="w-4 h-4 mr-2" /> Extend Available After Entry
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {primaryActiveBooking.status === "booked"
                    ? "Use Extend Booking Time while your current booked parking is active."
                    : "Your slot is still reserved. Extension becomes available after admin confirms payment and entry."}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {!primaryActiveBooking && allBookings.length === 0 && (
          <Alert className="mb-6">
            <AlertDescription>No active booking found. Please book a slot.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="shadow-card border-0">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-12 h-12 rounded-xl bg-slot-available/10 flex items-center justify-center">
                <ParkingCircle className="w-6 h-6 text-slot-available" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-3xl font-display font-bold">{available}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-12 h-12 rounded-xl bg-slot-occupied/10 flex items-center justify-center">
                <Car className="w-6 h-6 text-slot-occupied" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Occupied</p>
                <p className="text-3xl font-display font-bold">{occupied}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-0">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="w-12 h-12 rounded-xl bg-slot-reserved/10 flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-slot-reserved" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reserved</p>
                <p className="text-3xl font-display font-bold">{reserved}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button size="lg" className="gradient-primary text-primary-foreground h-14 text-base" onClick={() => navigate("/find-parking")}>
            <Search className="w-5 h-5 mr-2" /> Find Parking
          </Button>
          <Button size="lg" variant="outline" className="h-14 text-base" onClick={() => setShowBookings((prev) => !prev)}>
            <History className="w-5 h-5 mr-2" /> {showBookings ? "Hide Booking History" : "Booking History"}
          </Button>
        </div>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Booking History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!showBookings ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-3">View all bookings made by this user till date.</p>
                <Button variant="outline" onClick={() => setShowBookings(true)}>
                  Show Full Booking History
                </Button>
              </div>
            ) : allBookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No bookings yet. Click "Find Parking" to book a slot.</p>
            ) : (
              <div className="space-y-3">
                {allBookings.map((booking) => (
                  <div key={booking.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-secondary">
                    <div>
                      <p className="font-semibold">Slot {booking.slotNumber}</p>
                      <p className="text-sm text-muted-foreground">{booking.vehicleNumber} · {booking.date}</p>
                      <p className="text-xs text-muted-foreground">{booking.startTime} - {booking.endTime}</p>
                      {booking.status === "booked" && (
                        <CountdownTimer booking={booking} onExpired={refreshBookings} />
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="font-display font-bold text-primary">{formatCurrency(booking.amount)}</p>
                      <p className={`text-xs capitalize ${booking.status === "expired" || booking.status === "cancelled" ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                        {booking.status}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {booking.status === "booked" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 px-2"
                            onClick={() => {
                              setExtendDialog(booking);
                              setExtendHours("1");
                            }}
                          >
                            <TimerReset className="w-3 h-3 mr-1" /> Extend
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => setSelectedReceipt(booking)}>
                          <Receipt className="w-3 h-3 mr-1" /> Receipt
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!extendDialog} onOpenChange={(open) => !open && setExtendDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Extend Booking</DialogTitle>
          </DialogHeader>
          {extendDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Slot {extendDialog.slotNumber} · Current end: {extendDialog.endTime}</p>
              <div>
                <label className="text-sm font-medium mb-1 block">Extend by (hours)</label>
                <Input type="number" min="0.5" step="0.5" value={extendHours} onChange={(e) => setExtendHours(e.target.value)} />
              </div>
              <p className="text-sm">
                Additional cost: <span className="font-bold text-primary">{formatCurrency(parseFloat(extendHours || "0") * INR_PER_HOUR)}</span>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendDialog(null)}>Cancel</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleExtend}>Continue Extension</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedReceipt} onOpenChange={(open) => !open && setSelectedReceipt(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Booking Receipt</DialogTitle>
          </DialogHeader>
          {selectedReceipt && <EReceipt booking={selectedReceipt} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
