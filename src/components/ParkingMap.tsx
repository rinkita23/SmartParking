import { getSlots } from "@/lib/parking-store";
import { ParkingSlot } from "@/types/parking";
import { Car } from "lucide-react";

interface ParkingMapProps {
  onSelectSlot?: (slot: ParkingSlot) => void;
  adminMode?: boolean;
}

const ParkingMap = ({ onSelectSlot, adminMode }: ParkingMapProps) => {
  const slots = getSlots();
  const levels = [...new Set(slots.map((s) => s.level))].sort();

  const statusColors: Record<string, string> = {
    available: "bg-slot-available hover:bg-slot-available/80 cursor-pointer",
    occupied: "bg-slot-occupied",
    reserved: "bg-slot-reserved",
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slot-available" />
          <span className="text-muted-foreground">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slot-occupied" />
          <span className="text-muted-foreground">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slot-reserved" />
          <span className="text-muted-foreground">Reserved</span>
        </div>
      </div>

      {levels.map((level) => (
        <div key={level}>
          <h3 className="font-display font-semibold text-sm text-muted-foreground mb-3">Level {level}</h3>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {slots
              .filter((s) => s.level === level)
              .map((slot) => (
                <button
                  key={slot.id}
                  className={`relative p-3 rounded-lg text-center transition-all ${statusColors[slot.status]} ${
                    slot.status === "available" || adminMode ? "hover:scale-105" : "opacity-80"
                  }`}
                  onClick={() => (slot.status === "available" || adminMode) && onSelectSlot?.(slot)}
                  disabled={!adminMode && slot.status !== "available"}
                >
                  <Car className="w-5 h-5 mx-auto mb-1 text-primary-foreground" />
                  <span className="text-xs font-semibold text-primary-foreground block">{slot.number}</span>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ParkingMap;
