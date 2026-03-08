import { AppShell } from "@/components/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CalendarDays,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Download,
  Eye,
  EyeOff,
  File,
  FileText,
  Filter,
  ImageIcon,
  Lock,
  Mail,
  MessageCircle,
  Newspaper,
  Paperclip,
  Pencil,
  Phone,
  Plus,
  Scale,
  Search,
  Send,
  Share2,
  ThumbsUp,
  Trash2,
  UploadCloud,
  User,
  Users,
  X,
  ZoomIn,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
// react-easy-crop replaced with custom canvas cropper below
import { toast } from "sonner";

type Screen =
  | "splash"
  | "login"
  | "forgot-password"
  | "role-selection"
  | "register-advocate"
  | "register-client"
  | "registration-success"
  | "profile-setup"
  | "dashboard"
  | "my-profile"
  | "my-cases"
  | "messages"
  | "chat"
  | "my-clients"
  | "client-profile"
  | "advocate-public-profile"
  | "hearings"
  | "calendar"
  | "find-advocates"
  | "advocate-discovery-profile"
  | "legal-feed";
type LoginTab = "password" | "otp";
type OtpStep = "phone" | "verify";
type OtpPhase = "mobile" | "verify" | "form";

// ─── localStorage Helpers ─────────────────────────────────────────────────────

interface StoredUser {
  mobile: string;
  email: string;
  password: string;
  role: "advocate" | "client";
}
const LS_KEY = "myadvocate_users";

function loadUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUser(user: StoredUser) {
  const users = loadUsers();
  users.push(user);
  localStorage.setItem(LS_KEY, JSON.stringify(users));
}

function findUser(identifier: string, password: string): StoredUser | null {
  const users = loadUsers();
  return (
    users.find(
      (u) =>
        (u.mobile === identifier || u.email === identifier.toLowerCase()) &&
        u.password === password,
    ) ?? null
  );
}

function findUserByMobile(mobile: string): StoredUser | null {
  return loadUsers().find((u) => u.mobile === mobile) ?? null;
}

function mobileExists(mobile: string): boolean {
  return loadUsers().some((u) => u.mobile === mobile);
}

function emailExists(email: string): boolean {
  return loadUsers().some((u) => u.email === email.toLowerCase());
}

function updateUserPassword(mobile: string, newPassword: string) {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.mobile === mobile);
  if (idx !== -1) {
    users[idx].password = newPassword;
    localStorage.setItem(LS_KEY, JSON.stringify(users));
  }
}

function deleteUserAccount(mobile: string, role: "advocate" | "client") {
  // Remove from users
  const users = loadUsers().filter((u) => u.mobile !== mobile);
  localStorage.setItem(LS_KEY, JSON.stringify(users));
  // Remove profile
  const profiles: StoredProfile[] = JSON.parse(
    localStorage.getItem(LS_PROFILES_KEY) || "[]",
  ).filter((p: StoredProfile) => p.mobile !== mobile);
  localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(profiles));
  // Remove advocate or client data
  if (role === "advocate") {
    const advData = loadAllAdvocateData().filter((a) => a.userId !== mobile);
    localStorage.setItem(LS_ADVOCATE_DATA_KEY, JSON.stringify(advData));
  } else {
    const clientData = loadAllClientData().filter((c) => c.userId !== mobile);
    localStorage.setItem(LS_CLIENT_DATA_KEY, JSON.stringify(clientData));
  }
}

// ─── Pending Profile Data (carries registration fields to pre-fill setup) ────

interface PendingProfileData {
  mobile: string;
  email: string;
  fullName: string;
  state: string;
  city: string;
  role: "advocate" | "client";
  // advocate-only
  practiceArea?: string;
  yearsExp?: string;
  courtName?: string;
  barCouncilNumber?: string;
}

// ─── Profile Storage ──────────────────────────────────────────────────────────

const LS_PROFILES_KEY = "myadvocate_profiles";

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

function profileExists(mobile: string): boolean {
  try {
    const profiles: StoredProfile[] = JSON.parse(
      localStorage.getItem(LS_PROFILES_KEY) || "[]",
    );
    return profiles.some((p) => p.mobile === mobile);
  } catch {
    return false;
  }
}

function saveProfile(profile: StoredProfile) {
  try {
    const profiles: StoredProfile[] = JSON.parse(
      localStorage.getItem(LS_PROFILES_KEY) || "[]",
    );
    const idx = profiles.findIndex((p) => p.mobile === profile.mobile);
    if (idx !== -1) {
      profiles[idx] = profile;
    } else {
      profiles.push(profile);
    }
    localStorage.setItem(LS_PROFILES_KEY, JSON.stringify(profiles));
  } catch {
    // ignore
  }
}

function loadProfile(mobile: string): StoredProfile | null {
  try {
    const profiles: StoredProfile[] = JSON.parse(
      localStorage.getItem(LS_PROFILES_KEY) || "[]",
    );
    return profiles.find((p) => p.mobile === mobile) ?? null;
  } catch {
    return null;
  }
}

// ─── Advocate & Client Data (referral system) ────────────────────────────────

interface AdvocateData {
  userId: string; // mobile number
  name: string;
  referralCode: string;
  profileData: Record<string, unknown>;
}

interface ClientData {
  userId: string; // mobile number
  name: string;
  linkedAdvocateId: string | null; // referral code of advocate, or null
}

const LS_ADVOCATE_DATA_KEY = "myadvocate_advocate_data";
const LS_CLIENT_DATA_KEY = "myadvocate_client_data";

