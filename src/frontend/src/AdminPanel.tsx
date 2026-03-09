import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  BarChart2,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Filter,
  HardDrive,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageCircle,
  Newspaper,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

// ─── LocalStorage key constants ────────────────────────────────────────────────
const LS_NOTIFICATIONS_KEY = "myadvocate_notifications";
const LS_ADVOCATE_DATA_KEY = "myadvocate_advocate_data";
const LS_CLIENT_DATA_KEY = "myadvocate_client_data";
const LS_PROFILES_KEY = "myadvocate_profiles";
const LS_VERIFICATION_KEY = "myadvocate_verification";
const LS_VERIFICATION_DATA_KEY = "myadvocate_verification_data";
const LS_CASES_KEY = "myadvocate_cases";
const LS_FEED_POSTS_KEY = "myadvocate_feed_posts";
const LS_MESSAGES_KEY = "myadvocate_messages";
const LS_REVIEWS_KEY = "myadvocate_reviews";
const LS_ADMIN_SETTINGS_KEY = "myadvocate_admin_settings";

// ─── Types ────────────────────────────────────────────────────────────────────
type AdminPage =
  | "dashboard"
  | "verification"
  | "users"
  | "reviews"
  | "reports"
  | "content"
  | "settings";
interface AdvocateData {
  userId: string;
  name: string;
  referralCode: string;
  profileData: Record<string, unknown>;
}

interface StoredProfile {
  mobile: string;
  profilePhoto?: string;
  coverPhoto?: string;
  fullName: string;
  practiceArea?: string;
  yearsExp?: string;
  courtName?: string;
  barCouncilNumber?: string;
  state: string;
  city: string;
  officeAddress?: string;
  bio?: string;
  contactEmail: string;
}

interface ClientData {
  userId: string;
  name: string;
  linkedAdvocateId: string | null;
}

interface CaseRecord {
  id: string;
  advocateId: string;
  clientId: string;
  caseTitle: string;
  caseNumber?: string;
  caseType: string;
  caseStatus: "Active" | "Closed" | "Pending" | "On Hold";
  court: string;
  clientName: string;
  nextHearingDate?: string;
  description?: string;
}

interface UserPost {
  id: string;
  authorName: string;
  authorMobile?: string;
  text: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
}

interface AdvocateReview {
  id: string;
  advocateId: string;
  clientId: string;
  clientName: string;
  rating: number;
  text: string;
  createdAt: string;
  updatedAt: string;
  advocateReply?: string;
  replyUpdatedAt?: string;
}

