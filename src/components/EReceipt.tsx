import { Booking } from "@/types/parking";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Navigation, Receipt } from "lucide-react";
import { downloadReceiptPDF } from "@/lib/receipt-pdf";
import { formatCurrency } from "@/lib/currency";
import { getParkingLocationLabel, navigateToParking } from "@/lib/navigation";

interface EReceiptProps {
  booking: Booking;
  showDownload?: boolean;
}

const EReceipt = ({ booking, showDownload = true }: EReceiptProps) => {
  const duration = (() => {
    const [sh, sm] = booking.startTime.split(":").map(Number);
    const [eh, em] = booking.endTime.split(":").map(Number);
    return Math.max(0.5, (eh + em / 60) - (sh + sm / 60));
  })();

  return (
    <Card className="shadow-card border-0">
      <CardContent className="pt-6">
        <div className="text-center mb-4">
          <Receipt className="w-8 h-8 text-primary mx-auto mb-2" />
          <h3 className="font-display font-bold text-lg">E-Receipt</h3>
        </div>
        <div className="space-y-2 text-sm">
          {booking.receiptNumber && (
            <div className="flex justify-between p-2 rounded bg-primary/5 border border-primary/20">
              <span className="text-muted-foreground">Receipt No.</span>
              <span className="font-semibold text-primary">{booking.receiptNumber}</span>
            </div>
          )}
          <div className="flex justify-between p-2 rounded bg-secondary">
            <span className="text-muted-foreground">Booking ID</span>
            <span className="font-semibold text-xs">{booking.id}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-secondary">
            <span className="text-muted-foreground">Vehicle No.</span>
            <span className="font-semibold">{booking.vehicleNumber}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-secondary">
            <span className="text-muted-foreground">Slot Number</span>
            <span className="font-semibold">{booking.slotNumber}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-secondary">
            <span className="text-muted-foreground">Date</span>
            <span className="font-semibold">{booking.date}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-secondary">
            <span className="text-muted-foreground">Time</span>
            <span className="font-semibold">{booking.startTime} - {booking.endTime}</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-secondary">
            <span className="text-muted-foreground">Duration</span>
            <span className="font-semibold">{duration.toFixed(1)} hrs</span>
          </div>
          <div className="flex justify-between p-2 rounded bg-secondary">
            <span className="text-muted-foreground">Payment</span>
            <span className="font-semibold">{booking.paymentMethod || "UPI"}</span>
          </div>
          <div className="flex justify-between p-3 rounded-lg bg-primary/10 mt-2">
            <span className="font-semibold">Amount</span>
            <span className="font-display font-bold text-primary text-lg">{formatCurrency(booking.amount)}</span>
          </div>
        </div>
        {showDownload && (
          <div className="mt-4 space-y-2">
            <Button variant="outline" className="w-full" onClick={() => navigateToParking()}>
              <Navigation className="w-4 h-4 mr-2" /> Navigate to {getParkingLocationLabel()}
            </Button>
            <Button variant="outline" className="w-full" onClick={() => downloadReceiptPDF(booking)}>
              <Download className="w-4 h-4 mr-2" /> Download Receipt PDF
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EReceipt;
