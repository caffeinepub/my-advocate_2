import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Toaster } from "@/components/ui/sonner";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Phone,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Screen = "splash" | "login" | "role-selection" | "dashboard";
type LoginTab = "password" | "otp";
type OtpStep = "phone" | "verify";

// ─── Splash Screen ───────────────────────────────────────────────────────────

function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div
      data-ocid="splash.section"
      className="flex flex-col items-center justify-center flex-1 bg-white"
      style={{ minHeight: "100dvh" }}
    >
      <div className="flex flex-col items-center gap-4 animate-logo-fade">
        <img
          src="/assets/uploads/file_000000003c74720b8f411065c41e45f4-3.png"
          alt="My Advocate"
          style={{ width: 220, height: "auto" }}
          draggable={false}
        />
      </div>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({
  onSuccess,
  onSignUp,
}: {
  onSuccess: () => void;
  onSignUp: () => void;
}) {
  const [activeTab, setActiveTab] = useState<LoginTab>("password");

  // Password login state
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwError, setPwError] = useState("");

  // OTP login state
  const [otpMobile, setOtpMobile] = useState("");
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSending, setOtpSending] = useState(false);

  const DEMO_OTP = "123456";

  function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (!mobile.trim() || !password.trim()) {
      setPwError("Please enter your mobile number and password.");
      return;
    }
    onSuccess();
  }

  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!otpMobile.trim() || otpMobile.length < 10) {
      setOtpError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpError("");
    setOtpSending(true);
    setTimeout(() => {
      setOtpSending(false);
      setOtpStep("verify");
      toast.success("OTP sent! Use 123456 for demo.");
    }, 800);
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp !== DEMO_OTP) {
      setOtpError(`Invalid OTP. Use ${DEMO_OTP} for demo.`);
      return;
    }
    setOtpError("");
    onSuccess();
  }

  function handleGoogleLogin() {
    toast.loading("Connecting to Google…");
    setTimeout(() => {
      toast.dismiss();
      onSuccess();
    }, 1000);
  }

  function handleTabSwitch(tab: LoginTab) {
    setActiveTab(tab);
    setPwError("");
    setOtpError("");
    setOtpStep("phone");
    setOtp("");
  }

  return (
    <div className="flex flex-col flex-1 px-6 pt-10 pb-6">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <img
          src="/assets/uploads/file_0000000036f0720b93e8a32c87ff91e2-1.png"
          alt="My Advocate"
          style={{ height: 60, width: "auto" }}
          draggable={false}
        />
      </div>

      {/* Welcome */}
      <div className="text-center mb-7">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Welcome to My Advocate
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          India's Professional Legal Network
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-muted p-1 mb-6">
        <button
          data-ocid="login.tab.1"
          type="button"
          onClick={() => handleTabSwitch("password")}
          className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            activeTab === "password"
              ? "bg-white text-primary shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Password Login
        </button>
        <button
          data-ocid="login.tab.2"
          type="button"
          onClick={() => handleTabSwitch("otp")}
          className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
            activeTab === "otp"
              ? "bg-white text-primary shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          OTP Login
        </button>
      </div>

      {/* Password Tab */}
      {activeTab === "password" && (
        <form
          onSubmit={handlePasswordLogin}
          className="flex flex-col gap-4 animate-fade-in"
          noValidate
        >
          {/* Mobile */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center gap-1.5">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium text-foreground/60 border-r border-border pr-2">
                +91
              </span>
            </span>
            <Input
              data-ocid="login.mobile.input"
              type="tel"
              placeholder="Mobile Number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="pl-[4.5rem] h-12 text-base"
              maxLength={10}
              autoComplete="tel"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Lock className="w-4 h-4" />
            </span>
            <Input
              data-ocid="login.password.input"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-12 h-12 text-base"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {pwError && (
            <p
              data-ocid="login.error_state"
              className="text-destructive text-sm -mt-1"
            >
              {pwError}
            </p>
          )}

          <Button
            data-ocid="login.submit_button"
            type="submit"
            className="h-12 text-base font-semibold w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl mt-1"
          >
            Login
          </Button>

          <div className="text-center">
            <button
              data-ocid="login.forgot.link"
              type="button"
              className="text-sm text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline"
              onClick={() => toast.info("Password reset coming soon.")}
            >
              Forgot Password?
            </button>
          </div>
        </form>
      )}

      {/* OTP Tab */}
      {activeTab === "otp" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          {otpStep === "phone" ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium text-foreground/60 border-r border-border pr-2">
                    +91
                  </span>
                </span>
                <Input
                  data-ocid="otp.mobile.input"
                  type="tel"
                  placeholder="Mobile Number"
                  value={otpMobile}
                  onChange={(e) => setOtpMobile(e.target.value)}
                  className="pl-[4.5rem] h-12 text-base"
                  maxLength={10}
                  autoComplete="tel"
                />
              </div>

              {otpError && (
                <p
                  data-ocid="otp.error_state"
                  className="text-destructive text-sm -mt-1"
                >
                  {otpError}
                </p>
              )}

              <Button
                data-ocid="otp.send_button"
                type="submit"
                disabled={otpSending}
                className="h-12 text-base font-semibold w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
                {otpSending ? "Sending OTP…" : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={handleVerifyOtp}
              className="flex flex-col gap-5 animate-fade-in"
            >
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  OTP sent to{" "}
                  <span className="text-foreground font-semibold">
                    +91 {otpMobile}
                  </span>
                </p>
                <button
                  type="button"
                  className="text-xs text-primary hover:underline focus-visible:outline-none"
                  onClick={() => {
                    setOtpStep("phone");
                    setOtp("");
                    setOtpError("");
                  }}
                >
                  Change number
                </button>
              </div>

              <div className="flex flex-col items-center gap-3">
                <p className="text-sm font-medium text-foreground self-start">
                  Enter 6-digit OTP
                </p>
                <InputOTP
                  data-ocid="otp.input"
                  maxLength={6}
                  value={otp}
                  onChange={(val) => {
                    setOtp(val);
                    setOtpError("");
                  }}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <p className="text-xs text-muted-foreground">
                  Demo OTP:{" "}
                  <span className="font-mono font-bold text-primary">
                    123456
                  </span>
                </p>
              </div>

              {otpError && (
                <p
                  data-ocid="otp.error_state"
                  className="text-destructive text-sm"
                >
                  {otpError}
                </p>
              )}

              <Button
                data-ocid="otp.verify_button"
                type="submit"
                className="h-12 text-base font-semibold w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
                Verify OTP
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
          or
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Google Login */}
      <button
        data-ocid="login.google_button"
        type="button"
        onClick={handleGoogleLogin}
        className="flex items-center justify-center gap-3 w-full h-12 rounded-xl border border-border bg-white hover:bg-muted/50 transition-colors text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Google G SVG */}
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
          />
          <path
            fill="#34A853"
            d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
          />
          <path
            fill="#FBBC05"
            d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
          />
          <path
            fill="#EA4335"
            d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
          />
        </svg>
        Continue with Google
      </button>

      {/* Sign Up */}
      <div className="text-center mt-6">
        <span className="text-sm text-muted-foreground">
          Don't have an account?{" "}
        </span>
        <button
          data-ocid="login.signup.link"
          type="button"
          onClick={onSignUp}
          className="text-sm font-bold text-primary hover:underline focus-visible:outline-none"
        >
          Sign Up
        </button>
      </div>

      {/* Footer */}
      <footer className="mt-auto pt-6 text-center">
        <p className="text-[11px] text-muted-foreground">
          © 2026 My Advocate • Made by Ankit Sharma
        </p>
      </footer>
    </div>
  );
}

