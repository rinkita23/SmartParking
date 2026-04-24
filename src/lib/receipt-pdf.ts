import { Booking } from "@/types/parking";
import { formatCurrency } from "@/lib/currency";

export function generateReceiptHTML(booking: Booking): string {
  const duration = (() => {
    const [sh, sm] = booking.startTime.split(":").map(Number);
    const [eh, em] = booking.endTime.split(":").map(Number);
    return Math.max(0.5, (eh + em / 60) - (sh + sm / 60));
  })();

  return `
    <div style="font-family: 'Inter', sans-serif; max-width: 400px; margin: 0 auto; padding: 32px; border: 2px solid #e2e8f0; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 20px; font-weight: 700; color: #1a56db; margin: 0;">Smart Parking</h1>
        <p style="font-size: 14px; color: #64748b; margin: 4px 0 0;">E-Receipt</p>
      </div>
      <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 16px 0;" />
      <table style="width: 100%; font-size: 14px; color: #334155;">
        ${booking.receiptNumber ? `<tr><td style="padding: 6px 0; color: #1a56db; font-weight:600;">Receipt No.</td><td style="text-align: right; font-weight: 700; color:#1a56db;">${booking.receiptNumber}</td></tr>` : ""}
        <tr><td style="padding: 6px 0; color: #64748b;">Booking ID</td><td style="text-align: right; font-weight: 600;">${booking.id}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Vehicle No.</td><td style="text-align: right; font-weight: 600;">${booking.vehicleNumber}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Slot Number</td><td style="text-align: right; font-weight: 600;">${booking.slotNumber}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Date</td><td style="text-align: right; font-weight: 600;">${booking.date}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Start Time</td><td style="text-align: right; font-weight: 600;">${booking.startTime}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">End Time</td><td style="text-align: right; font-weight: 600;">${booking.endTime}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Duration</td><td style="text-align: right; font-weight: 600;">${duration.toFixed(1)} hrs</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Payment Method</td><td style="text-align: right; font-weight: 600;">${booking.paymentMethod || "UPI"}</td></tr>
      </table>
      <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 16px 0;" />
      <div style="text-align: center;">
        <p style="font-size: 12px; color: #64748b; margin: 0;">Amount</p>
        <p style="font-size: 28px; font-weight: 700; color: #1a56db; margin: 4px 0;">${formatCurrency(booking.amount)}</p>
      </div>
      <hr style="border: none; border-top: 1px dashed #cbd5e1; margin: 16px 0;" />
      <p style="text-align: center; font-size: 11px; color: #94a3b8;">Booked on ${new Date(booking.createdAt).toLocaleString()}</p>
      <p style="text-align: center; font-size: 11px; color: #94a3b8;">Thank you for using Smart Parking!</p>
    </div>
  `;
}

export function downloadReceiptPDF(booking: Booking) {
  const html = generateReceiptHTML(booking);
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head><title>Receipt - ${booking.id}</title>
    <style>@media print { body { margin: 0; } }</style>
    </head>
    <body style="display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f8fafc;">
      ${html}
      <script>setTimeout(() => window.print(), 300);</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
