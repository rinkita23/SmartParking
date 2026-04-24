import { useEffect, useState } from "react";
import { Booking } from "@/types/parking";
import { getBookingRemainingTime } from "@/lib/parking-store";
import { Timer } from "lucide-react";

interface CountdownTimerProps {
  booking: Booking;
  onExpired?: () => void;
}

const CountdownTimer = ({ booking, onExpired }: CountdownTimerProps) => {
  const [remaining, setRemaining] = useState(getBookingRemainingTime(booking));

  useEffect(() => {
    const interval = setInterval(() => {
      const r = getBookingRemainingTime(booking);
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [booking, onExpired]);

  if (remaining <= 0) {
    return (
      <span className="text-xs font-semibold text-destructive flex items-center gap-1">
        <Timer className="w-3 h-3" /> Expired
      </span>
    );
  }

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const isUrgent = remaining <= 10 * 60 * 1000;

  return (
    <span className={`text-xs font-semibold flex items-center gap-1 ${isUrgent ? "text-destructive" : "text-primary"}`}>
      <Timer className="w-3 h-3" />
      {hours > 0 && `${hours}h `}{String(minutes).padStart(2, "0")}m {String(seconds).padStart(2, "0")}s
    </span>
  );
};

export default CountdownTimer;
