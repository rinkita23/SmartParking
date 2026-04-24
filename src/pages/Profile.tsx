import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, getBookings } from "@/lib/parking-store";
import { formatCurrency } from "@/lib/currency";

const Profile = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  if (!user) return null;

  const totalBookings = getBookings().filter((b) => b.userId === user.id).length;
  const totalSpent = getBookings().filter((b) => b.userId === user.id).reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="gradient-primary px-4 sm:px-6 py-4 flex items-center gap-3">
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-display text-lg sm:text-xl font-bold text-primary-foreground">My Profile</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Card className="shadow-card border-0">
          <CardHeader className="items-center text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <User className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">{user.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Role</p>
                <p className="font-medium capitalize">{user.role}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-4 rounded-lg bg-secondary">
                <p className="text-2xl font-display font-bold text-primary">{totalBookings}</p>
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-secondary">
                <p className="text-2xl font-display font-bold text-primary">{formatCurrency(totalSpent)}</p>
                <p className="text-xs text-muted-foreground">Total Spent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
