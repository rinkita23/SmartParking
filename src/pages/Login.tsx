import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, Mail, Lock, User, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { login, signup } from "@/lib/parking-store";
import { signupSchema, loginSchema, evaluatePassword } from "@/lib/auth-validation";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pwStrength = evaluatePassword(signupPassword);
  const strengthColors = ["bg-destructive", "bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-lime-500", "bg-slot-available"];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { fieldErrors[`login_${i.path[0]}`] = i.message; });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    const user = login(loginEmail, loginPassword);
    if (user) {
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === "admin" ? "/admin" : "/dashboard");
    } else {
      toast.error("Invalid email or password");
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ name: signupName, email: signupEmail, password: signupPassword });
    const fieldErrors: Record<string, string> = {};
    if (!parsed.success) {
      parsed.error.issues.forEach((i) => { fieldErrors[`signup_${i.path[0]}`] = i.message; });
    }
    if (signupPassword !== signupConfirm) {
      fieldErrors.signup_confirm = "Passwords do not match";
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    const user = signup(signupName.trim(), signupEmail.trim(), signupPassword);
    if (user) {
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } else {
      toast.error("Email already exists");
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <Card className="relative z-10 w-full max-w-md shadow-elevated border-0 animate-fade-in">
        <CardHeader className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl gradient-primary mx-auto mb-4">
            <Car className="w-7 h-7 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">Smart Parking</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full" onValueChange={() => setErrors({})}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4" noValidate>
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Email" type="email" className={`pl-10 ${errors.login_email ? "border-destructive" : ""}`} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
                  </div>
                  {errors.login_email && <p className="text-xs text-destructive mt-1">{errors.login_email}</p>}
                </div>
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Password" type="password" className={`pl-10 ${errors.login_password ? "border-destructive" : ""}`} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                  </div>
                  {errors.login_password && <p className="text-xs text-destructive mt-1">{errors.login_password}</p>}
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">Login</Button>
                <p className="text-center text-sm text-muted-foreground">
                  Admin: admin@parking.com / admin123
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4" noValidate>
                <div>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Full Name" className={`pl-10 ${errors.signup_name ? "border-destructive" : ""}`} value={signupName} onChange={(e) => setSignupName(e.target.value)} />
                  </div>
                  {errors.signup_name && <p className="text-xs text-destructive mt-1">{errors.signup_name}</p>}
                </div>
                <div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Email" type="email" className={`pl-10 ${errors.signup_email ? "border-destructive" : ""}`} value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} />
                  </div>
                  {errors.signup_email && <p className="text-xs text-destructive mt-1">{errors.signup_email}</p>}
                </div>
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Password" type="password" className={`pl-10 ${errors.signup_password ? "border-destructive" : ""}`} value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} />
                  </div>
                  {signupPassword && (
                    <div className="mt-2 space-y-1.5">
                      <div className="flex gap-1">
                        {[0,1,2,3,4].map((i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < pwStrength.score ? strengthColors[pwStrength.score] : "bg-muted"}`} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">Strength: <span className="font-medium text-foreground">{pwStrength.label}</span></p>
                      <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
                        {pwStrength.checks.map((c) => (
                          <li key={c.label} className={`flex items-center gap-1 ${c.ok ? "text-slot-available" : "text-muted-foreground"}`}>
                            {c.ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {c.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {errors.signup_password && <p className="text-xs text-destructive mt-1">{errors.signup_password}</p>}
                </div>
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Confirm Password" type="password" className={`pl-10 ${errors.signup_confirm ? "border-destructive" : ""}`} value={signupConfirm} onChange={(e) => setSignupConfirm(e.target.value)} />
                  </div>
                  {errors.signup_confirm && <p className="text-xs text-destructive mt-1">{errors.signup_confirm}</p>}
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">Sign Up</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
