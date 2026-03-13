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
  Ban,
  BarChart2,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Flag,
  Globe,
  HardDrive,
  Heart,
  LayoutDashboard,
  Lock,
  LogOut,
  Megaphone,
  MessageCircle,
  MessageCircleOff,
  MoreVertical,
  Newspaper,
  RefreshCw,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Trash2,
  TrendingUp,
  UserCheck,
  UserX,
  Users,
  XCircle,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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
const LS_ACCOUNT_STATUS_KEY = "myadvocate_account_status";
const LS_LAST_LOGIN_KEY = "myadvocate_last_login";
const LS_REVIEW_FLAGS_KEY = "myadvocate_review_flags";
const LS_REPORTS_KEY = "myadvocate_reports";
const LS_CONTENT_STATUS_KEY = "myadvocate_content_status";
const LS_PLATFORM_SETTINGS_KEY = "myadvocate_platform_settings";

// ─── Types ────────────────────────────────────────────────────────────────────
type AdminPage =
  | "dashboard"
  | "verification"
  | "users"
  | "reviews"
  | "reports"
  | "analytics"
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
  imageDataUrl?: string;
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

interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedId: string;
  reportedName: string;
  reportType: "User" | "Post" | "Message";
  reportedContentPreview?: string;
  reason: string;
  note?: string;
  status: "Pending" | "Ignored" | "Warned" | "Suspended" | "Banned";
  createdAt: string;
}

interface PlatformSettings {
  platformName: string;
  platformDescription: string;
  customLogoBase64: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementColor: "info" | "warning" | "success";
  registrationsDisabled: boolean;
  postingDisabled: boolean;
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
  const reports = safeParseArray<UserReport>(LS_REPORTS_KEY);
  const reviews = safeParseArray<AdvocateReview>(LS_REVIEWS_KEY);

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
    totalUsers: advocates.length + clients.length,
    totalCases: cases.length,
    totalPosts: posts.length + 8, // +8 for demo posts
    totalMessages: messages.length,
    totalReports: reports.length,
    pendingReports: reports.filter((r) => r.status === "Pending").length,
    totalReviews: reviews.length,
  };
}

// ─── Analytics data generators ─────────────────────────────────────────────
type TimeRange = "7d" | "30d" | "12m";

function generateUserGrowthData(range: TimeRange) {
  const now = new Date();
  const points: { label: string; users: number }[] = [];

  if (range === "7d") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let base = 42;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      base += Math.floor(Math.random() * 6) + 1;
      points.push({ label: days[d.getDay()], users: base });
    }
  } else if (range === "30d") {
    let base = 30;
    for (let i = 29; i >= 0; i -= 3) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      base += Math.floor(Math.random() * 8) + 2;
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      points.push({ label, users: base });
    }
  } else {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    let base = 10;
    const startMonth = (now.getMonth() + 1) % 12;
    for (let i = 0; i < 12; i++) {
      const monthIdx = (startMonth + i) % 12;
      base += Math.floor(Math.random() * 15) + 5;
      points.push({ label: months[monthIdx], users: base });
    }
  }
  return points;
}

function generatePostActivityData(range: TimeRange) {
  const now = new Date();
  const points: { label: string; posts: number }[] = [];

  if (range === "7d") {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      points.push({
        label: days[d.getDay()],
        posts: Math.floor(Math.random() * 12) + 1,
      });
    }
  } else if (range === "30d") {
    for (let i = 29; i >= 0; i -= 3) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      points.push({ label, posts: Math.floor(Math.random() * 20) + 3 });
    }
  } else {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const startMonth = (now.getMonth() + 1) % 12;
    for (let i = 0; i < 12; i++) {
      const monthIdx = (startMonth + i) % 12;
      points.push({
        label: months[monthIdx],
        posts: Math.floor(Math.random() * 60) + 10,
      });
    }
  }
  return points;
}

