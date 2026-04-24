import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Receipt, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getCurrentUser, getBookings } from "@/lib/parking-store";
import { Booking } from "@/types/parking";
import EReceipt from "@/components/EReceipt";
import { formatCurrency } from "@/lib/currency";

const PaymentHistory = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [selectedReceipt, setSelectedReceipt] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  if (!user) return null;

  const bookings = getBookings().filter((b) => b.userId === user.id);
  const totalSpent = bookings.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-primary px-4 sm:px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-display text-lg sm:text-xl font-bold text-primary-foreground">Payment History</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="shadow-card border-0 mb-6">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">Total Spent</p>
            <p className="text-4xl font-display font-bold text-primary">{formatCurrency(totalSpent)}</p>
            <p className="text-xs text-muted-foreground mt-1">{bookings.length} transaction(s)</p>
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Receipt className="w-5 h-5 text-primary" /> Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No payments yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-secondary">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-sm">Slot {b.slotNumber}</p>
                        <p className="text-xs text-muted-foreground">{b.date} · {b.startTime}-{b.endTime}</p>
                        <p className="text-xs text-muted-foreground">{b.paymentMethod || "UPI"}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="font-display font-bold text-primary">{formatCurrency(b.amount)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{b.status}</p>
                      <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={() => setSelectedReceipt(b)}>
                        <Download className="w-3 h-3 mr-1" /> Receipt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!selectedReceipt} onOpenChange={(o) => !o && setSelectedReceipt(null)}>
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

export default PaymentHistory;