// ─── Role Selection Screen ────────────────────────────────────────────────────

function RoleSelectionScreen({ onBack }: { onBack: () => void }) {
  function handleRoleSelect(role: string) {
    toast.success(`Registration coming soon! We'll notify you.`, {
      description: `You selected: ${role}`,
    });
  }

  return (
    <div className="flex flex-col flex-1 px-6 pt-6 pb-6">
      {/* Back button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1 -ml-1"
          aria-label="Back to login"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      {/* Logo */}
      <div className="flex justify-center mb-7">
        <img
          src="/assets/uploads/file_0000000036f0720b93e8a32c87ff91e2-1.png"
          alt="My Advocate"
          style={{ height: 60, width: "auto" }}
          draggable={false}
        />
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Join My Advocate
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Choose your role to get started
        </p>
      </div>

      {/* Role Cards */}
      <div className="flex flex-col gap-4 flex-1">
        <button
          data-ocid="role.advocate.button"
          type="button"
          onClick={() => handleRoleSelect("Advocate")}
          className="group flex items-start gap-4 p-5 rounded-2xl border-2 border-border bg-white hover:border-primary/60 hover:bg-accent/30 transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">
              Join as Advocate
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Grow your legal practice
            </p>
          </div>
        </button>

        <button
          data-ocid="role.client.button"
          type="button"
          onClick={() => handleRoleSelect("Client")}
          className="group flex items-start gap-4 p-5 rounded-2xl border-2 border-border bg-white hover:border-primary/60 hover:bg-accent/30 transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">
              Join as Client
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Find expert legal help
            </p>
          </div>
        </button>
      </div>

      {/* Footer */}
      <footer className="pt-8 text-center">
        <p className="text-[11px] text-muted-foreground">
          © 2026 My Advocate • Made by Ankit Sharma
        </p>
      </footer>
    </div>
  );
}