function getReviewRatingData(): {
  name: string;
  value: number;
  fill: string;
}[] {
  const reviews = safeParseArray<AdvocateReview>(LS_REVIEWS_KEY);
  const counts = [0, 0, 0, 0, 0];
  for (const r of reviews) {
    const idx = Math.min(Math.max(Math.round(r.rating), 1), 5) - 1;
    counts[idx]++;
  }
  // Add demo data if no reviews yet
  if (reviews.length === 0) {
    counts[0] = 2;
    counts[1] = 3;
    counts[2] = 8;
    counts[3] = 15;
    counts[4] = 22;
  }
  const colors = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#2563EB"];
  return [1, 2, 3, 4, 5]
    .map((star, i) => ({
      name: `${star} Star${star > 1 ? "s" : ""}`,
      value: counts[i],
      fill: colors[i],
    }))
    .filter((d) => d.value > 0);
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

function getContentStatus(): Record<
  string,
  { hidden?: boolean; commentsDisabled?: boolean }
> {
  return safeParseObject<
    Record<string, { hidden?: boolean; commentsDisabled?: boolean }>
  >(LS_CONTENT_STATUS_KEY);
}

function saveContentStatus(
  postId: string,
  updates: { hidden?: boolean; commentsDisabled?: boolean },
) {
  const status = getContentStatus();
  status[postId] = { ...status[postId], ...updates };
  localStorage.setItem(LS_CONTENT_STATUS_KEY, JSON.stringify(status));
}

function pushContentNotification(
  authorMobile: string | undefined,
  type: "hidden" | "deleted",
) {
  if (!authorMobile) return;
  const notifications =
    safeParseArray<Record<string, unknown>>(LS_NOTIFICATIONS_KEY);
  const notification = {
    id: Date.now().toString(),
    userId: authorMobile,
    type: "content_moderation",
    title: type === "hidden" ? "Post Hidden by Admin" : "Post Removed by Admin",
    body:
      type === "hidden"
        ? "One of your posts has been hidden from the feed by the platform admin. Please review our community guidelines."
        : "One of your posts has been permanently removed by the platform admin for violating community guidelines.",
    avatarInitials: "MA",
    avatarColor: "bg-red-600",
    relatedTab: "home",
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(notification);
  localStorage.setItem(LS_NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

// ─── Platform Settings helpers ────────────────────────────────────────────────
function getDefaultPlatformSettings(): PlatformSettings {
  return {
    platformName: "",
    platformDescription: "",
    customLogoBase64: "",
    announcementEnabled: false,
    announcementText: "",
    announcementColor: "info",
    registrationsDisabled: false,
    postingDisabled: false,
  };
}

export function getPlatformSettings(): PlatformSettings {
  try {
    const v = localStorage.getItem(LS_PLATFORM_SETTINGS_KEY);
    if (!v) return getDefaultPlatformSettings();
    return {
      ...getDefaultPlatformSettings(),
      ...(JSON.parse(v) as Partial<PlatformSettings>),
    };
  } catch {
    return getDefaultPlatformSettings();
  }
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
    label: "User Reports",
    icon: <Flag className="w-4 h-4" />,
    ocid: "admin.sidebar.reports_link",
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: <BarChart2 className="w-4 h-4" />,
    ocid: "admin.sidebar.analytics_link",
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
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const userGrowthData = useMemo(
    () => generateUserGrowthData(timeRange),
    [timeRange],
  );
  const postActivityData = useMemo(
    () => generatePostActivityData(timeRange),
    [timeRange],
  );
  const ratingData = useMemo(() => getReviewRatingData(), []);

  const summaryCards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: <Users className="w-5 h-5 text-blue-600" />,
      color: "bg-blue-50",
      ocid: "admin.dashboard.stats_card.1",
    },
    {
      label: "Total Advocates",
      value: stats.totalAdvocates,
      icon: <UserCheck className="w-5 h-5 text-violet-600" />,
      color: "bg-violet-50",
      ocid: "admin.dashboard.stats_card.2",
    },
    {
      label: "Total Clients",
      value: stats.totalClients,
      icon: <Users className="w-5 h-5 text-cyan-600" />,
      color: "bg-cyan-50",
      ocid: "admin.dashboard.stats_card.3",
    },
    {
      label: "Verified Advocates",
      value: stats.verifiedAdvocates,
      icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
      color: "bg-emerald-50",
      ocid: "admin.dashboard.stats_card.4",
    },
    {
      label: "Total Posts",
      value: stats.totalPosts,
      icon: <Newspaper className="w-5 h-5 text-pink-600" />,
      color: "bg-pink-50",
      ocid: "admin.dashboard.stats_card.5",
    },
    {
      label: "Total Reviews",
      value: stats.totalReviews,
      icon: <Star className="w-5 h-5 text-amber-500" />,
      color: "bg-amber-50",
      ocid: "admin.dashboard.stats_card.6",
    },
  ];

  const timeRangeOptions: { label: string; value: TimeRange }[] = [
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
    { label: "Last 12 months", value: "12m" },
  ];

  const totalRatings = ratingData.reduce((s, d) => s + d.value, 0);
  const avgRating =
    totalRatings > 0
      ? (
          ratingData.reduce(
            (s, d) => s + d.value * Number(d.name.charAt(0)),
            0,
          ) / totalRatings
        ).toFixed(1)
      : "0.0";

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-700">
          Platform Overview
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Analytics and statistics from platform data
        </p>
      </div>

      {/* 6 Summary Cards — 3×2 grid */}
      <div
        className="grid grid-cols-3 gap-3 mb-8"
        data-ocid="admin.dashboard.stats_card.1"
      >
        {summaryCards.map((card) => (
          <StatCard key={card.ocid} {...card} />
        ))}
      </div>

      {/* Time Range Selector */}
      <div
        className="flex items-center gap-2 mb-6"
        data-ocid="admin.dashboard.panel"
      >
        <span className="text-xs font-medium text-slate-500 mr-1">Period:</span>
        {timeRangeOptions.map((opt) => (
          <button
            type="button"
            key={opt.value}
            data-ocid={`admin.dashboard.${opt.value}.toggle`}
            onClick={() => setTimeRange(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              timeRange === opt.value
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Charts Row 1: User Growth + Post Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Growth Line Chart */}
        <div
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
          data-ocid="admin.dashboard.user_growth.card"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-700">
              User Growth
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={userGrowthData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#334155", fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={{ fill: "#2563EB", r: 3 }}
                activeDot={{ r: 5, fill: "#2563EB" }}
                name="Users"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Post Activity Bar Chart */}
        <div
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
          data-ocid="admin.dashboard.post_activity.card"
        >
          <div className="flex items-center gap-2 mb-4">
            <Newspaper className="w-4 h-4 text-pink-600" />
            <h3 className="text-sm font-semibold text-slate-700">
              Post Activity
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={postActivityData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#334155", fontWeight: 600 }}
              />
              <Bar
                dataKey="posts"
                fill="#2563EB"
                radius={[4, 4, 0, 0]}
                name="Posts"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Review Rating Distribution Donut */}
      <div
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
        data-ocid="admin.dashboard.rating_dist.card"
      >
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-slate-700">
            Review Rating Distribution
          </h3>
          <span className="ml-auto text-xs text-slate-500">
            Avg:{" "}
            <span className="font-semibold text-amber-600">{avgRating} ★</span>
            {" · "}
            {totalRatings} reviews
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={ratingData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {ratingData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [
                  `${value} reviews`,
                  name,
                ]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px", color: "#64748b" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
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

// ─── Account Status helpers ───────────────────────────────────────────────────
function getAccountStatuses(): Record<
  string,
  "Active" | "Suspended" | "Banned"
> {
  return safeParseObject<Record<string, "Active" | "Suspended" | "Banned">>(
    LS_ACCOUNT_STATUS_KEY,
  );
}

function saveAccountStatus(
  userId: string,
  status: "Active" | "Suspended" | "Banned",
) {
  const data = getAccountStatuses();
  data[userId] = status;
  localStorage.setItem(LS_ACCOUNT_STATUS_KEY, JSON.stringify(data));
}

function getLastLogins(): Record<string, string> {
  return safeParseObject<Record<string, string>>(LS_LAST_LOGIN_KEY);
}

function seedLastLogins(userIds: string[]) {
  const existing = getLastLogins();
  const hasData = Object.keys(existing).length > 0;
  if (hasData) return;
  const now = Date.now();
  const seeded: Record<string, string> = {};
  userIds.forEach((id, idx) => {
    const daysAgo = (idx * 2) % 30;
    const hoursAgo = (idx * 3) % 24;
    seeded[id] = new Date(
      now - (daysAgo * 86400 + hoursAgo * 3600) * 1000,
    ).toISOString();
  });
  localStorage.setItem(LS_LAST_LOGIN_KEY, JSON.stringify(seeded));
}

function formatLastLogin(isoDate: string | undefined): string {
  if (!isoDate) return "Never";
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Account Status Badge ─────────────────────────────────────────────────────
function AccountStatusBadge({ status }: { status: string }) {
  if (status === "Suspended") {
    return (
      <span className="flex items-center gap-1.5 text-amber-700 text-sm font-medium">
        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block shrink-0" />
        Suspended
      </span>
    );
  }
  if (status === "Banned") {
    return (
      <span className="flex items-center gap-1.5 text-red-700 text-sm font-medium">
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block shrink-0" />
        Banned
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-emerald-700 text-sm font-medium">
      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
      Active
    </span>
  );
}

// ─── Users Page ───────────────────────────────────────────────────────────────
function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "advocate" | "client">(
    "all",
  );
  const [verifyFilter, setVerifyFilter] = useState<
    "all" | "verified" | "pending" | "not_verified"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Active" | "Suspended" | "Banned"
  >("all");

  const [accountStatuses, setAccountStatuses] = useState<
    Record<string, "Active" | "Suspended" | "Banned">
  >(() => getAccountStatuses());
  const [lastLogins, setLastLogins] = useState<Record<string, string>>({});

  // Modals & dialogs
  const [profileUser, setProfileUser] = useState<null | {
    userId: string;
    name: string;
    email: string;
    city: string;
    state: string;
    mobile: string;
    accountType: "Advocate" | "Client";
    verificationStatus: string;
    accountStatus: string;
    lastLogin: string;
    practiceArea?: string;
    courtName?: string;
    barCouncilNumber?: string;
    linkedAdvocateId?: string | null;
    yearsExp?: string;
  }>(null);
  const [suspendTarget, setSuspendTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [banTarget, setBanTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    userId: string;
    name: string;
    accountType: "Advocate" | "Client";
  } | null>(null);

  const advocates = useMemo(
    () => safeParseArray<AdvocateData>(LS_ADVOCATE_DATA_KEY),
    [],
  );
  const clients = useMemo(
    () => safeParseArray<ClientData>(LS_CLIENT_DATA_KEY),
    [],
  );
  const profiles = useMemo(() => getAllProfiles(), []);
  const verificationStatuses = useMemo(() => getVerificationStatuses(), []);

  // Seed last logins on mount
  useEffect(() => {
    const allIds = [
      ...advocates.map((a) => a.userId),
      ...clients.map((c) => c.userId),
    ];
    seedLastLogins(allIds);
    setLastLogins(getLastLogins());
  }, [advocates, clients]);

  // Build unified user list
  const allUsers = useMemo(() => {
    const advUsers = advocates.map((adv) => {
      const profile = profiles.find((p) => p.mobile === adv.userId);
      return {
        userId: adv.userId,
        name: profile?.fullName || adv.name,
        email: profile?.contactEmail || "—",
        city: profile?.city || "—",
        state: profile?.state || "—",
        mobile: adv.userId,
        accountType: "Advocate" as const,
        verificationStatus: verificationStatuses[adv.userId] || "not_verified",
        practiceArea: profile?.practiceArea,
        courtName: profile?.courtName,
        barCouncilNumber: profile?.barCouncilNumber,
        yearsExp: profile?.yearsExp,
        linkedAdvocateId: undefined as string | null | undefined,
      };
    });

    const clientUsers = clients.map((c) => {
      const profile = profiles.find((p) => p.mobile === c.userId);
      return {
        userId: c.userId,
        name: profile?.fullName || c.name,
        email: profile?.contactEmail || "—",
        city: profile?.city || "—",
        state: profile?.state || "—",
        mobile: c.userId,
        accountType: "Client" as const,
        verificationStatus: "not_verified" as string,
        practiceArea: undefined as string | undefined,
        courtName: undefined as string | undefined,
        barCouncilNumber: undefined as string | undefined,
        yearsExp: undefined as string | undefined,
        linkedAdvocateId: c.linkedAdvocateId,
      };
    });

    return [...advUsers, ...clientUsers];
  }, [advocates, clients, profiles, verificationStatuses]);

  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase();
    return allUsers.filter((u) => {
      if (
        q &&
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q)
      )
        return false;
      if (typeFilter !== "all" && u.accountType.toLowerCase() !== typeFilter)
        return false;
      if (verifyFilter !== "all" && u.verificationStatus !== verifyFilter)
        return false;
      const acctStatus = accountStatuses[u.userId] || "Active";
      if (statusFilter !== "all" && acctStatus !== statusFilter) return false;
      return true;
    });
  }, [
    allUsers,
    search,
    typeFilter,
    verifyFilter,
    statusFilter,
    accountStatuses,
  ]);

  function verificationStatusBadge(status: string) {
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
      <Badge className="bg-gray-100 text-gray-500 border-gray-200 text-xs">
        Not Verified
      </Badge>
    );
  }

  function handleSuspend() {
    if (!suspendTarget) return;
    saveAccountStatus(suspendTarget.userId, "Suspended");
    setAccountStatuses(getAccountStatuses());
    setSuspendTarget(null);
    toast.success(`${suspendTarget.name} has been suspended`);
  }

  function handleBan() {
    if (!banTarget) return;
    saveAccountStatus(banTarget.userId, "Banned");
    setAccountStatuses(getAccountStatuses());
    setBanTarget(null);
    toast.success(`${banTarget.name} has been banned`);
  }

  function handleReactivate(userId: string, name: string) {
    saveAccountStatus(userId, "Active");
    setAccountStatuses(getAccountStatuses());
    toast.success(`${name} account reactivated`);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const { userId, accountType } = deleteTarget;

    if (accountType === "Advocate") {
      const advList = safeParseArray<AdvocateData>(LS_ADVOCATE_DATA_KEY).filter(
        (a) => a.userId !== userId,
      );
      localStorage.setItem(LS_ADVOCATE_DATA_KEY, JSON.stringify(advList));
    } else {
      const clientList = safeParseArray<ClientData>(LS_CLIENT_DATA_KEY).filter(
        (c) => c.userId !== userId,
      );
      localStorage.setItem(LS_CLIENT_DATA_KEY, JSON.stringify(clientList));
    }

    // Remove from profiles
    const profileList = safeParseArray<StoredProfile>(LS_PROFILES_KEY).filter(
      (p) => p.mobile !== userId,
    );
    localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(profileList));

    // Remove account status
    const statuses = getAccountStatuses();
    delete statuses[userId];
    localStorage.setItem(LS_ACCOUNT_STATUS_KEY, JSON.stringify(statuses));

    setAccountStatuses(getAccountStatuses());
    setDeleteTarget(null);
    toast.success(`${deleteTarget.name} has been deleted`);

    // Force re-render by reloading page state
    window.location.reload();
  }

  function openProfile(u: (typeof allUsers)[0]) {
    setProfileUser({
      userId: u.userId,
      name: u.name,
      email: u.email,
      city: u.city,
      state: u.state,
      mobile: u.mobile,
      accountType: u.accountType,
      verificationStatus: u.verificationStatus,
      accountStatus: accountStatuses[u.userId] || "Active",
      lastLogin: formatLastLogin(lastLogins[u.userId]),
      practiceArea: u.practiceArea,
      courtName: u.courtName,
      barCouncilNumber: u.barCouncilNumber,
      linkedAdvocateId: u.linkedAdvocateId,
      yearsExp: u.yearsExp,
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-700">Users</h2>
        <p className="text-sm text-slate-500">
          Manage all {allUsers.length} users on the platform
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="admin.users.search_input"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
        >
          <SelectTrigger
            className="w-40"
            data-ocid="admin.users.type_filter.select"
          >
            <SelectValue placeholder="Account Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="advocate">Advocate</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={verifyFilter}
          onValueChange={(v) => setVerifyFilter(v as typeof verifyFilter)}
        >
          <SelectTrigger
            className="w-44"
            data-ocid="admin.users.verification_filter.select"
          >
            <SelectValue placeholder="Verification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Verification</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="not_verified">Not Verified</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger
            className="w-40"
            data-ocid="admin.users.status_filter.select"
          >
            <SelectValue placeholder="Account Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
            <SelectItem value="Banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        data-ocid="admin.users.table"
      >
        <div className="overflow-x-auto">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_1.2fr_1fr] gap-2 px-4 py-3 bg-slate-50 border-b border-gray-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div>Name</div>
            <div>Email</div>
            <div>City</div>
            <div>Type</div>
            <div>Verification</div>
            <div>Status</div>
            <div>Last Login</div>
            <div>Actions</div>
          </div>

          {/* Table rows */}
          {filteredUsers.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-slate-400"
              data-ocid="admin.users.empty_state"
            >
              <Users className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No users match your filters</p>
              <p className="text-xs mt-1">
                Try adjusting your search or filter criteria
              </p>
            </div>
          ) : (
            <div>
              {filteredUsers.map((u, idx) => {
                const rowIdx = idx + 1;
                const acctStatus = accountStatuses[u.userId] || "Active";
                return (
                  <div
                    key={u.userId}
                    className="grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_1fr_1.2fr_1fr] gap-2 px-4 py-3.5 border-b border-gray-50 hover:bg-slate-50/70 transition-colors items-center"
                    data-ocid={`admin.users.row.${rowIdx}`}
                  >
                    {/* Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          u.accountType === "Advocate"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        {u.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 text-sm truncate">
                          {u.name}
                        </div>
                        <div className="text-xs text-slate-400 md:hidden">
                          {u.city}
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="text-sm text-slate-600 truncate hidden md:block">
                      {u.email}
                    </div>

                    {/* City */}
                    <div className="text-sm text-slate-600 hidden md:block">
                      {u.city}
                    </div>

                    {/* Account Type */}
                    <div className="hidden md:block">
                      {u.accountType === "Advocate" ? (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                          Advocate
                        </Badge>
                      ) : (
                        <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">
                          Client
                        </Badge>
                      )}
                    </div>

                    {/* Verification */}
                    <div className="hidden md:block">
                      {verificationStatusBadge(u.verificationStatus)}
                    </div>

                    {/* Account Status */}
                    <div className="hidden md:block">
                      <AccountStatusBadge status={acctStatus} />
                    </div>

                    {/* Last Login */}
                    <div className="text-sm text-slate-500 hidden md:block">
                      {formatLastLogin(lastLogins[u.userId])}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 justify-end md:justify-start">
                      <button
                        type="button"
                        onClick={() => openProfile(u)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors"
                        title="View Profile"
                        data-ocid={`admin.users.view_profile_button.${rowIdx}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {acctStatus === "Active" && (
                        <button
                          type="button"
                          onClick={() =>
                            setSuspendTarget({ userId: u.userId, name: u.name })
                          }
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition-colors"
                          title="Suspend"
                          data-ocid={`admin.users.suspend_button.${rowIdx}`}
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                      {acctStatus !== "Banned" && (
                        <button
                          type="button"
                          onClick={() =>
                            setBanTarget({ userId: u.userId, name: u.name })
                          }
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                          title="Ban"
                          data-ocid={`admin.users.ban_button.${rowIdx}`}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      {(acctStatus === "Suspended" ||
                        acctStatus === "Banned") && (
                        <button
                          type="button"
                          onClick={() => handleReactivate(u.userId, u.name)}
                          className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-colors"
                          title="Reactivate"
                          data-ocid={`admin.users.reactivate_button.${rowIdx}`}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            userId: u.userId,
                            name: u.name,
                            accountType: u.accountType,
                          })
                        }
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                        title="Delete"
                        data-ocid={`admin.users.delete_button.${rowIdx}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer count */}
        {filteredUsers.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50 border-t border-gray-100 text-xs text-slate-400">
            Showing {filteredUsers.length} of {allUsers.length} users
          </div>
        )}
      </div>

      {/* ─── View Profile Modal ─────────────────────────────── */}
      <Dialog
        open={!!profileUser}
        onOpenChange={(open) => {
          if (!open) setProfileUser(null);
        }}
      >
        <DialogContent
          className="max-w-lg"
          data-ocid="admin.users.profile_modal"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                  profileUser?.accountType === "Advocate"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-violet-100 text-violet-700"
                }`}
              >
                {profileUser?.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <span>{profileUser?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {profileUser && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">
                    Email
                  </span>
                  <span className="text-slate-700">{profileUser.email}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">
                    Mobile
                  </span>
                  <span className="text-slate-700">{profileUser.mobile}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">
                    City
                  </span>
                  <span className="text-slate-700">{profileUser.city}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">
                    State
                  </span>
                  <span className="text-slate-700">{profileUser.state}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">
                    Account Type
                  </span>
                  {profileUser.accountType === "Advocate" ? (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                      Advocate
                    </Badge>
                  ) : (
                    <Badge className="bg-violet-100 text-violet-700 border-violet-200 text-xs">
                      Client
                    </Badge>
                  )}
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">
                    Account Status
                  </span>
                  <AccountStatusBadge status={profileUser.accountStatus} />
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">
                    Verification
                  </span>
                  {verificationStatusBadge(profileUser.verificationStatus)}
                </div>
                <div>
                  <span className="text-xs text-slate-400 block mb-0.5">
                    Last Login
                  </span>
                  <span className="text-slate-700">
                    {profileUser.lastLogin}
                  </span>
                </div>
              </div>

              {profileUser.accountType === "Advocate" && (
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">
                      Practice Area
                    </span>
                    <span className="text-slate-700">
                      {profileUser.practiceArea || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">
                      Court
                    </span>
                    <span className="text-slate-700">
                      {profileUser.courtName || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">
                      Bar Council #
                    </span>
                    <span className="text-slate-700 font-mono text-xs">
                      {profileUser.barCouncilNumber || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block mb-0.5">
                      Experience
                    </span>
                    <span className="text-slate-700">
                      {profileUser.yearsExp
                        ? `${profileUser.yearsExp} yrs`
                        : "—"}
                    </span>
                  </div>
                </div>
              )}

              {profileUser.accountType === "Client" &&
                profileUser.linkedAdvocateId && (
                  <div className="pt-2 border-t border-gray-100">
                    <span className="text-xs text-slate-400 block mb-0.5">
                      Linked Advocate
                    </span>
                    <span className="text-slate-700 text-sm">
                      {profileUser.linkedAdvocateId}
                    </span>
                  </div>
                )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setProfileUser(null)}
              data-ocid="admin.users.profile_close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Suspend Confirmation Dialog ───────────────────── */}
      <Dialog
        open={!!suspendTarget}
        onOpenChange={(open) => {
          if (!open) setSuspendTarget(null);
        }}
      >
        <DialogContent
          className="max-w-sm"
          data-ocid="admin.users.suspend_dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <UserX className="w-5 h-5" />
              Suspend Account
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to suspend{" "}
            <strong>{suspendTarget?.name}</strong>? They will lose access until
            reactivated.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSuspendTarget(null)}
              data-ocid="admin.users.suspend_cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleSuspend}
              data-ocid="admin.users.suspend_confirm_button"
            >
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Ban Confirmation Dialog ────────────────────────── */}
      <Dialog
        open={!!banTarget}
        onOpenChange={(open) => {
          if (!open) setBanTarget(null);
        }}
      >
        <DialogContent className="max-w-sm" data-ocid="admin.users.ban_dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Ban className="w-5 h-5" />
              Ban Account
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to ban <strong>{banTarget?.name}</strong>?
            This is a stronger action than suspension.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setBanTarget(null)}
              data-ocid="admin.users.ban_cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              data-ocid="admin.users.ban_confirm_button"
            >
              Ban Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─────────────────────── */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent
          className="max-w-sm"
          data-ocid="admin.users.delete_dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="w-5 h-5" />
              Delete Account
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently delete{" "}
            <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="admin.users.delete_cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              data-ocid="admin.users.delete_confirm_button"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Date boundary helper (outside component so it's stable)
function reviewDateInRange(iso: string, range: string): boolean {
  if (range === "all") return true;
  const d = new Date(iso).getTime();
  const now = Date.now();
  if (range === "today") return d >= now - 86400 * 1000;
  if (range === "week") return d >= now - 7 * 86400 * 1000;
  if (range === "month") return d >= now - 30 * 86400 * 1000;
  return true;
}

// ─── Reviews Page ─────────────────────────────────────────────────────────────
function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdvocateReview[]>(() =>
    safeParseArray<AdvocateReview>(LS_REVIEWS_KEY).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  // Flags: Set of flagged review IDs, persisted in localStorage
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(LS_REVIEW_FLAGS_KEY);
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set<string>();
    }
  });

  const [search, setSearch] = useState("");
  const [filterAdvocate, setFilterAdvocate] = useState("all");
  const [filterRating, setFilterRating] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "normal" | "flagged"
  >("all");
  const [viewTarget, setViewTarget] = useState<AdvocateReview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const advocates = useMemo(
    () => safeParseArray<AdvocateData>(LS_ADVOCATE_DATA_KEY),
    [],
  );
  const profiles = useMemo(() => getAllProfiles(), []);

  const getAdvocateName = useCallback(
    (id: string): string => {
      const profile = profiles.find((p) => p.mobile === id);
      if (profile) return profile.fullName;
      const adv = advocates.find((a) => a.userId === id);
      return adv?.name || id;
    },
    [profiles, advocates],
  );

  // Unique advocate options for filter dropdown
  const advocateOptions = useMemo(() => {
    const ids = [...new Set(reviews.map((r) => r.advocateId))];
    return ids.map((id) => ({ id, name: getAdvocateName(id) }));
  }, [reviews, getAdvocateName]);

  const filteredReviews = useMemo(() => {
    const q = search.toLowerCase();
    return reviews.filter((rev) => {
      const advName = getAdvocateName(rev.advocateId).toLowerCase();
      if (
        q &&
        !rev.clientName.toLowerCase().includes(q) &&
        !advName.includes(q)
      )
        return false;
      if (filterAdvocate !== "all" && rev.advocateId !== filterAdvocate)
        return false;
      if (
        filterRating !== "all" &&
        rev.rating !== Number.parseInt(filterRating)
      )
        return false;
      if (!reviewDateInRange(rev.createdAt, filterDate)) return false;
      const isFlagged = flaggedIds.has(rev.id);
      if (filterStatus === "flagged" && !isFlagged) return false;
      if (filterStatus === "normal" && isFlagged) return false;
      return true;
    });
  }, [
    reviews,
    search,
    filterAdvocate,
    filterRating,
    filterDate,
    filterStatus,
    flaggedIds,
    getAdvocateName,
  ]);

  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  }, [reviews]);

  const flaggedCount = flaggedIds.size;

  function toggleFlag(id: string) {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem(LS_REVIEW_FLAGS_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  function handleDelete(id: string) {
    const all = safeParseArray<AdvocateReview>(LS_REVIEWS_KEY);
    localStorage.setItem(
      LS_REVIEWS_KEY,
      JSON.stringify(all.filter((r) => r.id !== id)),
    );
    // Also clear flag
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      localStorage.setItem(LS_REVIEW_FLAGS_KEY, JSON.stringify([...next]));
      return next;
    });
    setReviews((prev) => prev.filter((r) => r.id !== id));
    setDeleteTarget(null);
    toast.success("Review deleted and removed from advocate profile");
  }

  function StarRow({
    rating,
    size = "sm",
  }: { rating: number; size?: "sm" | "md" }) {
    const cls = size === "md" ? "w-4.5 h-4.5" : "w-3.5 h-3.5";
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`${cls} ${i <= rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
          />
        ))}
      </div>
    );
  }

  function ReviewStatusBadge({ flagged }: { flagged: boolean }) {
    if (flagged) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-300">
          <Flag className="w-3 h-3" />
          Flagged
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
        Normal
      </span>
    );
  }

  return (
    <div>
      {/* Page heading */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-700">Reviews</h2>
        <p className="text-sm text-slate-500">
          Moderate client reviews across all advocates
        </p>
      </div>

      {/* Summary cards */}
      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"
        data-ocid="admin.reviews.summary_section"
      >
        <div
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4"
          data-ocid="admin.reviews.total_card"
        >
          <div className="p-3 rounded-xl bg-blue-50">
            <Star className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {reviews.length}
            </div>
            <div className="text-sm text-slate-500">Total Reviews</div>
          </div>
        </div>
        <div
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4"
          data-ocid="admin.reviews.avg_card"
        >
          <div className="p-3 rounded-xl bg-amber-50">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {reviews.length ? avgRating.toFixed(1) : "—"}
            </div>
            <div className="text-sm text-slate-500">Average Rating</div>
          </div>
        </div>
        <div
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4"
          data-ocid="admin.reviews.flagged_card"
        >
          <div className="p-3 rounded-xl bg-amber-50">
            <Flag className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">
              {flaggedCount}
            </div>
            <div className="text-sm text-slate-500">Flagged Reviews</div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by client or advocate name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="admin.reviews.search_input"
          />
        </div>
        <Select value={filterAdvocate} onValueChange={setFilterAdvocate}>
          <SelectTrigger
            className="w-44"
            data-ocid="admin.reviews.advocate_filter.select"
          >
            <SelectValue placeholder="All Advocates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Advocates</SelectItem>
            {advocateOptions.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterRating} onValueChange={setFilterRating}>
          <SelectTrigger
            className="w-36"
            data-ocid="admin.reviews.rating_filter.select"
          >
            <SelectValue placeholder="All Ratings" />
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
        <Select value={filterDate} onValueChange={setFilterDate}>
          <SelectTrigger
            className="w-36"
            data-ocid="admin.reviews.date_filter.select"
          >
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}
        >
          <SelectTrigger
            className="w-36"
            data-ocid="admin.reviews.status_filter.select"
          >
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Result count */}
      <div className="text-xs text-slate-400 mb-3">
        Showing {filteredReviews.length} of {reviews.length} reviews
      </div>

      {/* Reviews table */}
      {filteredReviews.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-slate-400"
          data-ocid="admin.reviews.empty_state"
        >
          <Star className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium text-sm">No reviews match your filters</p>
          <p className="text-xs mt-1">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          data-ocid="admin.reviews.table"
        >
          {/* Table header */}
          <div className="hidden lg:grid grid-cols-[1.4fr_1.4fr_auto_2.5fr_auto_auto_auto] gap-3 px-5 py-3 bg-slate-50 border-b border-gray-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div>Client</div>
            <div>Advocate</div>
            <div>Rating</div>
            <div>Review</div>
            <div>Date</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {/* Table rows */}
          <div>
            {filteredReviews.map((review, idx) => {
              const isFlagged = flaggedIds.has(review.id);
              return (
                <div
                  key={review.id}
                  className={`grid lg:grid-cols-[1.4fr_1.4fr_auto_2.5fr_auto_auto_auto] gap-3 px-5 py-4 border-b border-gray-50 last:border-0 items-start transition-colors ${
                    isFlagged
                      ? "bg-amber-50 border-amber-100 hover:bg-amber-100/60"
                      : "hover:bg-slate-50/70"
                  }`}
                  data-ocid={`admin.reviews.row.${idx + 1}`}
                >
                  {/* Client */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0">
                        {review.clientName
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-slate-800 truncate">
                        {review.clientName}
                      </span>
                    </div>
                  </div>

                  {/* Advocate */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                        {getAdvocateName(review.advocateId)
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-blue-600 truncate">
                        {getAdvocateName(review.advocateId)}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 shrink-0">
                    <StarRow rating={review.rating} />
                    <span className="text-xs text-slate-500 font-medium ml-1">
                      {review.rating}
                    </span>
                  </div>

                  {/* Review text */}
                  <div className="min-w-0">
                    <p className="text-sm text-slate-600 line-clamp-2">
                      {review.text}
                    </p>
                    {review.advocateReply && (
                      <div className="mt-1.5 pl-2.5 border-l-2 border-blue-200">
                        <p className="text-xs text-slate-400 italic line-clamp-1">
                          Reply: {review.advocateReply}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Date */}
                  <div className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                    {new Date(review.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0">
                    <ReviewStatusBadge flagged={isFlagged} />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setViewTarget(review)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                      title="View full review"
                      data-ocid={`admin.reviews.view_button.${idx + 1}`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFlag(review.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isFlagged
                          ? "text-amber-600 hover:bg-amber-100 hover:text-amber-700"
                          : "text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                      }`}
                      title={isFlagged ? "Unflag review" : "Flag review"}
                      data-ocid={`admin.reviews.flag_button.${idx + 1}`}
                    >
                      <Flag
                        className={`w-4 h-4 ${isFlagged ? "fill-amber-400" : ""}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(review.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete review"
                      data-ocid={`admin.reviews.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View Full Review Modal */}
      <Dialog
        open={!!viewTarget}
        onOpenChange={(o) => !o && setViewTarget(null)}
      >
        <DialogContent
          className="max-w-lg"
          data-ocid="admin.reviews.view_modal"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              Full Review
            </DialogTitle>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4 text-sm">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5 font-medium uppercase">
                    Client
                  </div>
                  <div className="font-semibold text-slate-800">
                    {viewTarget.clientName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5 font-medium uppercase">
                    Advocate
                  </div>
                  <div className="font-semibold text-blue-600">
                    {getAdvocateName(viewTarget.advocateId)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5 font-medium uppercase">
                    Rating
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i <= viewTarget.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
                        />
                      ))}
                    </div>
                    <span className="font-semibold text-slate-700">
                      {viewTarget.rating}/5
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5 font-medium uppercase">
                    Date
                  </div>
                  <div className="text-slate-700">
                    {new Date(viewTarget.createdAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-slate-400 mb-0.5 font-medium uppercase">
                    Status
                  </div>
                  <ReviewStatusBadge flagged={flaggedIds.has(viewTarget.id)} />
                </div>
              </div>

              {/* Review text */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="text-xs text-slate-400 mb-1.5 font-medium uppercase">
                  Review
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {viewTarget.text}
                </p>
              </div>

              {/* Advocate reply */}
              {viewTarget.advocateReply && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="text-xs text-blue-500 mb-1.5 font-medium uppercase">
                    Advocate's Reply
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {viewTarget.advocateReply}
                  </p>
                  {viewTarget.replyUpdatedAt && (
                    <p className="text-xs text-blue-400 mt-1.5">
                      Replied on{" "}
                      {new Date(viewTarget.replyUpdatedAt).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => viewTarget && toggleFlag(viewTarget.id)}
              className={
                flaggedIds.has(viewTarget?.id ?? "")
                  ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                  : ""
              }
              data-ocid="admin.reviews.view_flag_button"
            >
              <Flag
                className={`w-4 h-4 mr-1.5 ${flaggedIds.has(viewTarget?.id ?? "") ? "fill-amber-400 text-amber-600" : ""}`}
              />
              {flaggedIds.has(viewTarget?.id ?? "") ? "Unflag" : "Flag"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setViewTarget(null)}
              data-ocid="admin.reviews.view_close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent
          className="max-w-sm"
          data-ocid="admin.reviews.delete_dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="w-4 h-4" />
              Delete Review?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This will permanently remove the review from the platform and it
            will no longer appear on the advocate's profile.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="admin.reviews.delete_cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              data-ocid="admin.reviews.delete_confirm_button"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Reports Seed & User Reports Page ────────────────────────────────────────

function seedDemoReports() {
  if (localStorage.getItem("myadvocate_reports_seeded_v1")) return;
  const now = Date.now();
  const MS = 1000;
  const demoReports: UserReport[] = [
    {
      id: "rep_001",
      reporterId: "9900000001",
      reporterName: "Rohit Mehta",
      reportedId: "9800000001",
      reportedName: "Arjun Sharma",
      reportType: "User",
      reason: "Misconduct",
      note: "Unprofessional behavior in court proceedings.",
      status: "Pending",
      createdAt: new Date(now - 2 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_002",
      reporterId: "9900000002",
      reporterName: "Kavitha Subramaniam",
      reportedId: "9800000002",
      reportedName: "Priya Nair",
      reportType: "Post",
      reportedContentPreview: "Important reminder for matrimonial cases...",
      reason: "Inappropriate Content",
      status: "Ignored",
      createdAt: new Date(now - 5 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_003",
      reporterId: "9900000003",
      reporterName: "Suresh Iyer",
      reportedId: "9800000003",
      reportedName: "Ravi Krishnan",
      reportType: "Message",
      reportedContentPreview: "Chat conversation",
      reason: "Harassment",
      note: "Repeated unsolicited messages demanding fees upfront.",
      status: "Warned",
      createdAt: new Date(now - 8 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_004",
      reporterId: "9900000004",
      reporterName: "Anjali Rajput",
      reportedId: "9800000004",
      reportedName: "Meera Verma",
      reportType: "User",
      reason: "Fake Profile",
      note: "Bar Council number appears to be invalid.",
      status: "Suspended",
      createdAt: new Date(now - 12 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_005",
      reporterId: "9900000005",
      reporterName: "Deepika Pillai",
      reportedId: "9800000005",
      reportedName: "Sameer Bose",
      reportType: "Post",
      reportedContentPreview: "GST Council update: legal services...",
      reason: "Spam",
      status: "Pending",
      createdAt: new Date(now - 1 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_006",
      reporterId: "9900000006",
      reporterName: "Vishal Malhotra",
      reportedId: "9800000001",
      reportedName: "Arjun Sharma",
      reportType: "Message",
      reportedContentPreview: "Chat conversation",
      reason: "Harassment",
      status: "Pending",
      createdAt: new Date(now - 3 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_007",
      reporterId: "9900000007",
      reporterName: "Meenakshi Gopalan",
      reportedId: "9800000002",
      reportedName: "Priya Nair",
      reportType: "User",
      reason: "Other",
      note: "Soliciting clients outside of the platform.",
      status: "Pending",
      createdAt: new Date(now - 15 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_008",
      reporterId: "9900000008",
      reporterName: "Aditya Srinivasan",
      reportedId: "9800000003",
      reportedName: "Ravi Krishnan",
      reportType: "Post",
      reportedContentPreview: "NCLT Chennai Bench recently ruled...",
      reason: "Inappropriate Content",
      status: "Ignored",
      createdAt: new Date(now - 20 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_009",
      reporterId: "9900000009",
      reporterName: "Nandita Chakraborty",
      reportedId: "9800000004",
      reportedName: "Meera Verma",
      reportType: "User",
      reason: "Spam",
      status: "Banned",
      createdAt: new Date(now - 25 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_010",
      reporterId: "9900000010",
      reporterName: "Prakash Venkataraman",
      reportedId: "9800000005",
      reportedName: "Sameer Bose",
      reportType: "Message",
      reportedContentPreview: "Chat conversation",
      reason: "Misconduct",
      status: "Warned",
      createdAt: new Date(now - 30 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_011",
      reporterId: "9900000001",
      reporterName: "Rohit Mehta",
      reportedId: "9800000003",
      reportedName: "Ravi Krishnan",
      reportType: "Post",
      reportedContentPreview: "Excited to share that my article...",
      reason: "Spam",
      status: "Pending",
      createdAt: new Date(now - 4 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_012",
      reporterId: "9900000002",
      reporterName: "Kavitha Subramaniam",
      reportedId: "9800000001",
      reportedName: "Arjun Sharma",
      reportType: "User",
      reason: "Fake Profile",
      note: "Credentials not verifiable through Bar Council portal.",
      status: "Pending",
      createdAt: new Date(now - 6 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_013",
      reporterId: "9900000003",
      reporterName: "Suresh Iyer",
      reportedId: "9800000002",
      reportedName: "Priya Nair",
      reportType: "Message",
      reportedContentPreview: "Chat conversation",
      reason: "Other",
      status: "Ignored",
      createdAt: new Date(now - 40 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_014",
      reporterId: "9900000004",
      reporterName: "Anjali Rajput",
      reportedId: "9800000005",
      reportedName: "Sameer Bose",
      reportType: "Post",
      reportedContentPreview: "GST Council update...",
      reason: "Inappropriate Content",
      status: "Pending",
      createdAt: new Date(now - 50 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_015",
      reporterId: "9900000005",
      reporterName: "Deepika Pillai",
      reportedId: "9800000004",
      reportedName: "Meera Verma",
      reportType: "User",
      reason: "Harassment",
      note: "Multiple clients have complained about communication style.",
      status: "Suspended",
      createdAt: new Date(now - 55 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_016",
      reporterId: "9900000006",
      reporterName: "Vishal Malhotra",
      reportedId: "9800000001",
      reportedName: "Arjun Sharma",
      reportType: "Post",
      reportedContentPreview: "Landmark judgment today...",
      reason: "Spam",
      status: "Pending",
      createdAt: new Date(now - 58 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_017",
      reporterId: "9900000007",
      reporterName: "Meenakshi Gopalan",
      reportedId: "9800000003",
      reportedName: "Ravi Krishnan",
      reportType: "User",
      reason: "Misconduct",
      status: "Banned",
      createdAt: new Date(now - 60 * 24 * 60 * 60 * MS).toISOString(),
    },
    {
      id: "rep_018",
      reporterId: "9900000008",
      reporterName: "Aditya Srinivasan",
      reportedId: "9800000005",
      reportedName: "Sameer Bose",
      reportType: "Message",
      reportedContentPreview: "Chat conversation",
      reason: "Other",
      note: "Strange behavior during consultation.",
      status: "Pending",
      createdAt: new Date(now - 7 * 24 * 60 * 60 * MS).toISOString(),
    },
  ];

  const existing = safeParseArray<UserReport>(LS_REPORTS_KEY);
  const merged = [...existing];
  for (const r of demoReports) {
    if (!merged.some((e) => e.id === r.id)) merged.push(r);
  }
  localStorage.setItem(LS_REPORTS_KEY, JSON.stringify(merged));
  localStorage.setItem("myadvocate_reports_seeded_v1", "1");
}

function pushAccountNotification(userId: string, title: string, body: string) {
  const notifications =
    safeParseArray<Record<string, unknown>>(LS_NOTIFICATIONS_KEY);
  notifications.unshift({
    id: Date.now().toString(),
    userId,
    type: "verification",
    title,
    body,
    avatarInitials: "MA",
    avatarColor: "bg-red-600",
    relatedTab: "profile",
    timestamp: new Date().toISOString(),
    read: false,
  });
  localStorage.setItem(LS_NOTIFICATIONS_KEY, JSON.stringify(notifications));
}

function reportDateInRange(iso: string, range: string): boolean {
  if (range === "all") return true;
  const d = new Date(iso).getTime();
  const now = Date.now();
  if (range === "today") return d >= now - 86400 * 1000;
  if (range === "week") return d >= now - 7 * 86400 * 1000;
  if (range === "month") return d >= now - 30 * 86400 * 1000;
  return true;
}

function AdminUserReportsPage() {
  useEffect(() => {
    seedDemoReports();
  }, []);

  const [reports, setReports] = useState<UserReport[]>(() =>
    safeParseArray<UserReport>(LS_REPORTS_KEY).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    ),
  );

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "User" | "Post" | "Message"
  >("all");
  const [filterDate, setFilterDate] = useState("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "Pending" | "Ignored" | "Warned" | "Suspended" | "Banned"
  >("all");

  const [viewTarget, setViewTarget] = useState<UserReport | null>(null);
  const [warnTarget, setWarnTarget] = useState<UserReport | null>(null);
  const [warnMessage, setWarnMessage] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<UserReport | null>(null);
  const [banTarget, setBanTarget] = useState<UserReport | null>(null);

  function refreshReports() {
    setReports(
      safeParseArray<UserReport>(LS_REPORTS_KEY).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
  }

  function saveReport(updated: UserReport) {
    const all = safeParseArray<UserReport>(LS_REPORTS_KEY);
    const idx = all.findIndex((r) => r.id === updated.id);
    if (idx >= 0) all[idx] = updated;
    else all.push(updated);
    localStorage.setItem(LS_REPORTS_KEY, JSON.stringify(all));
  }

  function handleIgnore(report: UserReport) {
    const updated = { ...report, status: "Ignored" as const };
    saveReport(updated);
    refreshReports();
    toast.success("Report marked as ignored");
  }

  function openWarn(report: UserReport) {
    setWarnTarget(report);
    setWarnMessage("");
  }

  function confirmWarn() {
    if (!warnTarget) return;
    if (!warnMessage.trim()) {
      toast.error("Please enter a warning message");
      return;
    }
    const updated = { ...warnTarget, status: "Warned" as const };
    saveReport(updated);
    pushAccountNotification(
      warnTarget.reportedId,
      "Account Warning",
      warnMessage.trim(),
    );
    refreshReports();
    setWarnTarget(null);
    setWarnMessage("");
    toast.success(`Warning sent to ${warnTarget.reportedName}`);
  }

  function confirmSuspend() {
    if (!suspendTarget) return;
    const updated = { ...suspendTarget, status: "Suspended" as const };
    saveReport(updated);
    saveAccountStatus(suspendTarget.reportedId, "Suspended");
    pushAccountNotification(
      suspendTarget.reportedId,
      "Account Suspended",
      "Your account has been suspended due to a policy violation.",
    );
    refreshReports();
    setSuspendTarget(null);
    toast.success(`${suspendTarget.reportedName} has been suspended`);
  }

  function confirmBan() {
    if (!banTarget) return;
    const updated = { ...banTarget, status: "Banned" as const };
    saveReport(updated);
    saveAccountStatus(banTarget.reportedId, "Banned");
    pushAccountNotification(
      banTarget.reportedId,
      "Account Banned",
      "Your account has been permanently banned due to repeated policy violations.",
    );
    refreshReports();
    setBanTarget(null);
    toast.success(`${banTarget.reportedName} has been permanently banned`);
  }

  const filteredReports = useMemo(() => {
    const q = search.toLowerCase();
    return reports.filter((r) => {
      if (
        q &&
        !r.reporterName.toLowerCase().includes(q) &&
        !r.reportedName.toLowerCase().includes(q)
      )
        return false;
      if (filterType !== "all" && r.reportType !== filterType) return false;
      if (!reportDateInRange(r.createdAt, filterDate)) return false;
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      return true;
    });
  }, [reports, search, filterType, filterDate, filterStatus]);

  const summary = useMemo(
    () => ({
      total: reports.length,
      pending: reports.filter((r) => r.status === "Pending").length,
      ignored: reports.filter((r) => r.status === "Ignored").length,
      warned: reports.filter((r) => r.status === "Warned").length,
      suspendedBanned: reports.filter(
        (r) => r.status === "Suspended" || r.status === "Banned",
      ).length,
    }),
    [reports],
  );

  function StatusBadge({ status }: { status: UserReport["status"] }) {
    const map: Record<UserReport["status"], { cls: string; label: string }> = {
      Pending: {
        cls: "bg-blue-100 text-blue-700 border-blue-200",
        label: "Pending",
      },
      Ignored: {
        cls: "bg-gray-100 text-gray-500 border-gray-200",
        label: "Ignored",
      },
      Warned: {
        cls: "bg-amber-100 text-amber-700 border-amber-200",
        label: "Warned",
      },
      Suspended: {
        cls: "bg-orange-100 text-orange-700 border-orange-200",
        label: "Suspended",
      },
      Banned: {
        cls: "bg-red-100 text-red-700 border-red-200",
        label: "Banned",
      },
    };
    const { cls, label } = map[status];
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}
      >
        {label}
      </span>
    );
  }

  function TypeBadge({ type }: { type: UserReport["reportType"] }) {
    const map = {
      User: "bg-blue-50 text-blue-600 border-blue-200",
      Post: "bg-violet-50 text-violet-600 border-violet-200",
      Message: "bg-teal-50 text-teal-600 border-teal-200",
    };
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${map[type]}`}
      >
        {type}
      </span>
    );
  }

  return (
    <div>
      {/* Heading */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-700">User Reports</h2>
        <p className="text-sm text-slate-500">
          Review and take action on reports submitted by users
        </p>
      </div>

      {/* Summary cards */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6"
        data-ocid="admin.reports.summary_section"
      >
        {[
          {
            label: "Total Reports",
            value: summary.total,
            cls: "bg-blue-50",
            iconCls: "text-blue-600",
            ocid: "admin.reports.total_card",
          },
          {
            label: "Pending",
            value: summary.pending,
            cls: "bg-amber-50",
            iconCls: "text-amber-600",
            ocid: "admin.reports.pending_card",
          },
          {
            label: "Ignored",
            value: summary.ignored,
            cls: "bg-gray-50",
            iconCls: "text-gray-500",
            ocid: "admin.reports.ignored_card",
          },
          {
            label: "Warned",
            value: summary.warned,
            cls: "bg-orange-50",
            iconCls: "text-orange-600",
            ocid: "admin.reports.warned_card",
          },
          {
            label: "Suspended / Banned",
            value: summary.suspendedBanned,
            cls: "bg-red-50",
            iconCls: "text-red-600",
            ocid: "admin.reports.suspended_card",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3"
            data-ocid={card.ocid}
          >
            <div className={`p-2.5 rounded-xl ${card.cls}`}>
              <Flag className={`w-4 h-4 ${card.iconCls}`} />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">
                {card.value}
              </div>
              <div className="text-xs text-slate-500 leading-tight">
                {card.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search reporter or reported name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="admin.reports.search_input"
          />
        </div>
        <Select
          value={filterType}
          onValueChange={(v) => setFilterType(v as typeof filterType)}
        >
          <SelectTrigger
            className="w-36"
            data-ocid="admin.reports.type_filter.select"
          >
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="User">User</SelectItem>
            <SelectItem value="Post">Post</SelectItem>
            <SelectItem value="Message">Message</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterDate} onValueChange={setFilterDate}>
          <SelectTrigger
            className="w-36"
            data-ocid="admin.reports.date_filter.select"
          >
            <SelectValue placeholder="All Time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}
        >
          <SelectTrigger
            className="w-36"
            data-ocid="admin.reports.status_filter.select"
          >
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Ignored">Ignored</SelectItem>
            <SelectItem value="Warned">Warned</SelectItem>
            <SelectItem value="Suspended">Suspended</SelectItem>
            <SelectItem value="Banned">Banned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="text-xs text-slate-400 mb-3">
        Showing {filteredReports.length} of {reports.length} reports
      </div>

      {/* Table */}
      {filteredReports.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 text-slate-400"
          data-ocid="admin.reports.empty_state"
        >
          <Flag className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium text-sm">No reports match your filters</p>
          <p className="text-xs mt-1">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div
          className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          data-ocid="admin.reports.table"
        >
          {/* Header */}
          <div className="hidden lg:grid grid-cols-[1.3fr_1.3fr_auto_1.5fr_auto_auto_auto] gap-3 px-5 py-3 bg-slate-50 border-b border-gray-100 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            <div>Reporter</div>
            <div>Reported</div>
            <div>Type</div>
            <div>Reason</div>
            <div>Date</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {/* Rows */}
          <div>
            {filteredReports.map((report, idx) => (
              <div
                key={report.id}
                className="grid lg:grid-cols-[1.3fr_1.3fr_auto_1.5fr_auto_auto_auto] gap-3 px-5 py-4 border-b border-gray-50 last:border-0 items-center hover:bg-slate-50/70 transition-colors"
                data-ocid={`admin.reports.row.${idx + 1}`}
              >
                {/* Reporter */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700 shrink-0">
                    {report.reporterName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-slate-800 truncate">
                    {report.reporterName}
                  </span>
                </div>

                {/* Reported */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
                    {report.reportedName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-blue-600 truncate">
                    {report.reportedName}
                  </span>
                </div>

                {/* Type */}
                <div className="shrink-0">
                  <TypeBadge type={report.reportType} />
                </div>

                {/* Reason + note */}
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 font-medium">
                    {report.reason}
                  </p>
                  {report.note && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {report.note}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                  {new Date(report.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>

                {/* Status */}
                <div className="shrink-0">
                  <StatusBadge status={report.status} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewTarget(report)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                    title="View full report"
                    data-ocid={`admin.reports.view_button.${idx + 1}`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {report.status === "Pending" && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleIgnore(report)}
                        className="p-1.5 rounded-lg hover:bg-gray-50 text-slate-400 hover:text-gray-600 transition-colors"
                        title="Ignore report"
                        data-ocid={`admin.reports.ignore_button.${idx + 1}`}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openWarn(report)}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                        title="Warn user"
                        data-ocid={`admin.reports.warn_button.${idx + 1}`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSuspendTarget(report)}
                        className="p-1.5 rounded-lg hover:bg-orange-50 text-slate-400 hover:text-orange-600 transition-colors"
                        title="Suspend account"
                        data-ocid={`admin.reports.suspend_button.${idx + 1}`}
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBanTarget(report)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        title="Ban account"
                        data-ocid={`admin.reports.ban_button.${idx + 1}`}
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── View Full Report Modal ── */}
      <Dialog
        open={!!viewTarget}
        onOpenChange={(o) => !o && setViewTarget(null)}
      >
        <DialogContent
          className="max-w-lg"
          data-ocid="admin.reports.view_modal"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-red-500" />
              Full Report
            </DialogTitle>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-slate-400 mb-0.5 font-medium uppercase">
                    Reporter
                  </div>
                  <div className="font-semibold text-slate-800">
                    {viewTarget.reporterName}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {viewTarget.reporterId}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5 font-medium uppercase">
                    Reported
                  </div>
                  <div className="font-semibold text-blue-600">
                    {viewTarget.reportedName}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {viewTarget.reportedId}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5 font-medium uppercase">
                    Type
                  </div>
                  <TypeBadge type={viewTarget.reportType} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5 font-medium uppercase">
                    Status
                  </div>
                  <StatusBadge status={viewTarget.status} />
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5 font-medium uppercase">
                    Reason
                  </div>
                  <div className="font-medium text-slate-700">
                    {viewTarget.reason}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-0.5 font-medium uppercase">
                    Date
                  </div>
                  <div className="text-slate-700">
                    {new Date(viewTarget.createdAt).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      },
                    )}
                  </div>
                </div>
              </div>
              {viewTarget.note && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                  <div className="text-xs text-slate-400 mb-1 font-medium uppercase">
                    Additional Note
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {viewTarget.note}
                  </p>
                </div>
              )}
              {viewTarget.reportedContentPreview && (
                <div className="bg-muted/40 rounded-lg p-3 border">
                  <div className="text-xs text-slate-400 mb-1 font-medium uppercase">
                    Content Preview
                  </div>
                  <p className="text-slate-600 text-xs italic">
                    "{viewTarget.reportedContentPreview}"
                  </p>
                </div>
              )}

              {/* Actions inside modal */}
              {viewTarget.status === "Pending" && (
                <div className="flex gap-2 flex-wrap pt-1 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleIgnore(viewTarget);
                      setViewTarget(null);
                    }}
                    data-ocid="admin.reports.view_ignore_button"
                  >
                    <XCircle className="w-3.5 h-3.5 mr-1" />
                    Ignore
                  </Button>
                  <Button
                    size="sm"
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => {
                      setViewTarget(null);
                      openWarn(viewTarget);
                    }}
                    data-ocid="admin.reports.view_warn_button"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    Warn
                  </Button>
                  <Button
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => {
                      setViewTarget(null);
                      setSuspendTarget(viewTarget);
                    }}
                    data-ocid="admin.reports.view_suspend_button"
                  >
                    <UserX className="w-3.5 h-3.5 mr-1" />
                    Suspend
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setViewTarget(null);
                      setBanTarget(viewTarget);
                    }}
                    data-ocid="admin.reports.view_ban_button"
                  >
                    <Ban className="w-3.5 h-3.5 mr-1" />
                    Ban
                  </Button>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewTarget(null)}
              data-ocid="admin.reports.view_close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Warn Dialog ── */}
      <Dialog
        open={!!warnTarget}
        onOpenChange={(o) => !o && setWarnTarget(null)}
      >
        <DialogContent
          className="max-w-md"
          data-ocid="admin.reports.warn_dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              Warn User
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Enter a custom warning message for{" "}
            <strong>{warnTarget?.reportedName}</strong>. This message will be
            sent as an in-app notification.
          </p>
          <Textarea
            placeholder="Enter warning message..."
            value={warnMessage}
            onChange={(e) => setWarnMessage(e.target.value)}
            rows={3}
            data-ocid="admin.reports.warn_textarea"
          />
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setWarnTarget(null)}
              data-ocid="admin.reports.warn_cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={confirmWarn}
              data-ocid="admin.reports.warn_confirm_button"
            >
              Send Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Suspend Dialog ── */}
      <Dialog
        open={!!suspendTarget}
        onOpenChange={(o) => !o && setSuspendTarget(null)}
      >
        <DialogContent
          className="max-w-sm"
          data-ocid="admin.reports.suspend_dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-700">
              <UserX className="w-5 h-5" />
              Suspend Account
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to suspend{" "}
            <strong>{suspendTarget?.reportedName}</strong>? They will lose
            access until reactivated.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSuspendTarget(null)}
              data-ocid="admin.reports.suspend_cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={confirmSuspend}
              data-ocid="admin.reports.suspend_confirm_button"
            >
              Suspend Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Ban Dialog ── */}
      <Dialog open={!!banTarget} onOpenChange={(o) => !o && setBanTarget(null)}>
        <DialogContent
          className="max-w-sm"
          data-ocid="admin.reports.ban_dialog"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Ban className="w-5 h-5" />
              Ban Account
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently ban{" "}
            <strong>{banTarget?.reportedName}</strong>? This is a stronger
            action than suspension.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setBanTarget(null)}
              data-ocid="admin.reports.ban_cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBan}
              data-ocid="admin.reports.ban_confirm_button"
            >
              Ban Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Analytics Page (formerly Reports) ────────────────────────────────────────
const CHART_COLORS = [
  "#2563eb",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

function AdminAnalyticsPage() {
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
        <h2 className="text-lg font-semibold text-slate-700">Analytics</h2>
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
  const [contentStatus, setContentStatus] = useState<
    Record<string, { hidden?: boolean; commentsDisabled?: boolean }>
  >(() => getContentStatus());
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "7days" | "30days"
  >("all");
  const [activityFilter, setActivityFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "visible" | "hidden" | "comments_disabled"
  >("all");
  const [viewPost, setViewPost] = useState<UserPost | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  function refreshStatus() {
    setContentStatus(getContentStatus());
  }

  function handleHideToggle(post: UserPost) {
    const current = contentStatus[post.id]?.hidden ?? false;
    saveContentStatus(post.id, { hidden: !current });
    if (!current) {
      pushContentNotification(post.authorMobile, "hidden");
      toast.success("Post hidden from feed");
    } else {
      toast.success("Post restored to feed");
    }
    refreshStatus();
  }

  function handleCommentsToggle(post: UserPost) {
    const current = contentStatus[post.id]?.commentsDisabled ?? false;
    saveContentStatus(post.id, { commentsDisabled: !current });
    toast.success(
      current ? "Comments re-enabled" : "Comments disabled for post",
    );
    refreshStatus();
  }

  function handleDelete(id: string) {
    const post = posts.find((p) => p.id === id);
    const all = safeParseArray<UserPost>(LS_FEED_POSTS_KEY);
    localStorage.setItem(
      LS_FEED_POSTS_KEY,
      JSON.stringify(all.filter((p) => p.id !== id)),
    );
    // Remove from content status
    const cs = getContentStatus();
    delete cs[id];
    localStorage.setItem(LS_CONTENT_STATUS_KEY, JSON.stringify(cs));
    pushContentNotification(post?.authorMobile, "deleted");
    setPosts((prev) => prev.filter((p) => p.id !== id));
    refreshStatus();
    setDeleteTarget(null);
    toast.success("Post deleted");
  }

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.authorName.toLowerCase().includes(q));
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      result = result.filter((p) => {
        const age = now - new Date(p.timestamp).getTime();
        if (dateFilter === "today") return age < dayMs;
        if (dateFilter === "7days") return age < 7 * dayMs;
        if (dateFilter === "30days") return age < 30 * dayMs;
        return true;
      });
    }

    // Activity filter
    if (activityFilter !== "all") {
      result = result.filter((p) => {
        const total = p.likes + p.comments;
        if (activityFilter === "low") return total <= 5;
        if (activityFilter === "medium") return total >= 6 && total <= 20;
        if (activityFilter === "high") return total >= 21;
        return true;
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => {
        const cs = contentStatus[p.id];
        if (statusFilter === "hidden") return cs?.hidden === true;
        if (statusFilter === "comments_disabled")
          return cs?.commentsDisabled === true && !cs?.hidden;
        if (statusFilter === "visible")
          return !cs?.hidden && !cs?.commentsDisabled;
        return true;
      });
    }

    return result;
  }, [posts, search, dateFilter, activityFilter, statusFilter, contentStatus]);

  // Summary stats
  const totalPosts = posts.length;
  const hiddenCount = posts.filter((p) => contentStatus[p.id]?.hidden).length;
  const commentsDisabledCount = posts.filter(
    (p) =>
      contentStatus[p.id]?.commentsDisabled && !contentStatus[p.id]?.hidden,
  ).length;
  const visibleCount = totalPosts - hiddenCount;

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-700">
          Platform Content
        </h2>
        <p className="text-sm text-slate-500">
          Manage and moderate user-created posts
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Total Posts",
            value: totalPosts,
            color: "text-slate-700",
            bg: "bg-slate-50",
            icon: <Newspaper className="w-5 h-5 text-slate-400" />,
          },
          {
            label: "Visible",
            value: visibleCount,
            color: "text-green-700",
            bg: "bg-green-50",
            icon: <Eye className="w-5 h-5 text-green-500" />,
          },
          {
            label: "Hidden",
            value: hiddenCount,
            color: "text-slate-600",
            bg: "bg-gray-50",
            icon: <EyeOff className="w-5 h-5 text-slate-400" />,
          },
          {
            label: "Comments Off",
            value: commentsDisabledCount,
            color: "text-amber-700",
            bg: "bg-amber-50",
            icon: <MessageCircleOff className="w-5 h-5 text-amber-500" />,
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`${card.bg} rounded-xl p-4 border border-gray-100 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              {card.icon}
            </div>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            data-ocid="admin.content.search_input"
          />
        </div>
        <Select
          value={dateFilter}
          onValueChange={(v) =>
            setDateFilter(v as "all" | "today" | "7days" | "30days")
          }
        >
          <SelectTrigger className="w-40" data-ocid="admin.content.date_select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={activityFilter}
          onValueChange={(v) =>
            setActivityFilter(v as "all" | "low" | "medium" | "high")
          }
        >
          <SelectTrigger
            className="w-44"
            data-ocid="admin.content.activity_select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="low">Low (0–5)</SelectItem>
            <SelectItem value="medium">Medium (6–20)</SelectItem>
            <SelectItem value="high">High (21+)</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(
              v as "all" | "visible" | "hidden" | "comments_disabled",
            )
          }
        >
          <SelectTrigger
            className="w-44"
            data-ocid="admin.content.status_select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="visible">Visible</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
            <SelectItem value="comments_disabled">Comments Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Post List */}
      {filteredPosts.length === 0 ? (
        <div
          data-ocid="admin.content.empty_state"
          className="text-center py-16 text-slate-400"
        >
          <Newspaper className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>
            {search ||
            dateFilter !== "all" ||
            activityFilter !== "all" ||
            statusFilter !== "all"
              ? "No posts match your filters"
              : "No posts yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post, idx) => {
            const cs = contentStatus[post.id];
            const isHidden = cs?.hidden === true;
            const isCommentsDisabled = cs?.commentsDisabled === true;
            const totalEngagement = post.likes + post.comments;

            return (
              <div
                key={post.id}
                className={`bg-white rounded-xl border shadow-sm p-4 transition-all ${
                  isHidden ? "border-gray-200 opacity-75" : "border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Author Avatar */}
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                    {post.authorName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top row: name + date + status badge */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">
                          {post.authorName}
                        </span>
                        {isHidden ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600 border-gray-200"
                          >
                            Hidden
                          </Badge>
                        ) : isCommentsDisabled ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-amber-100 text-amber-700 border-amber-200"
                          >
                            Comments Disabled
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 border-green-200"
                          >
                            Visible
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(post.timestamp).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Content preview */}
                    <p className="text-sm text-slate-600 mt-1.5 line-clamp-2">
                      {post.text}
                    </p>

                    {/* Engagement */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" /> {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" /> {post.comments}
                      </span>
                      <span className="text-slate-300">
                        Engagement: {totalEngagement}
                        {totalEngagement <= 5
                          ? " (Low)"
                          : totalEngagement <= 20
                            ? " (Medium)"
                            : " (High)"}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-3 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 text-slate-600"
                        onClick={() => setViewPost(post)}
                        data-ocid={`admin.content.view_button.${idx + 1}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-7 text-xs gap-1.5 ${
                          isHidden
                            ? "text-blue-600 border-blue-200 hover:bg-blue-50"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                        onClick={() => handleHideToggle(post)}
                        data-ocid={`admin.content.hide_button.${idx + 1}`}
                      >
                        {isHidden ? (
                          <>
                            <Eye className="w-3.5 h-3.5" /> Unhide
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> Hide
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-7 text-xs gap-1.5 ${
                          isCommentsDisabled
                            ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                            : "text-slate-600 hover:text-slate-800"
                        }`}
                        onClick={() => handleCommentsToggle(post)}
                        data-ocid={`admin.content.comments_button.${idx + 1}`}
                      >
                        {isCommentsDisabled ? (
                          <>
                            <MessageCircle className="w-3.5 h-3.5" /> Enable
                            Comments
                          </>
                        ) : (
                          <>
                            <MessageCircleOff className="w-3.5 h-3.5" /> Disable
                            Comments
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1.5 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setDeleteTarget(post.id)}
                        data-ocid={`admin.content.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Post Modal */}
      <Dialog open={!!viewPost} onOpenChange={(o) => !o && setViewPost(null)}>
        <DialogContent
          className="max-w-lg max-h-[80vh] overflow-y-auto"
          data-ocid="admin.content.view_modal"
        >
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {viewPost && (
            <div className="space-y-4">
              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                  {viewPost.authorName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {viewPost.authorName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(viewPost.timestamp).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="ml-auto">
                  {contentStatus[viewPost.id]?.hidden ? (
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-600"
                    >
                      Hidden
                    </Badge>
                  ) : contentStatus[viewPost.id]?.commentsDisabled ? (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-700"
                    >
                      Comments Disabled
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700"
                    >
                      Visible
                    </Badge>
                  )}
                </div>
              </div>

              {/* Post text */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {viewPost.text}
                </p>
              </div>

              {/* Image if present */}
              {viewPost.imageDataUrl && (
                <div className="rounded-xl overflow-hidden">
                  <img
                    src={viewPost.imageDataUrl}
                    alt="Post attachment"
                    className="w-full object-cover max-h-64"
                  />
                </div>
              )}

              {/* Engagement stats */}
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-red-400" />
                  {viewPost.likes} likes
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                  {viewPost.comments} comments
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPost(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <DialogContent
          className="max-w-sm"
          data-ocid="admin.content.delete_dialog"
        >
          <DialogHeader>
            <DialogTitle>Delete Post?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            This will permanently remove the post and notify the author. This
            cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              data-ocid="admin.content.cancel_delete_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              data-ocid="admin.content.confirm_delete_button"
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
  const [ps, setPs] = useState<PlatformSettings>(() => getPlatformSettings());
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const storageUsage = useMemo(() => getLocalStorageUsage(), []);
  const lastSync = useMemo(() => new Date().toLocaleString("en-IN"), []);
  const logoInputRef = useRef<HTMLInputElement>(null);

  function saveAdminSettings(updated: typeof adminSettings) {
    setAdminSettings(updated);
    localStorage.setItem(LS_ADMIN_SETTINGS_KEY, JSON.stringify(updated));
    toast.success("Settings saved");
  }

  function savePlatformSettings(newPs: PlatformSettings) {
    setPs(newPs);
    localStorage.setItem(LS_PLATFORM_SETTINGS_KEY, JSON.stringify(newPs));
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      savePlatformSettings({ ...ps, customLogoBase64: base64 });
      toast.success("Logo updated");
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
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
        <h2 className="text-lg font-semibold text-slate-700">
          Platform Settings
        </h2>
        <p className="text-sm text-slate-500">
          Configure platform identity, announcements, and access controls
        </p>
      </div>

      <div className="space-y-5 max-w-2xl">
        {/* ── Section 1: Platform Identity ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            Platform Identity
          </h3>
          <div className="space-y-4">
            {/* Platform Name */}
            <div>
              <Label
                htmlFor="platform-name"
                className="text-sm font-medium text-slate-700 mb-1.5 block"
              >
                Platform Name
              </Label>
              <input
                id="platform-name"
                data-ocid="admin.settings.platform_name.input"
                type="text"
                placeholder="My Advocate"
                value={ps.platformName}
                onChange={(e) => setPs({ ...ps, platformName: e.target.value })}
                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
              />
            </div>

            {/* Platform Description */}
            <div>
              <Label
                htmlFor="platform-desc"
                className="text-sm font-medium text-slate-700 mb-1.5 block"
              >
                Platform Description
              </Label>
              <Textarea
                id="platform-desc"
                data-ocid="admin.settings.platform_desc.textarea"
                placeholder="India's Professional Legal Network"
                value={ps.platformDescription}
                onChange={(e) =>
                  setPs({ ...ps, platformDescription: e.target.value })
                }
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* Platform Logo */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Platform Logo
              </Label>
              <p className="text-xs text-slate-500 mb-2">
                Upload to replace the header logo (stored as base64)
              </p>
              {ps.customLogoBase64 && (
                <div className="mb-3 flex items-center gap-3">
                  <img
                    src={ps.customLogoBase64}
                    alt="Current platform logo"
                    style={{ height: 50, width: "auto", maxWidth: 200 }}
                    className="object-contain border border-gray-100 rounded-lg p-1"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      savePlatformSettings({ ...ps, customLogoBase64: "" });
                      toast.success("Logo removed");
                    }}
                    data-ocid="admin.settings.remove_logo.button"
                  >
                    Remove Logo
                  </Button>
                </div>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => logoInputRef.current?.click()}
                data-ocid="admin.settings.upload_logo.button"
              >
                {ps.customLogoBase64 ? "Replace Logo" : "Upload Logo"}
              </Button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>

            {/* Save Identity */}
            <Button
              type="button"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                savePlatformSettings(ps);
                toast.success("Platform identity saved");
              }}
              data-ocid="admin.settings.save_identity.button"
            >
              Save Identity
            </Button>
          </div>
        </div>

        {/* ── Section 2: Announcement Banner ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-amber-500" />
            Announcement Banner
          </h3>
          <div className="space-y-4">
            {/* Enabled toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-700">
                  Show banner in main app
                </div>
                <div className="text-xs text-slate-500">
                  Displays below the header on every page load
                </div>
              </div>
              <Switch
                data-ocid="admin.settings.announcement_enabled.switch"
                checked={ps.announcementEnabled}
                onCheckedChange={(v) =>
                  setPs({ ...ps, announcementEnabled: v })
                }
              />
            </div>

            {/* Banner text & color — visible only when enabled */}
            {ps.announcementEnabled && (
              <div className="space-y-3 pt-1">
                <div>
                  <Label
                    htmlFor="announcement-text"
                    className="text-sm font-medium text-slate-700 mb-1.5 block"
                  >
                    Announcement Text
                  </Label>
                  <Textarea
                    id="announcement-text"
                    data-ocid="admin.settings.announcement_text.textarea"
                    placeholder="Enter announcement text..."
                    value={ps.announcementText}
                    onChange={(e) =>
                      setPs({ ...ps, announcementText: e.target.value })
                    }
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>

                {/* Color selector */}
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Banner Color
                  </Label>
                  <div className="flex gap-2">
                    {(["info", "warning", "success"] as const).map((color) => {
                      const labels = {
                        info: "Info (Blue)",
                        warning: "Warning (Amber)",
                        success: "Success (Green)",
                      };
                      const styles = {
                        info:
                          ps.announcementColor === "info"
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
                        warning:
                          ps.announcementColor === "warning"
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
                        success:
                          ps.announcementColor === "success"
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
                      };
                      return (
                        <button
                          key={color}
                          type="button"
                          data-ocid={`admin.settings.banner_color_${color}.button`}
                          onClick={() =>
                            setPs({ ...ps, announcementColor: color })
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${styles[color]}`}
                        >
                          {labels[color]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Save Banner */}
            <Button
              type="button"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                savePlatformSettings(ps);
                toast.success("Banner settings saved");
              }}
              data-ocid="admin.settings.save_banner.button"
            >
              Save Banner
            </Button>
          </div>
        </div>

        {/* ── Section 3: Access Controls ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-500" />
            Access Controls
          </h3>
          <div className="space-y-4">
            {/* Disable registrations */}
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={`text-sm font-medium ${ps.registrationsDisabled ? "text-red-600" : "text-slate-700"}`}
                >
                  Disable New Registrations
                </div>
                <div className="text-xs text-slate-500">
                  {ps.registrationsDisabled
                    ? "New users cannot register"
                    : "New user registrations are open"}
                </div>
              </div>
              <Switch
                data-ocid="admin.settings.disable_registrations.switch"
                checked={ps.registrationsDisabled}
                onCheckedChange={(v) => {
                  const newPs = { ...ps, registrationsDisabled: v };
                  savePlatformSettings(newPs);
                  toast.success(
                    v ? "Registrations disabled" : "Registrations enabled",
                  );
                }}
              />
            </div>

            <div className="h-px bg-gray-100" />

            {/* Disable posting */}
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={`text-sm font-medium ${ps.postingDisabled ? "text-red-600" : "text-slate-700"}`}
                >
                  Disable Feed Posting
                </div>
                <div className="text-xs text-slate-500">
                  {ps.postingDisabled
                    ? "Advocates cannot create new posts"
                    : "Feed posting is open to advocates"}
                </div>
              </div>
              <Switch
                data-ocid="admin.settings.disable_posting.switch"
                checked={ps.postingDisabled}
                onCheckedChange={(v) => {
                  const newPs = { ...ps, postingDisabled: v };
                  savePlatformSettings(newPs);
                  toast.success(v ? "Posting disabled" : "Posting enabled");
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Section 4: Admin Credentials ── */}
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

        {/* ── Section 5: Platform Config (Demo Mode + Auto-Approve) ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-500" />
            Demo Configuration
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
                data-ocid="admin.settings.auto_approve.switch"
                checked={adminSettings.autoApprove}
                onCheckedChange={(v) =>
                  saveAdminSettings({ ...adminSettings, autoApprove: v })
                }
              />
            </div>
          </div>
        </div>

        {/* ── Section 6: Platform Stats ── */}
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

        {/* ── Section 7: Danger Zone ── */}
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
              data-ocid="admin.settings.clear_data.button"
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
              data-ocid="admin.settings.clear_data.cancel_button"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearDemoData}
              data-ocid="admin.settings.clear_data.confirm_button"
            >
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
  reports: "User Reports",
  analytics: "Analytics",
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
            {activePage === "reports" && <AdminUserReportsPage />}
            {activePage === "analytics" && <AdminAnalyticsPage />}
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
