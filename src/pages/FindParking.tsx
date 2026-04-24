import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Car, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ParkingMap from "@/components/ParkingMap";
import { getCurrentUser } from "@/lib/parking-store";

const FindParking = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-primary px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Car className="w-6 h-6 text-primary-foreground" />
        <h1 className="font-display text-xl font-bold text-primary-foreground">Find Parking</h1>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Real-Time Parking Map
            </CardTitle>
            <p className="text-sm text-muted-foreground">Select an available slot to book it</p>
          </CardHeader>
          <CardContent>
            <ParkingMap onSelectSlot={(slot) => navigate(`/booking/${slot.id}`)} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default FindParking;