interface VerificationFormData {
  barCouncilEnrollment: string;
  stateBarCouncil: string;
  enrollmentCertName?: string;
  idCardName?: string;
  submittedAt?: string;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────
function safeParseArray<T>(key: string): T[] {
  try {
    const v = localStorage.getItem(key);
    if (!v) return [];
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeParseObject<T extends Record<string, unknown>>(key: string): T {
  try {
    const v = localStorage.getItem(key);
    if (!v) return {} as T;
    return JSON.parse(v) as T;
  } catch {
    return {} as T;
  }
}

function getAdminStats() {
  const advocates = safeParseArray<AdvocateData>(LS_ADVOCATE_DATA_KEY);
  const clients = safeParseArray<ClientData>(LS_CLIENT_DATA_KEY);
  const cases = safeParseArray<CaseRecord>(LS_CASES_KEY);
  const posts = safeParseArray<UserPost>(LS_FEED_POSTS_KEY);
  const messages = safeParseArray<unknown>(LS_MESSAGES_KEY);
  const verification =
    safeParseObject<Record<string, string>>(LS_VERIFICATION_KEY);

  let verified = 0;
  let pending = 0;
  for (const status of Object.values(verification)) {
    if (status === "verified") verified++;
    if (status === "pending") pending++;
  }

  return {
    totalAdvocates: advocates.length,
    verifiedAdvocates: verified,
    pendingVerifications: pending,
    totalClients: clients.length,
    totalCases: cases.length,
    totalPosts: posts.length + 8, // +8 for demo posts
    totalMessages: messages.length,
  };
}

function getAllProfiles(): StoredProfile[] {
  return safeParseArray<StoredProfile>(LS_PROFILES_KEY);
}

function getProfileByMobile(mobile: string): StoredProfile | null {
  return getAllProfiles().find((p) => p.mobile === mobile) ?? null;
}

function getVerificationData(): Record<string, VerificationFormData> {
  return safeParseObject<Record<string, VerificationFormData>>(
    LS_VERIFICATION_DATA_KEY,
  );
}

function getVerificationStatuses(): Record<string, string> {
  return safeParseObject<Record<string, string>>(LS_VERIFICATION_KEY);
}

function saveVerificationStatus(mobile: string, status: string) {
  const data = safeParseObject<Record<string, string>>(LS_VERIFICATION_KEY);
  data[mobile] = status;
  localStorage.setItem(LS_VERIFICATION_KEY, JSON.stringify(data));
}

function pushVerificationNotification(
  userId: string,
  type: "approved" | "rejected",
  reason?: string,
) {
  const notifications =
    safeParseArray<Record<string, unknown>>(LS_NOTIFICATIONS_KEY);
  const notification = {
    id: Date.now().toString(),
    userId,
    type: "verification",
    title:
      type === "approved" ? "Verification Approved ✓" : "Verification Rejected",
    body:
      type === "approved"
        ? "Your verification has been approved. Your profile now shows the Verified Advocate badge."
        : `Your verification was rejected. Reason: ${reason || "No reason provided"}`,
    avatarInitials: "MA",
    avatarColor: "bg-blue-600",
    relatedTab: "profile",
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(notification);
  localStorage.setItem(LS_NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

function getLocalStorageUsage(): string {
  let total = 0;
  for (const key of Object.keys(localStorage)) {
    total += (localStorage.getItem(key) || "").length * 2; // UTF-16
  }
  if (total < 1024) return `${total} B`;
  if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
  return `${(total / (1024 * 1024)).toFixed(2)} MB`;
}

// ─── Admin Login Page ─────────────────────────────────────────────────────────
function AdminLoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setTimeout(() => {
      if (email === "admin@myadvocate.in" && password === "Admin@123") {
        sessionStorage.setItem("myadvocate_admin_session", "1");
        onLogin();
      } else {
        setError("Invalid email or password. Please try again.");
      }
      setLoading(false);
    }, 600);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-xl">
            <Scale className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            My Advocate
          </h1>
          <p className="text-slate-400 text-sm mt-1">Admin Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-1">
            Sign in to Admin
          </h2>
          <p className="text-slate-500 text-sm mb-6">
            Enter your admin credentials to continue
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-5">
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label
                htmlFor="admin-email"
                className="text-slate-700 text-sm font-medium"
              >
                Email Address
              </Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@myadvocate.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                autoComplete="email"
                data-ocid="admin.login.email_input"
              />
            </div>
            <div>
              <Label
                htmlFor="admin-password"
                className="text-slate-700 text-sm font-medium"
              >
                Password
              </Label>
              <div className="relative mt-1.5">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  autoComplete="current-password"
                  data-ocid="admin.login.password_input"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-2"
              disabled={loading}
              data-ocid="admin.login.submit_button"
            >
              {loading ? "Signing in..." : "Sign In to Admin Panel"}
            </Button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            This panel is restricted to authorized administrators only.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS: {
  id: AdminPage;
  label: string;
  icon: React.ReactNode;
  ocid: string;
}[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
    ocid: "admin.sidebar.dashboard_link",
  },
  {
    id: "verification",
    label: "Advocate Verification",
    icon: <ShieldCheck className="w-4 h-4" />,
    ocid: "admin.sidebar.verification_link",
  },
  {
    id: "users",
    label: "Users",
    icon: <Users className="w-4 h-4" />,
    ocid: "admin.sidebar.users_link",
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: <Star className="w-4 h-4" />,
    ocid: "admin.sidebar.reviews_link",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <BarChart2 className="w-4 h-4" />,
    ocid: "admin.sidebar.reports_link",
  },
  {
    id: "content",
    label: "Platform Content",
    icon: <Newspaper className="w-4 h-4" />,
    ocid: "admin.sidebar.content_link",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-4 h-4" />,
    ocid: "admin.sidebar.settings_link",
  },
];

function AdminSidebar({
  activePage,
  onNavigate,
  onLogout,
}: {
  activePage: AdminPage;
  onNavigate: (page: AdminPage) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#1e2a3a] flex flex-col z-40 shadow-2xl">
      {/* Brand */}
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">
              My Advocate
            </div>
            <div className="text-slate-400 text-xs">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <button
            type="button"
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activePage === item.id
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-700/60 hover:text-white"
            }`}
            data-ocid={item.ocid}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-slate-700/50">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600/20 hover:text-red-400 transition-all"
          data-ocid="admin.sidebar.logout_button"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

// ─── Top Header ───────────────────────────────────────────────────────────────
function AdminTopHeader({ title }: { title: string }) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
        Admin
      </Badge>
    </header>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  color,
  ocid,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  ocid: string;
}) {
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4"
      data-ocid={ocid}
    >
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      <div>
        <div className="text-2xl font-bold text-slate-800">
          {value.toLocaleString()}
        </div>
        <div className="text-sm text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function AdminDashboardPage() {
  const stats = useMemo(() => getAdminStats(), []);

  const cards = [
    {
      label: "Total Advocates",
      value: stats.totalAdvocates,
      icon: <UserCheck className="w-5 h-5 text-blue-600" />,
      color: "bg-blue-50",
      ocid: "admin.dashboard.stats_card.1",
    },
    {
      label: "Verified Advocates",
      value: stats.verifiedAdvocates,
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      color: "bg-emerald-50",
      ocid: "admin.dashboard.stats_card.2",
    },
    {
      label: "Pending Verifications",
      value: stats.pendingVerifications,
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      color: "bg-amber-50",
      ocid: "admin.dashboard.stats_card.3",
    },
    {
      label: "Total Clients",
      value: stats.totalClients,
      icon: <Users className="w-5 h-5 text-violet-600" />,
      color: "bg-violet-50",
      ocid: "admin.dashboard.stats_card.4",
    },
    {
      label: "Total Cases",
      value: stats.totalCases,
      icon: <BriefcaseBusiness className="w-5 h-5 text-orange-600" />,
      color: "bg-orange-50",
      ocid: "admin.dashboard.stats_card.5",
    },
    {
      label: "Total Posts",
      value: stats.totalPosts,
      icon: <Newspaper className="w-5 h-5 text-pink-600" />,
      color: "bg-pink-50",
      ocid: "admin.dashboard.stats_card.6",
    },
    {
      label: "Total Messages",
      value: stats.totalMessages,
      icon: <MessageCircle className="w-5 h-5 text-cyan-600" />,
      color: "bg-cyan-50",
      ocid: "admin.dashboard.stats_card.7",
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-700">
          Platform Overview
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Real-time statistics from localStorage
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <StatCard key={card.ocid} {...card} />
        ))}
      </div>

      {/* Quick info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-800">
            Platform Health
          </span>
        </div>
        <p className="text-sm text-blue-700">
          {stats.pendingVerifications > 0
            ? `${stats.pendingVerifications} advocate verification${stats.pendingVerifications > 1 ? "s are" : " is"} pending review. Navigate to Advocate Verification to approve or reject.`
            : "All advocate verifications are up to date. No pending reviews."}
        </p>
      </div>
    </div>
  );
}

// ─── Advocate Verification Page ───────────────────────────────────────────────
function AdminVerificationPage() {
  const [verTab, setVerTab] = useState<
    "pending" | "all" | "verified" | "rejected"
  >("pending");
  const [statuses, setStatuses] = useState<Record<string, string>>(() =>
    getVerificationStatuses(),
  );
  const [formData] = useState<Record<string, VerificationFormData>>(() =>
    getVerificationData(),
  );
  const [selectedAdvocate, setSelectedAdvocate] = useState<
    (AdvocateData & { profile: StoredProfile | null; statusKey: string }) | null
  >(null);
  const [docsAdvocate, setDocsAdvocate] = useState<
    | (AdvocateData & {
        profile: StoredProfile | null;
        statusKey: string;
        formData: VerificationFormData | null;
      })
    | null
  >(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const advocates = useMemo(
    () => safeParseArray<AdvocateData>(LS_ADVOCATE_DATA_KEY),
    [],
  );

  const enrichedAdvocates = useMemo(
    () =>
      advocates.map((adv) => ({
        ...adv,
        profile: getProfileByMobile(adv.userId),
        statusKey: statuses[adv.userId] || "not_verified",
        formData: formData[adv.userId] || null,
      })),
    [advocates, statuses, formData],
  );

  const filteredAdvocates = useMemo(() => {
    if (verTab === "pending")
      return enrichedAdvocates.filter((a) => a.statusKey === "pending");
    if (verTab === "verified")
      return enrichedAdvocates.filter((a) => a.statusKey === "verified");
    if (verTab === "rejected")
      return enrichedAdvocates.filter((a) => a.statusKey === "rejected");
    return enrichedAdvocates;
  }, [enrichedAdvocates, verTab]);

  function approve(mobile: string) {
    saveVerificationStatus(mobile, "verified");
    pushVerificationNotification(mobile, "approved");
    setStatuses(getVerificationStatuses());
    toast.success("Advocate verification approved");
  }

  function openReject(mobile: string) {
    setRejectTarget(mobile);
    setRejectReason("");
    setRejectDialogOpen(true);
  }

  function confirmReject() {
    if (!rejectTarget) return;
    saveVerificationStatus(rejectTarget, "rejected");
    pushVerificationNotification(rejectTarget, "rejected", rejectReason);
    setStatuses(getVerificationStatuses());
    setRejectDialogOpen(false);
    setRejectTarget(null);
    setRejectReason("");
    toast.success("Advocate verification rejected");
  }

  const statusBadge = (status: string) => {
    if (status === "verified")
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
          Verified
        </Badge>
      );
    if (status === "pending")
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          Pending
        </Badge>
      );
    if (status === "rejected")
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          Rejected
        </Badge>
      );
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200">
        Not Verified
      </Badge>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-700">
          Advocate Verification
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Review and approve advocate verification requests
        </p>
      </div>

      <Tabs
        value={verTab}
        onValueChange={(v) =>
          setVerTab(v as "pending" | "all" | "verified" | "rejected")
        }
      >
        <TabsList className="mb-4">
          <TabsTrigger value="pending" data-ocid="admin.verification.tab">
            Pending (
            {enrichedAdvocates.filter((a) => a.statusKey === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="all" data-ocid="admin.verification.tab">
            All ({enrichedAdvocates.length})
          </TabsTrigger>
          <TabsTrigger value="verified" data-ocid="admin.verification.tab">
            Verified (
            {enrichedAdvocates.filter((a) => a.statusKey === "verified").length}
            )
          </TabsTrigger>
          <TabsTrigger value="rejected" data-ocid="admin.verification.tab">
            Rejected (
            {enrichedAdvocates.filter((a) => a.statusKey === "rejected").length}
            )
          </TabsTrigger>
        </TabsList>

        <TabsContent value={verTab}>
          {filteredAdvocates.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No advocates in this category</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAdvocates.map((adv, idx) => (
                <div
                  key={adv.userId}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">
                          {adv.profile?.fullName || adv.name}
                        </span>
                        {statusBadge(adv.statusKey)}
                      </div>
                      <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                        <div>
                          📍 {adv.profile?.city || "—"},{" "}
                          {adv.profile?.state || "—"}
                        </div>
                        <div>
                          ⚖️ {adv.profile?.practiceArea || "—"} •{" "}
                          {adv.profile?.courtName || "—"}
                        </div>
                        {adv.formData && (
                          <div>
                            📋 Bar Council: {adv.formData.barCouncilEnrollment}{" "}
                            • {adv.formData.stateBarCouncil}
                          </div>
                        )}
                        {adv.formData?.submittedAt && (
                          <div>
                            🕐 Submitted:{" "}
                            {new Date(
                              adv.formData.submittedAt,
                            ).toLocaleDateString("en-IN")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {(adv.formData?.enrollmentCertName ||
                        adv.formData?.idCardName) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setDocsAdvocate({
                              ...adv,
                              formData: adv.formData,
                            })
                          }
                          className="gap-1.5"
                          data-ocid={`admin.verification.view_docs_button.${idx + 1}`}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          View Documents
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setSelectedAdvocate({
                            ...adv,
                            statusKey: adv.statusKey,
                          })
                        }
                        className="gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                      </Button>
                      {adv.statusKey === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            onClick={() => approve(adv.userId)}
                            data-ocid={`admin.verification.approve_button.${idx + 1}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openReject(adv.userId)}
                            className="gap-1.5"
                            data-ocid={`admin.verification.reject_button.${idx + 1}`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog
        open={!!selectedAdvocate}
        onOpenChange={(o) => !o && setSelectedAdvocate(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Advocate Details</DialogTitle>
          </DialogHeader>
          {selectedAdvocate && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase mb-0.5">
                    Name
                  </div>
                  <div className="font-semibold">
                    {selectedAdvocate.profile?.fullName ||
                      selectedAdvocate.name}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase mb-0.5">
                    Status
                  </div>
                  {statusBadge(selectedAdvocate.statusKey)}
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase mb-0.5">
                    Mobile
                  </div>
                  <div>{selectedAdvocate.userId}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase mb-0.5">
                    City / State
                  </div>
                  <div>
                    {selectedAdvocate.profile?.city},{" "}
                    {selectedAdvocate.profile?.state}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase mb-0.5">
                    Practice Area
                  </div>
                  <div>{selectedAdvocate.profile?.practiceArea || "—"}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase mb-0.5">
                    Court
                  </div>
                  <div>{selectedAdvocate.profile?.courtName || "—"}</div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase mb-0.5">
                    Experience
                  </div>
                  <div>
                    {selectedAdvocate.profile?.yearsExp
                      ? `${selectedAdvocate.profile.yearsExp} years`
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 text-xs font-medium uppercase mb-0.5">
                    Referral Code
                  </div>
                  <div className="font-mono">
                    {selectedAdvocate.referralCode}
                  </div>
                </div>
              </div>

              {/* Form data */}
              {formData[selectedAdvocate.userId] && (
                <div className="border-t pt-3">
                  <div className="text-slate-700 font-semibold mb-2">
                    Verification Submission
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-slate-500 text-xs font-medium uppercase mb-0.5">
                        Enrollment Number
                      </div>
                      <div>
                        {formData[selectedAdvocate.userId].barCouncilEnrollment}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 text-xs font-medium uppercase mb-0.5">
                        State Bar Council
                      </div>
                      <div>
                        {formData[selectedAdvocate.userId].stateBarCouncil}
                      </div>
                    </div>
                    {formData[selectedAdvocate.userId].enrollmentCertName && (
                      <div className="col-span-2">
                        <div className="text-slate-500 text-xs font-medium uppercase mb-0.5">
                          Enrollment Certificate
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <FileText className="w-4 h-4" />
                          {formData[selectedAdvocate.userId].enrollmentCertName}
                        </div>
                      </div>
                    )}
                    {formData[selectedAdvocate.userId].idCardName && (
                      <div className="col-span-2">
                        <div className="text-slate-500 text-xs font-medium uppercase mb-0.5">
                          Advocate ID Card
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-600">
                          <FileText className="w-4 h-4" />
                          {formData[selectedAdvocate.userId].idCardName}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAdvocate(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Documents Modal */}
      <Dialog
        open={!!docsAdvocate}
        onOpenChange={(o) => !o && setDocsAdvocate(null)}
      >
        <DialogContent
          className="max-w-md"
          data-ocid="admin.verification.docs_modal"
        >
          <DialogHeader>
            <DialogTitle>
              Verification Documents —{" "}
              {docsAdvocate?.profile?.fullName || docsAdvocate?.name}
            </DialogTitle>
          </DialogHeader>
          {docsAdvocate && (
            <div className="space-y-3 py-1">
              {!docsAdvocate.formData?.enrollmentCertName &&
              !docsAdvocate.formData?.idCardName ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No documents uploaded
                </p>
              ) : (
                <>
                  {docsAdvocate.formData?.enrollmentCertName && (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-500 mb-0.5">
                            Enrollment Certificate
                          </div>
                          <div className="text-sm text-slate-800 truncate">
                            {docsAdvocate.formData.enrollmentCertName}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() =>
                          toast.info("Download not available in demo mode")
                        }
                      >
                        Download
                      </Button>
                    </div>
                  )}
                  {docsAdvocate.formData?.idCardName && (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-500 mb-0.5">
                            Advocate ID Card
                          </div>
                          <div className="text-sm text-slate-800 truncate">
                            {docsAdvocate.formData.idCardName}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
                        onClick={() =>
                          toast.info("Download not available in demo mode")
                        }
                      >
                        Download
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDocsAdvocate(null)}
              data-ocid="admin.verification.docs_close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirm Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Verification</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Please provide a reason for rejection. This will be stored for
              record purposes.
            </p>
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmReject}>
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Users Page ───────────────────────────────────────────────────────────────
function AdminUsersPage() {
  const [usersTab, setUsersTab] = useState<"advocates" | "clients">(
    "advocates",
  );
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const advocates = useMemo(
    () => safeParseArray<AdvocateData>(LS_ADVOCATE_DATA_KEY),
    [],
  );
  const clients = useMemo(
    () => safeParseArray<ClientData>(LS_CLIENT_DATA_KEY),
    [],
  );
  const profiles = useMemo(() => getAllProfiles(), []);
  const statuses = useMemo(() => getVerificationStatuses(), []);
  const cases = useMemo(() => safeParseArray<CaseRecord>(LS_CASES_KEY), []);

  const enrichedAdvocates = useMemo(() => {
    const q = search.toLowerCase();
    return advocates
      .map((adv) => {
        const profile = profiles.find((p) => p.mobile === adv.userId);
        const caseCount = cases.filter(
          (c) => c.advocateId === adv.userId,
        ).length;
        return {
          ...adv,
          profile,
          caseCount,
          status: statuses[adv.userId] || "not_verified",
        };
      })
      .filter(
        (adv) =>
          !q ||
          (adv.profile?.fullName || adv.name).toLowerCase().includes(q) ||
          (adv.profile?.city || "").toLowerCase().includes(q),
      );
  }, [advocates, profiles, cases, statuses, search]);

  const enrichedClients = useMemo(() => {
    const q = search.toLowerCase();
    return clients
      .map((c) => {
        const profile = profiles.find((p) => p.mobile === c.userId);
        const caseCount = cases.filter((cs) => cs.clientId === c.userId).length;
        return { ...c, profile, caseCount };
      })
      .filter(
        (c) =>
          !q ||
          (c.profile?.fullName || c.name).toLowerCase().includes(q) ||
          (c.profile?.city || "").toLowerCase().includes(q),
      );
  }, [clients, profiles, cases, search]);

  const statusBadge = (status: string) => {
    if (status === "verified")
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
          Verified
        </Badge>
      );
    if (status === "pending")
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
          Pending
        </Badge>
      );
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-xs">
        Not Verified
      </Badge>
    );
  };

  return (
    <div>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-700">Users</h2>
          <p className="text-sm text-slate-500">
            Manage all advocates and clients on the platform
          </p>
        </div>
        <div className="sm:ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
            data-ocid="admin.users.search_input"
          />
        </div>
      </div>

      <Tabs
        value={usersTab}
        onValueChange={(v) => setUsersTab(v as "advocates" | "clients")}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="advocates" data-ocid="admin.users.advocates_tab">
            Advocates ({advocates.length})
          </TabsTrigger>
          <TabsTrigger value="clients" data-ocid="admin.users.clients_tab">
            Clients ({clients.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="advocates">
          {enrichedAdvocates.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No advocates found
            </div>
          ) : (
            <div className="space-y-2">
              {enrichedAdvocates.map((adv) => (
                <div
                  key={adv.userId}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 text-left"
                    onClick={() =>
                      setExpandedRow(
                        expandedRow === adv.userId ? null : adv.userId,
                      )
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                        {(adv.profile?.fullName || adv.name)
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                          {adv.profile?.fullName || adv.name}
                          {statusBadge(adv.status)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {adv.profile?.practiceArea || "—"} •{" "}
                          {adv.profile?.city || "—"},{" "}
                          {adv.profile?.state || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{adv.caseCount} cases</span>
                      {expandedRow === adv.userId ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                  {expandedRow === adv.userId && (
                    <div className="border-t px-4 py-3 bg-slate-50 text-sm grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <span className="text-slate-400 text-xs">Mobile:</span>{" "}
                        {adv.userId}
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs">Email:</span>{" "}
                        {adv.profile?.contactEmail || "—"}
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs">Court:</span>{" "}
                        {adv.profile?.courtName || "—"}
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs">
                          Bar Council #:
                        </span>{" "}
                        {adv.profile?.barCouncilNumber || "—"}
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs">
                          Experience:
                        </span>{" "}
                        {adv.profile?.yearsExp
                          ? `${adv.profile.yearsExp} yrs`
                          : "—"}
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs">
                          Referral:
                        </span>{" "}
                        <span className="font-mono text-xs">
                          {adv.referralCode}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clients">
          {enrichedClients.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No clients found
            </div>
          ) : (
            <div className="space-y-2">
              {enrichedClients.map((c) => (
                <div
                  key={c.userId}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 text-left"
                    onClick={() =>
                      setExpandedRow(expandedRow === c.userId ? null : c.userId)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700">
                        {(c.profile?.fullName || c.name)
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 text-sm">
                          {c.profile?.fullName || c.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {c.profile?.city || "—"}, {c.profile?.state || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <span>{c.caseCount} cases</span>
                      {expandedRow === c.userId ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </button>
                  {expandedRow === c.userId && (
                    <div className="border-t px-4 py-3 bg-slate-50 text-sm grid grid-cols-2 gap-2 text-slate-600">
                      <div>
                        <span className="text-slate-400 text-xs">Mobile:</span>{" "}
                        {c.userId}
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs">Email:</span>{" "}
                        {c.profile?.contactEmail || "—"}
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs">
                          Linked Advocate:
                        </span>{" "}
                        {c.linkedAdvocateId || "None"}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Reviews Page ─────────────────────────────────────────────────────────────
function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdvocateReview[]>(() =>
    safeParseArray<AdvocateReview>(LS_REVIEWS_KEY).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );
  const [filterRating, setFilterRating] = useState<string>("all");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const advocates = useMemo(
    () => safeParseArray<AdvocateData>(LS_ADVOCATE_DATA_KEY),
    [],
  );
  const profiles = useMemo(() => getAllProfiles(), []);

  function getAdvocateName(id: string): string {
    const profile = profiles.find((p) => p.mobile === id);
    if (profile) return profile.fullName;
    const adv = advocates.find((a) => a.userId === id);
    return adv?.name || id;
  }

  const filteredReviews = useMemo(() => {
    if (filterRating === "all") return reviews;
    const r = Number.parseInt(filterRating);
    return reviews.filter((rev) => rev.rating === r);
  }, [reviews, filterRating]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  function handleDelete(id: string) {
    const all = safeParseArray<AdvocateReview>(LS_REVIEWS_KEY);
    localStorage.setItem(
      LS_REVIEWS_KEY,
      JSON.stringify(all.filter((r) => r.id !== id)),
    );
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setDeleteTarget(null);
    toast.success("Review deleted");
  }

  function StarRow({ rating }: { rating: number }) {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-700">Reviews</h2>
          <p className="text-sm text-slate-500">
            {reviews.length} total reviews • Average rating:{" "}
            <span className="font-semibold text-amber-600">
              ⭐ {avgRating.toFixed(1)}
            </span>
          </p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger
              className="w-36"
              data-ocid="admin.reviews.filter.select"
            >
              <SelectValue placeholder="Filter by rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No reviews found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review, idx) => (
            <div
              key={review.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <StarRow rating={review.rating} />
                    <span className="text-sm font-semibold text-slate-800">
                      {review.clientName}
                    </span>
                    <span className="text-xs text-slate-400">→</span>
                    <span className="text-sm text-blue-600 font-medium">
                      {getAdvocateName(review.advocateId)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-3">
                    {review.text}
                  </p>
                  {review.advocateReply && (
                    <div className="mt-2 pl-3 border-l-2 border-blue-200">
                      <p className="text-xs text-slate-500 font-medium mb-0.5">
                        Advocate replied:
                      </p>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {review.advocateReply}
                      </p>
                    </div>
                  )}
                  <div className="text-xs text-slate-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                  onClick={() => setDeleteTarget(review.id)}
                  data-ocid={`admin.reviews.delete_button.${idx + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Review?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This will permanently remove the review from the platform.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
const CHART_COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

function AdminReportsPage() {
  const cases = useMemo(() => safeParseArray<CaseRecord>(LS_CASES_KEY), []);
  const reviews = useMemo(
    () => safeParseArray<AdvocateReview>(LS_REVIEWS_KEY),
    [],
  );
  const advocates = useMemo(
    () => safeParseArray<AdvocateData>(LS_ADVOCATE_DATA_KEY),
    [],
  );
  const profiles = useMemo(() => getAllProfiles(), []);

  const caseStatusData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of cases) {
      counts[c.caseStatus] = (counts[c.caseStatus] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [cases]);

  const topAdvocatesByRating = useMemo(() => {
    const ratingMap: Record<string, number[]> = {};
    for (const r of reviews) {
      if (!ratingMap[r.advocateId]) ratingMap[r.advocateId] = [];
      ratingMap[r.advocateId].push(r.rating);
    }
    return Object.entries(ratingMap)
      .map(([id, ratings]) => {
        const profile = profiles.find((p) => p.mobile === id);
        const adv = advocates.find((a) => a.userId === id);
        const avg =
          Math.round(
            (ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10,
          ) / 10;
        return {
          name: (profile?.fullName || adv?.name || id)
            .split(" ")
            .slice(0, 1)
            .join(""),
          avg,
          count: ratings.length,
        };
      })
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
  }, [reviews, advocates, profiles]);

  const stats = useMemo(() => getAdminStats(), []);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-700">Reports</h2>
        <p className="text-sm text-slate-500">
          Platform analytics and performance metrics
        </p>
      </div>

      <div className="space-y-6">
        {/* Case Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-700 mb-4">
            Case Status Distribution
          </h3>
          {caseStatusData.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={caseStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {caseStatusData.map((entry, i) => (
                      <Cell
                        key={entry.name}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              No case data available
            </div>
          )}
        </div>

        {/* Top Advocates by Rating */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-700 mb-4">
            Top Advocates by Rating
          </h3>
          {topAdvocatesByRating.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAdvocatesByRating}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 5]}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} ⭐`, "Avg Rating"]}
                  />
                  <Bar dataKey="avg" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-slate-400 text-sm">
              No review data available
            </div>
          )}
        </div>

        {/* Platform Summary Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-700 mb-4">
            Platform Summary
          </h3>
          <div className="divide-y">
            {[
              ["Total Advocates", stats.totalAdvocates],
              ["Verified Advocates", stats.verifiedAdvocates],
              ["Pending Verifications", stats.pendingVerifications],
              ["Total Clients", stats.totalClients],
              ["Total Cases", stats.totalCases],
              ["Total Posts", stats.totalPosts],
              ["Total Messages", stats.totalMessages],
              ["Total Reviews", safeParseArray(LS_REVIEWS_KEY).length],
            ].map(([label, value]) => (
              <div
                key={label as string}
                className="flex justify-between py-2.5 text-sm"
              >
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold text-slate-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Platform Content Page ────────────────────────────────────────────────────
function AdminContentPage() {
  const [posts, setPosts] = useState<UserPost[]>(() =>
    safeParseArray<UserPost>(LS_FEED_POSTS_KEY).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    ),
  );
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filteredPosts = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.authorName.toLowerCase().includes(q) ||
        p.text.toLowerCase().includes(q),
    );
  }, [posts, search]);

  function handleDelete(id: string) {
    const all = safeParseArray<UserPost>(LS_FEED_POSTS_KEY);
    localStorage.setItem(
      LS_FEED_POSTS_KEY,
      JSON.stringify(all.filter((p) => p.id !== id)),
    );
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setDeleteTarget(null);
    toast.success("Post deleted");
  }

  return (
    <div>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-700">
            Platform Content
          </h2>
          <p className="text-sm text-slate-500">
            {posts.length} user-created posts
          </p>
        </div>
        <div className="sm:ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64"
            data-ocid="admin.content.search_input"
          />
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{search ? "No posts match your search" : "No posts yet"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post, idx) => (
            <div
              key={post.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                  {post.authorName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-800 text-sm">
                      {post.authorName}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400">
                        {new Date(post.timestamp).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                        onClick={() => setDeleteTarget(post.id)}
                        data-ocid={`admin.content.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-1.5 line-clamp-3">
                    {post.text}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span>👍 {post.likes}</span>
                    <span>💬 {post.comments}</span>
                    <span>↗ {post.shares}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Post?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This will permanently remove the post from the feed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────
function AdminSettingsPage() {
  const [adminSettings, setAdminSettings] = useState(() => {
    const saved = safeParseObject<{
      autoApprove?: boolean;
    }>(LS_ADMIN_SETTINGS_KEY);
    return { autoApprove: saved.autoApprove || false };
  });
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const storageUsage = useMemo(() => getLocalStorageUsage(), []);
  const lastSync = useMemo(() => new Date().toLocaleString("en-IN"), []);

  function saveSettings(updated: typeof adminSettings) {
    setAdminSettings(updated);
    localStorage.setItem(LS_ADMIN_SETTINGS_KEY, JSON.stringify(updated));
    toast.success("Settings saved");
  }

  function handleClearDemoData() {
    const keysToReset = [
      "myadvocate_users",
      "myadvocate_profiles",
      "myadvocate_advocate_data",
      "myadvocate_client_data",
      "myadvocate_cases",
      "myadvocate_feed_posts",
      "myadvocate_messages",
      "myadvocate_reviews",
      "myadvocate_verification",
      "myadvocate_verification_data",
      "myadvocate_seeded_v1",
      "myadvocate_reviews_seeded_v1",
    ];
    for (const k of keysToReset) localStorage.removeItem(k);
    setClearConfirmOpen(false);
    toast.success("Demo data cleared. Refresh the main app to re-seed.");
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-700">Settings</h2>
        <p className="text-sm text-slate-500">
          Admin panel configuration and platform settings
        </p>
      </div>

      <div className="space-y-5 max-w-2xl">
        {/* Admin Credentials */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-500" />
            Admin Credentials
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="text-sm font-medium text-slate-700">
                  Admin Email
                </div>
                <div className="text-sm text-slate-500">
                  admin@myadvocate.in
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Read-only
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="text-sm font-medium text-slate-700">
                  Password
                </div>
                <div className="text-sm text-slate-500">••••••••</div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() =>
                  toast.info(
                    "Password change requires backend — demo mode only",
                  )
                }
                data-ocid="admin.settings.save_button"
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>

        {/* Platform Settings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-500" />
            Platform Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-700">
                  Demo Mode
                </div>
                <div className="text-xs text-slate-500">
                  All data stored in localStorage (always on)
                </div>
              </div>
              <Switch checked={true} disabled />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-700">
                  Verification Auto-Approve
                </div>
                <div className="text-xs text-slate-500">
                  Automatically approve verification after submission
                </div>
              </div>
              <Switch
                checked={adminSettings.autoApprove}
                onCheckedChange={(v) =>
                  saveSettings({ ...adminSettings, autoApprove: v })
                }
              />
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-500" />
            Platform Stats
          </h3>
          <div className="divide-y">
            <div className="flex justify-between py-2.5 text-sm">
              <span className="text-slate-500">Last Sync</span>
              <span className="text-slate-800 font-medium">{lastSync}</span>
            </div>
            <div className="flex justify-between py-2.5 text-sm">
              <span className="text-slate-500">Total Storage Used</span>
              <span className="text-slate-800 font-medium">{storageUsage}</span>
            </div>
            <div className="flex justify-between py-2.5 text-sm">
              <span className="text-slate-500">Storage Type</span>
              <span className="text-slate-800 font-medium">localStorage</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-red-600 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-700">
                Clear Demo Data
              </div>
              <div className="text-xs text-slate-500">
                Reset all seeded data from localStorage. This cannot be undone.
              </div>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setClearConfirmOpen(true)}
              className="shrink-0"
            >
              Clear Data
            </Button>
          </div>
        </div>
      </div>

      {/* Clear Confirm Dialog */}
      <Dialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear Demo Data?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This will remove all demo data from localStorage. The main app will
            re-seed fresh data on next load. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClearConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearDemoData}>
              Yes, Clear All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Admin App Shell ──────────────────────────────────────────────────────────
const PAGE_TITLES: Record<AdminPage, string> = {
  dashboard: "Dashboard",
  verification: "Advocate Verification",
  users: "Users",
  reviews: "Reviews",
  reports: "Reports",
  content: "Platform Content",
  settings: "Settings",
};

function AdminDashboardShell({ onLogout }: { onLogout: () => void }) {
  const [activePage, setActivePage] = useState<AdminPage>(() => {
    const hash = window.location.hash;
    const match = hash.match(/^#\/admin\/(\w+)/);
    if (match && match[1] in PAGE_TITLES) return match[1] as AdminPage;
    return "dashboard";
  });

  function navigate(page: AdminPage) {
    setActivePage(page);
    window.location.hash = `#/admin/${page}`;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar
        activePage={activePage}
        onNavigate={navigate}
        onLogout={onLogout}
      />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <AdminTopHeader title={PAGE_TITLES[activePage]} />
        <main className="flex-1 p-6">
          <ScrollArea className="h-full">
            {activePage === "dashboard" && <AdminDashboardPage />}
            {activePage === "verification" && <AdminVerificationPage />}
            {activePage === "users" && <AdminUsersPage />}
            {activePage === "reviews" && <AdminReviewsPage />}
            {activePage === "reports" && <AdminReportsPage />}
            {activePage === "content" && <AdminContentPage />}
            {activePage === "settings" && <AdminSettingsPage />}
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}

// ─── Main AdminApp Component (exported) ───────────────────────────────────────
export function AdminApp() {
  const [loggedIn, setLoggedIn] = useState(
    () => sessionStorage.getItem("myadvocate_admin_session") === "1",
  );
  const hasToasterRef = useRef(false);

  function handleLogin() {
    setLoggedIn(true);
  }

  function handleLogout() {
    sessionStorage.removeItem("myadvocate_admin_session");
    setLoggedIn(false);
    window.location.hash = "#/admin";
  }

  if (!loggedIn) {
    return (
      <>
        {!hasToasterRef.current &&
          (() => {
            hasToasterRef.current = true;
            return null;
          })()}
        <AdminLoginPage onLogin={handleLogin} />
      </>
    );
  }

  return <AdminDashboardShell onLogout={handleLogout} />;
}

// ─── Export verification data saver (for use in main app) ─────────────────────
export function saveVerificationFormData(
  mobile: string,
  data: VerificationFormData,
) {
  const existing = safeParseObject<Record<string, VerificationFormData>>(
    LS_VERIFICATION_DATA_KEY,
  );
  existing[mobile] = data;
  localStorage.setItem(LS_VERIFICATION_DATA_KEY, JSON.stringify(existing));
}