// ─── Dashboard Placeholder ────────────────────────────────────────────────────

function DashboardScreen({ onBack }: { onBack: () => void }) {
  return (
    <div data-ocid="dashboard.section" className="flex flex-col flex-1">
      {/* Header bar */}
      <header className="flex items-center w-full px-5 py-3 border-b border-border bg-white">
        <button
          data-ocid="dashboard.header.link"
          type="button"
          onClick={() => toast.info("Dashboard coming soon")}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          aria-label="My Advocate – go to dashboard"
        >
          <img
            src="/assets/uploads/file_0000000067dc720b979aa33b95fe860c-2.png"
            alt="My Advocate"
            style={{ height: 36, width: "auto" }}
            draggable={false}
          />
        </button>
      </header>

      {/* Content */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
        <div className="animate-fade-in flex flex-col items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Login Successful
            </h1>
            <p className="text-base text-muted-foreground mt-2 font-medium">
              Dashboard coming soon
            </p>
            <p className="text-sm text-muted-foreground/70 mt-3 max-w-[280px] mx-auto leading-relaxed">
              Phase 1A complete. Full dashboard will be available in the next
              release.
            </p>
          </div>

          <Button
            data-ocid="dashboard.back_button"
            variant="outline"
            onClick={onBack}
            className="mt-2 h-11 px-8 rounded-xl font-semibold border-border hover:border-primary/40 hover:text-primary transition-colors"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");

  return (
    <div className="app-shell">
      <div className="mobile-card">
        <Toaster position="top-center" richColors />

        {screen === "splash" && (
          <SplashScreen onDone={() => setScreen("login")} />
        )}

        {screen === "login" && (
          <LoginScreen
            onSuccess={() => setScreen("dashboard")}
            onSignUp={() => setScreen("role-selection")}
          />
        )}

        {screen === "role-selection" && (
          <RoleSelectionScreen onBack={() => setScreen("login")} />
        )}

        {screen === "dashboard" && (
          <DashboardScreen onBack={() => setScreen("login")} />
        )}
      </div>
    </div>
  );
}
