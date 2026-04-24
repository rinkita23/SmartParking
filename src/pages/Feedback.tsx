import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import PublicHeader from "@/components/PublicHeader";
import Footer from "@/components/Footer";
import { addFeedback } from "@/lib/parking-store";
import { toast } from "sonner";

const Feedback = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill all fields");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      addFeedback(name.trim(), email.trim(), message.trim());
      toast.success("Thanks for your feedback!");
      setName(""); setEmail(""); setMessage("");
      setSubmitting(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="relative gradient-hero pb-14 sm:pb-20 pt-20 sm:pt-28 px-4 sm:px-6">
        <PublicHeader />
        <div className="max-w-3xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-foreground/10 mb-5">
            <MessageSquare className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-3">We'd love your feedback</h1>
          <p className="text-primary-foreground/80">Tell us how we can make Smart Parking better for you.</p>
        </div>
      </div>

      <main className="flex-1 max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full">
        <Card className="shadow-elevated border-0 animate-fade-in">
          <CardHeader>
            <CardTitle className="font-display">Send feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Message</label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Share your thoughts..." rows={5} required />
              </div>
              <Button type="submit" disabled={submitting} className="w-full gradient-primary text-primary-foreground hover-scale">
                <Send className="w-4 h-4 mr-2" />
                {submitting ? "Sending..." : "Submit feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Feedback;
