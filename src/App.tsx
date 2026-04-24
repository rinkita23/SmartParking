import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { initializeData, hydrateSlotsFromBackend } from "@/lib/parking-store";
import { isBackendAvailable } from "@/lib/api";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import FindParking from "./pages/FindParking";
import BookingPage from "./pages/BookingPage";
import ExtendPayment from "./pages/ExtendPayment";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import PaymentHistory from "./pages/PaymentHistory";
import About from "./pages/About";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    initializeData();
    isBackendAvailable().then((ok) => {
      if (ok) {
        console.info("[backend] Connected to Flask API");
        hydrateSlotsFromBackend();
      } else {
        console.info("[backend] Flask API unavailable, using localStorage");
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/find-parking" element={<FindParking />} />
            <Route path="/booking/:slotId" element={<BookingPage />} />
            <Route path="/extend/:bookingId" element={<ExtendPayment />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/payment-history" element={<PaymentHistory />} />
            <Route path="/about" element={<About />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
