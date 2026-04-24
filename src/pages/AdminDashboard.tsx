import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Car, LogOut, Users, ParkingCircle, CalendarDays, ClipboardList,
  Plus, ArrowRightLeft, BarChart3, RefreshCw, MessageSquare,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCurrentUser, getSlots, getBookings, getVehicleLogs, getUsers,
  logout, updateSlotStatus, getFeedback, checkAndExpireBookings,
  freeSlotByAdmin, markArrivalPayment,
  getNotifications,
} from "@/lib/parking-store";
import ParkingMap from "@/components/ParkingMap";
import Footer from "@/components/Footer";
import { toast } from "sonner";
import { Booking, ParkingSlot } from "@/types/parking";
import { formatCurrency, RESERVATION_GRACE_MINUTES } from "@/lib/currency";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";

const STATUS_CYCLE: Record<ParkingSlot["status"], ParkingSlot["status"]> = {
  available: "reserved",
  reserved: "occupied",
  occupied: "available",
};

function getLocalToday(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

function isBookingForToday(booking: Booking) {
  return booking.date === getLocalToday();
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user] = useState(getCurrentUser());
  const [entryVehicle, setEntryVehicle] = useState("");
  const [entrySlot, setEntrySlot] = useState("");
  const [exitVehicle, setExitVehicle] = useState("");
  const [exitSlot, setExitSlot] = useState("");
  const [, setRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState("parking");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      checkAndExpireBookings();
      setRefresh((r) => r + 1);
    }, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const slots = getSlots();
  const bookings = getBookings();
  const logs = getVehicleLogs();
  const users = getUsers();
  const feedback = getFeedback();
  const unreadNotifications = getNotifications(user.id).filter((n) => !n.read).length;
  const available = slots.filter((s) => s.status === "available").length;
  const occupied = slots.filter((s) => s.status === "occupied").length;
  const reserved = slots.filter((s) => s.status === "reserved").length;

  const todayKey = new Date().toDateString();
  const todayLogs = logs.filter((l) => {
    const timestamp = new Date(l.entryTime || l.exitTime || "").toDateString();
    return timestamp === todayKey;
  });

  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; bookings: number; revenue: number }>();
    bookings.forEach((b) => {
      const d = new Date(b.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const cur = map.get(key) || { month: label, bookings: 0, revenue: 0 };
      cur.bookings += 1;
      cur.revenue += b.amount;
      map.set(key, cur);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value);
  }, [bookings]);

  const slotUsage = useMemo(() => {
    const counts = new Map<string, number>();
    bookings.forEach((b) => counts.set(b.slotNumber, (counts.get(b.slotNumber) || 0) + 1));
    return Array.from(counts.entries())
      .map(([slot, count]) => ({ slot, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [bookings]);

  if (!user) return null;

  const handleEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedVehicle = entryVehicle.trim().toUpperCase();
    const normalizedSlot = entrySlot.trim().toUpperCase();

    const booking = bookings.find((b) =>
      b.status === "reserved" &&
      b.slotNumber === normalizedSlot &&
      b.vehicleNumber.toUpperCase() === normalizedVehicle,
    );

    if (!booking) {
      toast.error("No reserved booking found for this vehicle and slot.");
      return;
    }

    if (!isBookingForToday(booking)) {
      toast.error(`This reservation is for ${booking.date}. Entry can be completed only on that date.`);
      return;
    }

    markArrivalPayment(booking.id);
    toast.success(`Payment confirmed and ${booking.vehicleNumber} entered at ${booking.slotNumber}.`);
    setEntryVehicle("");
    setEntrySlot("");
    setRefresh((r) => r + 1);
  };

  const handleExit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedVehicle = exitVehicle.trim().toUpperCase();
    const normalizedSlot = exitSlot.trim().toUpperCase();

    const booking = bookings.find((b) =>
      b.status === "booked" &&
      b.slotNumber === normalizedSlot &&
      b.vehicleNumber.toUpperCase() === normalizedVehicle,
    );

    if (!booking) {
      toast.error("No active booked vehicle found for this slot and vehicle.");
      return;
    }

    const extraDue = booking.pendingExitAmount || 0;
    freeSlotByAdmin(booking.slotId);
    toast.success(
      extraDue > 0
        ? `Vehicle exited from ${booking.slotNumber}. Extra ${formatCurrency(extraDue)} collected at exit.`
        : `Vehicle ${booking.vehicleNumber} exited from ${booking.slotNumber}.`,
    );
    setExitVehicle("");
    setExitSlot("");
    setRefresh((r) => r + 1);
  };

  const handleSlotClick = (slot: ParkingSlot) => {
    const next = STATUS_CYCLE[slot.status];
    updateSlotStatus(slot.id, next, next === "available" ? undefined : slot.vehicleNumber);
    toast.success(`Slot ${slot.number}: ${slot.status} -> ${next}`);
    setRefresh((r) => r + 1);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-sidebar px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Car className="w-6 h-6 text-sidebar-primary" />
          <h1 className="font-display text-lg sm:text-xl font-bold text-sidebar-foreground">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-sidebar-foreground hover:bg-sidebar-accent relative px-2" onClick={() => navigate("/notifications")}>
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Notifications</span>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                {unreadNotifications}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="sm" className="text-sidebar-foreground hover:bg-sidebar-accent px-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline ml-1">Logout</span>
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            { icon: Users, label: "Total Users", value: users.length, color: "text-primary" },
            { icon: CalendarDays, label: "Total Bookings", value: bookings.length, color: "text-slot-reserved" },
            { icon: ParkingCircle, label: "Available", value: available, color: "text-slot-available" },
            { icon: Car, label: "Occupied", value: occupied, color: "text-slot-occupied" },
            { icon: RefreshCw, label: "Reserved", value: reserved, color: "text-slot-reserved" },
          ].map(({ icon: Icon, label, value, color }) => (
            <Card key={label} className="shadow-card border-0 hover-scale">
              <CardContent className="flex items-center gap-3 pt-6">
                <Icon className={`w-8 h-8 ${color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-display font-bold">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 overflow-x-auto">
            <TabsTrigger value="parking">Slot Management</TabsTrigger>
            <TabsTrigger value="entry-exit">Entry / Exit</TabsTrigger>
            <TabsTrigger value="logs">Daily Logs</TabsTrigger>
            <TabsTrigger value="bookings">Booking Details</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="parking">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="font-display">Parking Slot Management</CardTitle>
                <p className="text-sm text-muted-foreground">Click any slot to cycle its status manually: available → reserved → occupied → available</p>
              </CardHeader>
              <CardContent>
                <ParkingMap adminMode onSelectSlot={handleSlotClick} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="entry-exit">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-slot-available">
                    <Plus className="w-5 h-5" /> Reserved Slot Entry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleEntry} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Use the vehicle number and slot number from the e-receipt. This confirms arrival payment and changes the slot from reserved to booked.
                    </p>
                    <Input placeholder="Vehicle Number" value={entryVehicle} onChange={(e) => setEntryVehicle(e.target.value)} required />
                    <Input placeholder="Slot Number (e.g. A1)" value={entrySlot} onChange={(e) => setEntrySlot(e.target.value)} required />
                    <p className="text-xs text-muted-foreground">
                      Reserved bookings can be admitted only on their booking date. Reservations auto-cancel if the driver does not arrive within {RESERVATION_GRACE_MINUTES} minutes of start time.
                    </p>
                    <Button type="submit" className="w-full gradient-primary text-primary-foreground hover-scale">Confirm Payment & Entry</Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="shadow-card border-0">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2 text-slot-occupied">
                    <ArrowRightLeft className="w-5 h-5" /> Vehicle Exit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleExit} className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Exit completes the booking and collects any additional amount created by extension.
                    </p>
                    <Input placeholder="Vehicle Number" value={exitVehicle} onChange={(e) => setExitVehicle(e.target.value)} required />
                    <Input placeholder="Slot Number (e.g. A1)" value={exitSlot} onChange={(e) => setExitSlot(e.target.value)} required />
                    <Button type="submit" className="w-full bg-slot-occupied text-primary-foreground hover:bg-slot-occupied/90 hover-scale">Log Exit</Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" /> Daily Logs — Today's Bookings
                </CardTitle>
                <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const todayBookings = bookings.filter(isBookingForToday);
                  return todayBookings.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No bookings for today.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-muted-foreground">
                            <th className="py-2 pr-3">Vehicle</th>
                            <th className="py-2 pr-3">Slot</th>
                            <th className="py-2 pr-3">Start</th>
                            <th className="py-2 pr-3">End</th>
                            <th className="py-2 pr-3">Amount</th>
                            <th className="py-2 pr-3">Status</th>
                            <th className="py-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...todayBookings].reverse().map((b) => (
                            <tr key={b.id} className="border-b last:border-0">
                              <td className="py-2 pr-3 font-medium">{b.vehicleNumber}</td>
                              <td className="py-2 pr-3">{b.slotNumber}</td>
                              <td className="py-2 pr-3">{b.startTime}</td>
                              <td className="py-2 pr-3">{b.endTime}</td>
                              <td className="py-2 pr-3 font-display font-bold text-primary">{formatCurrency(b.amount)}</td>
                              <td className="py-2 pr-3">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  b.status === "reserved" ? "bg-slot-reserved/20 text-slot-reserved" :
                                  b.status === "booked" ? "bg-slot-available/20 text-slot-available" :
                                  b.status === "expired" || b.status === "cancelled" ? "bg-destructive/20 text-destructive" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {b.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2">
                                {b.status === "reserved" ? (
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs gradient-primary text-primary-foreground"
                                    onClick={() => {
                                      markArrivalPayment(b.id);
                                      toast.success(`Payment confirmed. ${b.vehicleNumber} admitted to slot ${b.slotNumber}.`);
                                      setRefresh((r) => r + 1);
                                    }}
                                  >
                                    Admit Vehicle
                                  </Button>
                                ) : b.status === "booked" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      freeSlotByAdmin(b.slotId);
                                      toast.success(`Slot ${b.slotNumber} freed. ${b.vehicleNumber} exited.`);
                                      setRefresh((r) => r + 1);
                                    }}
                                  >
                                    Free Slot
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="font-display">All Bookings</CardTitle>
                <p className="text-sm text-muted-foreground">Complete history of all bookings made till date ({bookings.length} total)</p>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No bookings yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-muted-foreground">
                          <th className="py-2 pr-3">Vehicle</th>
                          <th className="py-2 pr-3">Slot</th>
                          <th className="py-2 pr-3">Date</th>
                          <th className="py-2 pr-3">Start</th>
                          <th className="py-2 pr-3">End</th>
                          <th className="py-2 pr-3">Duration</th>
                          <th className="py-2 pr-3">Payment</th>
                          <th className="py-2 pr-3">Payment Status</th>
                          <th className="py-2 pr-3">Amount</th>
                          <th className="py-2 pr-3">Status</th>
                          <th className="py-2">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...bookings].reverse().map((b) => {
                          const [sh, sm] = b.startTime.split(":").map(Number);
                          const [eh, em] = b.endTime.split(":").map(Number);
                          const duration = Math.max(0, (eh + em / 60) - (sh + sm / 60));
                          return (
                            <tr key={b.id} className="border-b last:border-0">
                              <td className="py-2 pr-3 font-medium">{b.vehicleNumber}</td>
                              <td className="py-2 pr-3">{b.slotNumber}</td>
                              <td className="py-2 pr-3">{b.date}</td>
                              <td className="py-2 pr-3">{b.startTime}</td>
                              <td className="py-2 pr-3">{b.endTime}</td>
                              <td className="py-2 pr-3">{duration.toFixed(1)}h</td>
                              <td className="py-2 pr-3">{b.paymentMethod || "—"}</td>
                              <td className="py-2 pr-3 capitalize">{(b.paymentStatus || "pending").replaceAll("_", " ")}</td>
                              <td className="py-2 pr-3 font-display font-bold text-primary">{formatCurrency(b.amount)}</td>
                              <td className="py-2 pr-3 capitalize">
                                <span className={`text-xs ${b.status === "expired" || b.status === "cancelled" ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="py-2">
                                {b.status === "reserved" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      if (!isBookingForToday(b)) {
                                        toast.error(`This reservation is for ${b.date}.`);
                                        return;
                                      }
                                      markArrivalPayment(b.id);
                                      toast.success(`Payment received and ${b.slotNumber} is now booked.`);
                                      setRefresh((r) => r + 1);
                                    }}
                                  >
                                    Admit Vehicle
                                  </Button>
                                ) : b.status === "booked" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      const extraDue = b.pendingExitAmount || 0;
                                      freeSlotByAdmin(b.slotId);
                                      toast.success(
                                        extraDue > 0
                                          ? `Slot ${b.slotNumber} freed. Exit amount ${formatCurrency(extraDue)} collected.`
                                          : `Slot ${b.slotNumber} freed. ${b.vehicleNumber} marked exited.`,
                                      );
                                      setRefresh((r) => r + 1);
                                    }}
                                  >
                                    Free Slot
                                  </Button>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-elevated border-0 bg-gradient-to-br from-card to-secondary/40">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" /> Bookings per Month
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ height: 300 }}>
                  {monthlyData.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.4)" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10 }} />
                        <Bar dataKey="bookings" fill="url(#barFill)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-elevated border-0 bg-gradient-to-br from-card to-secondary/40">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-accent" /> Revenue per Month
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ height: 300 }}>
                  {monthlyData.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10 }} />
                        <Legend />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={3} fill="url(#revFill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-elevated border-0 bg-gradient-to-br from-card to-secondary/40">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <ParkingCircle className="w-5 h-5 text-primary" /> Live Slot Status
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10 }} />
                      <Legend verticalAlign="bottom" />
                      <Pie
                        data={[
                          { name: "Available", value: available, fill: "hsl(var(--slot-available))" },
                          { name: "Occupied", value: occupied, fill: "hsl(var(--slot-occupied))" },
                          { name: "Reserved", value: reserved, fill: "hsl(var(--slot-reserved))" },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={3}
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-elevated border-0 bg-gradient-to-br from-card to-secondary/40">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-slot-reserved" /> Slot Usage Frequency (Top 10)
                  </CardTitle>
                </CardHeader>
                <CardContent style={{ height: 300 }}>
                  {slotUsage.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No data yet.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={slotUsage} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--slot-reserved))" stopOpacity={0.95} />
                            <stop offset="100%" stopColor="hsl(var(--slot-reserved))" stopOpacity={0.4} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="slot" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: "hsl(var(--muted) / 0.4)" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10 }} />
                        <Bar dataKey="count" fill="url(#usageFill)" radius={[8, 8, 0, 0]}>
                          {slotUsage.map((_, index) => (
                            <Cell key={index} fill="url(#usageFill)" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="feedback">
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" /> User Feedback
                </CardTitle>
              </CardHeader>
              <CardContent>
                {feedback.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No feedback received yet.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {feedback.map((f) => (
                      <div key={f.id} className="p-4 rounded-lg bg-secondary animate-fade-in">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <p className="font-semibold">{f.name}</p>
                            <p className="text-xs text-muted-foreground">{f.email}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">{new Date(f.createdAt).toLocaleString()}</p>
                        </div>
                        <p className="text-sm mt-2">{f.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
