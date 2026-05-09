import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/mediqueu/logo";
import { ArrowRight, Mail, Smartphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth, dashboardPath } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — MediQueu" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  // Email/pwd
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Phone
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // If already signed in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate({ to: dashboardPath[role ?? "patient"] });
    }
  }, [user, role, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error("Sign-in failed", { description: error.message });
      return;
    }
    toast.success("Welcome back");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: fullName },
      },
    });
    setBusy(false);
    if (error) {
      toast.error("Sign-up failed", { description: error.message });
      return;
    }
    toast.success("Account created", {
      description: "Check your email to verify your address before signing in.",
    });
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed", {
        description: result.error.message ?? "Please try again",
      });
      setBusy(false);
      return;
    }
    if (result.redirected) return; // browser will redirect
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setBusy(false);
    if (error) {
      toast.error("Could not send code", { description: error.message });
      return;
    }
    setOtpSent(true);
    toast.success("Code sent", { description: "Check your phone for the SMS code." });
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    setBusy(false);
    if (error) {
      toast.error("Invalid code", { description: error.message });
      return;
    }
    toast.success("Signed in");
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left visual */}
      <div className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:block">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute inset-0 gradient-soft opacity-50" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Link to="/"><Logo className="text-primary-foreground [&_div]:text-primary-foreground" /></Link>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-70">MediQueu</div>
            <h2 className="mt-3 text-balance text-5xl font-semibold leading-tight tracking-tight">
              The waiting room, reimagined.
            </h2>
            <p className="mt-4 max-w-md text-primary-foreground/80">
              One workspace for patients, receptionists, doctors and admins. Smart queues, honest ETAs, happier care teams.
            </p>
          </div>
          <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-5 backdrop-blur">
            <div className="text-sm text-primary-foreground/80">"We cut average wait time by 68%."</div>
            <div className="mt-2 text-xs opacity-70">Dr. Hala Mansour — Clinic Director</div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden"><Logo /></Link>
          <div className="mt-8 lg:mt-0">
            <h1 className="text-3xl font-semibold tracking-tight">Welcome to MediQueu</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your account or create a new one.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full rounded-full"
            onClick={handleGoogle}
            disabled={busy}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="signin"><Mail className="mr-1 h-3.5 w-3.5" />Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create</TabsTrigger>
              <TabsTrigger value="phone"><Smartphone className="mr-1 h-3.5 w-3.5" />Phone</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.com" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5" />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign in<ArrowRight className="ml-1 h-4 w-4" /></>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-5 space-y-4">
                <div>
                  <Label htmlFor="n">Full name</Label>
                  <Input id="n" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Alex Morgan" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="e2">Email</Label>
                  <Input id="e2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.com" className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="p2">Password</Label>
                  <Input id="p2" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="mt-1.5" />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Create account<ArrowRight className="ml-1 h-4 w-4" /></>}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  We'll email you a link to verify your address.
                </p>
              </form>
            </TabsContent>

            <TabsContent value="phone">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="mt-5 space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone number</Label>
                    <Input id="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" className="mt-1.5" />
                    <p className="mt-1.5 text-xs text-muted-foreground">Use international format with country code.</p>
                  </div>
                  <Button type="submit" className="w-full rounded-full" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
                  <div>
                    <Label htmlFor="otp">6-digit code</Label>
                    <Input id="otp" required value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" inputMode="numeric" className="mt-1.5" />
                  </div>
                  <Button type="submit" className="w-full rounded-full" disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify and sign in"}
                  </Button>
                  <button type="button" onClick={() => setOtpSent(false)} className="w-full text-center text-xs text-muted-foreground hover:text-foreground">
                    Use a different number
                  </button>
                </form>
              )}
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing you agree to our Terms & Privacy.
          </p>
        </div>
      </div>
    </div>
  );
}