function loadAllAdvocateData(): AdvocateData[] {
  try {
    return JSON.parse(localStorage.getItem(LS_ADVOCATE_DATA_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveAdvocateData(data: AdvocateData) {
  const all = loadAllAdvocateData();
  const idx = all.findIndex((a) => a.userId === data.userId);
  if (idx !== -1) {
    all[idx] = data;
  } else {
    all.push(data);
  }
  localStorage.setItem(LS_ADVOCATE_DATA_KEY, JSON.stringify(all));
}

function findAdvocateByCode(code: string): AdvocateData | null {
  return (
    loadAllAdvocateData().find(
      (a) => a.referralCode.toUpperCase() === code.toUpperCase(),
    ) ?? null
  );
}

function loadAllClientData(): ClientData[] {
  try {
    return JSON.parse(localStorage.getItem(LS_CLIENT_DATA_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveClientData(data: ClientData) {
  const all = loadAllClientData();
  const idx = all.findIndex((c) => c.userId === data.userId);
  if (idx !== -1) {
    all[idx] = data;
  } else {
    all.push(data);
  }
  localStorage.setItem(LS_CLIENT_DATA_KEY, JSON.stringify(all));
}

function getClientsForAdvocate(referralCode: string): ClientData[] {
  return loadAllClientData().filter(
    (c) =>
      c.linkedAdvocateId &&
      c.linkedAdvocateId.toUpperCase() === referralCode.toUpperCase(),
  );
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const existing = loadAllAdvocateData().map((a) => a.referralCode);
  let code = "";
  let attempts = 0;
  do {
    code = `ADV-${Array.from({ length: 5 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("")}`;
    attempts++;
  } while (existing.includes(code) && attempts < 100);
  return code;
}

// ─── Sample Advocate Seeding ───────────────────────────────────────────────────
const LS_SEEDED_KEY = "myadvocate_seeded_v1";

const SAMPLE_ADVOCATES: Array<{
  user: StoredUser;
  profile: StoredProfile;
  advocateData: AdvocateData;
}> = [
  {
    user: {
      mobile: "9800000001",
      email: "arjun.sharma@demo.com",
      password: "demo1234",
      role: "advocate",
    },
    profile: {
      mobile: "9800000001",
      fullName: "Arjun Sharma",
      practiceArea: "Criminal Law",
      yearsExp: "12",
      courtName: "Delhi High Court",
      barCouncilNumber: "D/1234/2012",
      state: "Delhi",
      city: "New Delhi",
      bio: "Senior criminal defense lawyer with 12 years at Delhi High Court. Specialist in bail matters, sessions trials, and appeals.",
      contactEmail: "arjun.sharma@demo.com",
    },
    advocateData: {
      userId: "9800000001",
      name: "Arjun Sharma",
      referralCode: "ADV-DEMO1",
      profileData: {},
    },
  },
  {
    user: {
      mobile: "9800000002",
      email: "priya.nair@demo.com",
      password: "demo1234",
      role: "advocate",
    },
    profile: {
      mobile: "9800000002",
      fullName: "Priya Nair",
      practiceArea: "Family Law",
      yearsExp: "8",
      courtName: "Bombay High Court",
      barCouncilNumber: "MH/4521/2016",
      state: "Maharashtra",
      city: "Mumbai",
      bio: "Family law specialist handling matrimonial disputes, child custody, and succession matters.",
      contactEmail: "priya.nair@demo.com",
    },
    advocateData: {
      userId: "9800000002",
      name: "Priya Nair",
      referralCode: "ADV-DEMO2",
      profileData: {},
    },
  },
  {
    user: {
      mobile: "9800000003",
      email: "ravi.krishnan@demo.com",
      password: "demo1234",
      role: "advocate",
    },
    profile: {
      mobile: "9800000003",
      fullName: "Ravi Krishnan",
      practiceArea: "Corporate Law",
      yearsExp: "15",
      courtName: "Madras High Court",
      barCouncilNumber: "TN/6789/2009",
      state: "Tamil Nadu",
      city: "Chennai",
      bio: "Corporate and commercial litigation expert. Advises startups and listed companies on regulatory and contract disputes.",
      contactEmail: "ravi.krishnan@demo.com",
    },
    advocateData: {
      userId: "9800000003",
      name: "Ravi Krishnan",
      referralCode: "ADV-DEMO3",
      profileData: {},
    },
  },
  {
    user: {
      mobile: "9800000004",
      email: "meera.verma@demo.com",
      password: "demo1234",
      role: "advocate",
    },
    profile: {
      mobile: "9800000004",
      fullName: "Meera Verma",
      practiceArea: "Property Law",
      yearsExp: "6",
      courtName: "Allahabad High Court",
      barCouncilNumber: "UP/3310/2018",
      state: "Uttar Pradesh",
      city: "Lucknow",
      bio: "Property and real estate lawyer handling title disputes, lease agreements, and RERA matters.",
      contactEmail: "meera.verma@demo.com",
    },
    advocateData: {
      userId: "9800000004",
      name: "Meera Verma",
      referralCode: "ADV-DEMO4",
      profileData: {},
    },
  },
  {
    user: {
      mobile: "9800000005",
      email: "sameer.bose@demo.com",
      password: "demo1234",
      role: "advocate",
    },
    profile: {
      mobile: "9800000005",
      fullName: "Sameer Bose",
      practiceArea: "Tax Law",
      yearsExp: "10",
      courtName: "Calcutta High Court",
      barCouncilNumber: "WB/2201/2014",
      state: "West Bengal",
      city: "Kolkata",
      bio: "Tax litigation attorney with expertise in GST disputes, income tax appeals, and customs matters.",
      contactEmail: "sameer.bose@demo.com",
    },
    advocateData: {
      userId: "9800000005",
      name: "Sameer Bose",
      referralCode: "ADV-DEMO5",
      profileData: {},
    },
  },
];

function seedSampleAdvocates() {
  if (localStorage.getItem(LS_SEEDED_KEY)) return;
  for (const { user, profile, advocateData } of SAMPLE_ADVOCATES) {
    if (!mobileExists(user.mobile)) {
      saveUser(user);
      saveProfile(profile);
      saveAdvocateData(advocateData);
    }
  }
  localStorage.setItem(LS_SEEDED_KEY, "1");
}

// ─── Legal Feed Demo Data ─────────────────────────────────────────────────────

interface DemoPost {
  id: string;
  authorName: string;
  authorInitials: string;
  authorAvatarColor: string;
  practiceArea: string;
  text: string;
  hasImage: boolean;
  timeAgo: string;
  likes: number;
  comments: number;
  shares: number;
}

interface UserPost {
  id: string;
  authorName: string;
  authorInitials: string;
  authorAvatarColor: string;
  authorPhoto?: string;
  practiceArea: string;
  text: string;
  imageDataUrl?: string;
  timestamp: string; // ISO string
  likes: number;
  comments: number;
  shares: number;
}

const LS_FEED_POSTS_KEY = "myadvocate_feed_posts";

function loadUserPosts(): UserPost[] {
  try {
    return JSON.parse(localStorage.getItem(LS_FEED_POSTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUserPosts(posts: UserPost[]) {
  try {
    localStorage.setItem(LS_FEED_POSTS_KEY, JSON.stringify(posts));
  } catch {
    // If quota exceeded, try without images
    try {
      const withoutImages = posts.map(({ imageDataUrl: _, ...rest }) => rest);
      localStorage.setItem(LS_FEED_POSTS_KEY, JSON.stringify(withoutImages));
    } catch {
      // ignore
    }
  }
}

function formatTimeAgo(isoStr: string): string {
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
  return new Date(isoStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const DEMO_POSTS: DemoPost[] = [
  {
    id: "post-1",
    authorName: "Arjun Sharma",
    authorInitials: "AS",
    authorAvatarColor: "bg-blue-600",
    practiceArea: "Criminal Law",
    text: "Landmark judgment today at Delhi High Court: The bench clarified that bail cannot be denied solely on the basis of severity of the alleged offence. The court must examine flight risk, tampering of evidence, and likelihood of repetition independently. This reaffirms the fundamental principle that bail is the rule and jail is the exception. #CriminalLaw #BailJurisprudence",
    hasImage: false,
    timeAgo: "2 hours ago",
    likes: 87,
    comments: 14,
    shares: 23,
  },
  {
    id: "post-2",
    authorName: "Priya Nair",
    authorInitials: "PN",
    authorAvatarColor: "bg-rose-600",
    practiceArea: "Family Law",
    text: "Important reminder for matrimonial cases: Under Section 125 CrPC, interim maintenance can now be ordered within 60 days of the first hearing as per the new Supreme Court guidelines. Many clients are unaware of this timeline and delay filing. Share this with anyone navigating a maintenance dispute.",
    hasImage: false,
    timeAgo: "4 hours ago",
    likes: 62,
    comments: 9,
    shares: 31,
  },
  {
    id: "post-3",
    authorName: "Ravi Krishnan",
    authorInitials: "RK",
    authorAvatarColor: "bg-emerald-600",
    practiceArea: "Corporate Law",
    text: "The NCLT Chennai Bench recently ruled on a significant insolvency matter where the personal guarantor's assets were held liable under IBC. The judgment has far-reaching implications for promoters of MSMEs who personally guarantee corporate loans. Corporate counsel should advise clients to review guarantee exposure carefully. #IBC #Insolvency #CorporateLaw",
    hasImage: true,
    timeAgo: "6 hours ago",
    likes: 134,
    comments: 28,
    shares: 45,
  },
  {
    id: "post-4",
    authorName: "Meera Verma",
    authorInitials: "MV",
    authorAvatarColor: "bg-violet-600",
    practiceArea: "Property Law",
    text: "RERA Update: The Allahabad High Court has upheld a homebuyer's right to seek refund with interest even after taking possession of a flat that was delayed by more than 3 years. Builders cannot claim the delay was due to force majeure without producing documentary evidence. Homebuyers, know your rights! #RERA #PropertyLaw #RealEstate",
    hasImage: false,
    timeAgo: "Yesterday",
    likes: 109,
    comments: 22,
    shares: 57,
  },
  {
    id: "post-5",
    authorName: "Sameer Bose",
    authorInitials: "SB",
    authorAvatarColor: "bg-amber-600",
    practiceArea: "Tax Law",
    text: "GST Council update: The council has clarified that legal services provided by individual advocates are exempt from GST when provided to any business entity. However, senior advocates charging fees above ₹20 lakh per year must register under reverse charge mechanism. Make sure your billing compliance is up to date. #GST #TaxLaw #AdvocateRCM",
    hasImage: false,
    timeAgo: "1 day ago",
    likes: 78,
    comments: 17,
    shares: 29,
  },
  {
    id: "post-6",
    authorName: "Karan Malhotra",
    authorInitials: "KM",
    authorAvatarColor: "bg-sky-600",
    practiceArea: "Constitutional Law",
    text: "The Supreme Court's recent five-judge bench verdict on Article 370 provides an in-depth study on the nature of federalism in India. The judgment runs to 476 pages — I've prepared a 10-point summary for my fellow practitioners. Feel free to comment 'NOTES' below and I'll share it with you directly.",
    hasImage: true,
    timeAgo: "2 days ago",
    likes: 312,
    comments: 74,
    shares: 98,
  },
  {
    id: "post-7",
    authorName: "Neha Gupta",
    authorInitials: "NG",
    authorAvatarColor: "bg-pink-600",
    practiceArea: "Labour Law",
    text: "Important for HR and employment lawyers: The Industrial Relations Code 2020 now mandates that any establishment with 300 or more workers must obtain prior government permission before layoffs, retrenchment, or closure. Earlier this threshold was 100 workers. Compliance teams must update their workforce management policies accordingly. #LabourLaw #IRCode #Employment",
    hasImage: false,
    timeAgo: "2 days ago",
    likes: 91,
    comments: 11,
    shares: 34,
  },
  {
    id: "post-8",
    authorName: "Vikram Desai",
    authorInitials: "VD",
    authorAvatarColor: "bg-teal-600",
    practiceArea: "Civil Law",
    text: "Excited to share that my article on 'Procedural Reforms under the New CPC Amendment' has been published in the Indian Law Review. The amendments significantly reduce adjournments and introduce timelines for filing written statements. A long overdue step toward decongesting our courts. Link in comments. #CivilProcedure #LegalReform",
    hasImage: true,
    timeAgo: "3 days ago",
    likes: 156,
    comments: 33,
    shares: 61,
  },
];

// ─── Case Data ────────────────────────────────────────────────────────────────

interface StoredCase {
  id: string;
  advocateId: string; // advocate's mobile
  clientId: string; // client's mobile
  caseTitle: string;
  caseNumber: string;
  courtName: string;
  caseType: string; // one of PRACTICE_AREAS
  caseStatus: "Active" | "Pending" | "Adjourned" | "Closed" | "Disposed";
  nextHearingDate: string; // "YYYY-MM-DD" or ""
  notes: string;
  createdAt: string; // ISO timestamp
}

const LS_CASES_KEY = "myadvocate_cases";

function loadCases(): StoredCase[] {
  try {
    return JSON.parse(localStorage.getItem(LS_CASES_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCasesToStorage(cases: StoredCase[]) {
  localStorage.setItem(LS_CASES_KEY, JSON.stringify(cases));
}

function addCaseToStorage(c: StoredCase) {
  const all = loadCases();
  all.push(c);
  saveCasesToStorage(all);
}

function updateCaseInStorage(updated: StoredCase) {
  const all = loadCases().map((c) => (c.id === updated.id ? updated : c));
  saveCasesToStorage(all);
}

function deleteCaseFromStorage(id: string) {
  saveCasesToStorage(loadCases().filter((c) => c.id !== id));
}

function getCasesForAdvocateClient(
  advocateId: string,
  clientId: string,
): StoredCase[] {
  return loadCases().filter(
    (c) => c.advocateId === advocateId && c.clientId === clientId,
  );
}

function getUpcomingHearings(advocateId: string): StoredCase[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return loadCases()
    .filter(
      (c) =>
        c.advocateId === advocateId &&
        c.nextHearingDate &&
        new Date(c.nextHearingDate) >= today,
    )
    .sort(
      (a, b) =>
        new Date(a.nextHearingDate).getTime() -
        new Date(b.nextHearingDate).getTime(),
    );
}

// Returns upcoming hearings for a CLIENT (filtered by clientId)
function getUpcomingHearingsForClient(clientMobile: string): StoredCase[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return loadCases()
    .filter(
      (c) =>
        c.clientId === clientMobile &&
        c.nextHearingDate &&
        new Date(c.nextHearingDate) >= today,
    )
    .sort(
      (a, b) =>
        new Date(a.nextHearingDate).getTime() -
        new Date(b.nextHearingDate).getTime(),
    );
}

// Returns hearings on a specific date for a user (role-aware)
function getHearingsForDate(
  userId: string,
  role: "advocate" | "client",
  dateStr: string,
): StoredCase[] {
  return loadCases().filter((c) => {
    if (role === "advocate")
      return c.advocateId === userId && c.nextHearingDate === dateStr;
    return c.clientId === userId && c.nextHearingDate === dateStr;
  });
}

// Returns all future hearings for a user (role-aware)
function getAllUpcomingHearings(
  userId: string,
  role: "advocate" | "client",
): StoredCase[] {
  if (role === "advocate") return getUpcomingHearings(userId);
  return getUpcomingHearingsForClient(userId);
}

function generateCaseId(): string {
  return `case_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const CASE_STATUSES = [
  "Active",
  "Pending",
  "Adjourned",
  "Closed",
  "Disposed",
] as const;
type CaseStatus = (typeof CASE_STATUSES)[number];

function getHearingLabel(dateStr: string): { label: string; color: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const d = new Date(dateStr);
  if (d.getTime() === today.getTime())
    return { label: "Today", color: "bg-red-100 text-red-700 border-red-200" };
  if (d.getTime() === tomorrow.getTime())
    return {
      label: "Tomorrow",
      color: "bg-orange-100 text-orange-700 border-orange-200",
    };
  if (d <= nextWeek)
    return {
      label: "Next 7 days",
      color: "bg-blue-100 text-blue-700 border-blue-200",
    };
  return {
    label: d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
    color: "bg-gray-100 text-gray-600 border-gray-200",
  };
}

function getCaseStatusColor(status: string): string {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700 border-green-200";
    case "Pending":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "Adjourned":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Closed":
      return "bg-gray-100 text-gray-600 border-gray-200";
    case "Disposed":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

// ─── Document Data ────────────────────────────────────────────────────────────

type DocType = "Petition" | "Evidence" | "Court Order" | "Affidavit" | "Other";

interface StoredDocument {
  id: string;
  caseId: string;
  advocateId: string; // advocate's mobile (owner)
  clientId: string; // client's mobile
  title: string;
  docType: DocType;
  notes: string;
  fileName: string;
  fileType: string;
  // fileData is omitted from localStorage; actual file kept in memory only
  uploadedAt: string; // ISO timestamp
  uploadedByName: string;
}

const LS_DOCUMENTS_KEY = "myadvocate_documents";
const DOC_TYPES: DocType[] = [
  "Petition",
  "Evidence",
  "Court Order",
  "Affidavit",
  "Other",
];

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
];

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

// In-memory blob store for current session (avoids localStorage quota issues)
const docBlobStore = new Map<string, Blob>();

function loadDocuments(): StoredDocument[] {
  try {
    return JSON.parse(localStorage.getItem(LS_DOCUMENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

// Returns true on success, throws on quota/other error
function saveDocumentToStorage(doc: StoredDocument): void {
  const all = loadDocuments();
  all.push(doc);
  localStorage.setItem(LS_DOCUMENTS_KEY, JSON.stringify(all));
}

function deleteDocumentById(id: string) {
  const all = loadDocuments().filter((d) => d.id !== id);
  localStorage.setItem(LS_DOCUMENTS_KEY, JSON.stringify(all));
  docBlobStore.delete(id);
}

function getDocumentsForCase(caseId: string): StoredDocument[] {
  return loadDocuments().filter((d) => d.caseId === caseId);
}

function generateDocId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Message Data ─────────────────────────────────────────────────────────────

interface StoredMessage {
  id: string;
  conversationId: string; // "{userId1}_{userId2}" sorted alphabetically
  senderId: string; // mobile of sender
  senderName: string;
  senderRole: "advocate" | "client";
  text: string; // empty if file-only message
  fileAttachment?: {
    id: string; // key into chatFileBlobStore
    fileName: string;
    fileSize: number; // bytes
    fileType: string; // MIME type
  };
  timestamp: string; // ISO
  seen: boolean; // true once recipient has opened the conversation
}

const LS_MESSAGES_KEY = "myadvocate_messages";

// In-memory blob store for chat files (same pattern as docBlobStore)
const chatFileBlobStore = new Map<string, Blob>();

function getConversationId(a: string, b: string): string {
  return [a, b].sort().join("_");
}

function loadAllMessages(): StoredMessage[] {
  try {
    return JSON.parse(localStorage.getItem(LS_MESSAGES_KEY) || "[]");
  } catch {
    return [];
  }
}

function loadConversationMessages(conversationId: string): StoredMessage[] {
  return loadAllMessages().filter((m) => m.conversationId === conversationId);
}

function saveMessageToStorage(msg: StoredMessage): void {
  const all = loadAllMessages();
  all.push(msg);
  localStorage.setItem(LS_MESSAGES_KEY, JSON.stringify(all));
}

function markConversationAsSeen(
  conversationId: string,
  readerMobile: string,
): void {
  const all = loadAllMessages();
  let changed = false;
  const updated = all.map((m) => {
    if (
      m.conversationId === conversationId &&
      m.senderId !== readerMobile &&
      !m.seen
    ) {
      changed = true;
      return { ...m, seen: true };
    }
    return m;
  });
  if (changed) {
    localStorage.setItem(LS_MESSAGES_KEY, JSON.stringify(updated));
  }
}

function getConversationLastMessage(
  conversationId: string,
): StoredMessage | null {
  const msgs = loadConversationMessages(conversationId);
  if (msgs.length === 0) return null;
  return msgs[msgs.length - 1];
}

function getUnreadCount(conversationId: string, readerMobile: string): number {
  return loadConversationMessages(conversationId).filter(
    (m) => m.senderId !== readerMobile && !m.seen,
  ).length;
}

// biome-ignore lint/correctness/noUnusedVariables: retained for upcoming navigation rebuild
function getTotalUnreadCount(
  myMobile: string,
  myRole: "advocate" | "client",
): number {
  const all = loadAllMessages();
  if (myRole === "advocate") {
    // Advocate: sum unread across all conversations where they are participant
    const advData = loadAllAdvocateData().find((a) => a.userId === myMobile);
    if (!advData) return 0;
    const clients = getClientsForAdvocate(advData.referralCode);
    return clients.reduce((sum, c) => {
      const convId = getConversationId(myMobile, c.userId);
      return (
        sum +
        all.filter(
          (m) =>
            m.conversationId === convId && m.senderId !== myMobile && !m.seen,
        ).length
      );
    }, 0);
  }
  // Client: one conversation with their advocate
  const clientData = loadAllClientData().find((c) => c.userId === myMobile);
  if (!clientData?.linkedAdvocateId) return 0;
  const advocate = loadAllAdvocateData().find(
    (a) =>
      a.referralCode.toUpperCase() ===
      clientData.linkedAdvocateId!.toUpperCase(),
  );
  if (!advocate) return 0;
  const convId = getConversationId(myMobile, advocate.userId);
  return all.filter(
    (m) => m.conversationId === convId && m.senderId !== myMobile && !m.seen,
  ).length;
}

function generateMsgId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateChatFileId(): string {
  return `chatfile_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatMsgTime(isoStr: string): string {
  const d = new Date(isoStr);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) {
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(fileType: string): React.ElementType {
  if (fileType.startsWith("image/")) return ImageIcon;
  if (fileType === "application/pdf") return FileText;
  return File;
}

// ─── Indian States ────────────────────────────────────────────────────────────

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const PRACTICE_AREAS = [
  "Criminal Law",
  "Civil Law",
  "Family Law",
  "Corporate Law",
  "Property Law",
  "Tax Law",
  "Constitutional Law",
  "Labour Law",
  "Other",
];

const DEMO_OTP = "123456";

// ─── Searchable State Select ──────────────────────────────────────────────────

type SearchableStateSelectProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ocid?: string;
};

function SearchableStateSelect({
  value,
  onChange,
  placeholder = "Select State",
  ocid,
}: SearchableStateSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 30);
    } else {
      setSearch("");
    }
  }, [open]);

  function handleSelect(stateName: string) {
    onChange(stateName);
    setOpen(false);
    setSearch("");
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        data-ocid={ocid}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-between w-full h-12 px-3 text-base rounded-xl border bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          open
            ? "border-ring ring-2 ring-ring"
            : "border-input hover:border-ring/50"
        } ${value ? "text-foreground" : "text-muted-foreground"}`}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 ml-2 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              data-ocid="state.search_input"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search state..."
              className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-muted-foreground text-center">
                No states found
              </div>
            ) : (
              filtered.map((stateName) => (
                <button
                  key={stateName}
                  type="button"
                  aria-pressed={value === stateName}
                  onClick={() => handleSelect(stateName)}
                  className={`w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-muted/60 ${
                    value === stateName
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-muted/60"
                  }`}
                >
                  {stateName}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reusable Logo Component ───────────────────────────────────────────────────

function IconLogo({ size = 100 }: { size?: number }) {
  return (
    <img
      src="/assets/uploads/file_0000000036f0720b93e8a32c87ff91e2-1.png"
      alt="My Advocate"
      style={{ width: size, height: "auto" }}
      className="object-contain"
      draggable={false}
    />
  );
}

// ─── Reusable Footer ───────────────────────────────────────────────────────────

function AppFooter() {
  return (
    <footer className="pt-6 pb-2 text-center">
      <p className="text-[11px] text-muted-foreground">
        © 2026 My Advocate · Made by Ankit Sharma
      </p>
    </footer>
  );
}

// ─── Reusable Back Button ─────────────────────────────────────────────────────

function BackButton({
  onClick,
  label = "Back",
  ocid,
}: {
  onClick: () => void;
  label?: string;
  ocid: string;
}) {
  return (
    <button
      data-ocid={ocid}
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md p-1 -ml-1"
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({
  current,
  total,
  labels,
}: {
  current: number;
  total: number;
  labels: string[];
}) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {labels.map((label, i) => (
        <div key={label} className="flex items-center gap-2 flex-1">
          <div
            className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 transition-colors ${
              i + 1 === current
                ? "bg-primary text-primary-foreground"
                : i + 1 < current
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1 < current ? "✓" : i + 1}
          </div>
          <span
            className={`text-xs font-medium truncate transition-colors ${
              i + 1 === current ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {labels[i]}
          </span>
          {i < total - 1 && (
            <div
              className={`h-px flex-1 ml-1 transition-colors ${
                i + 1 < current ? "bg-primary/40" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Field Error Component ─────────────────────────────────────────────────────

function FieldError({
  message,
  ocid,
}: {
  message: string;
  ocid: string;
}) {
  return (
    <p data-ocid={ocid} className="text-destructive text-xs mt-1">
      {message}
    </p>
  );
}

// ─── Mobile OTP Phase (reusable for both reg forms) ──────────────────────────

type MobileOtpPhaseProps = {
  mobile: string;
  setMobile: (v: string) => void;
  otpPhase: OtpPhase;
  setOtpPhase: (v: OtpPhase) => void;
  otp: string;
  setOtp: (v: string) => void;
  mobileError: string;
  setMobileError: (v: string) => void;
  otpError: string;
  setOtpError: (v: string) => void;
  mobileInputOcid: string;
  sendOtpOcid: string;
  otpInputOcid: string;
  verifyOtpOcid: string;
};

function MobileOtpPhase({
  mobile,
  setMobile,
  otpPhase,
  setOtpPhase,
  otp,
  setOtp,
  mobileError,
  setMobileError,
  otpError,
  setOtpError,
  mobileInputOcid,
  sendOtpOcid,
  otpInputOcid,
  verifyOtpOcid,
}: MobileOtpPhaseProps) {
  const [sending, setSending] = useState(false);

  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setMobileError("");
    if (!mobile.trim() || !/^\d{10}$/.test(mobile)) {
      setMobileError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (mobileExists(mobile)) {
      setMobileError("This mobile number is already registered.");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setOtpPhase("verify");
      toast.success(`OTP sent! Use ${DEMO_OTP} for demo.`);
    }, 800);
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError("");
    if (otp !== DEMO_OTP) {
      setOtpError(`Invalid OTP. Use ${DEMO_OTP} for demo.`);
      return;
    }
    setOtpPhase("form");
  }

  if (otpPhase === "mobile") {
    return (
      <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
        <div>
          <Label className="text-sm font-medium mb-1.5 block">
            Mobile Number
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center gap-1.5">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium text-foreground/60 border-r border-border pr-2">
                +91
              </span>
            </span>
            <Input
              data-ocid={mobileInputOcid}
              type="tel"
              placeholder="10-digit mobile number"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                setMobileError("");
              }}
              className="pl-[4.5rem] h-12 text-base rounded-xl"
              maxLength={10}
              autoComplete="tel"
            />
          </div>
          {mobileError && (
            <p className="text-destructive text-xs mt-1">{mobileError}</p>
          )}
        </div>

        <Button
          data-ocid={sendOtpOcid}
          type="submit"
          disabled={sending}
          className="h-12 text-base font-semibold w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
        >
          {sending ? "Sending OTP…" : "Send OTP"}
        </Button>
      </form>
    );
  }

  // otpPhase === "verify"
  return (
    <form
      onSubmit={handleVerifyOtp}
      className="flex flex-col gap-5 animate-fade-in"
    >
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          OTP sent to{" "}
          <span className="text-foreground font-semibold">+91 {mobile}</span>
        </p>
        <button
          type="button"
          className="text-xs text-primary hover:underline focus-visible:outline-none"
          onClick={() => {
            setOtpPhase("mobile");
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
          data-ocid={otpInputOcid}
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
          <span className="font-mono font-bold text-primary">{DEMO_OTP}</span>
        </p>
      </div>

      {otpError && <p className="text-destructive text-sm">{otpError}</p>}

      <Button
        data-ocid={verifyOtpOcid}
        type="submit"
        className="h-12 text-base font-semibold w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
      >
        Verify OTP
      </Button>
    </form>
  );
}

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
      <div className="flex flex-col items-center animate-logo-fade">
        <img
          src="/assets/uploads/file_000000003c74720b8f411065c41e45f4-3.png"
          alt="My Advocate"
          style={{ width: 280, height: "auto", maxWidth: "80vw" }}
          className="object-contain"
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
  onForgotPassword,
}: {
  onSuccess: (user: StoredUser) => void;
  onSignUp: () => void;
  onForgotPassword: () => void;
}) {
  const [activeTab, setActiveTab] = useState<LoginTab>("password");

  // Password login state
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pwError, setPwError] = useState("");

  // OTP login state
  const [otpMobile, setOtpMobile] = useState("");
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSending, setOtpSending] = useState(false);

  function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    if (!identifier.trim() || !password.trim()) {
      setPwError("Please enter your mobile/email and password.");
      return;
    }
    const user = findUser(identifier.trim(), password);
    if (!user) {
      setPwError("Invalid mobile/email or password.");
      return;
    }
    onSuccess(user);
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
    const found = findUserByMobile(otpMobile);
    if (found) {
      onSuccess(found);
    } else {
      setOtpError("No account found with this mobile number. Please register.");
    }
  }

  function handleGoogleLogin() {
    toast.loading("Connecting to Google…");
    setTimeout(() => {
      toast.dismiss();
      // Demo Google login — no real user lookup, go to dashboard directly
      const demoUser: StoredUser = {
        mobile: "google-demo",
        email: "demo@google.com",
        password: "",
        role: "client",
      };
      onSuccess(demoUser);
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
    <div className="flex flex-col flex-1 px-6 pt-8 pb-6">
      {/* Logo */}
      <div className="flex justify-center" style={{ marginBottom: 14 }}>
        <IconLogo size={150} />
      </div>

      {/* Welcome */}
      <div className="text-center mb-6">
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
          {/* Mobile / Email */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Phone className="w-4 h-4" />
            </span>
            <Input
              data-ocid="login.mobile.input"
              type="text"
              placeholder="Mobile Number or Email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="pl-10 h-12 text-base"
              autoComplete="username"
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
              onClick={onForgotPassword}
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
                    {DEMO_OTP}
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
      <AppFooter />
    </div>
  );
}

// ─── Forgot Password Screen ───────────────────────────────────────────────────

type ForgotStep = "phone" | "verify" | "reset";

function ForgotPasswordScreen({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: () => void;
}) {
  const [step, setStep] = useState<ForgotStep>("phone");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resetError, setResetError] = useState("");
  const [sending, setSending] = useState(false);

  const stepLabels = ["Verify Mobile", "Enter OTP", "New Password"];
  const stepIndex = step === "phone" ? 1 : step === "verify" ? 2 : 3;

  function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setMobileError("");
    if (!mobile.trim() || !/^\d{10}$/.test(mobile)) {
      setMobileError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setStep("verify");
      toast.success(`OTP sent! Use ${DEMO_OTP} for demo.`);
    }, 800);
  }

  function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError("");
    if (otp !== DEMO_OTP) {
      setOtpError(`Invalid OTP. Use ${DEMO_OTP} for demo.`);
      return;
    }
    setStep("reset");
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");

    if (!newPassword) {
      setResetError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }
    if (!mobileExists(mobile)) {
      setResetError(
        "No account found with this mobile number. Please register first.",
      );
      return;
    }

    updateUserPassword(mobile, newPassword);
    toast.success("Password reset successfully! Please login.");
    setTimeout(() => onDone(), 800);
  }

  return (
    <div className="flex flex-col flex-1 px-6 pt-6 pb-6">
      <div className="mb-5">
        <BackButton
          ocid="forgot.back.button"
          onClick={onBack}
          label="Back to Login"
        />
      </div>

      <div className="flex flex-col items-center mb-5">
        <IconLogo size={72} />
        <h1 className="text-xl font-bold text-foreground tracking-tight mt-3">
          Reset Password
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Verify your mobile to reset your password
        </p>
      </div>

      <StepIndicator current={stepIndex} total={3} labels={stepLabels} />

      {/* Step 1: Enter Mobile */}
      {step === "phone" && (
        <form
          onSubmit={handleSendOtp}
          className="flex flex-col gap-4 animate-fade-in"
          noValidate
        >
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              Mobile Number
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none flex items-center gap-1.5">
                <Phone className="w-4 h-4" />
                <span className="text-sm font-medium text-foreground/60 border-r border-border pr-2">
                  +91
                </span>
              </span>
              <Input
                data-ocid="forgot.mobile.input"
                type="tel"
                placeholder="Registered mobile number"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  setMobileError("");
                }}
                className="pl-[4.5rem] h-12 text-base rounded-xl"
                maxLength={10}
                autoComplete="tel"
              />
            </div>
            {mobileError && (
              <p
                data-ocid="forgot.error_state"
                className="text-destructive text-xs mt-1"
              >
                {mobileError}
              </p>
            )}
          </div>

          <Button
            data-ocid="forgot.send_otp.button"
            type="submit"
            disabled={sending}
            className="h-12 text-base font-semibold w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            {sending ? "Sending OTP…" : "Send OTP"}
          </Button>
        </form>
      )}

      {/* Step 2: Verify OTP */}
      {step === "verify" && (
        <form
          onSubmit={handleVerifyOtp}
          className="flex flex-col gap-5 animate-fade-in"
          noValidate
        >
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              OTP sent to{" "}
              <span className="text-foreground font-semibold">
                +91 {mobile}
              </span>
            </p>
            <button
              type="button"
              className="text-xs text-primary hover:underline focus-visible:outline-none"
              onClick={() => {
                setStep("phone");
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
              data-ocid="forgot.otp.input"
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
                {DEMO_OTP}
              </span>
            </p>
          </div>

          {otpError && (
            <p
              data-ocid="forgot.error_state"
              className="text-destructive text-sm"
            >
              {otpError}
            </p>
          )}

          <Button
            data-ocid="forgot.verify_otp.button"
            type="submit"
            className="h-12 text-base font-semibold w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            Verify OTP
          </Button>
        </form>
      )}

      {/* Step 3: Set New Password */}
      {step === "reset" && (
        <form
          onSubmit={handleReset}
          className="flex flex-col gap-4 animate-fade-in"
          noValidate
        >
          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              New Password
            </Label>
            <div className="relative">
              <Input
                data-ocid="forgot.new_password.input"
                type={showNewPw ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setResetError("");
                }}
                className="pr-12 h-12 text-base rounded-xl"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                tabIndex={-1}
                aria-label={showNewPw ? "Hide password" : "Show password"}
              >
                {showNewPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-1.5 block">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                data-ocid="forgot.confirm_password.input"
                type={showConfirmPw ? "text" : "password"}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setResetError("");
                }}
                className="pr-12 h-12 text-base rounded-xl"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                tabIndex={-1}
                aria-label={showConfirmPw ? "Hide password" : "Show password"}
              >
                {showConfirmPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {resetError && (
            <p
              data-ocid="forgot.error_state"
              className="text-destructive text-sm"
            >
              {resetError}
            </p>
          )}

          <Button
            data-ocid="forgot.reset.submit_button"
            type="submit"
            className="h-12 text-base font-semibold w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl mt-2"
          >
            Set New Password
          </Button>
        </form>
      )}

      <AppFooter />
    </div>
  );
}

// ─── Role Selection Screen ────────────────────────────────────────────────────

function RoleSelectionScreen({
  onBack,
  onSelectRole,
}: {
  onBack: () => void;
  onSelectRole: (role: "advocate" | "client") => void;
}) {
  return (
    <div className="flex flex-col flex-1 px-6 pt-6 pb-6">
      <div className="mb-6">
        <BackButton
          ocid="role.back.button"
          onClick={onBack}
          label="Back to Login"
        />
      </div>

      <div className="flex justify-center mb-7">
        <IconLogo size={100} />
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Join My Advocate
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Choose your role to get started
        </p>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        <button
          data-ocid="role.advocate.button"
          type="button"
          onClick={() => onSelectRole("advocate")}
          className="group flex items-start gap-4 p-5 rounded-2xl border-2 border-border bg-white hover:border-primary/60 hover:bg-accent/30 transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground">Advocate</p>
            <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
              Join India's professional legal network
            </p>
            <span className="inline-block mt-3 text-sm font-semibold text-primary">
              Continue as Advocate →
            </span>
          </div>
        </button>

        <button
          data-ocid="role.client.button"
          type="button"
          onClick={() => onSelectRole("client")}
          className="group flex items-start gap-4 p-5 rounded-2xl border-2 border-border bg-white hover:border-primary/60 hover:bg-accent/30 transition-all duration-200 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-foreground">Client</p>
            <p className="text-sm text-muted-foreground mt-0.5 leading-snug">
              Find trusted advocates and connect with lawyers
            </p>
            <span className="inline-block mt-3 text-sm font-semibold text-primary">
              Continue as Client →
            </span>
          </div>
        </button>
      </div>

      <AppFooter />
    </div>
  );
}

// ─── Advocate Registration Form ───────────────────────────────────────────────

type AdvocateFormProps = {
  onBack: () => void;
  onSuccess: () => void;
  onRegister: (data: PendingProfileData) => void;
  onLogin: () => void;
};

function AdvocateRegistrationForm({
  onBack,
  onSuccess,
  onRegister,
  onLogin,
}: AdvocateFormProps) {
  const [otpPhase, setOtpPhase] = useState<OtpPhase>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [otpError, setOtpError] = useState("");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [barCouncil, setBarCouncil] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [practiceArea, setPracticeArea] = useState("");
  const [yearsExp, setYearsExp] = useState("");
  const [courtName, setCourtName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepLabels = ["Verify Mobile", "Complete Registration"];

  function validateForm(): Record<string, string> {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address.";
    } else if (emailExists(email)) {
      errs.email = "This email is already registered.";
    }
    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      errs.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }
    if (!barCouncil.trim()) errs.barCouncil = "Bar Council number is required.";
    if (!state) errs.state = "Please select your state.";
    if (!city.trim()) errs.city = "City / District is required.";
    if (!practiceArea) errs.practiceArea = "Please select a practice area.";
    if (!yearsExp.trim()) {
      errs.yearsExp = "Years of experience is required.";
    } else if (Number.isNaN(Number(yearsExp)) || Number(yearsExp) < 0) {
      errs.yearsExp = "Enter a valid number of years.";
    }
    if (!courtName.trim()) errs.courtName = "Court name is required.";

    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    setTimeout(() => {
      saveUser({
        mobile,
        email: email.toLowerCase(),
        password,
        role: "advocate",
      });
      const referralCode = generateReferralCode();
      saveAdvocateData({
        userId: mobile,
        name: fullName,
        referralCode,
        profileData: {},
      });
      onRegister({
        mobile,
        email: email.toLowerCase(),
        fullName,
        state,
        city,
        role: "advocate",
        practiceArea,
        yearsExp,
        courtName,
        barCouncilNumber: barCouncil,
      });
      setIsSubmitting(false);
      onSuccess();
    }, 600);
  }

  const currentStep = otpPhase === "mobile" || otpPhase === "verify" ? 1 : 2;

  return (
    <div className="flex flex-col flex-1 px-6 pt-6 pb-6">
      <div className="mb-5">
        <BackButton
          ocid="advocate_reg.back.button"
          onClick={onBack}
          label="Back"
        />
      </div>

      <div className="flex flex-col items-center mb-5">
        <IconLogo size={72} />
        <h1 className="text-xl font-bold text-foreground tracking-tight mt-3">
          Register as Advocate
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Join India's professional legal network
        </p>
      </div>

      <StepIndicator current={currentStep} total={2} labels={stepLabels} />

      {/* Phase 1 & 2: Mobile OTP */}
      {(otpPhase === "mobile" || otpPhase === "verify") && (
        <MobileOtpPhase
          mobile={mobile}
          setMobile={setMobile}
          otpPhase={otpPhase}
          setOtpPhase={setOtpPhase}
          otp={otp}
          setOtp={setOtp}
          mobileError={mobileError}
          setMobileError={setMobileError}
          otpError={otpError}
          setOtpError={setOtpError}
          mobileInputOcid="advocate_reg.mobile.input"
          sendOtpOcid="advocate_reg.send_otp.button"
          otpInputOcid="advocate_reg.otp.input"
          verifyOtpOcid="advocate_reg.verify_otp.button"
        />
      )}

      {/* Phase 3: Full Registration Form */}
      {otpPhase === "form" && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 animate-fade-in"
          noValidate
        >
          {/* Full Name */}
          <div>
            <Label
              htmlFor="adv-fullname"
              className="text-sm font-medium mb-1.5 block"
            >
              Full Name
            </Label>
            <Input
              id="adv-fullname"
              data-ocid="advocate_reg.fullname.input"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 text-base rounded-xl"
              autoComplete="name"
            />
            {errors.fullName && (
              <FieldError
                ocid="advocate_reg.fullname.error_state"
                message={errors.fullName}
              />
            )}
          </div>

          {/* Email Address */}
          <div>
            <Label
              htmlFor="adv-email"
              className="text-sm font-medium mb-1.5 block"
            >
              Email Address
            </Label>
            <Input
              id="adv-email"
              data-ocid="advocate_reg.email.input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base rounded-xl"
              autoComplete="email"
            />
            {errors.email && (
              <FieldError
                ocid="advocate_reg.email.error_state"
                message={errors.email}
              />
            )}
          </div>

          {/* Password */}
          <div>
            <Label
              htmlFor="adv-password"
              className="text-sm font-medium mb-1.5 block"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="adv-password"
                data-ocid="advocate_reg.password.input"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-12 h-12 text-base rounded-xl"
                autoComplete="new-password"
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
            {errors.password && (
              <FieldError
                ocid="advocate_reg.password.error_state"
                message={errors.password}
              />
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <Label
              htmlFor="adv-confirm-password"
              className="text-sm font-medium mb-1.5 block"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="adv-confirm-password"
                data-ocid="advocate_reg.confirm_password.input"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-12 h-12 text-base rounded-xl"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                tabIndex={-1}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <FieldError
                ocid="advocate_reg.confirm_password.error_state"
                message={errors.confirmPassword}
              />
            )}
          </div>

          {/* Bar Council Number */}
          <div>
            <Label
              htmlFor="adv-barcouncil"
              className="text-sm font-medium mb-1.5 block"
            >
              Bar Council Number
            </Label>
            <Input
              id="adv-barcouncil"
              data-ocid="advocate_reg.barcouncil.input"
              type="text"
              placeholder="e.g. DL/1234/2020"
              value={barCouncil}
              onChange={(e) => setBarCouncil(e.target.value)}
              className="h-12 text-base rounded-xl"
              autoComplete="off"
            />
            {errors.barCouncil && (
              <FieldError
                ocid="advocate_reg.barcouncil.error_state"
                message={errors.barCouncil}
              />
            )}
          </div>

          {/* State (before City) */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">State</Label>
            <SearchableStateSelect
              value={state}
              onChange={setState}
              placeholder="Select your state"
              ocid="advocate.state.select"
            />
            {errors.state && (
              <FieldError
                ocid="advocate_reg.state.error_state"
                message={errors.state}
              />
            )}
          </div>

          {/* City / District (after State) */}
          <div>
            <Label
              htmlFor="adv-city"
              className="text-sm font-medium mb-1.5 block"
            >
              City / District
            </Label>
            <Input
              id="adv-city"
              data-ocid="advocate_reg.city.input"
              type="text"
              placeholder="Your city or district"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-12 text-base rounded-xl"
              autoComplete="address-level2"
            />
            {errors.city && (
              <FieldError
                ocid="advocate_reg.city.error_state"
                message={errors.city}
              />
            )}
          </div>

          {/* Practice Area */}
          <div>
            <Label
              htmlFor="adv-practice"
              className="text-sm font-medium mb-1.5 block"
            >
              Practice Area
            </Label>
            <Select value={practiceArea} onValueChange={setPracticeArea}>
              <SelectTrigger
                id="adv-practice"
                data-ocid="advocate_reg.practice.select"
                className="h-12 text-base rounded-xl"
              >
                <SelectValue placeholder="Select practice area" />
              </SelectTrigger>
              <SelectContent>
                {PRACTICE_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.practiceArea && (
              <FieldError
                ocid="advocate_reg.practice.error_state"
                message={errors.practiceArea}
              />
            )}
          </div>

          {/* Years of Experience */}
          <div>
            <Label
              htmlFor="adv-years-exp"
              className="text-sm font-medium mb-1.5 block"
            >
              Years of Experience
            </Label>
            <Input
              id="adv-years-exp"
              data-ocid="advocate_reg.years_exp.input"
              type="number"
              placeholder="e.g. 5"
              value={yearsExp}
              onChange={(e) => setYearsExp(e.target.value)}
              className="h-12 text-base rounded-xl"
              min="0"
              autoComplete="off"
            />
            {errors.yearsExp && (
              <FieldError
                ocid="advocate_reg.years_exp.error_state"
                message={errors.yearsExp}
              />
            )}
          </div>

          {/* Court Name */}
          <div>
            <Label
              htmlFor="adv-court-name"
              className="text-sm font-medium mb-1.5 block"
            >
              Court Name
            </Label>
            <Input
              id="adv-court-name"
              data-ocid="advocate_reg.court_name.input"
              type="text"
              placeholder="e.g. Delhi High Court"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
              className="h-12 text-base rounded-xl"
              autoComplete="off"
            />
            {errors.courtName && (
              <FieldError
                ocid="advocate_reg.court_name.error_state"
                message={errors.courtName}
              />
            )}
          </div>

          {/* Submit */}
          <Button
            data-ocid="advocate_reg.submit_button"
            type="submit"
            disabled={isSubmitting}
            className="h-12 text-base font-semibold w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl mt-2"
          >
            {isSubmitting ? "Registering…" : "Register as Advocate"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              data-ocid="advocate_reg.login.link"
              type="button"
              onClick={onLogin}
              className="text-primary font-semibold hover:underline focus-visible:outline-none"
            >
              Login
            </button>
          </p>
        </form>
      )}

      <AppFooter />
    </div>
  );
}

// ─── Client Registration Form ─────────────────────────────────────────────────

type ClientFormProps = {
  onBack: () => void;
  onSuccess: () => void;
  onRegister: (data: PendingProfileData) => void;
  onLogin: () => void;
};

function ClientRegistrationForm({
  onBack,
  onSuccess,
  onRegister,
  onLogin,
}: ClientFormProps) {
  const [otpPhase, setOtpPhase] = useState<OtpPhase>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [otpError, setOtpError] = useState("");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stepLabels = ["Verify Mobile", "Complete Registration"];
  const currentStep = otpPhase === "mobile" || otpPhase === "verify" ? 1 : 2;

  function validateForm(): Record<string, string> {
    const errs: Record<string, string> = {};

    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address.";
    } else if (emailExists(email)) {
      errs.email = "This email is already registered.";
    }
    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }
    if (!confirmPassword) {
      errs.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }
    if (!state) errs.state = "Please select your state.";
    if (!city.trim()) errs.city = "City / District is required.";
    // Referral code validation (optional)
    if (referralCode.trim() && !findAdvocateByCode(referralCode.trim())) {
      errs.referralCode = "Invalid referral code. Please check and try again.";
    }

    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const trimmedCode = referralCode.trim();
    const linkedAdvocateId =
      trimmedCode && findAdvocateByCode(trimmedCode) ? trimmedCode : null;

    setIsSubmitting(true);
    setTimeout(() => {
      saveUser({
        mobile,
        email: email.toLowerCase(),
        password,
        role: "client",
      });
      saveClientData({
        userId: mobile,
        name: fullName,
        linkedAdvocateId,
      });
      onRegister({
        mobile,
        email: email.toLowerCase(),
        fullName,
        state,
        city,
        role: "client",
      });
      setIsSubmitting(false);
      onSuccess();
    }, 600);
  }

  return (
    <div className="flex flex-col flex-1 px-6 pt-6 pb-6">
      <div className="mb-5">
        <BackButton
          ocid="client_reg.back.button"
          onClick={onBack}
          label="Back"
        />
      </div>

      <div className="flex flex-col items-center mb-5">
        <IconLogo size={72} />
        <h1 className="text-xl font-bold text-foreground tracking-tight mt-3">
          Register as Client
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Find trusted advocates near you
        </p>
      </div>

      <StepIndicator current={currentStep} total={2} labels={stepLabels} />

      {/* Phase 1 & 2: Mobile OTP */}
      {(otpPhase === "mobile" || otpPhase === "verify") && (
        <MobileOtpPhase
          mobile={mobile}
          setMobile={setMobile}
          otpPhase={otpPhase}
          setOtpPhase={setOtpPhase}
          otp={otp}
          setOtp={setOtp}
          mobileError={mobileError}
          setMobileError={setMobileError}
          otpError={otpError}
          setOtpError={setOtpError}
          mobileInputOcid="client_reg.mobile.input"
          sendOtpOcid="client_reg.send_otp.button"
          otpInputOcid="client_reg.otp.input"
          verifyOtpOcid="client_reg.verify_otp.button"
        />
      )}

      {/* Phase 3: Full Registration Form */}
      {otpPhase === "form" && (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 animate-fade-in"
          noValidate
        >
          {/* Full Name */}
          <div>
            <Label
              htmlFor="cli-fullname"
              className="text-sm font-medium mb-1.5 block"
            >
              Full Name
            </Label>
            <Input
              id="cli-fullname"
              data-ocid="client_reg.fullname.input"
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 text-base rounded-xl"
              autoComplete="name"
            />
            {errors.fullName && (
              <FieldError
                ocid="client_reg.fullname.error_state"
                message={errors.fullName}
              />
            )}
          </div>

          {/* Email Address */}
          <div>
            <Label
              htmlFor="cli-email"
              className="text-sm font-medium mb-1.5 block"
            >
              Email Address
            </Label>
            <Input
              id="cli-email"
              data-ocid="client_reg.email.input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base rounded-xl"
              autoComplete="email"
            />
            {errors.email && (
              <FieldError
                ocid="client_reg.email.error_state"
                message={errors.email}
              />
            )}
          </div>

          {/* Password */}
          <div>
            <Label
              htmlFor="cli-password"
              className="text-sm font-medium mb-1.5 block"
            >
              Password
            </Label>
            <div className="relative">
              <Input
                id="cli-password"
                data-ocid="client_reg.password.input"
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-12 h-12 text-base rounded-xl"
                autoComplete="new-password"
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
            {errors.password && (
              <FieldError
                ocid="client_reg.password.error_state"
                message={errors.password}
              />
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <Label
              htmlFor="cli-confirm-password"
              className="text-sm font-medium mb-1.5 block"
            >
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="cli-confirm-password"
                data-ocid="client_reg.confirm_password.input"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-12 h-12 text-base rounded-xl"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                tabIndex={-1}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <FieldError
                ocid="client_reg.confirm_password.error_state"
                message={errors.confirmPassword}
              />
            )}
          </div>

          {/* State (before City) */}
          <div>
            <Label className="text-sm font-medium mb-1.5 block">State</Label>
            <SearchableStateSelect
              value={state}
              onChange={setState}
              placeholder="Select your state"
              ocid="client.state.select"
            />
            {errors.state && (
              <FieldError
                ocid="client_reg.state.error_state"
                message={errors.state}
              />
            )}
          </div>

          {/* City / District (after State) */}
          <div>
            <Label
              htmlFor="cli-city"
              className="text-sm font-medium mb-1.5 block"
            >
              City / District
            </Label>
            <Input
              id="cli-city"
              data-ocid="client_reg.city.input"
              type="text"
              placeholder="Your city or district"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-12 text-base rounded-xl"
              autoComplete="address-level2"
            />
            {errors.city && (
              <FieldError
                ocid="client_reg.city.error_state"
                message={errors.city}
              />
            )}
          </div>

          {/* Advocate Referral Code (Optional) */}
          <div>
            <Label
              htmlFor="cli-referral"
              className="text-sm font-medium mb-1.5 block"
            >
              Advocate Referral Code
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (Optional)
              </span>
            </Label>
            <Input
              id="cli-referral"
              data-ocid="client_reg.referral_code.input"
              type="text"
              placeholder="e.g. ADV-7F3K9"
              value={referralCode}
              onChange={(e) => {
                setReferralCode(e.target.value.toUpperCase());
                setErrors((prev) => ({ ...prev, referralCode: "" }));
              }}
              className="h-12 text-base rounded-xl font-mono tracking-wider"
              autoComplete="off"
            />
            {errors.referralCode && (
              <FieldError
                ocid="client_reg.referral_code.error_state"
                message={errors.referralCode}
              />
            )}
            <p className="text-xs text-muted-foreground mt-1">
              If your advocate shared a referral code, enter it here to connect.
            </p>
          </div>

          {/* Submit */}
          <Button
            data-ocid="client_reg.submit_button"
            type="submit"
            disabled={isSubmitting}
            className="h-12 text-base font-semibold w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl mt-2"
          >
            {isSubmitting ? "Registering…" : "Register as Client"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              data-ocid="client_reg.login.link"
              type="button"
              onClick={onLogin}
              className="text-primary font-semibold hover:underline focus-visible:outline-none"
            >
              Login
            </button>
          </p>
        </form>
      )}

      <AppFooter />
    </div>
  );
}

// ─── Registration Success Screen ──────────────────────────────────────────────

function RegistrationSuccessScreen({
  role,
  onContinue,
}: {
  role: "advocate" | "client";
  onContinue: () => void;
}) {
  const description =
    role === "advocate"
      ? "Welcome to My Advocate. Your account is under review."
      : "Welcome to My Advocate. You can now connect with advocates.";

  return (
    <div
      data-ocid="registration_success.section"
      className="flex flex-col flex-1 px-6 py-8"
    >
      <div className="flex justify-center mb-8">
        <IconLogo size={72} />
      </div>

      <div className="flex flex-col items-center justify-center flex-1 text-center animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-6 ring-4 ring-green-100">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Registration Successful!
        </h1>
        <p className="text-base text-muted-foreground mt-3 max-w-[280px] leading-relaxed">
          {description}
        </p>

        <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          {role === "advocate" ? (
            <Briefcase className="w-4 h-4 text-primary" />
          ) : (
            <User className="w-4 h-4 text-primary" />
          )}
          <span className="text-sm font-semibold text-primary capitalize">
            {role}
          </span>
        </div>

        <Button
          data-ocid="registration_success.continue.button"
          onClick={onContinue}
          className="mt-10 h-12 px-10 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl w-full"
        >
          Set Up Your Profile
        </Button>
      </div>

      <AppFooter />
    </div>
  );
}

// ─── Shared PageHeader Component ─────────────────────────────────────────────

type PageHeaderProps = {
  user: StoredUser | null;
  profile: StoredProfile | null;
  onBack: () => void;
  onLogout: () => void;
  backLabel?: string;
};

function PageHeader({
  user,
  profile,
  onBack,
  onLogout,
  backLabel = "Back to Dashboard",
}: PageHeaderProps) {
  const displayName =
    profile?.fullName ||
    (user?.mobile === "google-demo" ? "Demo User" : "User");
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="w-full">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-10 flex items-center justify-between w-full px-5 py-3 border-b border-border bg-white shadow-sm">
        <img
          src="/assets/uploads/file_0000000067dc720b979aa33b95fe860c-2.png"
          alt="My Advocate"
          style={{ height: 44, width: "auto" }}
          className="object-contain"
          draggable={false}
        />
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-border bg-white">
            {profile?.profilePhoto ? (
              <img
                src={profile.profilePhoto}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary leading-none">
                  {initials}
                </span>
              </div>
            )}
          </div>
          <button
            data-ocid="page.logout.button"
            type="button"
            onClick={onLogout}
            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </header>
      {/* Back button row */}
      <div className="px-5 pt-3 pb-1">
        <BackButton
          ocid="page.back.button"
          onClick={onBack}
          label={`← ${backLabel}`}
        />
      </div>
    </div>
  );
}

// ─── Dashboard Client Hearings Preview ───────────────────────────────────────
// biome-ignore lint/correctness/noUnusedVariables: retained for upcoming navigation rebuild
function DashboardClientHearingsPreview({
  clientMobile,
  onViewAll,
}: {
  clientMobile: string;
  onViewAll: () => void;
}) {
  const hearings = getUpcomingHearingsForClient(clientMobile).slice(0, 3);
  const total = getUpcomingHearingsForClient(clientMobile).length;

  if (hearings.length === 0) {
    return (
      <div
        data-ocid="dashboard.client_hearings.empty_state"
        className="bg-white rounded-2xl border border-border p-5 text-center"
      >
        <CalendarDays className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          No upcoming hearings scheduled.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {hearings.map((c, idx) => {
        const hearingInfo = getHearingLabel(c.nextHearingDate);
        return (
          <div
            key={c.id}
            data-ocid={`dashboard.client_hearings.item.${idx + 1}`}
            className="bg-white rounded-xl border border-border shadow-sm p-3 flex flex-col gap-1.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-bold text-foreground leading-snug flex-1 min-w-0 truncate">
                {c.caseTitle}
              </p>
              <span
                className={`shrink-0 inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getCaseStatusColor(c.caseStatus)}`}
              >
                {c.caseStatus}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{c.courtName}</span>
            </div>
            <span
              className={`self-start inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${hearingInfo.color}`}
            >
              <Calendar className="w-2.5 h-2.5" />
              {hearingInfo.label} ·{" "}
              {new Date(`${c.nextHearingDate}T00:00:00`).toLocaleDateString(
                "en-IN",
                { day: "numeric", month: "short" },
              )}
            </span>
          </div>
        );
      })}
      {total > 3 && (
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-primary font-semibold text-center py-1 hover:underline focus-visible:outline-none"
        >
          +{total - 3} more hearings →
        </button>
      )}
    </div>
  );
}

// ─── Dashboard Hearings Preview ───────────────────────────────────────────────
// biome-ignore lint/correctness/noUnusedVariables: retained for upcoming navigation rebuild
function DashboardHearingsPreview({
  advocateId,
  onViewAll,
}: {
  advocateId: string;
  onViewAll: () => void;
}) {
  const hearings = getUpcomingHearings(advocateId).slice(0, 3);

  if (hearings.length === 0) {
    return (
      <div
        data-ocid="dashboard.hearings.empty_state"
        className="bg-white rounded-2xl border border-border p-5 text-center"
      >
        <CalendarDays className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          No upcoming hearings. Add hearing dates to your cases.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {hearings.map((c, idx) => {
        const clientProfile = loadProfile(c.clientId);
        const clientData = loadAllClientData().find(
          (cd) => cd.userId === c.clientId,
        );
        const clientName =
          clientProfile?.fullName || clientData?.name || "Client";
        const hearingInfo = getHearingLabel(c.nextHearingDate);

        return (
          <div
            key={c.id}
            data-ocid={`dashboard.hearings.item.${idx + 1}`}
            className="bg-white rounded-xl border border-border shadow-sm p-3 flex flex-col gap-1.5"
          >
            {/* Client name */}
            <p className="text-[10px] font-medium text-muted-foreground">
              Client: {clientName}
            </p>
            {/* Case title + status */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-bold text-foreground leading-snug flex-1 min-w-0 truncate">
                {c.caseTitle}
              </p>
              <span
                className={`shrink-0 inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getCaseStatusColor(c.caseStatus)}`}
              >
                {c.caseStatus}
              </span>
            </div>
            {/* Court */}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Building2 className="w-3 h-3 shrink-0" />
              <span className="truncate">{c.courtName}</span>
            </div>
            {/* Date chip */}
            <span
              className={`self-start inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${hearingInfo.color}`}
            >
              <Calendar className="w-2.5 h-2.5" />
              {hearingInfo.label} ·{" "}
              {new Date(`${c.nextHearingDate}T00:00:00`).toLocaleDateString(
                "en-IN",
                { day: "numeric", month: "short" },
              )}
            </span>
          </div>
        );
      })}
      {getUpcomingHearings(advocateId).length > 3 && (
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs text-primary font-semibold text-center py-1 hover:underline focus-visible:outline-none"
        >
          +{getUpcomingHearings(advocateId).length - 3} more hearings →
        </button>
      )}
    </div>
  );
}

// ─── My Profile Page ─────────────────────────────────────────────────────────

function MyProfilePage({
  user,
  onBack,
  onLogout,
  onNavigateToMessages,
  onViewAdvocateProfile,
}: {
  user: StoredUser | null;
  onBack: () => void;
  onLogout: () => void;
  onNavigateToMessages: () => void;
  onViewAdvocateProfile: (advocateUserId: string) => void;
}) {
  const [profileState, setProfileState] = useState<StoredProfile | null>(
    user ? loadProfile(user.mobile) : null,
  );
  const isAdvocate = user?.role === "advocate";

  // Edit Profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editPracticeArea, setEditPracticeArea] = useState("");
  const [editYearsExp, setEditYearsExp] = useState("");
  const [editCourtName, setEditCourtName] = useState("");
  const [editState, setEditState] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editOfficeAddress, setEditOfficeAddress] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editContactEmail, setEditContactEmail] = useState("");
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Change Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmNewPw, setShowConfirmNewPw] = useState(false);
  const [pwChangeError, setPwChangeError] = useState("");

  // Photo options state
  const [profilePhotoSheetOpen, setProfilePhotoSheetOpen] = useState(false);
  const [coverPhotoSheetOpen, setCoverPhotoSheetOpen] = useState(false);
  const [viewPhotoDialog, setViewPhotoDialog] = useState<{
    open: boolean;
    url: string;
    alt: string;
  }>({ open: false, url: "", alt: "" });
  const [changingPhoto, setChangingPhoto] = useState<
    "profile" | "cover" | null
  >(null);
  const [newProfilePhotoSrc, setNewProfilePhotoSrc] = useState<string | null>(
    null,
  );
  const profilePhotoFileRef = useRef<HTMLInputElement>(null);
  const coverPhotoFileRef = useRef<HTMLInputElement>(null);

  const profile = profileState;

  // Get advocate's referral code
  const advocateData = user
    ? (loadAllAdvocateData().find((a) => a.userId === user.mobile) ?? null)
    : null;
  const referralCode = advocateData?.referralCode ?? null;

  // Get connected advocate for client
  const clientData = user
    ? (loadAllClientData().find((c) => c.userId === user.mobile) ?? null)
    : null;
  const connectedAdvocate = clientData?.linkedAdvocateId
    ? findAdvocateByCode(clientData.linkedAdvocateId)
    : null;

  function handleCopyCode() {
    if (!referralCode) return;
    navigator.clipboard
      .writeText(referralCode)
      .then(() => toast.success("Referral code copied!"))
      .catch(() => toast.error("Could not copy to clipboard."));
  }

  function startEditing() {
    if (!profile) return;
    setEditFullName(profile.fullName);
    setEditPracticeArea(profile.practiceArea ?? "");
    setEditYearsExp(profile.yearsExp ?? "");
    setEditCourtName(profile.courtName ?? "");
    setEditState(profile.state);
    setEditCity(profile.city);
    setEditOfficeAddress(profile.officeAddress ?? "");
    setEditBio(profile.bio ?? "");
    setEditContactEmail(profile.contactEmail);
    setEditErrors({});
    setIsEditing(true);
  }

  function validateEdit(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!editFullName.trim()) errs.fullName = "Full name is required.";
    if (!editState) errs.state = "State is required.";
    if (!editCity.trim()) errs.city = "City / District is required.";
    if (!editContactEmail.trim())
      errs.contactEmail = "Contact email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editContactEmail))
      errs.contactEmail = "Enter a valid email.";
    if (isAdvocate) {
      if (!editPracticeArea) errs.practiceArea = "Practice area is required.";
      if (!editYearsExp.trim())
        errs.yearsExp = "Years of experience is required.";
      else if (Number.isNaN(Number(editYearsExp)) || Number(editYearsExp) < 0)
        errs.yearsExp = "Enter a valid number.";
      if (!editCourtName.trim()) errs.courtName = "Court name is required.";
    }
    return errs;
  }

  function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateEdit();
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!profile || !user) return;

    const updated: StoredProfile = {
      ...profile,
      fullName: editFullName.trim(),
      practiceArea: isAdvocate ? editPracticeArea : profile.practiceArea,
      yearsExp: isAdvocate ? editYearsExp.trim() : profile.yearsExp,
      courtName: isAdvocate ? editCourtName.trim() : profile.courtName,
      state: editState,
      city: editCity.trim(),
      officeAddress: editOfficeAddress.trim() || undefined,
      bio: editBio.trim() || undefined,
      contactEmail: editContactEmail.toLowerCase().trim(),
    };
    saveProfile(updated);
    setProfileState(updated);
    setIsEditing(false);
    toast.success("Profile updated successfully");
  }

  function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwChangeError("");
    if (!user) return;

    // Validate current password
    const storedUser = loadUsers().find((u) => u.mobile === user.mobile);
    if (!storedUser || storedUser.password !== currentPassword) {
      setPwChangeError("Current password is incorrect.");
      return;
    }
    if (!newPassword) {
      setPwChangeError("Please enter a new password.");
      return;
    }
    if (newPassword.length < 8) {
      setPwChangeError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwChangeError("New passwords do not match.");
      return;
    }

    updateUserPassword(user.mobile, newPassword);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setIsChangingPassword(false);
    toast.success("Password changed successfully");
  }

  function handleDeleteAccount() {
    if (!user) return;
    deleteUserAccount(user.mobile, user.role);
    onLogout();
  }

  // ── Photo action handlers ──────────────────────────────────────────────────

  function handleProfilePhotoFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setNewProfilePhotoSrc(ev.target?.result as string);
      setChangingPhoto("profile");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleCoverPhotoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (!profile || !user) return;
      const updated: StoredProfile = {
        ...profile,
        coverPhoto: ev.target?.result as string,
      };
      saveProfile(updated);
      setProfileState(updated);
      toast.success("Cover photo updated");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleRemoveProfilePhoto() {
    if (!profile || !user) return;
    const updated: StoredProfile = { ...profile, profilePhoto: undefined };
    saveProfile(updated);
    setProfileState(updated);
    toast.success("Profile photo removed");
  }

  function handleRemoveCoverPhoto() {
    if (!profile || !user) return;
    const updated: StoredProfile = { ...profile, coverPhoto: undefined };
    saveProfile(updated);
    setProfileState(updated);
    toast.success("Cover photo removed");
  }

  function handleProfileCropDone(dataUrl: string) {
    if (!profile || !user) return;
    if (dataUrl) {
      const updated: StoredProfile = { ...profile, profilePhoto: dataUrl };
      saveProfile(updated);
      setProfileState(updated);
      toast.success("Profile photo updated");
    }
    setChangingPhoto(null);
    setNewProfilePhotoSrc(null);
  }

  const displayName = profile?.fullName || "User";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      data-ocid="my_profile.section"
      className="flex flex-col min-h-screen bg-background"
    >
      <PageHeader
        user={user}
        profile={profile}
        onBack={onBack}
        onLogout={onLogout}
        backLabel="Back to Dashboard"
      />

      <main className="flex flex-col flex-1 overflow-y-auto pb-8">
        {/* Cover photo (advocate only) */}
        {isAdvocate && (
          <div
            className="relative w-full overflow-hidden shrink-0 bg-gradient-to-r from-primary/80 to-primary"
            style={{ height: 200 }}
          >
            {profile?.coverPhoto ? (
              <img
                src={profile.coverPhoto}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <Briefcase className="w-16 h-16 text-white" />
              </div>
            )}
            {/* Cover photo tap target */}
            <button
              data-ocid="my_profile.cover_photo.button"
              type="button"
              onClick={() => setCoverPhotoSheetOpen(true)}
              className="absolute inset-0 w-full h-full focus-visible:outline-none"
              aria-label="Cover photo options"
            />
            {/* Camera icon overlay */}
            <div className="absolute bottom-3 right-3 pointer-events-none w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>
        )}

        <div
          className={`flex flex-col items-center px-6 ${isAdvocate ? "" : "pt-8"}`}
        >
          {/* Avatar — straddles cover/content boundary for advocates */}
          <div className={`relative ${isAdvocate ? "-mt-[60px]" : ""} z-10`}>
            <button
              data-ocid="my_profile.profile_photo.button"
              type="button"
              onClick={() => setProfilePhotoSheetOpen(true)}
              className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg bg-white overflow-hidden block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Profile photo options"
            >
              {profile?.profilePhoto ? (
                <img
                  src={profile.profilePhoto}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    {initials}
                  </span>
                </div>
              )}
            </button>
            {/* Camera overlay badge */}
            <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-white pointer-events-none">
              <Camera className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Name */}
          <h1 className="mt-3 text-xl font-bold text-foreground tracking-tight text-center">
            {displayName}
          </h1>

          {isAdvocate ? (
            <>
              {/* Practice Area badge */}
              {profile?.practiceArea && (
                <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-3 py-0.5 rounded-full">
                  {profile.practiceArea}
                </span>
              )}

              {/* Details grid */}
              <div className="w-full mt-5 bg-white rounded-2xl border border-border shadow-sm divide-y divide-border">
                {profile?.courtName && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      Court
                    </span>
                    <span className="text-sm font-semibold text-foreground text-right max-w-[60%]">
                      {profile.courtName}
                    </span>
                  </div>
                )}
                {profile?.yearsExp && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      Experience
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {profile.yearsExp}{" "}
                      {Number(profile.yearsExp) === 1 ? "year" : "years"}
                    </span>
                  </div>
                )}
                {profile?.barCouncilNumber && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      Bar Council No.
                    </span>
                    <span className="text-sm font-semibold text-foreground font-mono">
                      {profile.barCouncilNumber}
                    </span>
                  </div>
                )}
                {(profile?.city || profile?.state) && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      Location
                    </span>
                    <span className="text-sm font-semibold text-foreground text-right">
                      {[profile?.city, profile?.state]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {profile?.contactEmail && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      Email
                    </span>
                    <span className="text-sm font-semibold text-foreground truncate max-w-[60%]">
                      {profile.contactEmail}
                    </span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {profile?.bio && (
                <div className="w-full mt-4 bg-white rounded-2xl border border-border shadow-sm p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Bio
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Referral Code Card */}
              {referralCode && (
                <div
                  data-ocid="my_profile.referral.card"
                  className="w-full mt-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20 p-4"
                >
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Your Referral Code
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-2xl font-bold text-primary tracking-widest">
                      {referralCode}
                    </span>
                    <button
                      data-ocid="my_profile.referral.copy.button"
                      type="button"
                      onClick={handleCopyCode}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                      aria-label="Copy referral code"
                    >
                      <ClipboardCopy className="w-3.5 h-3.5" />
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this code with your clients so they can connect with
                    you.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Client profile details */}
              <div className="w-full mt-5 bg-white rounded-2xl border border-border shadow-sm divide-y divide-border">
                {(profile?.city || profile?.state) && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      Location
                    </span>
                    <span className="text-sm font-semibold text-foreground text-right">
                      {[profile?.city, profile?.state]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
                {profile?.contactEmail && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-muted-foreground font-medium">
                      Email
                    </span>
                    <span className="text-sm font-semibold text-foreground truncate max-w-[60%]">
                      {profile.contactEmail}
                    </span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {profile?.bio && (
                <div className="w-full mt-4 bg-white rounded-2xl border border-border shadow-sm p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Bio
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Connected Advocate — full details card */}
              <div className="w-full mt-4 bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Your Advocate
                  </p>
                </div>
                {connectedAdvocate ? (
                  (() => {
                    const advProfile = loadProfile(connectedAdvocate.userId);
                    const advInitials = connectedAdvocate.name
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();
                    const advLocation = [advProfile?.city, advProfile?.state]
                      .filter(Boolean)
                      .join(", ");
                    return (
                      <div className="p-4 flex flex-col gap-4">
                        {/* Advocate header with photo */}
                        <div className="flex items-center gap-4">
                          <div className="w-[72px] h-[72px] rounded-full border-2 border-border overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 shadow-sm">
                            {advProfile?.profilePhoto ? (
                              <img
                                src={advProfile.profilePhoto}
                                alt={connectedAdvocate.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xl font-bold text-primary">
                                {advInitials}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-foreground truncate">
                              {connectedAdvocate.name}
                            </p>
                            {advProfile?.practiceArea && (
                              <span className="inline-flex items-center text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                                {advProfile.practiceArea}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details rows */}
                        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                          {advProfile?.courtName && (
                            <div className="flex justify-between px-3 py-2.5">
                              <span className="text-xs text-muted-foreground">
                                Court
                              </span>
                              <span className="text-xs font-semibold text-foreground text-right max-w-[60%]">
                                {advProfile.courtName}
                              </span>
                            </div>
                          )}
                          {advProfile?.yearsExp && (
                            <div className="flex justify-between px-3 py-2.5">
                              <span className="text-xs text-muted-foreground">
                                Experience
                              </span>
                              <span className="text-xs font-semibold text-foreground">
                                {advProfile.yearsExp}{" "}
                                {Number(advProfile.yearsExp) === 1
                                  ? "year"
                                  : "years"}
                              </span>
                            </div>
                          )}
                          {advLocation && (
                            <div className="flex justify-between px-3 py-2.5">
                              <span className="text-xs text-muted-foreground">
                                Location
                              </span>
                              <span className="text-xs font-semibold text-foreground text-right max-w-[60%]">
                                {advLocation}
                              </span>
                            </div>
                          )}
                          {connectedAdvocate.userId && (
                            <div className="flex justify-between px-3 py-2.5">
                              <span className="text-xs text-muted-foreground">
                                Mobile
                              </span>
                              <span className="text-xs font-semibold text-foreground">
                                +91 {connectedAdvocate.userId}
                              </span>
                            </div>
                          )}
                          {advProfile?.contactEmail && (
                            <div className="flex justify-between px-3 py-2.5">
                              <span className="text-xs text-muted-foreground">
                                Email
                              </span>
                              <span className="text-xs font-semibold text-foreground truncate max-w-[60%]">
                                {advProfile.contactEmail}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Bio */}
                        {advProfile?.bio && (
                          <div className="bg-muted/30 rounded-xl p-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                              About
                            </p>
                            <p className="text-xs text-foreground leading-relaxed">
                              {advProfile.bio}
                            </p>
                          </div>
                        )}

                        {/* 4 contact buttons in 2×2 grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <a
                            data-ocid="client_profile.call.button"
                            href={`tel:${connectedAdvocate.userId}`}
                            className="flex items-center justify-center gap-2 h-10 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Call Advocate
                          </a>
                          <a
                            data-ocid="client_profile.whatsapp.button"
                            href={`https://wa.me/91${connectedAdvocate.userId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#25D366] text-white text-xs font-semibold hover:bg-[#1fbd59] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                          <button
                            data-ocid="client_profile.message.button"
                            type="button"
                            onClick={onNavigateToMessages}
                            className="flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Message
                          </button>
                          <button
                            data-ocid="client_profile.view_advocate_profile.button"
                            type="button"
                            onClick={() =>
                              onViewAdvocateProfile(connectedAdvocate.userId)
                            }
                            className="flex items-center justify-center gap-2 h-10 rounded-xl border-2 border-primary text-primary text-xs font-semibold hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <User className="w-3.5 h-3.5" />
                            Full Profile
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="p-4">
                    <p className="text-sm text-muted-foreground">
                      No advocate connected yet. Enter an advocate's referral
                      code to connect.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Profile Management Buttons (FIX 4) ── */}
          <div className="w-full mt-6 flex flex-col gap-3">
            {/* Edit Profile Button */}
            <button
              data-ocid="my_profile.edit.button"
              type="button"
              onClick={startEditing}
              className="w-full h-11 rounded-xl border-2 border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Edit Profile
            </button>

            {/* Change Password Button */}
            <button
              data-ocid="my_profile.change_password.button"
              type="button"
              onClick={() => {
                setIsChangingPassword((v) => !v);
                setPwChangeError("");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmNewPassword("");
              }}
              className="w-full h-11 rounded-xl border-2 border-border text-foreground text-sm font-semibold hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isChangingPassword
                ? "Cancel Password Change"
                : "Change Password"}
            </button>

            {/* Delete Account Button */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  data-ocid="my_profile.delete.button"
                  type="button"
                  className="w-full h-11 rounded-xl border-2 border-destructive text-destructive text-sm font-semibold hover:bg-destructive/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  Delete Account
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent data-ocid="my_profile.delete.dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your account and all associated
                    data. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-ocid="my_profile.delete.cancel.button">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-ocid="my_profile.delete.confirm.button"
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* ── Edit Profile Form (inline) ── */}
          {isEditing && (
            <div className="w-full mt-5 bg-white rounded-2xl border border-border shadow-sm p-5">
              <h2 className="text-sm font-bold text-foreground mb-4">
                Edit Profile
              </h2>
              <form
                onSubmit={handleSaveEdit}
                className="flex flex-col gap-4"
                noValidate
              >
                {/* Full Name */}
                <div>
                  <Label
                    htmlFor="edit-fullname"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    Full Name
                  </Label>
                  <Input
                    id="edit-fullname"
                    data-ocid="my_profile.edit.fullname.input"
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="h-12 text-base rounded-xl"
                    autoComplete="name"
                  />
                  {editErrors.fullName && (
                    <FieldError
                      ocid="my_profile.edit.fullname.error_state"
                      message={editErrors.fullName}
                    />
                  )}
                </div>

                {/* Advocate-specific fields */}
                {isAdvocate && (
                  <>
                    <div>
                      <Label
                        htmlFor="edit-practice"
                        className="text-sm font-medium mb-1.5 block"
                      >
                        Practice Area
                      </Label>
                      <Select
                        value={editPracticeArea}
                        onValueChange={setEditPracticeArea}
                      >
                        <SelectTrigger
                          id="edit-practice"
                          data-ocid="my_profile.edit.practice.select"
                          className="h-12 text-base rounded-xl"
                        >
                          <SelectValue placeholder="Select practice area" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRACTICE_AREAS.map((area) => (
                            <SelectItem key={area} value={area}>
                              {area}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {editErrors.practiceArea && (
                        <FieldError
                          ocid="my_profile.edit.practice.error_state"
                          message={editErrors.practiceArea}
                        />
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="edit-years-exp"
                        className="text-sm font-medium mb-1.5 block"
                      >
                        Years of Experience
                      </Label>
                      <Input
                        id="edit-years-exp"
                        data-ocid="my_profile.edit.years_exp.input"
                        type="number"
                        value={editYearsExp}
                        onChange={(e) => setEditYearsExp(e.target.value)}
                        className="h-12 text-base rounded-xl"
                        min="0"
                      />
                      {editErrors.yearsExp && (
                        <FieldError
                          ocid="my_profile.edit.years_exp.error_state"
                          message={editErrors.yearsExp}
                        />
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="edit-court-name"
                        className="text-sm font-medium mb-1.5 block"
                      >
                        Court Name
                      </Label>
                      <Input
                        id="edit-court-name"
                        data-ocid="my_profile.edit.court_name.input"
                        type="text"
                        value={editCourtName}
                        onChange={(e) => setEditCourtName(e.target.value)}
                        className="h-12 text-base rounded-xl"
                        placeholder="e.g. Delhi High Court"
                      />
                      {editErrors.courtName && (
                        <FieldError
                          ocid="my_profile.edit.court_name.error_state"
                          message={editErrors.courtName}
                        />
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="edit-office-address"
                        className="text-sm font-medium mb-1.5 block"
                      >
                        Office Address
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (Optional)
                        </span>
                      </Label>
                      <Input
                        id="edit-office-address"
                        data-ocid="my_profile.edit.office_address.input"
                        type="text"
                        value={editOfficeAddress}
                        onChange={(e) => setEditOfficeAddress(e.target.value)}
                        className="h-12 text-base rounded-xl"
                        placeholder="Chamber / Office address"
                      />
                    </div>
                  </>
                )}

                {/* State */}
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">
                    State
                  </Label>
                  <SearchableStateSelect
                    value={editState}
                    onChange={setEditState}
                    placeholder="Select your state"
                    ocid="my_profile.edit.state.select"
                  />
                  {editErrors.state && (
                    <FieldError
                      ocid="my_profile.edit.state.error_state"
                      message={editErrors.state}
                    />
                  )}
                </div>

                {/* City */}
                <div>
                  <Label
                    htmlFor="edit-city"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    City / District
                  </Label>
                  <Input
                    id="edit-city"
                    data-ocid="my_profile.edit.city.input"
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="h-12 text-base rounded-xl"
                    placeholder="Your city or district"
                  />
                  {editErrors.city && (
                    <FieldError
                      ocid="my_profile.edit.city.error_state"
                      message={editErrors.city}
                    />
                  )}
                </div>

                {/* Bio */}
                <div>
                  <Label
                    htmlFor="edit-bio"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    Bio
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (Optional)
                    </span>
                  </Label>
                  <Textarea
                    id="edit-bio"
                    data-ocid="my_profile.edit.bio.textarea"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Write a brief bio..."
                    className="min-h-[90px] text-base rounded-xl resize-none"
                    maxLength={500}
                  />
                </div>

                {/* Contact Email */}
                <div>
                  <Label
                    htmlFor="edit-contact-email"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    Contact Email
                  </Label>
                  <Input
                    id="edit-contact-email"
                    data-ocid="my_profile.edit.contact_email.input"
                    type="email"
                    value={editContactEmail}
                    onChange={(e) => setEditContactEmail(e.target.value)}
                    className="h-12 text-base rounded-xl"
                    placeholder="contact@email.com"
                    autoComplete="email"
                  />
                  {editErrors.contactEmail && (
                    <FieldError
                      ocid="my_profile.edit.contact_email.error_state"
                      message={editErrors.contactEmail}
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <Button
                    data-ocid="my_profile.edit.cancel.button"
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 h-11 rounded-xl text-sm font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    data-ocid="my_profile.edit.save.button"
                    type="submit"
                    className="flex-1 h-11 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* ── Change Password Form (inline) ── */}
          {isChangingPassword && (
            <div className="w-full mt-5 bg-white rounded-2xl border border-border shadow-sm p-5">
              <h2 className="text-sm font-bold text-foreground mb-4">
                Change Password
              </h2>
              <form
                onSubmit={handleChangePassword}
                className="flex flex-col gap-4"
                noValidate
              >
                {/* Current Password */}
                <div>
                  <Label
                    htmlFor="current-password"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    Current Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      data-ocid="my_profile.current_password.input"
                      type={showCurrentPw ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPwChangeError("");
                      }}
                      className="pr-12 h-12 text-base rounded-xl"
                      autoComplete="current-password"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                      tabIndex={-1}
                      aria-label={
                        showCurrentPw ? "Hide password" : "Show password"
                      }
                    >
                      {showCurrentPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <Label
                    htmlFor="new-password"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      data-ocid="my_profile.new_password.input"
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPwChangeError("");
                      }}
                      className="pr-12 h-12 text-base rounded-xl"
                      autoComplete="new-password"
                      placeholder="Minimum 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                      tabIndex={-1}
                      aria-label={showNewPw ? "Hide password" : "Show password"}
                    >
                      {showNewPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <Label
                    htmlFor="confirm-new-password"
                    className="text-sm font-medium mb-1.5 block"
                  >
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-new-password"
                      data-ocid="my_profile.confirm_password.input"
                      type={showConfirmNewPw ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setPwChangeError("");
                      }}
                      className="pr-12 h-12 text-base rounded-xl"
                      autoComplete="new-password"
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmNewPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
                      tabIndex={-1}
                      aria-label={
                        showConfirmNewPw ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirmNewPw ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {pwChangeError && (
                  <p
                    data-ocid="my_profile.change_password.error_state"
                    className="text-destructive text-sm"
                  >
                    {pwChangeError}
                  </p>
                )}

                <div className="flex gap-3 pt-1">
                  <Button
                    data-ocid="my_profile.change_password.cancel.button"
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPwChangeError("");
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmNewPassword("");
                    }}
                    className="flex-1 h-11 rounded-xl text-sm font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    data-ocid="my_profile.change_password.submit_button"
                    type="submit"
                    className="flex-1 h-11 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* ── Hidden file inputs ── */}
      <input
        ref={profilePhotoFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleProfilePhotoFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />
      <input
        ref={coverPhotoFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleCoverPhotoFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* ── Profile Photo Options Sheet ── */}
      <PhotoOptionsSheet
        open={profilePhotoSheetOpen}
        onClose={() => setProfilePhotoSheetOpen(false)}
        photoType="profile"
        currentPhoto={profile?.profilePhoto}
        onView={() =>
          setViewPhotoDialog({
            open: true,
            url: profile?.profilePhoto ?? "",
            alt: displayName,
          })
        }
        onChange={() => profilePhotoFileRef.current?.click()}
        onRemove={handleRemoveProfilePhoto}
      />

      {/* ── Cover Photo Options Sheet (advocate only) ── */}
      <PhotoOptionsSheet
        open={coverPhotoSheetOpen}
        onClose={() => setCoverPhotoSheetOpen(false)}
        photoType="cover"
        currentPhoto={profile?.coverPhoto}
        onView={() =>
          setViewPhotoDialog({
            open: true,
            url: profile?.coverPhoto ?? "",
            alt: "Cover Photo",
          })
        }
        onChange={() => coverPhotoFileRef.current?.click()}
        onRemove={handleRemoveCoverPhoto}
      />

      {/* ── View Photo Dialog ── */}
      {viewPhotoDialog.open && viewPhotoDialog.url && (
        <ViewPhotoDialog
          open={viewPhotoDialog.open}
          onClose={() => setViewPhotoDialog({ open: false, url: "", alt: "" })}
          photoUrl={viewPhotoDialog.url}
          altText={viewPhotoDialog.alt}
        />
      )}

      {/* ── Change Profile Photo Crop Dialog ── */}
      <Dialog
        open={changingPhoto === "profile"}
        onOpenChange={(v) => {
          if (!v) {
            setChangingPhoto(null);
            setNewProfilePhotoSrc(null);
          }
        }}
      >
        <DialogContent className="max-w-sm w-full p-5 rounded-2xl">
          <div className="mb-4">
            <h2 className="text-base font-bold text-foreground">
              Change Profile Photo
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Crop and position your photo
            </p>
          </div>
          <ProfilePhotoCropper
            onCropped={handleProfileCropDone}
            croppedUrl={null}
            initialSrc={newProfilePhotoSrc}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── AddEditCaseSheet ─────────────────────────────────────────────────────────

type AddEditCaseSheetProps = {
  open: boolean;
  onClose: () => void;
  advocateId: string;
  clientId: string;
  existingCase?: StoredCase;
  onSaved: () => void;
};

function AddEditCaseSheet({
  open,
  onClose,
  advocateId,
  clientId,
  existingCase,
  onSaved,
}: AddEditCaseSheetProps) {
  const isEdit = !!existingCase;

  const [caseTitle, setCaseTitle] = useState(existingCase?.caseTitle ?? "");
  const [caseNumber, setCaseNumber] = useState(existingCase?.caseNumber ?? "");
  const [courtName, setCourtName] = useState(existingCase?.courtName ?? "");
  const [caseType, setCaseType] = useState(existingCase?.caseType ?? "");
  const [caseStatus, setCaseStatus] = useState<CaseStatus>(
    (existingCase?.caseStatus as CaseStatus) ?? "Active",
  );
  const [nextHearingDate, setNextHearingDate] = useState(
    existingCase?.nextHearingDate ?? "",
  );
  const [notes, setNotes] = useState(existingCase?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset form when opening for a new case
  useEffect(() => {
    if (open) {
      setCaseTitle(existingCase?.caseTitle ?? "");
      setCaseNumber(existingCase?.caseNumber ?? "");
      setCourtName(existingCase?.courtName ?? "");
      setCaseType(existingCase?.caseType ?? "");
      setCaseStatus((existingCase?.caseStatus as CaseStatus) ?? "Active");
      setNextHearingDate(existingCase?.nextHearingDate ?? "");
      setNotes(existingCase?.notes ?? "");
      setErrors({});
    }
  }, [open, existingCase]);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!caseTitle.trim()) errs.caseTitle = "Case title is required.";
    if (!caseNumber.trim()) errs.caseNumber = "Case number is required.";
    if (!courtName.trim()) errs.courtName = "Court name is required.";
    if (!caseType) errs.caseType = "Case type is required.";
    if (!caseStatus) errs.caseStatus = "Case status is required.";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setTimeout(() => {
      if (isEdit && existingCase) {
        updateCaseInStorage({
          ...existingCase,
          caseTitle: caseTitle.trim(),
          caseNumber: caseNumber.trim(),
          courtName: courtName.trim(),
          caseType,
          caseStatus,
          nextHearingDate,
          notes: notes.trim(),
        });
        toast.success("Case updated successfully");
      } else {
        addCaseToStorage({
          id: generateCaseId(),
          advocateId,
          clientId,
          caseTitle: caseTitle.trim(),
          caseNumber: caseNumber.trim(),
          courtName: courtName.trim(),
          caseType,
          caseStatus,
          nextHearingDate,
          notes: notes.trim(),
          createdAt: new Date().toISOString(),
        });
        toast.success("Case added successfully");
      }
      setSaving(false);
      onSaved();
      onClose();
    }, 400);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        data-ocid="case_form.sheet"
        side="bottom"
        className="rounded-t-2xl px-0 pb-safe max-h-[92dvh] overflow-y-auto"
      >
        <SheetHeader className="px-5 pb-3 border-b border-border">
          <SheetTitle className="text-base font-bold text-foreground">
            {isEdit ? "Edit Case" : "Add New Case"}
          </SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-4">
          {/* Case Title */}
          <div>
            <Label
              htmlFor="cf-title"
              className="text-sm font-medium mb-1.5 block"
            >
              Case Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cf-title"
              data-ocid="case_form.title.input"
              type="text"
              placeholder="e.g. Property Dispute – Sharma vs State"
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              className="h-12 text-base rounded-xl"
            />
            {errors.caseTitle && (
              <p className="text-destructive text-xs mt-1">
                {errors.caseTitle}
              </p>
            )}
          </div>

          {/* Case Number */}
          <div>
            <Label
              htmlFor="cf-number"
              className="text-sm font-medium mb-1.5 block"
            >
              Case Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cf-number"
              data-ocid="case_form.number.input"
              type="text"
              placeholder="e.g. CRM/1234/2025"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              className="h-12 text-base rounded-xl font-mono"
            />
            {errors.caseNumber && (
              <p className="text-destructive text-xs mt-1">
                {errors.caseNumber}
              </p>
            )}
          </div>

          {/* Court Name */}
          <div>
            <Label
              htmlFor="cf-court"
              className="text-sm font-medium mb-1.5 block"
            >
              Court Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cf-court"
              data-ocid="case_form.court.input"
              type="text"
              placeholder="e.g. Delhi High Court"
              value={courtName}
              onChange={(e) => setCourtName(e.target.value)}
              className="h-12 text-base rounded-xl"
            />
            {errors.courtName && (
              <p className="text-destructive text-xs mt-1">
                {errors.courtName}
              </p>
            )}
          </div>

          {/* Case Type */}
          <div>
            <Label
              htmlFor="cf-type"
              className="text-sm font-medium mb-1.5 block"
            >
              Case Type <span className="text-destructive">*</span>
            </Label>
            <Select value={caseType} onValueChange={setCaseType}>
              <SelectTrigger
                id="cf-type"
                data-ocid="case_form.type.select"
                className="h-12 text-base rounded-xl"
              >
                <SelectValue placeholder="Select case type" />
              </SelectTrigger>
              <SelectContent>
                {PRACTICE_AREAS.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.caseType && (
              <p className="text-destructive text-xs mt-1">{errors.caseType}</p>
            )}
          </div>

          {/* Case Status */}
          <div>
            <Label
              htmlFor="cf-status"
              className="text-sm font-medium mb-1.5 block"
            >
              Case Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={caseStatus}
              onValueChange={(v) => setCaseStatus(v as CaseStatus)}
            >
              <SelectTrigger
                id="cf-status"
                data-ocid="case_form.status.select"
                className="h-12 text-base rounded-xl"
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {CASE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.caseStatus && (
              <p className="text-destructive text-xs mt-1">
                {errors.caseStatus}
              </p>
            )}
          </div>

          {/* Next Hearing Date */}
          <div>
            <Label
              htmlFor="cf-date"
              className="text-sm font-medium mb-1.5 block"
            >
              Next Hearing Date
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (Optional)
              </span>
            </Label>
            <Input
              id="cf-date"
              data-ocid="case_form.date.input"
              type="date"
              value={nextHearingDate}
              onChange={(e) => setNextHearingDate(e.target.value)}
              className="h-12 text-base rounded-xl"
            />
          </div>

          {/* Notes */}
          <div>
            <Label
              htmlFor="cf-notes"
              className="text-sm font-medium mb-1.5 block"
            >
              Notes
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (Optional)
              </span>
            </Label>
            <Textarea
              id="cf-notes"
              data-ocid="case_form.notes.textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional case notes..."
              className="min-h-[90px] text-base rounded-xl resize-none"
              maxLength={500}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              data-ocid="case_form.cancel_button"
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl text-sm font-semibold"
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              data-ocid="case_form.submit_button"
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {saving ? "Saving…" : isEdit ? "Update Case" : "Add Case"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

// ─── CaseDocumentsSection ─────────────────────────────────────────────────────

function getDocTypeColor(docType: DocType): string {
  switch (docType) {
    case "Petition":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "Evidence":
      return "bg-green-100 text-green-700 border-green-200";
    case "Court Order":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "Affidavit":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Other":
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function getDocIcon(fileType: string) {
  if (fileType === "application/pdf")
    return <FileText className="w-5 h-5 text-red-500 shrink-0" />;
  if (
    fileType === "application/msword" ||
    fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return <FileText className="w-5 h-5 text-blue-500 shrink-0" />;
  if (fileType.startsWith("image/"))
    return <ImageIcon className="w-5 h-5 text-emerald-500 shrink-0" />;
  return <File className="w-5 h-5 text-muted-foreground shrink-0" />;
}

type CaseDocumentsSectionProps = {
  caseId: string;
  advocateId: string;
  clientId: string;
  currentUserMobile: string;
  role: "advocate" | "client";
  advocateName: string;
};

function CaseDocumentsSection({
  caseId,
  advocateId,
  clientId,
  currentUserMobile,
  role,
  advocateName,
}: CaseDocumentsSectionProps) {
  const isAdvocate = role === "advocate";
  const hasAccess =
    currentUserMobile === advocateId || currentUserMobile === clientId;

  // All hooks must come before any conditional return
  const [docs, setDocs] = useState<StoredDocument[]>(() =>
    getDocumentsForCase(caseId),
  );
  const [filterType, setFilterType] = useState<DocType | "All">("All");
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docType, setDocType] = useState<DocType>("Petition");
  const [docNotes, setDocNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Access control — after hooks
  if (!hasAccess) return null;

  function refreshDocs() {
    setDocs(getDocumentsForCase(caseId));
  }

  const filteredDocs =
    filterType === "All" ? docs : docs.filter((d) => d.docType === filterType);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError("");

    // Validate extension
    const ext = `.${file.name.split(".").pop()?.toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFileError(
        "Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, PNG are allowed.",
      );
      e.target.value = "";
      return;
    }

    // Validate MIME
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setFileError(
        "Invalid file type. Only PDF, DOC, DOCX, JPG, JPEG, PNG are allowed.",
      );
      e.target.value = "";
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File size exceeds the 25 MB limit.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  }

  function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setFileError("");

    if (!selectedFile) {
      setFileError("Please select a file to upload.");
      return;
    }
    if (!docTitle.trim()) {
      setFileError("Please enter a document title.");
      return;
    }

    setUploading(true);

    // Use a short timeout to let the browser paint the "Uploading…" state
    setTimeout(() => {
      try {
        const docId = generateDocId();
        // Store blob in memory for view/download during this session
        docBlobStore.set(docId, selectedFile!);

        const newDoc: StoredDocument = {
          id: docId,
          caseId,
          advocateId,
          clientId,
          title: docTitle.trim(),
          docType,
          notes: docNotes.trim(),
          fileName: selectedFile!.name,
          fileType: selectedFile!.type,
          uploadedAt: new Date().toISOString(),
          uploadedByName: advocateName,
        };

        saveDocumentToStorage(newDoc);
        refreshDocs();
        setUploading(false);
        setShowUploadForm(false);
        setSelectedFile(null);
        setDocTitle("");
        setDocType("Petition");
        setDocNotes("");
        setFileError("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.success("Document uploaded successfully");
      } catch (err) {
        setUploading(false);
        const msg =
          err instanceof DOMException && err.name === "QuotaExceededError"
            ? "Storage full. Please clear some data and try again."
            : "Upload failed. Please try again.";
        setFileError(msg);
        toast.error(msg);
      }
    }, 300);
  }

  function handleViewDocument(doc: StoredDocument) {
    const blob = docBlobStore.get(doc.id);
    if (!blob) {
      toast.error(
        "File preview is only available for documents uploaded in this session.",
      );
      return;
    }
    try {
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      toast.error("Failed to open document.");
    }
  }

  function handleDownloadDocument(doc: StoredDocument) {
    const blob = docBlobStore.get(doc.id);
    if (!blob) {
      toast.error(
        "Download is only available for documents uploaded in this session.",
      );
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  function handleDeleteConfirm() {
    if (!deletingDocId) return;
    deleteDocumentById(deletingDocId);
    refreshDocs();
    setDeletingDocId(null);
    toast.success("Document deleted");
  }

  return (
    <div data-ocid="docs.section" className="mt-3 border-t border-border pt-3">
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Documents</span>
          {docs.length > 0 && (
            <span className="text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {docs.length}
            </span>
          )}
        </div>
        {isAdvocate && (
          <button
            data-ocid="docs.add_document.button"
            type="button"
            onClick={() => {
              setShowUploadForm((v) => !v);
              setFileError("");
            }}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="w-3.5 h-3.5" />
            {showUploadForm ? "Cancel" : "Add Document"}
          </button>
        )}
      </div>

      {/* Upload form (advocate only) */}
      {isAdvocate && showUploadForm && (
        <form
          data-ocid="docs.upload_form.section"
          onSubmit={handleUpload}
          className="mb-4 bg-muted/40 rounded-xl border border-border p-4 flex flex-col gap-3"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Upload Document
          </p>

          {/* File picker */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">
              File{" "}
              <span className="text-muted-foreground font-normal">
                (PDF, DOC, DOCX, JPG, PNG · max 25 MB)
              </span>
            </Label>
            <button
              type="button"
              className="relative flex items-center gap-3 border-2 border-dashed border-border rounded-xl p-3 cursor-pointer hover:border-primary/50 transition-colors w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="w-5 h-5 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground truncate flex-1">
                {selectedFile ? selectedFile.name : "Tap to select file"}
              </span>
              {selectedFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="text-muted-foreground hover:text-destructive focus-visible:outline-none"
                  aria-label="Remove selected file"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </button>
            <input
              ref={fileInputRef}
              data-ocid="docs.file.upload_button"
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="sr-only"
            />
            {fileError && (
              <p
                data-ocid="docs.error_state"
                className="text-destructive text-xs mt-1.5"
              >
                {fileError}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">
              Document Title <span className="text-destructive">*</span>
            </Label>
            <Input
              data-ocid="docs.title.input"
              type="text"
              placeholder="e.g. Bail Application Petition"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="h-10 text-sm rounded-xl"
              required
            />
          </div>

          {/* Document Type */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">
              Document Type
            </Label>
            <Select
              value={docType}
              onValueChange={(v) => setDocType(v as DocType)}
            >
              <SelectTrigger
                data-ocid="docs.type.select"
                className="h-10 text-sm rounded-xl"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs font-medium mb-1.5 block">
              Notes{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              data-ocid="docs.notes.textarea"
              placeholder="Any notes about this document..."
              value={docNotes}
              onChange={(e) => setDocNotes(e.target.value)}
              className="text-sm rounded-xl resize-none min-h-[72px]"
            />
          </div>

          {/* Submit */}
          <Button
            data-ocid="docs.submit.upload_button"
            type="submit"
            disabled={uploading}
            className="h-10 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            {uploading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2 inline-block" />
                Uploading…
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </form>
      )}

      {/* Filter pills */}
      {docs.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {(["All", ...DOC_TYPES] as (DocType | "All")[]).map((t, i) => (
            <button
              key={t}
              data-ocid={`docs.filter.tab.${i + 1}`}
              type="button"
              onClick={() => setFilterType(t)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filterType === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {filteredDocs.length === 0 && (
        <div
          data-ocid="docs.empty_state"
          className="flex flex-col items-center justify-center text-center py-6 bg-muted/30 rounded-xl border border-dashed border-border"
        >
          <FileText className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <p className="text-xs font-semibold text-foreground">
            {isAdvocate
              ? filterType !== "All"
                ? `No ${filterType} documents`
                : "No documents uploaded yet."
              : "No documents available for this case."}
          </p>
          {isAdvocate && filterType === "All" && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Click 'Add Document' to upload.
            </p>
          )}
        </div>
      )}

      {/* Document cards */}
      {filteredDocs.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {filteredDocs.map((doc, idx) => (
            <div
              key={doc.id}
              data-ocid={`docs.item.${idx + 1}`}
              className="bg-white rounded-xl border border-border shadow-sm p-3 flex flex-col gap-2"
            >
              {/* Header row */}
              <div className="flex items-start gap-2.5">
                {getDocIcon(doc.fileType)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground leading-snug truncate">
                    {doc.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {doc.fileName}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${getDocTypeColor(doc.docType)}`}
                >
                  {doc.docType}
                </span>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-muted-foreground">
                  {new Date(doc.uploadedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                <span className="text-[11px] text-muted-foreground">
                  By: {doc.uploadedByName}
                </span>
              </div>

              {/* Notes */}
              {doc.notes && (
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {doc.notes}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1.5 border-t border-border flex-wrap">
                <button
                  data-ocid={`docs.view.button.${idx + 1}`}
                  type="button"
                  onClick={() => handleViewDocument(doc)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/5 px-2.5 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Document
                </button>
                <button
                  data-ocid={`docs.download.button.${idx + 1}`}
                  type="button"
                  onClick={() => handleDownloadDocument(doc)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-foreground/70 hover:bg-muted px-2.5 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
                {isAdvocate && (
                  <button
                    data-ocid={`docs.delete.button.${idx + 1}`}
                    type="button"
                    onClick={() => setDeletingDocId(doc.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 px-2.5 py-1.5 rounded-lg transition-colors ml-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={!!deletingDocId}
        onOpenChange={(v) => !v && setDeletingDocId(null)}
      >
        <AlertDialogContent data-ocid="docs.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="docs.delete.cancel_button"
              onClick={() => setDeletingDocId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="docs.delete.confirm_button"
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── CaseCard ─────────────────────────────────────────────────────────────────

type CaseCardProps = {
  c: StoredCase;
  index: number;
  isAdvocate: boolean;
  clientName?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  // Documents section
  showDocuments?: boolean;
  currentUserMobile?: string;
  advocateName?: string;
};

function CaseCard({
  c,
  index,
  isAdvocate,
  clientName,
  onEdit,
  onDelete,
  showDocuments = false,
  currentUserMobile,
  advocateName = "",
}: CaseCardProps) {
  const statusColor = getCaseStatusColor(c.caseStatus);
  const hearingInfo = c.nextHearingDate
    ? getHearingLabel(c.nextHearingDate)
    : null;

  return (
    <div
      data-ocid={`case_card.item.${index}`}
      className="bg-white rounded-2xl border border-border shadow-sm p-4 flex flex-col gap-2.5"
    >
      {/* Client name (shown on advocate hearings view) */}
      {clientName && (
        <p className="text-xs font-medium text-muted-foreground">
          Client: {clientName}
        </p>
      )}

      {/* Top row: title + status */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-foreground leading-snug flex-1 min-w-0">
          {c.caseTitle}
        </p>
        <span
          className={`shrink-0 inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}
        >
          {c.caseStatus}
        </span>
      </div>

      {/* Second row: case number + type */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-mono">
          {c.caseNumber}
        </span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/8 px-2 py-0.5 rounded-full">
          <Scale className="w-3 h-3" />
          {c.caseType}
        </span>
      </div>

      {/* Court */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Building2 className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{c.courtName}</span>
      </div>

      {/* Hearing date chip */}
      {hearingInfo && (
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
          <span
            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${hearingInfo.color}`}
          >
            {hearingInfo.label}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(`${c.nextHearingDate}T00:00:00`).toLocaleDateString(
              "en-IN",
              { day: "numeric", month: "short", year: "numeric" },
            )}
          </span>
        </div>
      )}

      {/* Notes (truncated) */}
      {c.notes && (
        <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
          {c.notes}
        </p>
      )}

      {/* Advocate actions */}
      {isAdvocate && (onEdit || onDelete) && (
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          {onEdit && (
            <button
              data-ocid={`case_card.edit_button.${index}`}
              type="button"
              onClick={onEdit}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Edit case"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              data-ocid={`case_card.delete_button.${index}`}
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/5 px-3 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Delete case"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      )}

      {/* Documents section */}
      {showDocuments && currentUserMobile && (
        <CaseDocumentsSection
          caseId={c.id}
          advocateId={c.advocateId}
          clientId={c.clientId}
          currentUserMobile={currentUserMobile}
          role={isAdvocate ? "advocate" : "client"}
          advocateName={advocateName}
        />
      )}
    </div>
  );
}

// ─── My Cases Page ────────────────────────────────────────────────────────────

function MyCasesPage({
  user,
  onBack,
  onLogout,
}: {
  user: StoredUser | null;
  onBack: () => void;
  onLogout: () => void;
}) {
  const profile = user ? loadProfile(user.mobile) : null;
  const isAdvocate = user?.role === "advocate";

  // Advocate state
  const advocateData = isAdvocate
    ? (loadAllAdvocateData().find((a) => a.userId === user?.mobile) ?? null)
    : null;
  const referralCode = advocateData?.referralCode ?? null;
  const allClients = referralCode ? getClientsForAdvocate(referralCode) : [];

  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [caseSheetOpen, setCaseSheetOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<StoredCase | undefined>(
    undefined,
  );
  const [caseListVersion, setCaseListVersion] = useState(0);
  const [deletingCaseId, setDeletingCaseId] = useState<string | null>(null);

  // Filter/sort state
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCourt, setFilterCourt] = useState("");
  const [sortBy, setSortBy] = useState("hearing");

  // Client view
  const clientData = !isAdvocate
    ? (loadAllClientData().find((c) => c.userId === user?.mobile) ?? null)
    : null;
  const connectedAdvocate = clientData?.linkedAdvocateId
    ? findAdvocateByCode(clientData.linkedAdvocateId)
    : null;

  // Cases for current context
  const rawCases: StoredCase[] = (() => {
    if (isAdvocate && selectedClientId) {
      return getCasesForAdvocateClient(user!.mobile, selectedClientId);
    }
    if (!isAdvocate && connectedAdvocate) {
      return getCasesForAdvocateClient(connectedAdvocate.userId, user!.mobile);
    }
    return [];
  })();
  // Re-evaluated when caseListVersion bumps
  void caseListVersion;

  const filteredCases = rawCases
    .filter((c) => {
      if (filterStatus !== "all" && c.caseStatus !== filterStatus) return false;
      if (
        filterCourt.trim() &&
        !c.courtName.toLowerCase().includes(filterCourt.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "hearing") {
        if (!a.nextHearingDate && !b.nextHearingDate) return 0;
        if (!a.nextHearingDate) return 1;
        if (!b.nextHearingDate) return -1;
        return (
          new Date(a.nextHearingDate).getTime() -
          new Date(b.nextHearingDate).getTime()
        );
      }
      // recently added
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  function handleCaseSaved() {
    setCaseListVersion((v) => v + 1);
  }

  function handleDeleteCase(id: string) {
    deleteCaseFromStorage(id);
    setDeletingCaseId(null);
    setCaseListVersion((v) => v + 1);
    toast.success("Case deleted");
  }

  const selectedClientProfile = selectedClientId
    ? loadProfile(selectedClientId)
    : null;
  const selectedClientData = selectedClientId
    ? (loadAllClientData().find((c) => c.userId === selectedClientId) ?? null)
    : null;
  const selectedClientName =
    selectedClientProfile?.fullName || selectedClientData?.name || "Client";

  return (
    <div
      data-ocid="my_cases.section"
      className="flex flex-col min-h-screen bg-background"
    >
      <PageHeader
        user={user}
        profile={profile}
        onBack={onBack}
        onLogout={onLogout}
        backLabel="Back to Dashboard"
      />

      <main className="flex flex-col flex-1 overflow-y-auto px-5 pt-2 pb-8">
        {/* ── Advocate view ── */}
        {isAdvocate && !selectedClientId && (
          <>
            <div className="mb-4">
              <h1 className="text-lg font-bold text-foreground">My Cases</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select a client to view or manage their cases
              </p>
            </div>

            {allClients.length === 0 ? (
              <div
                data-ocid="my_cases.empty_state"
                className="flex flex-col flex-1 items-center justify-center text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                  <Briefcase className="w-9 h-9 text-indigo-300" />
                </div>
                <p className="text-base font-semibold text-foreground">
                  No clients yet.
                </p>
                <p className="text-sm text-muted-foreground mt-2 max-w-[260px] leading-relaxed">
                  Share your referral code with your clients to connect.
                </p>
              </div>
            ) : (
              <div
                data-ocid="my_cases.client_list"
                className="flex flex-col gap-3"
              >
                {allClients.map((client, idx) => {
                  const cp = loadProfile(client.userId);
                  const cName = cp?.fullName || client.name || "Client";
                  const cLocation = [cp?.city, cp?.state]
                    .filter(Boolean)
                    .join(", ");
                  const caseCount = getCasesForAdvocateClient(
                    user!.mobile,
                    client.userId,
                  ).length;
                  const cInitials = cName
                    .split(" ")
                    .map((w: string) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <button
                      key={client.userId}
                      data-ocid={`my_cases.client_item.${idx + 1}`}
                      type="button"
                      onClick={() => setSelectedClientId(client.userId)}
                      className="w-full bg-white rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3 text-left hover:border-primary/30 hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="w-11 h-11 rounded-full border-2 border-border overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
                        {cp?.profilePhoto ? (
                          <img
                            src={cp.profilePhoto}
                            alt={cName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-primary">
                            {cInitials}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">
                          {cName}
                        </p>
                        {cLocation && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {cLocation}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {caseCount} {caseCount === 1 ? "case" : "cases"}
                        </span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── Advocate: Client case list ── */}
        {isAdvocate && selectedClientId && (
          <>
            {/* Back to clients button */}
            <button
              data-ocid="my_cases.back_to_clients.button"
              type="button"
              onClick={() => setSelectedClientId(null)}
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none mb-3"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to clients
            </button>

            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-base font-bold text-foreground">
                  Cases – {selectedClientName}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {filteredCases.length} case
                  {filteredCases.length !== 1 ? "s" : ""}
                </p>
              </div>
              <button
                data-ocid="my_cases.add_button"
                type="button"
                onClick={() => {
                  setEditingCase(undefined);
                  setCaseSheetOpen(true);
                }}
                className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Case
              </button>
            </div>

            {/* Filter bar */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger
                  data-ocid="my_cases.filter.select"
                  className="h-9 text-xs rounded-xl flex-1 min-w-[110px]"
                >
                  <Filter className="w-3 h-3 mr-1 shrink-0" />
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {CASE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger
                  data-ocid="my_cases.sort.select"
                  className="h-9 text-xs rounded-xl flex-1 min-w-[120px]"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hearing">Next Hearing Date</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                </SelectContent>
              </Select>

              <Input
                data-ocid="my_cases.court_filter.input"
                type="text"
                placeholder="Search court..."
                value={filterCourt}
                onChange={(e) => setFilterCourt(e.target.value)}
                className="h-9 text-xs rounded-xl flex-1 min-w-[120px]"
              />
            </div>

            {filteredCases.length === 0 ? (
              <div
                data-ocid="my_cases.empty_state"
                className="flex flex-col items-center justify-center text-center py-10"
              >
                <CalendarDays className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-semibold text-foreground">
                  No cases yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tap "Add Case" to create the first case for this client.
                </p>
              </div>
            ) : (
              <div data-ocid="my_cases.list" className="flex flex-col gap-3">
                {filteredCases.map((c, idx) => (
                  <CaseCard
                    key={c.id}
                    c={c}
                    index={idx + 1}
                    isAdvocate
                    onEdit={() => {
                      setEditingCase(c);
                      setCaseSheetOpen(true);
                    }}
                    onDelete={() => setDeletingCaseId(c.id)}
                    showDocuments
                    currentUserMobile={user!.mobile}
                    advocateName={profile?.fullName || "Advocate"}
                  />
                ))}
              </div>
            )}

            {/* Add/Edit Sheet */}
            <AddEditCaseSheet
              open={caseSheetOpen}
              onClose={() => setCaseSheetOpen(false)}
              advocateId={user!.mobile}
              clientId={selectedClientId}
              existingCase={editingCase}
              onSaved={handleCaseSaved}
            />

            {/* Delete confirm dialog */}
            <AlertDialog
              open={!!deletingCaseId}
              onOpenChange={(v) => !v && setDeletingCaseId(null)}
            >
              <AlertDialogContent data-ocid="my_cases.delete_confirm.dialog">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Case?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this case and cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    data-ocid="my_cases.delete_confirm.cancel_button"
                    onClick={() => setDeletingCaseId(null)}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-ocid="my_cases.delete_confirm.confirm_button"
                    onClick={() =>
                      deletingCaseId && handleDeleteCase(deletingCaseId)
                    }
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Yes, Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {/* ── Client view ── */}
        {!isAdvocate && (
          <>
            <div className="mb-4">
              <h1 className="text-lg font-bold text-foreground">My Cases</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cases assigned by your advocate
              </p>
            </div>

            {!connectedAdvocate ? (
              <div
                data-ocid="my_cases.empty_state"
                className="flex flex-col flex-1 items-center justify-center text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                  <Briefcase className="w-9 h-9 text-indigo-300" />
                </div>
                <p className="text-base font-semibold text-foreground">
                  No advocate connected.
                </p>
                <p className="text-sm text-muted-foreground mt-2 max-w-[260px] leading-relaxed">
                  Connect with an advocate to view your cases.
                </p>
              </div>
            ) : (
              <>
                {/* Filter bar */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger
                      data-ocid="my_cases.filter.select"
                      className="h-9 text-xs rounded-xl flex-1 min-w-[110px]"
                    >
                      <Filter className="w-3 h-3 mr-1 shrink-0" />
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {CASE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger
                      data-ocid="my_cases.sort.select"
                      className="h-9 text-xs rounded-xl flex-1 min-w-[120px]"
                    >
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hearing">Next Hearing Date</SelectItem>
                      <SelectItem value="recent">Recently Added</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    data-ocid="my_cases.court_filter.input"
                    type="text"
                    placeholder="Search court..."
                    value={filterCourt}
                    onChange={(e) => setFilterCourt(e.target.value)}
                    className="h-9 text-xs rounded-xl flex-1 min-w-[120px]"
                  />
                </div>

                {filteredCases.length === 0 ? (
                  <div
                    data-ocid="my_cases.empty_state"
                    className="flex flex-col items-center justify-center text-center py-10"
                  >
                    <CalendarDays className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm font-semibold text-foreground">
                      No cases assigned yet.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your advocate will add cases here.
                    </p>
                  </div>
                ) : (
                  <div
                    data-ocid="my_cases.list"
                    className="flex flex-col gap-3"
                  >
                    {filteredCases.map((c, idx) => {
                      const advProfile = connectedAdvocate
                        ? loadProfile(connectedAdvocate.userId)
                        : null;
                      const advName =
                        advProfile?.fullName ||
                        connectedAdvocate?.name ||
                        "Advocate";
                      return (
                        <CaseCard
                          key={c.id}
                          c={c}
                          index={idx + 1}
                          isAdvocate={false}
                          showDocuments
                          currentUserMobile={user!.mobile}
                          advocateName={advName}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── HearingsPage ─────────────────────────────────────────────────────────────

function HearingsPage({
  user,
  onBack,
  onLogout,
}: {
  user: StoredUser | null;
  onBack: () => void;
  onLogout: () => void;
}) {
  const profile = user ? loadProfile(user.mobile) : null;
  const isAdvocate = user?.role === "advocate";

  const upcoming = user ? getAllUpcomingHearings(user.mobile, user.role) : [];

  // Group hearings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const groups: { label: string; items: StoredCase[] }[] = [
    {
      label: "Today",
      items: upcoming.filter((c) => {
        const d = new Date(c.nextHearingDate);
        return d.getTime() === today.getTime();
      }),
    },
    {
      label: "Tomorrow",
      items: upcoming.filter((c) => {
        const d = new Date(c.nextHearingDate);
        return d.getTime() === tomorrow.getTime();
      }),
    },
    {
      label: "Next 7 Days",
      items: upcoming.filter((c) => {
        const d = new Date(c.nextHearingDate);
        return d > tomorrow && d <= nextWeek;
      }),
    },
    {
      label: "Later",
      items: upcoming.filter((c) => {
        const d = new Date(c.nextHearingDate);
        return d > nextWeek;
      }),
    },
  ];

  return (
    <div
      data-ocid="hearings.section"
      className="flex flex-col min-h-screen bg-background"
    >
      <PageHeader
        user={user}
        profile={profile}
        onBack={onBack}
        onLogout={onLogout}
        backLabel="Back to Dashboard"
      />

      <main className="flex flex-col flex-1 overflow-y-auto px-5 pt-2 pb-8">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-foreground">
            Upcoming Hearings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {upcoming.length} hearing{upcoming.length !== 1 ? "s" : ""}{" "}
            scheduled
          </p>
        </div>

        {upcoming.length === 0 ? (
          <div
            data-ocid="hearings.empty_state"
            className="flex flex-col flex-1 items-center justify-center text-center py-12"
          >
            <CalendarDays className="w-16 h-16 text-muted-foreground/20 mb-4" />
            <p className="text-base font-semibold text-foreground">
              No upcoming hearings
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-[240px] leading-relaxed">
              Hearings will appear here as you add cases with hearing dates.
            </p>
          </div>
        ) : (
          <div data-ocid="hearings.list" className="flex flex-col gap-6">
            {groups.map((group) => {
              if (group.items.length === 0) return null;
              return (
                <div key={group.label}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </span>
                    <span className="text-xs font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                      {group.items.length}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="flex flex-col gap-3">
                    {group.items.map((c, idx) => {
                      const clientData = loadAllClientData().find(
                        (cd) => cd.userId === c.clientId,
                      );
                      const clientProfile = loadProfile(c.clientId);
                      const clientName =
                        clientProfile?.fullName || clientData?.name || "Client";
                      return (
                        <div key={c.id} data-ocid={`hearings.item.${idx + 1}`}>
                          <CaseCard
                            c={c}
                            index={idx + 1}
                            isAdvocate={false}
                            clientName={isAdvocate ? clientName : undefined}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Messages Page (Conversation List) ───────────────────────────────────────

function MessagesPage({
  user,
  onBack,
  onLogout,
  onOpenChat,
}: {
  user: StoredUser | null;
  onBack: () => void;
  onLogout: () => void;
  onOpenChat: (partnerUserId: string) => void;
}) {
  const profile = user ? loadProfile(user.mobile) : null;
  const isAdvocate = user?.role === "advocate";

  // Re-render trigger for unread counts (updates on mount)
  const [, setTick] = useState(0);
  useEffect(() => {
    setTick((v) => v + 1);
  }, []);

  // Build conversation list
  type ConvItem = {
    partnerId: string;
    partnerName: string;
    partnerInitials: string;
    partnerPhoto: string | undefined;
    conversationId: string;
    lastMsg: StoredMessage | null;
    unread: number;
  };

  let conversations: ConvItem[] = [];

  if (isAdvocate && user) {
    const advData = loadAllAdvocateData().find((a) => a.userId === user.mobile);
    const clients = advData ? getClientsForAdvocate(advData.referralCode) : [];
    conversations = clients.map((c) => {
      const cProfile = loadProfile(c.userId);
      const name = cProfile?.fullName || c.name || "Client";
      const initials = name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
      const convId = getConversationId(user.mobile, c.userId);
      return {
        partnerId: c.userId,
        partnerName: name,
        partnerInitials: initials,
        partnerPhoto: cProfile?.profilePhoto,
        conversationId: convId,
        lastMsg: getConversationLastMessage(convId),
        unread: getUnreadCount(convId, user.mobile),
      };
    });
  } else if (!isAdvocate && user) {
    const clientData = loadAllClientData().find(
      (c) => c.userId === user.mobile,
    );
    if (clientData?.linkedAdvocateId) {
      const advocate = loadAllAdvocateData().find(
        (a) =>
          a.referralCode.toUpperCase() ===
          clientData.linkedAdvocateId!.toUpperCase(),
      );
      if (advocate) {
        const advProfile = loadProfile(advocate.userId);
        const name = advProfile?.fullName || advocate.name || "Advocate";
        const initials = name
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
        const convId = getConversationId(user.mobile, advocate.userId);
        conversations = [
          {
            partnerId: advocate.userId,
            partnerName: name,
            partnerInitials: initials,
            partnerPhoto: advProfile?.profilePhoto,
            conversationId: convId,
            lastMsg: getConversationLastMessage(convId),
            unread: getUnreadCount(convId, user.mobile),
          },
        ];
      }
    }
  }

  // Sort by last message time descending
  conversations.sort((a, b) => {
    if (!a.lastMsg && !b.lastMsg) return 0;
    if (!a.lastMsg) return 1;
    if (!b.lastMsg) return -1;
    return (
      new Date(b.lastMsg.timestamp).getTime() -
      new Date(a.lastMsg.timestamp).getTime()
    );
  });

  return (
    <div
      data-ocid="messages.section"
      className="flex flex-col min-h-screen bg-background"
    >
      <PageHeader
        user={user}
        profile={profile}
        onBack={onBack}
        onLogout={onLogout}
        backLabel="Back to Dashboard"
      />

      <main className="flex flex-col flex-1 overflow-y-auto px-4 pt-2 pb-8">
        <div className="mb-4 px-1">
          <h1 className="text-lg font-bold text-foreground">Messages</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAdvocate
              ? "Conversations with your clients"
              : "Chat with your advocate"}
          </p>
        </div>

        {conversations.length === 0 ? (
          <div
            data-ocid="messages.empty_state"
            className="flex flex-col flex-1 items-center justify-center text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-sky-50 flex items-center justify-center mb-4">
              <MessageCircle className="w-9 h-9 text-sky-300" />
            </div>
            <p className="text-base font-semibold text-foreground">
              No conversations yet
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-[260px] leading-relaxed">
              {isAdvocate
                ? "No clients connected yet. Connect clients using your referral code."
                : "Connect with an advocate using their referral code to start messaging."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {conversations.map((conv, idx) => {
              const preview = conv.lastMsg
                ? conv.lastMsg.fileAttachment
                  ? `📎 ${conv.lastMsg.fileAttachment.fileName}`
                  : conv.lastMsg.text.length > 42
                    ? `${conv.lastMsg.text.slice(0, 42)}…`
                    : conv.lastMsg.text
                : "No messages yet";
              const timeStr = conv.lastMsg
                ? formatMsgTime(conv.lastMsg.timestamp)
                : "";
              return (
                <button
                  key={conv.partnerId}
                  data-ocid={`messages.conversation.item.${idx + 1}`}
                  type="button"
                  onClick={() => onOpenChat(conv.partnerId)}
                  className="flex items-center gap-3 bg-white rounded-2xl border border-border shadow-sm px-4 py-3 hover:shadow-md hover:border-primary/20 transition-all duration-150 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-border bg-primary/10 flex items-center justify-center">
                      {conv.partnerPhoto ? (
                        <img
                          src={conv.partnerPhoto}
                          alt={conv.partnerName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {conv.partnerInitials}
                        </span>
                      )}
                    </div>
                    {/* Online dot */}
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm font-bold truncate ${conv.unread > 0 ? "text-foreground" : "text-foreground/90"}`}
                      >
                        {conv.partnerName}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {timeStr}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <span
                        className={`text-xs truncate ${conv.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}
                      >
                        {preview}
                      </span>
                      {conv.unread > 0 && (
                        <span className="shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                          {conv.unread > 99 ? "99+" : conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Chat Screen ──────────────────────────────────────────────────────────────

function ChatScreen({
  user,
  partnerUserId,
  onBack,
  onLogout,
}: {
  user: StoredUser | null;
  partnerUserId: string;
  onBack: () => void;
  onLogout: () => void;
}) {
  const myProfile = user ? loadProfile(user.mobile) : null;
  const partnerProfile = loadProfile(partnerUserId);
  const partnerName =
    partnerProfile?.fullName ||
    (user?.role === "advocate" ? "Client" : "Advocate");
  const partnerInitials = partnerName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const conversationId = user
    ? getConversationId(user.mobile, partnerUserId)
    : "";

  const [messages, setMessages] = useState<StoredMessage[]>(() =>
    user ? loadConversationMessages(conversationId) : [],
  );
  const [inputText, setInputText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mark as seen on mount and whenever messages change
  useEffect(() => {
    if (user && conversationId) {
      markConversationAsSeen(conversationId, user.mobile);
    }
  }, [conversationId, user]);

  // Auto-scroll to bottom whenever messages update
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reload messages from storage to pick up seen state changes
  useEffect(() => {
    if (conversationId) {
      setMessages(loadConversationMessages(conversationId));
    }
  }, [conversationId]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error("Only PDF, DOC, DOCX, JPG, PNG files are allowed.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("File size exceeds the 25 MB limit.");
      return;
    }
    setPendingFile(file);
    // Reset file input so same file can be re-selected
    e.target.value = "";
  }

  function handleSend() {
    if (!user || (!inputText.trim() && !pendingFile)) return;
    setIsSending(true);

    const myName =
      myProfile?.fullName ||
      (user.mobile === "google-demo" ? "Demo User" : "User");

    let fileAttachment: StoredMessage["fileAttachment"] | undefined = undefined;
    if (pendingFile) {
      const fileId = generateChatFileId();
      chatFileBlobStore.set(fileId, pendingFile);
      fileAttachment = {
        id: fileId,
        fileName: pendingFile.name,
        fileSize: pendingFile.size,
        fileType: pendingFile.type,
      };
    }

    const msg: StoredMessage = {
      id: generateMsgId(),
      conversationId,
      senderId: user.mobile,
      senderName: myName,
      senderRole: user.role,
      text: inputText.trim(),
      fileAttachment,
      timestamp: new Date().toISOString(),
      seen: false,
    };

    saveMessageToStorage(msg);
    setMessages(loadConversationMessages(conversationId));
    setInputText("");
    setPendingFile(null);
    setIsSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function downloadChatFile(fileId: string, fileName: string) {
    const blob = chatFileBlobStore.get(fileId);
    if (!blob) {
      toast.error("File unavailable – please re-upload.");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  const canSend = inputText.trim().length > 0 || pendingFile !== null;

  return (
    <div
      data-ocid="chat.section"
      className="flex flex-col min-h-screen bg-background"
    >
      {/* ── Chat header ── */}
      <header className="sticky top-0 z-10 flex items-center gap-3 w-full px-4 py-3 border-b border-border bg-white shadow-sm">
        <button
          data-ocid="chat.back.button"
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring -ml-1 shrink-0"
          aria-label="Back to messages"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Partner avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border bg-primary/10 flex items-center justify-center">
            {partnerProfile?.profilePhoto ? (
              <img
                src={partnerProfile.profilePhoto}
                alt={partnerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-primary">
                {partnerInitials}
              </span>
            )}
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
        </div>

        {/* Partner info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate">
            {partnerName}
          </p>
          <p className="text-xs text-green-500 font-medium">Online</p>
        </div>

        {/* Sign out */}
        <button
          data-ocid="page.logout.button"
          type="button"
          onClick={onLogout}
          className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
          aria-label="Sign out"
        >
          Sign out
        </button>
      </header>

      {/* ── Message list ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {messages.length === 0 ? (
          <div
            data-ocid="chat.empty_state"
            className="flex flex-col flex-1 items-center justify-center text-center py-16"
          >
            <div className="w-16 h-16 rounded-full bg-sky-50 flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-sky-300" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Start a conversation
            </p>
            <p className="text-xs text-muted-foreground mt-1">Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = user && msg.senderId === user.mobile;
            const FileIconComp = msg.fileAttachment
              ? getFileIcon(msg.fileAttachment.fileType)
              : File;
            const blobAvailable = msg.fileAttachment
              ? chatFileBlobStore.has(msg.fileAttachment.id)
              : false;

            return (
              <div
                key={msg.id}
                data-ocid={`chat.message.item.${idx + 1}`}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} gap-0.5`}
              >
                {/* Sender name for partner messages */}
                {!isMe && (
                  <span className="text-[11px] text-muted-foreground font-medium px-1 mb-0.5">
                    {msg.senderName}
                  </span>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  {/* Text */}
                  {msg.text && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                  )}

                  {/* File attachment */}
                  {msg.fileAttachment && (
                    <div
                      className={`mt-1.5 rounded-xl border p-2.5 flex items-center gap-2.5 ${
                        isMe
                          ? "bg-white/15 border-white/20"
                          : "bg-white border-border"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isMe ? "bg-white/20" : "bg-primary/10"
                        }`}
                      >
                        <FileIconComp
                          className={`w-4 h-4 ${isMe ? "text-white" : "text-primary"}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-semibold truncate ${isMe ? "text-white" : "text-foreground"}`}
                        >
                          {msg.fileAttachment.fileName}
                        </p>
                        <p
                          className={`text-[10px] mt-0.5 ${isMe ? "text-white/70" : "text-muted-foreground"}`}
                        >
                          {formatFileSize(msg.fileAttachment.fileSize)}
                        </p>
                      </div>
                      {blobAvailable ? (
                        <button
                          type="button"
                          onClick={() =>
                            downloadChatFile(
                              msg.fileAttachment!.id,
                              msg.fileAttachment!.fileName,
                            )
                          }
                          className={`shrink-0 p-1.5 rounded-lg transition-colors ${
                            isMe
                              ? "text-white hover:bg-white/20"
                              : "text-primary hover:bg-primary/10"
                          } focus-visible:outline-none`}
                          aria-label="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span
                          className={`text-[10px] shrink-0 ${isMe ? "text-white/60" : "text-muted-foreground"}`}
                        >
                          Unavailable
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Timestamp + tick (my messages only) */}
                {isMe && (
                  <div className="flex items-center gap-1 px-1">
                    <span className="text-[10px] text-muted-foreground">
                      {formatMsgTime(msg.timestamp)}
                    </span>
                    {msg.seen ? (
                      <CheckCheck className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Check className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                )}
                {/* Timestamp for partner messages */}
                {!isMe && (
                  <span className="text-[10px] text-muted-foreground px-1">
                    {formatMsgTime(msg.timestamp)}
                  </span>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* ── Input bar ── */}
      <div className="sticky bottom-0 z-10 bg-white border-t border-border px-3 py-2.5">
        {/* Pending file preview */}
        {pendingFile && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-xl px-3 py-2 mb-2">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs font-medium text-foreground truncate flex-1">
              {pendingFile.name}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {formatFileSize(pendingFile.size)}
            </span>
            <button
              type="button"
              onClick={() => setPendingFile(null)}
              className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
              aria-label="Remove file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* File attach button */}
          <button
            data-ocid="chat.attach_button"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Text input */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              data-ocid="chat.input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-border bg-muted/30 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              style={{
                maxHeight: "4.5rem",
                overflowY: "auto",
                lineHeight: "1.4",
              }}
            />
          </div>

          {/* Send button */}
          <button
            data-ocid="chat.send_button"
            type="button"
            onClick={handleSend}
            disabled={!canSend || isSending}
            className="shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── My Clients Page ──────────────────────────────────────────────────────────

function MyClientsPage({
  user,
  onBack,
  onLogout,
  onViewProfile,
  onMessageClient,
}: {
  user: StoredUser | null;
  onBack: () => void;
  onLogout: () => void;
  onViewProfile: (clientUserId: string) => void;
  onMessageClient?: (clientUserId: string) => void;
}) {
  // Role guard — only advocates can access this page
  useEffect(() => {
    if (user?.role !== "advocate") {
      onBack();
    }
  }, [user, onBack]);

  if (user?.role !== "advocate") return null;

  const profile = user ? loadProfile(user.mobile) : null;

  // Get advocate's referral code
  const advocateData = user
    ? (loadAllAdvocateData().find((a) => a.userId === user.mobile) ?? null)
    : null;
  const referralCode = advocateData?.referralCode ?? null;

  // Get all connected clients
  const clients = referralCode ? getClientsForAdvocate(referralCode) : [];

  return (
    <div
      data-ocid="my_clients.section"
      className="flex flex-col min-h-screen bg-background"
    >
      <PageHeader
        user={user}
        profile={profile}
        onBack={onBack}
        onLogout={onLogout}
        backLabel="Back to Dashboard"
      />

      <main className="flex flex-col flex-1 overflow-y-auto px-5 pt-2 pb-8">
        {/* Count header */}
        <div className="mb-4">
          <h1 className="text-lg font-bold text-foreground">
            My Clients ({clients.length})
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Clients connected via your referral code
          </p>
        </div>

        {clients.length === 0 ? (
          <div
            data-ocid="my_clients.empty_state"
            className="flex flex-col flex-1 items-center justify-center text-center py-12"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <Users className="w-9 h-9 text-emerald-300" />
            </div>
            <p className="text-base font-semibold text-foreground">
              No clients connected yet.
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-[260px] leading-relaxed">
              Share your referral code with your clients to connect.
            </p>
            {referralCode && (
              <div className="mt-5 bg-primary/5 border border-primary/20 rounded-xl px-5 py-3">
                <p className="text-xs text-muted-foreground mb-1">
                  Your referral code
                </p>
                <p className="font-mono text-lg font-bold text-primary tracking-widest">
                  {referralCode}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {clients.map((client, idx) => {
              const clientProfile = loadProfile(client.userId);
              const clientName =
                clientProfile?.fullName || client.name || "Client";
              const clientInitials = clientName
                .split(" ")
                .map((w: string) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const location = [clientProfile?.city, clientProfile?.state]
                .filter(Boolean)
                .join(", ");
              const mobileDisplay = client.userId.startsWith("+")
                ? client.userId
                : `+91 ${client.userId}`;

              return (
                <div
                  key={client.userId}
                  data-ocid={`my_clients.item.${idx + 1}`}
                  className="bg-white rounded-2xl border border-border shadow-sm p-4 flex items-center gap-3"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full border-2 border-border overflow-hidden shrink-0 bg-primary/10 flex items-center justify-center">
                    {clientProfile?.profilePhoto ? (
                      <img
                        src={clientProfile.profilePhoto}
                        alt={clientName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-primary">
                        {clientInitials}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {clientName}
                    </p>
                    {location && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {location}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mobileDisplay}
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      data-ocid={`my_clients.view_profile.button.${idx + 1}`}
                      type="button"
                      onClick={() => onViewProfile(client.userId)}
                      className="text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap"
                    >
                      View Profile
                    </button>
                    {onMessageClient && (
                      <button
                        data-ocid={`my_clients.message.button.${idx + 1}`}
                        type="button"
                        onClick={() => onMessageClient(client.userId)}
                        className="text-xs font-semibold text-primary-foreground bg-primary rounded-lg px-3 py-1.5 hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-nowrap flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" />
                        Message
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Client Profile Page ──────────────────────────────────────────────────────

function ClientProfilePage({
  clientUserId,
  user,
  onBack,
  onLogout,
  onMessageClient,
}: {
  clientUserId: string;
  user: StoredUser | null;
  onBack: () => void;
  onLogout: () => void;
  onMessageClient?: (clientUserId: string) => void;
}) {
  const myProfile = user ? loadProfile(user.mobile) : null;
  const clientProfile = loadProfile(clientUserId);
  const clientData =
    loadAllClientData().find((c) => c.userId === clientUserId) ?? null;

  const clientName = clientProfile?.fullName || clientData?.name || "Client";
  const clientInitials = clientName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const location = [clientProfile?.city, clientProfile?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      data-ocid="client_profile.section"
      className="flex flex-col min-h-screen bg-background"
    >
      <PageHeader
        user={user}
        profile={myProfile}
        onBack={onBack}
        onLogout={onLogout}
        backLabel="Back to My Clients"
      />

      <main className="flex flex-col flex-1 overflow-y-auto pb-8">
        <div className="flex flex-col items-center px-6 pt-6">
          {/* Client avatar */}
          <div className="w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-primary/10 flex items-center justify-center">
            {clientProfile?.profilePhoto ? (
              <img
                src={clientProfile.profilePhoto}
                alt={clientName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold text-primary">
                {clientInitials}
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="mt-3 text-xl font-bold text-foreground tracking-tight text-center">
            {clientName}
          </h1>

          {/* Location */}
          {location && (
            <p className="text-sm text-muted-foreground mt-1">{location}</p>
          )}

          {/* Details card */}
          <div className="w-full mt-5 bg-white rounded-2xl border border-border shadow-sm divide-y divide-border">
            {location && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Location
                </span>
                <span className="text-sm font-semibold text-foreground text-right">
                  {location}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs text-muted-foreground font-medium">
                Mobile
              </span>
              <span className="text-sm font-semibold text-foreground">
                +91 {clientUserId}
              </span>
            </div>
          </div>

          {/* Bio */}
          {clientProfile?.bio && (
            <div className="w-full mt-4 bg-white rounded-2xl border border-border shadow-sm p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Bio
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {clientProfile.bio}
              </p>
            </div>
          )}

          {/* Cases section (advocate view) */}
          {user?.role === "advocate" && (
            <ClientProfileCasesSection
              user={user}
              clientUserId={clientUserId}
              clientName={clientName}
            />
          )}

          {/* Message Client button */}
          <Button
            data-ocid="client_profile.message.button"
            type="button"
            onClick={() =>
              onMessageClient
                ? onMessageClient(clientUserId)
                : toast.info("Messaging coming soon")
            }
            className="mt-6 w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Message Client
          </Button>
        </div>
      </main>
    </div>
  );
}

// ─── ClientProfileCasesSection ────────────────────────────────────────────────

function ClientProfileCasesSection({
  user,
  clientUserId,
  clientName,
}: {
  user: StoredUser;
  clientUserId: string;
  clientName: string;
}) {
  const [caseSheetOpen, setCaseSheetOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<StoredCase | undefined>(
    undefined,
  );
  const [caseListVersion, setCaseListVersion] = useState(0);
  const [deletingCaseId, setDeletingCaseId] = useState<string | null>(null);

  void clientName;

  const cases = getCasesForAdvocateClient(user.mobile, clientUserId);
  void caseListVersion;

  function handleCaseSaved() {
    setCaseListVersion((v) => v + 1);
  }

  function handleDeleteCase(id: string) {
    deleteCaseFromStorage(id);
    setDeletingCaseId(null);
    setCaseListVersion((v) => v + 1);
    toast.success("Case deleted");
  }

  return (
    <div className="w-full mt-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Cases</span>
          <span className="text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
            {cases.length}
          </span>
        </div>
        <button
          data-ocid="client_profile.cases.add_button"
          type="button"
          onClick={() => {
            setEditingCase(undefined);
            setCaseSheetOpen(true);
          }}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Case
        </button>
      </div>

      {cases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-6 text-center">
          <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No cases yet.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Tap "Add Case" to create a case for this client.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {cases.map((c, idx) => {
            const advProfile = loadProfile(user.mobile);
            const advName = advProfile?.fullName || "Advocate";
            return (
              <CaseCard
                key={c.id}
                c={c}
                index={idx + 1}
                isAdvocate
                onEdit={() => {
                  setEditingCase(c);
                  setCaseSheetOpen(true);
                }}
                onDelete={() => setDeletingCaseId(c.id)}
                showDocuments
                currentUserMobile={user.mobile}
                advocateName={advName}
              />
            );
          })}
        </div>
      )}

      <AddEditCaseSheet
        open={caseSheetOpen}
        onClose={() => setCaseSheetOpen(false)}
        advocateId={user.mobile}
        clientId={clientUserId}
        existingCase={editingCase}
        onSaved={handleCaseSaved}
      />

      <AlertDialog
        open={!!deletingCaseId}
        onOpenChange={(v) => !v && setDeletingCaseId(null)}
      >
        <AlertDialogContent data-ocid="client_profile.delete_case.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this case and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="client_profile.delete_case.cancel_button"
              onClick={() => setDeletingCaseId(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="client_profile.delete_case.confirm_button"
              onClick={() => deletingCaseId && handleDeleteCase(deletingCaseId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Advocate Public Profile Page ─────────────────────────────────────────────

function AdvocatePublicProfilePage({
  advocateUserId,
  user,
  onBack,
  onLogout,
  onMessageAdvocate,
}: {
  advocateUserId: string;
  user: StoredUser | null;
  onBack: () => void;
  onLogout: () => void;
  onMessageAdvocate?: (advocateUserId: string) => void;
}) {
  const myProfile = user ? loadProfile(user.mobile) : null;
  const advProfile = loadProfile(advocateUserId);
  const advocateData =
    loadAllAdvocateData().find((a) => a.userId === advocateUserId) ?? null;

  const advName = advProfile?.fullName || advocateData?.name || "Advocate";
  const advInitials = advName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const advLocation = [advProfile?.city, advProfile?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      data-ocid="advocate_public_profile.section"
      className="flex flex-col min-h-screen bg-background"
    >
      <PageHeader
        user={user}
        profile={myProfile}
        onBack={onBack}
        onLogout={onLogout}
        backLabel="Back"
      />

      <main className="flex flex-col flex-1 overflow-y-auto pb-8">
        {/* Cover photo */}
        <div
          className="relative w-full overflow-hidden shrink-0 bg-gradient-to-r from-primary/80 to-primary"
          style={{ height: 200 }}
        >
          {advProfile?.coverPhoto ? (
            <img
              src={advProfile.coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Briefcase className="w-16 h-16 text-white" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center px-6">
          {/* Profile photo with overlap */}
          <div className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg bg-white overflow-hidden -mt-[60px] z-10">
            {advProfile?.profilePhoto ? (
              <img
                src={advProfile.profilePhoto}
                alt={advName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">
                  {advInitials}
                </span>
              </div>
            )}
          </div>

          {/* Name */}
          <h1 className="mt-3 text-xl font-bold text-foreground tracking-tight text-center">
            {advName}
          </h1>

          {/* Practice area badge */}
          {advProfile?.practiceArea && (
            <span className="mt-1.5 inline-flex items-center text-xs font-semibold text-primary bg-primary/10 px-3 py-0.5 rounded-full">
              {advProfile.practiceArea}
            </span>
          )}

          {/* Details card */}
          <div className="w-full mt-5 bg-white rounded-2xl border border-border shadow-sm divide-y divide-border">
            {advProfile?.courtName && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Court
                </span>
                <span className="text-sm font-semibold text-foreground text-right max-w-[60%]">
                  {advProfile.courtName}
                </span>
              </div>
            )}
            {advProfile?.yearsExp && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Experience
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {advProfile.yearsExp}{" "}
                  {Number(advProfile.yearsExp) === 1 ? "year" : "years"}
                </span>
              </div>
            )}
            {advProfile?.barCouncilNumber && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Bar Council No.
                </span>
                <span className="text-sm font-semibold text-foreground font-mono">
                  {advProfile.barCouncilNumber}
                </span>
              </div>
            )}
            {advLocation && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Location
                </span>
                <span className="text-sm font-semibold text-foreground text-right">
                  {advLocation}
                </span>
              </div>
            )}
            {advProfile?.contactEmail && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Email
                </span>
                <span className="text-sm font-semibold text-foreground truncate max-w-[60%]">
                  {advProfile.contactEmail}
                </span>
              </div>
            )}
            {advocateUserId && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-xs text-muted-foreground font-medium">
                  Mobile
                </span>
                <span className="text-sm font-semibold text-foreground">
                  +91 {advocateUserId}
                </span>
              </div>
            )}
          </div>

          {/* Bio section */}
          {advProfile?.bio && (
            <div className="w-full mt-4 bg-white rounded-2xl border border-border shadow-sm p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                About
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {advProfile.bio}
              </p>
            </div>
          )}

          {/* 3 contact buttons */}
          <div className="w-full mt-5 flex flex-col gap-2">
            <a
              data-ocid="advocate_public_profile.call.button"
              href={`tel:${advocateUserId}`}
              className="flex items-center justify-center gap-2 h-12 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
            >
              <Phone className="w-4 h-4" />
              Call Advocate
            </a>
            <a
              data-ocid="advocate_public_profile.whatsapp.button"
              href={`https://wa.me/91${advocateUserId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#1fbd59] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
            <button
              data-ocid="advocate_public_profile.message.button"
              type="button"
              onClick={() =>
                onMessageAdvocate
                  ? onMessageAdvocate(advocateUserId)
                  : toast.info("Messaging coming soon")
              }
              className="flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Mail className="w-4 h-4" />
              Message Advocate
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Profile Photo Cropper (canvas-based, drag + zoom) ────────────────────────

type ProfilePhotoCropperProps = {
  onCropped: (dataUrl: string) => void;
  croppedUrl: string | null;
  initialSrc?: string | null;
};

function ProfilePhotoCropper({
  onCropped,
  croppedUrl,
  initialSrc,
}: ProfilePhotoCropperProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(initialSrc ?? null);
  const [zoom, setZoom] = useState(1);
  // offset of image center relative to crop box center (in image pixels)
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{
    mx: number;
    my: number;
    ox: number;
    oy: number;
  } | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const CANVAS_SIZE = 260;

  // Draw canvas and reset when imageSrc/zoom/offset changes
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) {
      // Reset cached image when imageSrc is cleared
      imageRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    if (imageRef.current) {
      drawCropCanvas(ctx, imageRef.current, zoom, offset, CANVAS_SIZE);
    } else {
      // New image — reset position/zoom then load
      setOffset({ x: 0, y: 0 });
      setZoom(1);
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        drawCropCanvas(ctx, img, 1, { x: 0, y: 0 }, CANVAS_SIZE);
      };
      img.src = imageSrc;
    }
  }, [imageSrc, zoom, offset]);

  function drawCropCanvas(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    z: number,
    off: { x: number; y: number },
    size: number,
  ) {
    ctx.clearRect(0, 0, size, size);
    // Draw background
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, size, size);

    // Calculate displayed image dimensions
    const scale = z;
    const displayW = img.naturalWidth * scale;
    const displayH = img.naturalHeight * scale;

    // Center of canvas + offset
    const drawX = size / 2 - displayW / 2 + off.x;
    const drawY = size / 2 - displayH / 2 + off.y;

    ctx.drawImage(img, drawX, drawY, displayW, displayH);

    // Draw circular clip overlay
    ctx.save();
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.restore();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageSrc(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleMouseDown(e: React.MouseEvent) {
    setDragging(true);
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  }

  function handleMouseUp() {
    setDragging(false);
    dragStart.current = null;
  }

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    setDragging(true);
    dragStart.current = {
      mx: t.clientX,
      my: t.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!dragging || !dragStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStart.current.mx;
    const dy = t.clientY - dragStart.current.my;
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  }

  function handleApplyCrop() {
    if (!imageSrc || !imageRef.current) return;
    try {
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = CANVAS_SIZE;
      offscreenCanvas.height = CANVAS_SIZE;
      const ctx = offscreenCanvas.getContext("2d")!;
      drawCropCanvas(ctx, imageRef.current, zoom, offset, CANVAS_SIZE);
      const dataUrl = offscreenCanvas.toDataURL("image/jpeg", 0.92);
      onCropped(dataUrl);
      setImageSrc(null);
    } catch {
      toast.error("Failed to crop image. Please try again.");
    }
  }

  // State: preview
  if (croppedUrl) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-md"
          style={{
            backgroundImage: `url(${croppedUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-label="Profile photo preview"
        />
        <button
          type="button"
          data-ocid="profile_setup.profile_photo.upload_button"
          onClick={() => {
            onCropped("");
            setImageSrc(null);
            setZoom(1);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          className="text-sm text-primary font-semibold hover:underline focus-visible:outline-none"
        >
          Change Photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    );
  }

  // State: no image selected — show dropzone
  if (!imageSrc) {
    return (
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          data-ocid="profile_setup.profile_photo.upload_button"
          onClick={() => fileInputRef.current?.click()}
          className="w-[260px] h-[200px] rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 flex flex-col items-center justify-center gap-3 hover:border-primary/60 hover:bg-primary/10 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          aria-label="Upload profile photo"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-8 h-8 text-primary/60" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-semibold text-primary/80">
              Upload Photo
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tap to browse your gallery
            </p>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    );
  }

  // State: image loaded — show crop UI
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Canvas crop area */}
      <div className="rounded-2xl overflow-hidden border-2 border-primary/30 bg-gray-900 cursor-grab active:cursor-grabbing select-none">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          style={{
            display: "block",
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            borderRadius: "50%",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          aria-label="Drag to reposition photo"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Drag to reposition · Use slider to zoom
      </p>

      {/* Zoom slider */}
      <div className="flex items-center gap-3 w-full px-2">
        <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          data-ocid="profile_setup.crop.slider"
          type="range"
          min={0.5}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
          className="flex-1 h-2 appearance-none rounded-full bg-primary/20 accent-primary cursor-pointer"
          aria-label="Zoom"
        />
        <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
          {zoom.toFixed(1)}×
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setImageSrc(null);
            setZoom(1);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          className="flex-1 h-10 rounded-xl text-sm font-semibold border-border"
        >
          Cancel
        </Button>
        <Button
          type="button"
          data-ocid="profile_setup.crop.apply.button"
          onClick={handleApplyCrop}
          className="flex-1 h-10 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          Apply Crop
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

// ─── PhotoOptionsSheet ────────────────────────────────────────────────────────

type PhotoOptionsSheetProps = {
  open: boolean;
  onClose: () => void;
  photoType: "profile" | "cover";
  currentPhoto: string | undefined;
  onView: () => void;
  onChange: () => void;
  onRemove: () => void;
};

function PhotoOptionsSheet({
  open,
  onClose,
  photoType,
  currentPhoto,
  onView,
  onChange,
  onRemove,
}: PhotoOptionsSheetProps) {
  const isProfile = photoType === "profile";
  const viewLabel = isProfile ? "View Photo" : "View Cover Photo";
  const changeLabel = isProfile ? "Change Photo" : "Change Cover Photo";
  const removeLabel = isProfile ? "Remove Photo" : "Remove Cover Photo";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-safe">
        <SheetHeader className="px-5 pb-3 border-b border-border">
          <SheetTitle className="text-sm font-semibold text-foreground">
            {isProfile ? "Profile Photo" : "Cover Photo"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col">
          {/* View option — only if photo exists */}
          {currentPhoto && (
            <button
              data-ocid="photo_sheet.view.button"
              type="button"
              onClick={() => {
                onView();
                onClose();
              }}
              className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none border-b border-border last:border-b-0"
            >
              <Eye className="w-4 h-4 text-muted-foreground" />
              {viewLabel}
            </button>
          )}

          {/* Change option */}
          <button
            data-ocid="photo_sheet.change.button"
            type="button"
            onClick={() => {
              onChange();
              onClose();
            }}
            className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none border-b border-border last:border-b-0"
          >
            <Camera className="w-4 h-4 text-muted-foreground" />
            {changeLabel}
          </button>

          {/* Remove option — only if photo exists */}
          {currentPhoto && (
            <button
              data-ocid="photo_sheet.remove.button"
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors focus-visible:outline-none border-b border-border last:border-b-0"
            >
              <X className="w-4 h-4" />
              {removeLabel}
            </button>
          )}
        </div>

        {/* Cancel */}
        <div className="px-5 pt-3 pb-2">
          <Button
            data-ocid="photo_sheet.cancel.button"
            type="button"
            variant="outline"
            className="w-full h-11 rounded-xl text-sm font-semibold"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── ViewPhotoDialog ──────────────────────────────────────────────────────────

type ViewPhotoDialogProps = {
  open: boolean;
  onClose: () => void;
  photoUrl: string;
  altText?: string;
};

function ViewPhotoDialog({
  open,
  onClose,
  photoUrl,
  altText = "Photo",
}: ViewPhotoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm w-full p-0 bg-black border-0 overflow-hidden rounded-2xl">
        <div className="relative">
          <button
            data-ocid="view_photo.close.button"
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors focus-visible:outline-none"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
          <img
            src={photoUrl}
            alt={altText}
            className="w-full max-h-[80vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Advocate Profile Setup ───────────────────────────────────────────────────

type AdvocateProfileSetupProps = {
  data: PendingProfileData;
  onDone: () => void;
};

function AdvocateProfileSetup({ data, onDone }: AdvocateProfileSetupProps) {
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [coverPhoto, setCoverPhoto] = useState<string>("");
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(data.fullName);
  const [practiceArea, setPracticeArea] = useState(data.practiceArea ?? "");
  const [yearsExp, setYearsExp] = useState(data.yearsExp ?? "");
  const [courtName, setCourtName] = useState(data.courtName ?? "");
  const [state, setState] = useState(data.state);
  const [city, setCity] = useState(data.city);
  const [officeAddress, setOfficeAddress] = useState("");
  const [bio, setBio] = useState("");
  const [contactEmail, setContactEmail] = useState(data.email);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function handleCoverPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCoverPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!practiceArea) errs.practiceArea = "Practice area is required.";
    if (!yearsExp.trim()) errs.yearsExp = "Years of experience is required.";
    else if (Number.isNaN(Number(yearsExp)) || Number(yearsExp) < 0)
      errs.yearsExp = "Enter a valid number.";
    if (!courtName.trim()) errs.courtName = "Court name is required.";
    if (!state) errs.state = "State is required.";
    if (!city.trim()) errs.city = "City / District is required.";
    if (!contactEmail.trim()) errs.contactEmail = "Contact email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
      errs.contactEmail = "Enter a valid email.";
    return errs;
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setTimeout(() => {
      saveProfile({
        mobile: data.mobile,
        profilePhoto: profilePhoto || undefined,
        coverPhoto: coverPhoto || undefined,
        fullName,
        practiceArea,
        yearsExp,
        courtName,
        barCouncilNumber: data.barCouncilNumber || undefined,
        state,
        city,
        officeAddress: officeAddress.trim() || undefined,
        bio: bio.trim() || undefined,
        contactEmail: contactEmail.toLowerCase(),
      });
      setSaving(false);
      toast.success("Profile Created Successfully", {
        description: "Your advocate profile is ready.",
        duration: 3000,
      });
      setTimeout(onDone, 1500);
    }, 700);
  }

  return (
    <div className="flex flex-col flex-1 px-6 pt-6 pb-6">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <IconLogo size={72} />
        <h1 className="text-xl font-bold text-foreground tracking-tight mt-3">
          Complete Your Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1 text-center">
          Set up your advocate profile to get started
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5" noValidate>
        {/* Profile Photo */}
        <div>
          <Label className="text-sm font-semibold mb-3 block text-foreground">
            Profile Photo
          </Label>
          <div className="flex justify-center">
            <ProfilePhotoCropper
              onCropped={(url) => setProfilePhoto(url)}
              croppedUrl={profilePhoto || null}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Upload a square photo for your circular profile picture
          </p>
        </div>

        {/* Cover Photo */}
        <div>
          <Label className="text-sm font-semibold mb-2 block text-foreground">
            Cover Photo
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (Optional)
            </span>
          </Label>
          {coverPhoto ? (
            <div className="relative rounded-xl overflow-hidden border border-border shadow-sm">
              <div style={{ paddingTop: "56.25%", position: "relative" }}>
                <img
                  src={coverPhoto}
                  alt="Cover"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                data-ocid="profile_setup.cover_photo.upload_button"
                onClick={() => {
                  setCoverPhoto("");
                  if (coverInputRef.current) coverInputRef.current.value = "";
                }}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-black/80 transition-colors focus-visible:outline-none"
              >
                Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-ocid="profile_setup.cover_photo.upload_button"
              onClick={() => coverInputRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:border-primary/60 hover:bg-primary/10 transition-all flex flex-col items-center justify-center gap-2 py-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ImageIcon className="w-7 h-7 text-primary/50" />
              <span className="text-sm font-semibold text-primary/80">
                Upload Cover Photo
              </span>
              <span className="text-xs text-muted-foreground">
                Recommended: 16:9 aspect ratio
              </span>
            </button>
          )}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverPhoto}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Full Name */}
        <div>
          <Label
            htmlFor="ps-fullname"
            className="text-sm font-medium mb-1.5 block"
          >
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ps-fullname"
            data-ocid="profile_setup.fullname.input"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-12 text-base rounded-xl"
            autoComplete="name"
            placeholder="Your full name"
          />
          {errors.fullName && (
            <FieldError
              ocid="profile_setup.fullname.error_state"
              message={errors.fullName}
            />
          )}
        </div>

        {/* Practice Area */}
        <div>
          <Label
            htmlFor="ps-practice"
            className="text-sm font-medium mb-1.5 block"
          >
            Practice Area <span className="text-destructive">*</span>
          </Label>
          <Select value={practiceArea} onValueChange={setPracticeArea}>
            <SelectTrigger
              id="ps-practice"
              data-ocid="profile_setup.practice.select"
              className="h-12 text-base rounded-xl"
            >
              <SelectValue placeholder="Select practice area" />
            </SelectTrigger>
            <SelectContent>
              {PRACTICE_AREAS.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.practiceArea && (
            <FieldError
              ocid="profile_setup.practice.error_state"
              message={errors.practiceArea}
            />
          )}
        </div>

        {/* Years of Experience */}
        <div>
          <Label
            htmlFor="ps-years-exp"
            className="text-sm font-medium mb-1.5 block"
          >
            Years of Experience <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ps-years-exp"
            data-ocid="profile_setup.years_exp.input"
            type="number"
            value={yearsExp}
            onChange={(e) => setYearsExp(e.target.value)}
            className="h-12 text-base rounded-xl"
            min="0"
            placeholder="e.g. 5"
            autoComplete="off"
          />
          {errors.yearsExp && (
            <FieldError
              ocid="profile_setup.years_exp.error_state"
              message={errors.yearsExp}
            />
          )}
        </div>

        {/* Court Name */}
        <div>
          <Label
            htmlFor="ps-court-name"
            className="text-sm font-medium mb-1.5 block"
          >
            Court Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ps-court-name"
            data-ocid="profile_setup.court_name.input"
            type="text"
            value={courtName}
            onChange={(e) => setCourtName(e.target.value)}
            className="h-12 text-base rounded-xl"
            placeholder="e.g. Delhi High Court"
            autoComplete="off"
          />
          {errors.courtName && (
            <FieldError
              ocid="profile_setup.court_name.error_state"
              message={errors.courtName}
            />
          )}
        </div>

        {/* State */}
        <div>
          <Label className="text-sm font-medium mb-1.5 block">
            State <span className="text-destructive">*</span>
          </Label>
          <SearchableStateSelect
            value={state}
            onChange={setState}
            placeholder="Select your state"
            ocid="profile_setup.state.select"
          />
          {errors.state && (
            <FieldError
              ocid="profile_setup.state.error_state"
              message={errors.state}
            />
          )}
        </div>

        {/* City / District */}
        <div>
          <Label htmlFor="ps-city" className="text-sm font-medium mb-1.5 block">
            City / District <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ps-city"
            data-ocid="profile_setup.city.input"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-12 text-base rounded-xl"
            placeholder="Your city or district"
            autoComplete="address-level2"
          />
          {errors.city && (
            <FieldError
              ocid="profile_setup.city.error_state"
              message={errors.city}
            />
          )}
        </div>

        {/* Office Address */}
        <div>
          <Label
            htmlFor="ps-office-address"
            className="text-sm font-medium mb-1.5 block"
          >
            Office Address
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (Optional)
            </span>
          </Label>
          <Input
            id="ps-office-address"
            data-ocid="profile_setup.office_address.input"
            type="text"
            value={officeAddress}
            onChange={(e) => setOfficeAddress(e.target.value)}
            className="h-12 text-base rounded-xl"
            placeholder="Chamber / Office address"
            autoComplete="street-address"
          />
        </div>

        {/* Advocate Bio */}
        <div>
          <Label htmlFor="ps-bio" className="text-sm font-medium mb-1.5 block">
            Advocate Bio
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (Optional)
            </span>
          </Label>
          <Textarea
            id="ps-bio"
            data-ocid="profile_setup.bio.textarea"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Write a brief professional bio..."
            className="min-h-[100px] text-base rounded-xl resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right mt-1">
            {bio.length}/500
          </p>
        </div>

        {/* Contact Email */}
        <div>
          <Label
            htmlFor="ps-contact-email"
            className="text-sm font-medium mb-1.5 block"
          >
            Contact Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ps-contact-email"
            data-ocid="profile_setup.contact_email.input"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="h-12 text-base rounded-xl"
            placeholder="contact@email.com"
            autoComplete="email"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Pre-filled from registration — you can edit this.
          </p>
          {errors.contactEmail && (
            <FieldError
              ocid="profile_setup.contact_email.error_state"
              message={errors.contactEmail}
            />
          )}
        </div>

        {/* Save */}
        <Button
          data-ocid="profile_setup.save.submit_button"
          type="submit"
          disabled={saving}
          className="h-12 text-base font-semibold w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl mt-2"
        >
          {saving ? "Saving Profile…" : "Save Profile"}
        </Button>

        {saving && (
          <div
            data-ocid="profile_setup.success_state"
            className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            Profile Created Successfully
          </div>
        )}
      </form>

      <AppFooter />
    </div>
  );
}

// ─── Client Profile Setup ─────────────────────────────────────────────────────

type ClientProfileSetupProps = {
  data: PendingProfileData;
  onDone: () => void;
};

function ClientProfileSetup({ data, onDone }: ClientProfileSetupProps) {
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [fullName, setFullName] = useState(data.fullName);
  const [state, setState] = useState(data.state);
  const [city, setCity] = useState(data.city);
  const [bio, setBio] = useState("");
  const [contactEmail, setContactEmail] = useState(data.email);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = "Full name is required.";
    if (!state) errs.state = "State is required.";
    if (!city.trim()) errs.city = "City / District is required.";
    if (!contactEmail.trim()) errs.contactEmail = "Contact email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail))
      errs.contactEmail = "Enter a valid email.";
    return errs;
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSaving(true);
    setTimeout(() => {
      saveProfile({
        mobile: data.mobile,
        profilePhoto: profilePhoto || undefined,
        fullName,
        state,
        city,
        bio: bio.trim() || undefined,
        contactEmail: contactEmail.toLowerCase(),
      });
      setSaving(false);
      toast.success("Profile Created Successfully", {
        description: "Your profile is ready.",
        duration: 3000,
      });
      setTimeout(onDone, 1500);
    }, 700);
  }

  return (
    <div className="flex flex-col flex-1 px-6 pt-6 pb-6">
      {/* Header */}
      <div className="flex flex-col items-center mb-6">
        <IconLogo size={72} />
        <h1 className="text-xl font-bold text-foreground tracking-tight mt-3">
          Complete Your Profile
        </h1>
        <p className="text-sm text-muted-foreground mt-1 text-center">
          Set up your profile to connect with advocates
        </p>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-5" noValidate>
        {/* Profile Photo */}
        <div>
          <Label className="text-sm font-semibold mb-3 block text-foreground">
            Profile Photo
          </Label>
          <div className="flex justify-center">
            <ProfilePhotoCropper
              onCropped={(url) => setProfilePhoto(url)}
              croppedUrl={profilePhoto || null}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Upload a square photo for your circular profile picture
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Full Name */}
        <div>
          <Label
            htmlFor="cps-fullname"
            className="text-sm font-medium mb-1.5 block"
          >
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cps-fullname"
            data-ocid="profile_setup.fullname.input"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-12 text-base rounded-xl"
            autoComplete="name"
            placeholder="Your full name"
          />
          {errors.fullName && (
            <FieldError
              ocid="profile_setup.fullname.error_state"
              message={errors.fullName}
            />
          )}
        </div>

        {/* State */}
        <div>
          <Label className="text-sm font-medium mb-1.5 block">
            State <span className="text-destructive">*</span>
          </Label>
          <SearchableStateSelect
            value={state}
            onChange={setState}
            placeholder="Select your state"
            ocid="profile_setup.state.select"
          />
          {errors.state && (
            <FieldError
              ocid="profile_setup.state.error_state"
              message={errors.state}
            />
          )}
        </div>

        {/* City / District */}
        <div>
          <Label
            htmlFor="cps-city"
            className="text-sm font-medium mb-1.5 block"
          >
            City / District <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cps-city"
            data-ocid="profile_setup.city.input"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-12 text-base rounded-xl"
            placeholder="Your city or district"
            autoComplete="address-level2"
          />
          {errors.city && (
            <FieldError
              ocid="profile_setup.city.error_state"
              message={errors.city}
            />
          )}
        </div>

        {/* Short Bio */}
        <div>
          <Label htmlFor="cps-bio" className="text-sm font-medium mb-1.5 block">
            Short Bio
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              (Optional)
            </span>
          </Label>
          <Textarea
            id="cps-bio"
            data-ocid="profile_setup.bio.textarea"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us a bit about yourself..."
            className="min-h-[90px] text-base rounded-xl resize-none"
            maxLength={300}
          />
          <p className="text-xs text-muted-foreground text-right mt-1">
            {bio.length}/300
          </p>
        </div>

        {/* Contact Email */}
        <div>
          <Label
            htmlFor="cps-contact-email"
            className="text-sm font-medium mb-1.5 block"
          >
            Contact Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="cps-contact-email"
            data-ocid="profile_setup.contact_email.input"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="h-12 text-base rounded-xl"
            placeholder="contact@email.com"
            autoComplete="email"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Pre-filled from registration — you can edit this.
          </p>
          {errors.contactEmail && (
            <FieldError
              ocid="profile_setup.contact_email.error_state"
              message={errors.contactEmail}
            />
          )}
        </div>

        {/* Save */}
        <Button
          data-ocid="profile_setup.save.submit_button"
          type="submit"
          disabled={saving}
          className="h-12 text-base font-semibold w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl mt-2"
        >
          {saving ? "Saving Profile…" : "Save Profile"}
        </Button>

        {saving && (
          <div
            data-ocid="profile_setup.success_state"
            className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            Profile Created Successfully
          </div>
        )}
      </form>

      <AppFooter />
    </div>
  );
}

// ─── Calendar Page ────────────────────────────────────────────────────────────

function CalendarPage({
  user,
  onBack,
  onLogout,
}: {
  user: StoredUser | null;
  onBack: () => void;
  onLogout: () => void;
}) {
  const profile = user ? loadProfile(user.mobile) : null;
  const role = user?.role ?? "client";
  const userId = user?.mobile ?? "";

  // Start of the currently displayed month
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // All upcoming hearings (for the upcoming section above calendar)
  const upcomingHearings = user ? getAllUpcomingHearings(userId, role) : [];

  // Today, tomorrow, nextWeek boundaries
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const tomorrowDate = new Date(todayDate);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const nextWeekDate = new Date(todayDate);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);

  const upcomingGroups: { label: string; items: StoredCase[] }[] = [
    {
      label: "Today",
      items: upcomingHearings.filter((c) => {
        const d = new Date(`${c.nextHearingDate}T00:00:00`);
        return d.getTime() === todayDate.getTime();
      }),
    },
    {
      label: "Tomorrow",
      items: upcomingHearings.filter((c) => {
        const d = new Date(`${c.nextHearingDate}T00:00:00`);
        return d.getTime() === tomorrowDate.getTime();
      }),
    },
    {
      label: "Next 7 Days",
      items: upcomingHearings.filter((c) => {
        const d = new Date(`${c.nextHearingDate}T00:00:00`);
        return d > tomorrowDate && d <= nextWeekDate;
      }),
    },
    {
      label: "Later",
      items: upcomingHearings.filter((c) => {
        const d = new Date(`${c.nextHearingDate}T00:00:00`);
        return d > nextWeekDate;
      }),
    },
  ];

  // Build calendar grid for currentMonth
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Pad with 0s at start and end so we have complete weeks
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  function toDateStr(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function handleDateClick(day: number) {
    const dateStr = toDateStr(day);
    const hearingsOnDay = getHearingsForDate(userId, role, dateStr);
    if (hearingsOnDay.length === 0) return;
    setSelectedDate(dateStr);
    setSheetOpen(true);
  }

  function prevMonth() {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  }

  function nextMonth() {
    setCurrentMonth((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  }

  const monthLabel = currentMonth.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Selected date hearings for sheet
  const sheetHearings = selectedDate
    ? getHearingsForDate(userId, role, selectedDate)
    : [];

  const sheetDateLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, "0")}-${String(todayDate.getDate()).padStart(2, "0")}`;

  return (
    <div
      data-ocid="calendar.section"
      className="flex flex-col min-h-screen bg-background"
    >
      <PageHeader
        user={user}
        profile={profile}
        onBack={onBack}
        onLogout={onLogout}
        backLabel="Back to Dashboard"
      />

      <main className="flex flex-col flex-1 overflow-y-auto pb-8">
        {/* ── Upcoming Hearings Section (above calendar) ── */}
        <div className="px-5 pt-3 pb-4">
          <h1 className="text-lg font-bold text-foreground mb-1">
            Hearing Calendar
          </h1>
          <p className="text-xs text-muted-foreground mb-4">
            {upcomingHearings.length} upcoming hearing
            {upcomingHearings.length !== 1 ? "s" : ""}
          </p>

          {/* Upcoming groups */}
          {upcomingHearings.length === 0 ? (
            <div
              data-ocid="calendar.upcoming.empty_state"
              className="bg-white rounded-2xl border border-border p-5 text-center mb-4"
            >
              <CalendarDays className="w-10 h-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                No upcoming hearings. Add hearing dates to your cases.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 mb-4">
              {upcomingGroups.map((group) => {
                if (group.items.length === 0) return null;
                return (
                  <div key={group.label}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        {group.label}
                      </span>
                      <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                        {group.items.length}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="flex flex-col gap-2">
                      {group.items.map((c, idx) => {
                        const clientData = loadAllClientData().find(
                          (cd) => cd.userId === c.clientId,
                        );
                        const clientProfile = loadProfile(c.clientId);
                        const clientName =
                          clientProfile?.fullName ||
                          clientData?.name ||
                          "Client";
                        const hearingInfo = getHearingLabel(c.nextHearingDate);
                        return (
                          <div
                            key={c.id}
                            data-ocid={`calendar.upcoming.item.${idx + 1}`}
                            className="bg-white rounded-xl border border-border shadow-sm p-3 flex flex-col gap-1.5"
                          >
                            {role === "advocate" && (
                              <p className="text-[10px] font-medium text-muted-foreground">
                                Client: {clientName}
                              </p>
                            )}
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-foreground leading-snug flex-1 min-w-0 truncate">
                                {c.caseTitle}
                              </p>
                              <span
                                className={`shrink-0 inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getCaseStatusColor(c.caseStatus)}`}
                              >
                                {c.caseStatus}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span className="truncate">{c.courtName}</span>
                            </div>
                            <span
                              className={`self-start inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${hearingInfo.color}`}
                            >
                              <Calendar className="w-2.5 h-2.5" />
                              {hearingInfo.label} ·{" "}
                              {new Date(
                                `${c.nextHearingDate}T00:00:00`,
                              ).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Calendar Grid ── */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button
                data-ocid="calendar.prev_month.button"
                type="button"
                onClick={prevMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold text-foreground">
                {monthLabel}
              </span>
              <button
                data-ocid="calendar.next_month.button"
                type="button"
                onClick={nextMonth}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day-of-week header */}
            <div className="grid grid-cols-7 border-b border-border">
              {DOW_LABELS.map((dow) => (
                <div
                  key={dow}
                  className="flex items-center justify-center py-2 text-[10px] font-semibold text-muted-foreground"
                >
                  {dow}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="p-1">
              {weeks.map((week) => {
                const weekKey =
                  week.find((d) => d !== null) ?? `w${year}${month}`;
                return (
                  <div
                    key={`week-${year}-${month}-${weekKey}`}
                    className="grid grid-cols-7"
                  >
                    {week.map((day, di) => {
                      if (day === null) {
                        return (
                          <div
                            key={`empty-${year}-${month}-col${di}-wk${weekKey}`}
                            className="h-10"
                          />
                        );
                      }
                      const dateStr = toDateStr(day);
                      const hearingsCount = getHearingsForDate(
                        userId,
                        role,
                        dateStr,
                      ).length;
                      const isToday = dateStr === todayStr;
                      const hasHearings = hearingsCount > 0;

                      return (
                        <button
                          key={dateStr}
                          data-ocid="calendar.date.button"
                          type="button"
                          onClick={() => handleDateClick(day)}
                          disabled={!hasHearings}
                          className={`relative h-10 flex flex-col items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            hasHearings
                              ? "cursor-pointer hover:bg-primary/5 active:bg-primary/10"
                              : "cursor-default"
                          }`}
                          aria-label={`${dateStr}${hasHearings ? `, ${hearingsCount} hearing${hearingsCount > 1 ? "s" : ""}` : ""}`}
                        >
                          {/* Date number */}
                          <span
                            className={`text-xs font-semibold leading-none flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                              isToday
                                ? "bg-primary text-primary-foreground font-bold"
                                : hasHearings
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {day}
                          </span>

                          {/* Dot + badge for hearings */}
                          {hasHearings && (
                            <div className="flex items-center gap-0.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary block" />
                              {hearingsCount > 1 && (
                                <span className="text-[8px] font-bold bg-primary text-primary-foreground px-1 rounded-full leading-none py-0.5">
                                  {hearingsCount}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border bg-muted/30">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[9px] font-bold text-primary-foreground">
                    5
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">Today</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <span className="text-[10px] text-muted-foreground">
                  Has hearings
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-bold bg-primary text-primary-foreground px-1 rounded-full py-0.5">
                  3
                </span>
                <span className="text-[10px] text-muted-foreground">Count</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Bottom Sheet for day's hearings ── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          data-ocid="calendar.sheet"
          side="bottom"
          className="rounded-t-2xl max-h-[70vh] flex flex-col p-0"
        >
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
            <div className="flex items-start justify-between gap-2">
              <SheetTitle className="text-sm font-bold text-foreground leading-snug">
                Hearings on {sheetDateLabel}
              </SheetTitle>
              <button
                data-ocid="calendar.sheet.close_button"
                type="button"
                onClick={() => setSheetOpen(false)}
                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring -mt-0.5"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-left">
              {sheetHearings.length} hearing
              {sheetHearings.length !== 1 ? "s" : ""} scheduled
            </p>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {sheetHearings.map((c, idx) => {
              const clientData = loadAllClientData().find(
                (cd) => cd.userId === c.clientId,
              );
              const clientProfile = loadProfile(c.clientId);
              const clientName =
                clientProfile?.fullName || clientData?.name || "Client";
              return (
                <div
                  key={c.id}
                  data-ocid={`calendar.sheet.item.${idx + 1}`}
                  className="bg-muted/30 rounded-xl border border-border p-3 flex flex-col gap-1.5"
                >
                  {role === "advocate" && (
                    <p className="text-[10px] font-medium text-muted-foreground">
                      Client: {clientName}
                    </p>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-foreground leading-snug flex-1 min-w-0">
                      {c.caseTitle}
                    </p>
                    <span
                      className={`shrink-0 inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getCaseStatusColor(c.caseStatus)}`}
                    >
                      {c.caseStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{c.courtName}</span>
                  </div>
                  {c.caseNumber && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {c.caseNumber}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Profile Setup Screen (wrapper) ──────────────────────────────────────────

function ProfileSetupScreen({
  pendingData,
  onDone,
}: {
  pendingData: PendingProfileData | null;
  onDone: () => void;
}) {
  if (!pendingData) {
    // Fallback: no data, redirect to dashboard
    onDone();
    return null;
  }

  if (pendingData.role === "advocate") {
    return <AdvocateProfileSetup data={pendingData} onDone={onDone} />;
  }
  return <ClientProfileSetup data={pendingData} onDone={onDone} />;
}

// ─── Redirect Helper ─────────────────────────────────────────────────────────

function RedirectToDashboard({ onRedirect }: { onRedirect: () => void }) {
  useEffect(() => {
    onRedirect();
  }, [onRedirect]);
  return null;
}

// ─── Find Advocates Page ──────────────────────────────────────────────────────

const EXPERIENCE_RANGES = [
  { label: "0–5 years", min: 0, max: 5 },
  { label: "5–10 years", min: 5, max: 10 },
  { label: "10+ years", min: 10, max: Number.POSITIVE_INFINITY },
] as const;

function FindAdvocatesPage({
  user,
  onBack,
  onLogout,
  onViewAdvocate,
}: {
  user: StoredUser | null;
  onBack: () => void;
  onLogout: () => void;
  onViewAdvocate: (advocateUserId: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPracticeArea, setFilterPracticeArea] = useState("all");
  const [filterCity, setFilterCity] = useState("");
  const [filterCourt, setFilterCourt] = useState("");
  const [filterExpRange, setFilterExpRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const allAdvocates = useMemo(() => {
    const allAdv = loadAllAdvocateData();
    const results: Array<{ advData: AdvocateData; profile: StoredProfile }> =
      [];
    for (const adv of allAdv) {
      if (adv.userId === user?.mobile) continue;
      const profile = loadProfile(adv.userId);
      if (!profile) continue;
      results.push({ advData: adv, profile });
    }
    return results;
  }, [user?.mobile]);

  const clientData =
    user?.role === "client"
      ? (loadAllClientData().find((c) => c.userId === user.mobile) ?? null)
      : null;

  function isConnected(advData: AdvocateData): boolean {
    if (!clientData?.linkedAdvocateId) return false;
    return (
      clientData.linkedAdvocateId.toUpperCase() ===
      advData.referralCode.toUpperCase()
    );
  }

  const filtered = useMemo(() => {
    return allAdvocates.filter(({ advData: _adv, profile }) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const nameMatch = profile.fullName.toLowerCase().includes(q);
        const cityMatch = (profile.city || "").toLowerCase().includes(q);
        const courtMatch = (profile.courtName || "").toLowerCase().includes(q);
        const practiceMatch = (profile.practiceArea || "")
          .toLowerCase()
          .includes(q);
        if (!nameMatch && !cityMatch && !courtMatch && !practiceMatch)
          return false;
      }
      if (
        filterPracticeArea !== "all" &&
        profile.practiceArea !== filterPracticeArea
      )
        return false;
      if (
        filterCity.trim() &&
        !(profile.city || "")
          .toLowerCase()
          .includes(filterCity.toLowerCase().trim())
      )
        return false;
      if (
        filterCourt.trim() &&
        !(profile.courtName || "")
          .toLowerCase()
          .includes(filterCourt.toLowerCase().trim())
      )
        return false;
      if (filterExpRange !== "all") {
        const range = EXPERIENCE_RANGES.find((r) => r.label === filterExpRange);
        if (range) {
          const exp = Number(profile.yearsExp) || 0;
          if (exp < range.min || exp > range.max) return false;
        }
      }
      return true;
    });
  }, [
    allAdvocates,
    searchQuery,
    filterPracticeArea,
    filterCity,
    filterCourt,
    filterExpRange,
  ]);

  const activeFilterCount = [
    filterPracticeArea !== "all",
    filterCity.trim() !== "",
    filterCourt.trim() !== "",
    filterExpRange !== "all",
  ].filter(Boolean).length;

  function clearFilters() {
    setFilterPracticeArea("all");
    setFilterCity("");
    setFilterCourt("");
    setFilterExpRange("all");
  }

  const currentProfile = user ? loadProfile(user.mobile) : null;
  const displayName = currentProfile?.fullName || "User";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      data-ocid="find-advocates.section"
      className="flex flex-col min-h-screen bg-background"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between w-full px-5 py-3 border-b border-border bg-white shadow-sm">
        <button
          data-ocid="find-advocates.header.link"
          type="button"
          aria-label="My Advocate – home"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          onClick={onBack}
        >
          <img
            src="/assets/uploads/file_0000000067dc720b979aa33b95fe860c-2.png"
            alt="My Advocate"
            style={{ height: 44, width: "auto" }}
            className="object-contain"
            draggable={false}
          />
        </button>
        <div className="flex items-center gap-2">
          <button
            data-ocid="find-advocates.profile.button"
            type="button"
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-border hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="User profile"
          >
            {currentProfile?.profilePhoto ? (
              <img
                src={currentProfile.profilePhoto}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary leading-none">
                  {initials}
                </span>
              </div>
            )}
          </button>
          <button
            data-ocid="find-advocates.logout.button"
            type="button"
            onClick={onLogout}
            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex flex-col flex-1 overflow-y-auto">
        {/* Page title + back */}
        <div className="px-5 pt-5 pb-4">
          <BackButton
            ocid="find-advocates.back.button"
            onClick={onBack}
            label="Back to Dashboard"
          />
          <div className="mt-3 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight leading-tight">
                Find Advocates
              </h1>
              <p className="text-xs text-muted-foreground">
                {allAdvocates.length} advocate
                {allAdvocates.length !== 1 ? "s" : ""} registered
              </p>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              data-ocid="find-advocates.search_input"
              type="text"
              placeholder="Search by name, city, court, practice area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-12 text-sm rounded-xl border border-input bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters toggle */}
        <div className="px-5 pb-3 flex items-center gap-2">
          <button
            data-ocid="find-advocates.filter.toggle"
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              showFilters || activeFilterCount > 0
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-white text-muted-foreground hover:text-foreground hover:border-ring/50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 ml-1 transition-transform duration-200 ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>
          {activeFilterCount > 0 && (
            <button
              data-ocid="find-advocates.clear_filters.button"
              type="button"
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-none"
            >
              Clear all
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground font-medium">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mx-5 mb-4 p-4 bg-muted/30 rounded-2xl border border-border flex flex-col gap-3">
            {/* Practice Area */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                Practice Area
              </p>
              <Select
                value={filterPracticeArea}
                onValueChange={setFilterPracticeArea}
              >
                <SelectTrigger
                  data-ocid="find-advocates.practice_area.select"
                  className="h-10 text-sm rounded-xl"
                >
                  <SelectValue placeholder="All practice areas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All practice areas</SelectItem>
                  {PRACTICE_AREAS.map((pa) => (
                    <SelectItem key={pa} value={pa}>
                      {pa}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div>
              <label
                htmlFor="filter-city"
                className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide"
              >
                City
              </label>
              <input
                id="filter-city"
                data-ocid="find-advocates.city.input"
                type="text"
                placeholder="Filter by city..."
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-xl border border-input bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
              />
            </div>

            {/* Court */}
            <div>
              <label
                htmlFor="filter-court"
                className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide"
              >
                Court
              </label>
              <input
                id="filter-court"
                data-ocid="find-advocates.court.input"
                type="text"
                placeholder="Filter by court name..."
                value={filterCourt}
                onChange={(e) => setFilterCourt(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-xl border border-input bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
              />
            </div>

            {/* Experience Range */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5 block uppercase tracking-wide">
                Experience
              </p>
              <Select value={filterExpRange} onValueChange={setFilterExpRange}>
                <SelectTrigger
                  data-ocid="find-advocates.experience.select"
                  className="h-10 text-sm rounded-xl"
                >
                  <SelectValue placeholder="Any experience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any experience</SelectItem>
                  {EXPERIENCE_RANGES.map((r) => (
                    <SelectItem key={r.label} value={r.label}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Advocate card list */}
        <div className="px-5 pb-8 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div
              data-ocid="find-advocates.empty_state"
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-base font-semibold text-foreground">
                No advocates found
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
                {activeFilterCount > 0 || searchQuery
                  ? "Try adjusting your search or filters."
                  : "No advocates are registered yet."}
              </p>
              {(activeFilterCount > 0 || searchQuery) && (
                <button
                  type="button"
                  onClick={() => {
                    clearFilters();
                    setSearchQuery("");
                  }}
                  className="mt-4 text-sm text-primary hover:underline focus-visible:outline-none"
                >
                  Clear search & filters
                </button>
              )}
            </div>
          ) : (
            filtered.map(({ advData, profile }, idx) => {
              const connected = isConnected(advData);
              const exp = profile.yearsExp
                ? `${profile.yearsExp} yr${Number(profile.yearsExp) !== 1 ? "s" : ""}`
                : null;
              const initials2 = profile.fullName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <button
                  key={advData.userId}
                  data-ocid={`find-advocates.item.${idx + 1}`}
                  type="button"
                  onClick={() => onViewAdvocate(advData.userId)}
                  className="w-full text-left flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-border shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {/* Avatar */}
                  <div className="shrink-0 w-14 h-14 rounded-full overflow-hidden border-2 border-border bg-primary/5">
                    {profile.profilePhoto ? (
                      <img
                        src={profile.profilePhoto}
                        alt={profile.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-base font-bold text-primary">
                          {initials2}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground truncate">
                        {profile.fullName}
                      </p>
                      {connected && (
                        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Connected
                        </span>
                      )}
                    </div>
                    {profile.practiceArea && (
                      <span className="inline-block mt-0.5 text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {profile.practiceArea}
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {profile.city && (
                        <span className="text-xs text-muted-foreground">
                          {profile.city}
                        </span>
                      )}
                      {profile.city && exp && (
                        <span className="text-muted-foreground text-xs">·</span>
                      )}
                      {exp && (
                        <span className="text-xs text-muted-foreground">
                          {exp} exp.
                        </span>
                      )}
                    </div>
                    {profile.courtName && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {profile.courtName}
                      </p>
                    )}
                  </div>

                  <ChevronRight className="shrink-0 w-4 h-4 text-muted-foreground" />
                </button>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Advocate Discovery Profile Page ──────────────────────────────────────────

function AdvocateDiscoveryProfilePage({
  advocateUserId,
  user,
  onBack,
  onLogout,
}: {
  advocateUserId: string;
  user: StoredUser | null;
  onBack: () => void;
  onLogout: () => void;
}) {
  const profile = loadProfile(advocateUserId);
  const advData = loadAllAdvocateData().find(
    (a) => a.userId === advocateUserId,
  );

  const [referralCode, setReferralCode] = useState("");
  const [referralError, setReferralError] = useState("");
  const [showReferral, setShowReferral] = useState(false);
  const [connected, setConnected] = useState(() => {
    if (!user || user.role !== "client") return false;
    const cd = loadAllClientData().find((c) => c.userId === user.mobile);
    if (!cd?.linkedAdvocateId || !advData) return false;
    return (
      cd.linkedAdvocateId.toUpperCase() === advData.referralCode.toUpperCase()
    );
  });

  if (!profile || !advData) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center px-6 py-12">
        <p className="text-muted-foreground text-sm">
          Advocate profile not found.
        </p>
        <Button type="button" onClick={onBack} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const displayInitials = profile.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isClient = user?.role === "client";
  const isAdvocateUser = user?.role === "advocate";

  function handleConnect() {
    if (!user || !isClient) return;
    const cd = loadAllClientData().find((c) => c.userId === user.mobile);
    saveClientData({
      userId: user.mobile,
      name: cd?.name || user.mobile,
      linkedAdvocateId: advData!.referralCode,
    });
    setConnected(true);
    toast.success(`Connected with ${profile!.fullName}!`);
  }

  function handleReferralConnect(e: React.FormEvent) {
    e.preventDefault();
    setReferralError("");
    const found = findAdvocateByCode(referralCode.trim());
    if (!found) {
      setReferralError("Invalid referral code. Please check and try again.");
      return;
    }
    if (found.userId !== advocateUserId) {
      setReferralError("This code belongs to a different advocate.");
      return;
    }
    const cd = loadAllClientData().find((c) => c.userId === user!.mobile);
    saveClientData({
      userId: user!.mobile,
      name: cd?.name || user!.mobile,
      linkedAdvocateId: found.referralCode,
    });
    setConnected(true);
    toast.success(`Connected with ${profile!.fullName} via referral code!`);
    setShowReferral(false);
    setReferralCode("");
  }

  const currentUserProfile = user ? loadProfile(user.mobile) : null;
  const currentUserDisplayName = currentUserProfile?.fullName || "User";
  const currentUserInitials = currentUserDisplayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      data-ocid="advocate-discovery-profile.section"
      className="flex flex-col min-h-screen bg-background"
    >
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between w-full px-5 py-3 border-b border-border bg-white shadow-sm">
        <button
          data-ocid="advocate-discovery-profile.header.link"
          type="button"
          onClick={onBack}
          aria-label="My Advocate – home"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <img
            src="/assets/uploads/file_0000000067dc720b979aa33b95fe860c-2.png"
            alt="My Advocate"
            style={{ height: 44, width: "auto" }}
            className="object-contain"
            draggable={false}
          />
        </button>
        <div className="flex items-center gap-2">
          <button
            data-ocid="advocate-discovery-profile.profile.button"
            type="button"
            className="w-10 h-10 rounded-full overflow-hidden border-2 border-border hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="User profile"
          >
            {currentUserProfile?.profilePhoto ? (
              <img
                src={currentUserProfile.profilePhoto}
                alt={currentUserDisplayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary leading-none">
                  {currentUserInitials}
                </span>
              </div>
            )}
          </button>
          <button
            data-ocid="advocate-discovery-profile.logout.button"
            type="button"
            onClick={onLogout}
            className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2.5 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex flex-col flex-1 overflow-y-auto pb-10">
        {/* Back button */}
        <div className="px-5 pt-5 pb-2">
          <BackButton
            ocid="advocate-discovery-profile.back.button"
            onClick={onBack}
            label="Back to Find Advocates"
          />
        </div>

        {/* Cover photo */}
        <div
          className="relative w-full overflow-hidden shrink-0 bg-gradient-to-r from-primary/80 to-primary"
          style={{ height: 180 }}
        >
          {profile.coverPhoto ? (
            <img
              src={profile.coverPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-10">
              <Scale className="w-16 h-16 text-white" />
            </div>
          )}
        </div>

        {/* Avatar + name */}
        <div className="flex flex-col items-center px-6 pb-4">
          <div className="w-[110px] h-[110px] rounded-full border-4 border-white shadow-lg bg-white overflow-hidden -mt-[55px]">
            {profile.profilePhoto ? (
              <img
                src={profile.profilePhoto}
                alt={profile.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {displayInitials}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 text-center w-full">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                {profile.fullName}
              </h1>
              {connected && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected
                </span>
              )}
              {isAdvocateUser && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  <Users className="w-3.5 h-3.5" />
                  Network
                </span>
              )}
            </div>

            {profile.practiceArea && (
              <span className="inline-block mt-1.5 text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {profile.practiceArea}
              </span>
            )}

            <div className="flex items-center justify-center gap-2 mt-2 flex-wrap text-xs text-muted-foreground">
              {profile.courtName && <span>{profile.courtName}</span>}
              {profile.courtName && (profile.city || profile.state) && (
                <span>·</span>
              )}
              {(profile.city || profile.state) && (
                <span>
                  {[profile.city, profile.state].filter(Boolean).join(", ")}
                </span>
              )}
            </div>

            {profile.yearsExp && (
              <p className="text-xs text-muted-foreground mt-1">
                {profile.yearsExp}{" "}
                {Number(profile.yearsExp) === 1 ? "year" : "years"} of
                experience
              </p>
            )}
          </div>
        </div>

        {/* Connect actions — only for clients who are NOT yet connected */}
        {isClient && !connected && (
          <div className="px-5 pb-4 flex flex-col gap-3">
            <Button
              data-ocid="advocate-discovery-profile.connect.primary_button"
              type="button"
              onClick={handleConnect}
              className="h-12 text-base font-semibold w-full rounded-xl"
            >
              Connect with {profile.fullName.split(" ")[0]}
            </Button>

            <button
              data-ocid="advocate-discovery-profile.referral.toggle"
              type="button"
              onClick={() => setShowReferral((v) => !v)}
              className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
            >
              <span>Enter Referral Code instead</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showReferral ? "rotate-180" : ""
                }`}
              />
            </button>

            {showReferral && (
              <form
                onSubmit={handleReferralConnect}
                className="flex flex-col gap-2"
              >
                <div className="flex gap-2">
                  <input
                    data-ocid="advocate-discovery-profile.referral.input"
                    type="text"
                    placeholder="e.g. ADV-7F3K9"
                    value={referralCode}
                    onChange={(e) => {
                      setReferralCode(e.target.value.toUpperCase());
                      setReferralError("");
                    }}
                    className="flex-1 h-11 px-3 text-sm font-mono rounded-xl border border-input bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground placeholder:font-sans"
                  />
                  <Button
                    data-ocid="advocate-discovery-profile.referral.submit_button"
                    type="submit"
                    className="h-11 px-4 text-sm font-semibold rounded-xl"
                  >
                    Apply
                  </Button>
                </div>
                {referralError && (
                  <p
                    data-ocid="advocate-discovery-profile.referral.error_state"
                    className="text-destructive text-xs"
                  >
                    {referralError}
                  </p>
                )}
              </form>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="mx-5 h-px bg-border mb-5" />

        {/* Profile details */}
        <div className="px-5 flex flex-col gap-4">
          {profile.bio && (
            <div>
              <h2 className="text-sm font-bold text-foreground mb-1.5">
                About
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.bio}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {profile.practiceArea && (
              <div className="bg-muted/30 rounded-xl p-3 border border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Practice Area
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {profile.practiceArea}
                </p>
              </div>
            )}
            {profile.yearsExp && (
              <div className="bg-muted/30 rounded-xl p-3 border border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Experience
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {profile.yearsExp} years
                </p>
              </div>
            )}
            {profile.courtName && (
              <div className="bg-muted/30 rounded-xl p-3 border border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Court
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {profile.courtName}
                </p>
              </div>
            )}
            {(profile.city || profile.state) && (
              <div className="bg-muted/30 rounded-xl p-3 border border-border">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Location
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {[profile.city, profile.state].filter(Boolean).join(", ")}
                </p>
              </div>
            )}
            {profile.barCouncilNumber && (
              <div className="bg-muted/30 rounded-xl p-3 border border-border col-span-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                  Bar Council No.
                </p>
                <p className="text-sm font-semibold text-foreground font-mono">
                  {profile.barCouncilNumber}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Legal Feed Screen ────────────────────────────────────────────────────────

function getAvatarColorFromName(name: string): string {
  const colors = [
    "bg-blue-600",
    "bg-rose-600",
    "bg-emerald-600",
    "bg-violet-600",
    "bg-amber-600",
    "bg-sky-600",
    "bg-pink-600",
    "bg-teal-600",
    "bg-indigo-600",
    "bg-orange-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function LegalFeedScreen({
  currentUser,
  currentProfile,
  onBack,
}: {
  currentUser: StoredUser;
  currentProfile: StoredProfile | null;
  onBack: () => void;
}) {
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [userPosts, setUserPosts] = useState<UserPost[]>(() => loadUserPosts());
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const displayName =
    currentProfile?.fullName ||
    (currentUser.mobile === "google-demo" ? "Demo User" : "User");
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function toggleLike(postId: string) {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        setPostImage(result);
      }
    };
    reader.readAsDataURL(file);
    // Reset the input so the same file can be re-selected
    e.target.value = "";
  }

  function handleSubmitPost() {
    const trimmedText = postText.trim();
    if (!trimmedText) return;

    setIsPosting(true);

    const authorName = displayName;
    const authorInitials = initials;
    const authorAvatarColor = getAvatarColorFromName(authorName);

    const newPost: UserPost = {
      id: `user_post_${Date.now()}`,
      authorName,
      authorInitials,
      authorAvatarColor,
      authorPhoto: currentProfile?.profilePhoto || undefined,
      practiceArea:
        (currentProfile as { practiceArea?: string } | null)?.practiceArea ||
        "Advocate",
      text: trimmedText,
      imageDataUrl: postImage || undefined,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
    };

    setUserPosts((prev) => {
      const updated = [newPost, ...prev];
      saveUserPosts(updated);
      return updated;
    });

    setPostText("");
    setPostImage(null);
    setIsPosting(false);
    toast.success("Post shared!");
  }

  // Combined feed: user posts first (newest), then demo posts
  const allPosts = [...userPosts, ...DEMO_POSTS];

  return (
    <div
      data-ocid="legal-feed.page"
      className="flex flex-col min-h-screen bg-background"
    >
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-10 flex items-center justify-between w-full px-5 py-3 border-b border-border bg-white shadow-sm">
        <button
          type="button"
          aria-label="My Advocate – home"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
        >
          <img
            src="/assets/uploads/file_0000000067dc720b979aa33b95fe860c-2.png"
            alt="My Advocate"
            style={{ height: 44, width: "auto" }}
            className="object-contain"
            draggable={false}
          />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-border">
            {currentProfile?.profilePhoto ? (
              <img
                src={currentProfile.profilePhoto}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary leading-none">
                  {initials}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex flex-col flex-1 overflow-y-auto pb-8">
        {/* Back button + page title */}
        <div className="px-4 pt-4 pb-2">
          <button
            data-ocid="legal-feed.back.button"
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Newspaper className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Legal Feed</h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Stay updated with the legal community
          </p>
        </div>

        <div className="px-4 flex flex-col gap-3">
          {/* ── Create Post card ── */}
          <div
            data-ocid="legal-feed.create_post.card"
            className="bg-white rounded-xl border border-border shadow-sm p-4"
          >
            <div className="flex items-start gap-3">
              {/* User avatar */}
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-border shrink-0 mt-0.5">
                {currentProfile?.profilePhoto ? (
                  <img
                    src={currentProfile.profilePhoto}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary leading-none">
                      {initials}
                    </span>
                  </div>
                )}
              </div>

              {/* Text input */}
              <div className="flex-1 min-w-0">
                <Textarea
                  data-ocid="legal-feed.create_post.textarea"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder="Share legal knowledge, case insights, or legal updates..."
                  rows={3}
                  className="w-full resize-none text-sm bg-muted/30 border-border rounded-lg focus:bg-white transition-colors placeholder:text-muted-foreground/70 min-h-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      handleSubmitPost();
                    }
                  }}
                />

                {/* Image preview */}
                {postImage && (
                  <div
                    data-ocid="legal-feed.create_post.image_preview"
                    className="mt-2 relative inline-block"
                  >
                    <img
                      src={postImage}
                      alt="Selected attachment preview"
                      className="w-16 h-16 rounded-lg object-cover border border-border"
                    />
                    <button
                      data-ocid="legal-feed.create_post.remove_image.button"
                      type="button"
                      onClick={() => setPostImage(null)}
                      aria-label="Remove image"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-foreground text-background flex items-center justify-center shadow-sm hover:bg-foreground/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Bottom action row */}
                <div className="mt-3 flex items-center justify-between gap-2">
                  <button
                    data-ocid="legal-feed.create_post.add_image.button"
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary border border-border rounded-lg px-3 py-1.5 hover:border-primary/40 hover:bg-primary/5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Add Image
                  </button>

                  <Button
                    data-ocid="legal-feed.create_post.submit_button"
                    type="button"
                    size="sm"
                    disabled={!postText.trim() || isPosting}
                    onClick={handleSubmitPost}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isPosting ? "Posting..." : "Post"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {/* ── Post cards ── */}
          {allPosts.map((post, idx) => {
            const isUserPost = "timestamp" in post;
            const postId = post.id;
            const isLiked = likedPosts.has(postId);
            const likeCount = post.likes + (isLiked ? 1 : 0);
            const timeLabel = isUserPost
              ? formatTimeAgo((post as UserPost).timestamp)
              : (post as DemoPost).timeAgo;

            return (
              <div
                key={postId}
                data-ocid={
                  isUserPost
                    ? `legal-feed.user_post.item.${idx + 1}`
                    : `legal-feed.post.item.${idx + 1 - userPosts.length}`
                }
                className="bg-white rounded-xl border border-border shadow-sm overflow-hidden"
              >
                {/* Post header */}
                <div className="flex items-start gap-3 p-4 pb-3">
                  {/* Author avatar */}
                  {isUserPost && (post as UserPost).authorPhoto ? (
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-border shrink-0 shadow-sm">
                      <img
                        src={(post as UserPost).authorPhoto}
                        alt={post.authorName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      className={`w-11 h-11 rounded-full ${post.authorAvatarColor} flex items-center justify-center shrink-0 shadow-sm`}
                    >
                      <span className="text-sm font-bold text-white leading-none">
                        {post.authorInitials}
                      </span>
                    </div>
                  )}

                  {/* Author info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground leading-tight">
                          {post.authorName}
                        </p>
                        <span className="inline-flex items-center text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-0.5">
                          {post.practiceArea}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                        {timeLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Post text */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    {post.text}
                  </p>
                </div>

                {/* Post image */}
                {isUserPost && (post as UserPost).imageDataUrl ? (
                  <div className="mx-4 mb-3 rounded-xl overflow-hidden max-h-64">
                    <img
                      src={(post as UserPost).imageDataUrl}
                      alt="Attached media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : !isUserPost && (post as DemoPost).hasImage ? (
                  <div className="mx-4 mb-3 bg-muted/40 rounded-xl h-44 flex flex-col items-center justify-center border border-border gap-2">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                    <span className="text-xs text-muted-foreground">Image</span>
                  </div>
                ) : null}

                {/* Engagement counts */}
                <div className="px-4 pb-2 flex items-center gap-4">
                  <span className="text-[10px] text-muted-foreground">
                    {likeCount} likes
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {post.comments} comments
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {post.shares} shares
                  </span>
                </div>

                {/* Divider */}
                <div className="mx-4 h-px bg-border" />

                {/* Action buttons */}
                <div className="flex items-center px-2 py-1">
                  <button
                    data-ocid={`legal-feed.like.button.${idx + 1}`}
                    type="button"
                    onClick={() => toggleLike(postId)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isLiked
                        ? "text-primary hover:bg-primary/5"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                    aria-label="Like"
                    aria-pressed={isLiked}
                  >
                    <ThumbsUp
                      className={`w-4 h-4 ${isLiked ? "fill-primary" : ""}`}
                    />
                    Like
                  </button>
                  <button
                    data-ocid={`legal-feed.comment.button.${idx + 1}`}
                    type="button"
                    onClick={() =>
                      toast.info("Comments coming soon!", {
                        description:
                          "Comment threads will be available in the next release.",
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Comment"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Comment
                  </button>
                  <button
                    data-ocid={`legal-feed.share.button.${idx + 1}`}
                    type="button"
                    onClick={() =>
                      toast.info("Share coming soon!", {
                        description:
                          "Post sharing will be available in the next release.",
                      })
                    }
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Share"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-muted-foreground mt-6 px-4">
          <p>
            © {new Date().getFullYear()}{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Built with love using caffeine.ai
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [registeredRole, setRegisteredRole] = useState<
    "advocate" | "client" | null
  >(null);
  const [pendingProfileData, setPendingProfileData] =
    useState<PendingProfileData | null>(null);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [selectedClientUserId, setSelectedClientUserId] = useState<
    string | null
  >(null);
  const [selectedAdvocateId, setSelectedAdvocateId] = useState<string | null>(
    null,
  );
  const [chatPartnerId, setChatPartnerId] = useState<string | null>(null);
  const [selectedDiscoveryAdvocateId, setSelectedDiscoveryAdvocateId] =
    useState<string | null>(null);
  const [activeShellTab, setActiveShellTab] = useState<string>("home");

  // Seed sample advocates once on first mount
  useEffect(() => {
    seedSampleAdvocates();
  }, []);

  function handleRegister(data: PendingProfileData) {
    setPendingProfileData(data);
    setRegisteredRole(data.role);
  }

  // Called after a successful login (password, OTP, or Google)
  // If the user has no profile yet, send them to profile-setup first
  function handleLoginSuccess(user: StoredUser) {
    setCurrentUser(user);
    // Google demo login — no real account, go straight to dashboard
    if (user.mobile === "google-demo") {
      setScreen("dashboard");
      return;
    }
    if (!profileExists(user.mobile)) {
      // Build minimal PendingProfileData so profile setup can pre-fill fields
      setPendingProfileData({
        mobile: user.mobile,
        email: user.email,
        fullName: "",
        state: "",
        city: "",
        role: user.role,
      });
      setRegisteredRole(user.role);
      setScreen("profile-setup");
    } else {
      setScreen("dashboard");
    }
  }

  function handleLogout() {
    setCurrentUser(null);
    setPendingProfileData(null);
    setRegisteredRole(null);
    setChatPartnerId(null);
    setScreen("login");
  }

  function openChat(partnerId: string) {
    setChatPartnerId(partnerId);
    setScreen("chat");
  }

  return (
    <div className="app-shell">
      <div className="mobile-card">
        <Toaster position="top-center" richColors />

        {screen === "splash" && (
          <SplashScreen onDone={() => setScreen("login")} />
        )}

        {screen === "login" && (
          <LoginScreen
            onSuccess={handleLoginSuccess}
            onSignUp={() => setScreen("role-selection")}
            onForgotPassword={() => setScreen("forgot-password")}
          />
        )}

        {screen === "forgot-password" && (
          <ForgotPasswordScreen
            onBack={() => setScreen("login")}
            onDone={() => setScreen("login")}
          />
        )}

        {screen === "role-selection" && (
          <RoleSelectionScreen
            onBack={() => setScreen("login")}
            onSelectRole={(role) => {
              setRegisteredRole(role);
              setScreen(
                role === "advocate" ? "register-advocate" : "register-client",
              );
            }}
          />
        )}

        {screen === "register-advocate" && (
          <AdvocateRegistrationForm
            onBack={() => setScreen("role-selection")}
            onSuccess={() => setScreen("registration-success")}
            onRegister={handleRegister}
            onLogin={() => setScreen("login")}
          />
        )}

        {screen === "register-client" && (
          <ClientRegistrationForm
            onBack={() => setScreen("role-selection")}
            onSuccess={() => setScreen("registration-success")}
            onRegister={handleRegister}
            onLogin={() => setScreen("login")}
          />
        )}

        {screen === "registration-success" && (
          <RegistrationSuccessScreen
            role={registeredRole ?? "client"}
            onContinue={() => setScreen("profile-setup")}
          />
        )}

        {screen === "profile-setup" && (
          <ProfileSetupScreen
            pendingData={pendingProfileData}
            onDone={() => setScreen("dashboard")}
          />
        )}

        {screen === "dashboard" && (
          <AppShell
            userRole={currentUser?.role ?? "client"}
            userProfile={currentUser ? loadProfile(currentUser.mobile) : null}
            onLogout={handleLogout}
            activeTab={activeShellTab}
            onTabChange={setActiveShellTab}
          />
        )}

        {screen === "my-profile" && (
          <MyProfilePage
            user={currentUser}
            onBack={() => setScreen("dashboard")}
            onLogout={handleLogout}
            onNavigateToMessages={() => setScreen("messages")}
            onViewAdvocateProfile={(id) => {
              setSelectedAdvocateId(id);
              setScreen("advocate-public-profile");
            }}
          />
        )}

        {screen === "my-cases" && (
          <MyCasesPage
            user={currentUser}
            onBack={() => setScreen("dashboard")}
            onLogout={handleLogout}
          />
        )}

        {screen === "messages" && (
          <MessagesPage
            user={currentUser}
            onBack={() => setScreen("dashboard")}
            onLogout={handleLogout}
            onOpenChat={openChat}
          />
        )}

        {screen === "chat" && chatPartnerId && (
          <ChatScreen
            user={currentUser}
            partnerUserId={chatPartnerId}
            onBack={() => setScreen("messages")}
            onLogout={handleLogout}
          />
        )}

        {screen === "my-clients" && currentUser?.role === "advocate" && (
          <MyClientsPage
            user={currentUser}
            onBack={() => setScreen("dashboard")}
            onLogout={handleLogout}
            onViewProfile={(id) => {
              setSelectedClientUserId(id);
              setScreen("client-profile");
            }}
            onMessageClient={openChat}
          />
        )}
        {screen === "my-clients" && currentUser?.role !== "advocate" && (
          <RedirectToDashboard onRedirect={() => setScreen("dashboard")} />
        )}

        {screen === "client-profile" && selectedClientUserId && (
          <ClientProfilePage
            clientUserId={selectedClientUserId}
            user={currentUser}
            onBack={() => setScreen("my-clients")}
            onLogout={handleLogout}
            onMessageClient={openChat}
          />
        )}

        {screen === "advocate-public-profile" && selectedAdvocateId && (
          <AdvocatePublicProfilePage
            advocateUserId={selectedAdvocateId}
            user={currentUser}
            onBack={() => setScreen("my-profile")}
            onLogout={handleLogout}
            onMessageAdvocate={openChat}
          />
        )}

        {screen === "hearings" && (
          <HearingsPage
            user={currentUser}
            onBack={() => setScreen("dashboard")}
            onLogout={handleLogout}
          />
        )}

        {screen === "calendar" && (
          <CalendarPage
            user={currentUser}
            onBack={() => setScreen("dashboard")}
            onLogout={handleLogout}
          />
        )}

        {screen === "find-advocates" && (
          <FindAdvocatesPage
            user={currentUser}
            onBack={() => setScreen("dashboard")}
            onLogout={handleLogout}
            onViewAdvocate={(id) => {
              setSelectedDiscoveryAdvocateId(id);
              setScreen("advocate-discovery-profile");
            }}
          />
        )}

        {screen === "advocate-discovery-profile" &&
          selectedDiscoveryAdvocateId && (
            <AdvocateDiscoveryProfilePage
              advocateUserId={selectedDiscoveryAdvocateId}
              user={currentUser}
              onBack={() => setScreen("find-advocates")}
              onLogout={handleLogout}
            />
          )}

        {screen === "legal-feed" && currentUser && (
          <LegalFeedScreen
            currentUser={currentUser}
            currentProfile={
              currentUser ? loadProfile(currentUser.mobile) : null
            }
            onBack={() => setScreen("dashboard")}
          />
        )}
      </div>
    </div>
  );
}
