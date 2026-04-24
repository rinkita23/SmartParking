import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CheckCircle, Info, AlertTriangle, CreditCard, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getNotifications, markNotificationRead } from "@/lib/parking-store";
import { Notification } from "@/types/parking";

const iconMap: Record<Notification["type"], React.ReactNode> = {
  booking_confirmed: <CheckCircle className="w-5 h-5 text-slot-available mt-0.5 shrink-0" />,
  payment_success: <CreditCard className="w-5 h-5 text-primary mt-0.5 shrink-0" />,
  expiry_warning: <Clock className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />,
  expired: <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />,
};

const Notifications = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    setNotifications(getNotifications(user.id));
  }, [user, navigate]);

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
    if (user) setNotifications(getNotifications(user.id));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-primary px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-display text-xl font-bold text-primary-foreground">Notifications</h1>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" /> Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Info className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${n.read ? "bg-secondary/50" : "bg-secondary border-l-4 border-primary"}`}
                    onClick={() => handleMarkRead(n.id)}
                  >
                    {iconMap[n.type]}
                    <div className="flex-1">
                      <p className={`text-sm ${n.read ? "text-muted-foreground" : "font-medium"}`}>{n.message}</p>
                      <p className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Notifications;
