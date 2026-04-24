import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Car, ArrowLeft, CheckCircle, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getSlots, createBooking } from "@/lib/parking-store";
import { ParkingSlot, Booking } from "@/types/parking";
import { validateVehicleNumber, validateBookingDate, validateBookingTime, formatVehicleNumber } from "@/lib/validation";
import { formatCurrency, RESERVATION_GRACE_MINUTES } from "@/lib/currency";
import EReceipt from "@/components/EReceipt";
import { toast } from "sonner";

const BookingPage = () => {
  const { slotId } = useParams();
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [slot, setSlot] = useState<ParkingSlot | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [step, setStep] = useState<"booking" | "receipt">("booking");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  const [vehicleError, setVehicleError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    const slots = getSlots();
    const found = slots.find((s) => s.id === slotId);
    if (found) setSlot(found);
    else navigate("/dashboard");
  }, [slotId, navigate, user]);

  useEffect(() => {
    setVehicleError(vehicleNumber ? validateVehicleNumber(vehicleNumber) : null);
  }, [vehicleNumber]);

  useEffect(() => {
    setDateError(date ? validateBookingDate(date) : null);
  }, [date]);

  useEffect(() => {
    setTimeError(date && startTime && endTime ? validateBookingTime(date, startTime, endTime) : null);
  }, [date, startTime, endTime]);

  if (!slot || !user) return null;

  const hours = (() => {
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    return Math.max(0.5, (eh + em / 60) - (sh + sm / 60));
  })();
  const amount = hours * slot.rate;
  const isFormValid = !validateVehicleNumber(vehicleNumber) && !validateBookingDate(date) && !validateBookingTime(date, startTime, endTime);

  const handleConfirmBooking = () => {
    const vErr = validateVehicleNumber(vehicleNumber);
    const dErr = validateBookingDate(date);
    const tErr = validateBookingTime(date, startTime, endTime);
    setVehicleError(vErr);
    setDateError(dErr);
    setTimeError(tErr);
    if (vErr || dErr || tErr) return;

    const booking = createBooking({
      userId: user.id,
      slotId: slot.id,
      slotNumber: slot.number,
      vehicleNumber: formatVehicleNumber(vehicleNumber),
      date,
      startTime,
      endTime,
      amount,
      status: "reserved",
      paymentMethod,
      paymentStatus: "pending",
      pendingExitAmount: 0,
    });

    toast.success("Reservation created. Show the e-receipt when you arrive.");
    setConfirmedBooking(booking);
    setStep("receipt");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-primary px-4 sm:px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Car className="w-6 h-6 text-primary-foreground" />
        <h1 className="font-display text-lg sm:text-xl font-bold text-primary-foreground">
          {step === "receipt" ? "E-Receipt Ready" : "Book Slot"}
        </h1>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {step === "booking" && (
          <Card className="shadow-card border-0 animate-fade-in">
            <CardHeader>
              <CardTitle className="font-display">Slot {slot.number}</CardTitle>
              <p className="text-sm text-muted-foreground">Level {slot.level} · {formatCurrency(slot.rate)}/hr</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleConfirmBooking(); }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Vehicle Number</label>
                  <Input
                    placeholder="e.g. GJ01AB1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    className={vehicleError ? "border-destructive" : ""}
                    required
                  />
                  {vehicleError && <p className="text-xs text-destructive mt-1">{vehicleError}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className={dateError ? "border-destructive" : ""}
                    required
                  />
                  {dateError && <p className="text-xs text-destructive mt-1">{dateError}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Start Time</label>
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">End Time</label>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                  </div>
                </div>
                {timeError && <p className="text-xs text-destructive">{timeError}</p>}

                <div>
                  <label className="text-sm font-medium text-foreground mb-1 block">Payment Method on Arrival</label>
                  <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="UPI">UPI</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>

                <div className="p-4 rounded-lg bg-secondary space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-semibold">{hours.toFixed(1)} hrs</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Pay on arrival</span>
                    <span className="font-display font-bold text-primary">{formatCurrency(amount)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your slot stays reserved until payment is collected at parking entry. If you do not arrive within {RESERVATION_GRACE_MINUTES} minutes of the booked start time, the slot is released automatically.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/dashboard")}>Cancel</Button>
                  <Button type="submit" className="flex-1 gradient-primary text-primary-foreground" disabled={!isFormValid}>Generate E-Receipt</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "receipt" && confirmedBooking && (
          <div className="animate-fade-in space-y-6">
            <Card className="shadow-card border-0 text-center">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 rounded-full bg-slot-available/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-slot-available" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">Reservation Created</h2>
                <p className="text-muted-foreground flex items-center justify-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Show this e-receipt at the parking entrance to complete payment and entry.
                </p>
              </CardContent>
            </Card>
            <EReceipt booking={confirmedBooking} />
            <div className="flex gap-3">
              <Button className="flex-1 gradient-primary text-primary-foreground" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => navigate("/payment-history")}>
                View Receipts
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingPage;
