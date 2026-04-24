import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Car, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getBookings, getCurrentUser, extendBooking } from "@/lib/parking-store";
import { Booking } from "@/types/parking";
import EReceipt from "@/components/EReceipt";
import { formatCurrency, INR_PER_HOUR } from "@/lib/currency";
import { toast } from "sonner";

const ExtendPayment = () => {
  const { bookingId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [hours, setHours] = useState<number>(parseFloat(params.get("hours") || "1"));
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [step, setStep] = useState<"request" | "confirmed">("request");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const b = getBookings().find((x) => x.id === bookingId) || null;
    if (!b) { navigate("/dashboard"); return; }
    setBooking(b);
  }, [bookingId, user, navigate]);

  const additional = useMemo(() => Math.max(0.5, hours) * INR_PER_HOUR, [hours]);

  const newEndTime = useMemo(() => {
    if (!booking) return "";
    const [eh, em] = booking.endTime.split(":").map(Number);
    const totalMin = eh * 60 + em + Math.max(0.5, hours) * 60;
    const nh = Math.floor(totalMin / 60) % 24;
    const nm = Math.floor(totalMin % 60);
    return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
  }, [booking, hours]);

  if (!booking || !user) return null;

  const handleRequest = () => {
    if (booking.status !== "booked") {
      toast.error("Only parked bookings can be extended.");
      return;
    }
    extendBooking(booking.id, newEndTime, additional, paymentMethod);
    toast.success(`Extended until ${newEndTime}. Extra payment will be collected at exit.`);
    const updated = getBookings().find((x) => x.id === booking.id) || null;
    setBooking(updated);
    setStep("confirmed");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-primary px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Car className="w-6 h-6 text-primary-foreground" />
        <h1 className="font-display text-xl font-bold text-primary-foreground">
          {step === "confirmed" ? "Extension Updated" : "Extend Booking"}
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        {step === "request" && (
          <Card className="shadow-card border-0 animate-fade-in">
            <CardHeader>
              <CardTitle className="font-display">Extension Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary">
                <p className="text-sm text-muted-foreground">Slot {booking.slotNumber} · {booking.vehicleNumber}</p>
                <p className="text-sm text-muted-foreground">Current end: {booking.endTime} → New end: <span className="font-semibold text-foreground">{newEndTime}</span></p>
                <p className="text-2xl font-display font-bold text-primary mt-2">{formatCurrency(additional)}</p>
                <p className="text-xs text-muted-foreground mt-2">This extra amount will be collected when the vehicle exits.</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Extend by (hours)</label>
                <Input type="number" min="0.5" step="0.5" value={hours} onChange={(e) => setHours(parseFloat(e.target.value) || 0)} />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Preferred payment method at exit</label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="UPI">UPI</option>
                  <option value="Card">Credit/Debit Card</option>
                  <option value="Net Banking">Net Banking</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>Cancel</Button>
                <Button className="flex-1 gradient-primary text-primary-foreground" onClick={handleRequest}>Update E-Receipt</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "confirmed" && (
          <div className="animate-fade-in space-y-6">
            <Card className="shadow-card border-0 text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 rounded-full bg-slot-available/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-slot-available" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">Extension Added</h2>
                <p className="text-muted-foreground">Your e-receipt now shows the extra amount due at exit.</p>
              </CardContent>
            </Card>
            <EReceipt booking={booking} />
            <Button className="w-full gradient-primary text-primary-foreground" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ExtendPayment;
