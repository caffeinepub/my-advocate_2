import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  BadgeCheck,
  BarChart2,
  Bell,
  Calendar,
  FileText,
  Globe,
  HelpCircle,
  House,
  LogOut,
  Menu,
  MessageSquare,
  Scale,
  Search,
  Settings,
  User,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  fullName: string;
  profilePhoto?: string;
}

interface AppShellProps {
  userRole: "advocate" | "client";
  userProfile: UserProfile | null;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDrawerAction: (action: string) => void;
  messageUnreadCount?: number;
  notificationUnreadCount?: number;
  networkUnreadCount?: number;
  onNotificationClick?: () => void;
  children?: React.ReactNode;
}

// ─── Search Data ──────────────────────────────────────────────────────────────

const SEARCH_ADVOCATES = [
  {
    id: "1",
    name: "Ankit Sharma",
    city: "Mumbai",
    practiceArea: "Criminal Law",
    verified: true,
  },
  {
    id: "2",
    name: "Priya Mehta",
    city: "Delhi",
    practiceArea: "Family Law",
    verified: true,
  },
  {
    id: "3",
    name: "Rahul Gupta",
    city: "Bangalore",
    practiceArea: "Corporate Law",
    verified: false,
  },
  {
    id: "4",
    name: "Sneha Patel",
    city: "Ahmedabad",
    practiceArea: "Civil Law",
    verified: true,
  },
  {
    id: "5",
    name: "Vikram Singh",
    city: "Chandigarh",
    practiceArea: "Property Law",
    verified: false,
  },
  {
    id: "6",
    name: "Kavita Nair",
    city: "Chennai",
    practiceArea: "Labour Law",
    verified: true,
  },
  {
    id: "7",
    name: "Arjun Reddy",
    city: "Hyderabad",
    practiceArea: "Tax Law",
    verified: false,
  },
  {
    id: "8",
    name: "Meera Joshi",
    city: "Pune",
    practiceArea: "Intellectual Property",
    verified: true,
  },
  {
    id: "9",
    name: "Suresh Iyer",
    city: "Kochi",
    practiceArea: "Banking Law",
    verified: false,
  },
  {
    id: "10",
    name: "Deepa Verma",
    city: "Lucknow",
    practiceArea: "Consumer Law",
    verified: true,
  },
];

// ─── Search Overlay ───────────────────────────────────────────────────────────

function SearchOverlay({
  open,
  query,
  onQueryChange,
  onClose,
}: {
  open: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // Small delay to ensure the element is mounted/visible before focusing
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const results = q
    ? SEARCH_ADVOCATES.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.practiceArea.toLowerCase().includes(q),
      )
    : SEARCH_ADVOCATES;

  function getInitialsLocal(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  const AVATAR_BG = [
    "bg-blue-600",
    "bg-emerald-600",
    "bg-violet-600",
    "bg-rose-600",
    "bg-amber-600",
  ];
  function avatarBg(name: string) {
    return AVATAR_BG[name.charCodeAt(0) % AVATAR_BG.length];
  }

  return (
    <>
      {/* Backdrop — keyboard accessible close */}
      <div
        className="fixed inset-0 z-50 bg-black/30"
        aria-hidden="true"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
        // biome-ignore lint/a11y/useSemanticElements: backdrop overlay, not a true interactive element
        role="presentation"
      />

      {/* Panel */}
      <section
        data-ocid="search.overlay"
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] z-[51] bg-white shadow-xl flex flex-col"
        style={{ maxHeight: "85dvh" }}
        aria-label="Search advocates"
      >
        {/* Search bar */}
        <div className="flex items-center gap-2 px-3 py-3 border-b border-gray-100">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            data-ocid="search.input"
            type="search"
            inputMode="search"
            placeholder="Search by name, city, or practice area…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            aria-label="Search advocates"
          />
          <button
            data-ocid="search.close_button"
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors shrink-0 text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1">
          {results.length === 0 ? (
            <div
              data-ocid="search.empty_state"
              className="py-12 text-center text-muted-foreground text-sm"
            >
              No advocates found
            </div>
          ) : (
            <ul aria-label="Search results">
              {results.map((advocate, idx) => (
                <li
                  key={advocate.id}
                  data-ocid={`search.result.item.${idx + 1}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer"
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${avatarBg(advocate.name)} text-white text-sm font-bold`}
                  >
                    {getInitialsLocal(advocate.name)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {advocate.name}
                      </span>
                      {advocate.verified && (
                        <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0">
                          <BadgeCheck className="w-3 h-3" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {advocate.city} · {advocate.practiceArea}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}

// ─── Top Header ───────────────────────────────────────────────────────────────

function TopHeader({
  onHamburgerClick,
  onSearchClick,
  onNotificationClick,
  notificationUnreadCount = 0,
}: {
  onHamburgerClick: () => void;
  onSearchClick: () => void;
  onNotificationClick: () => void;
  notificationUnreadCount?: number;
}) {
  return (
    <header
      data-ocid="header.section"
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] z-40 flex items-center justify-between px-3 bg-white border-b border-border shadow-sm"
      style={{ height: 76 }}
    >
      {/* Hamburger menu — fixed width so logo can center against it */}
      <button
        data-ocid="header.hamburger_button"
        type="button"
        aria-label="Open menu"
        onClick={onHamburgerClick}
        className="flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
        style={{ width: 44, height: 44 }}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Center logo — absolutely centered between icons */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ left: 60, right: 100 }}
      >
        <img
          src="/assets/uploads/file_000000003c74720b8f411065c41e45f4-2-1.png"
          alt="My Advocate – India's Professional Legal Network"
          style={{ height: 56, width: "auto", maxWidth: "100%" }}
          className="object-contain"
          draggable={false}
        />
      </div>

      {/* Right icons — fixed width to balance with hamburger */}
      <div className="flex items-center gap-0.5 ml-auto shrink-0">
        <button
          data-ocid="header.search_button"
          type="button"
          aria-label="Search"
          onClick={onSearchClick}
          className="flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ width: 44, height: 44 }}
        >
          <Search className="w-5 h-5" />
        </button>
        <button
          data-ocid="header.notification_button"
          type="button"
          aria-label="Notifications"
          onClick={onNotificationClick}
          className="flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring relative"
          style={{ width: 44, height: 44 }}
        >
          <Bell className="w-5 h-5" />
          {notificationUnreadCount > 0 && (
            <span
              data-ocid="header.notification_badge"
              className="absolute top-1.5 right-1.5 min-w-[16px] h-[16px] rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none"
              aria-label={`${notificationUnreadCount} unread notifications`}
            >
              {notificationUnreadCount > 99 ? "99+" : notificationUnreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────

interface BottomNavTab {
  id: string;
  label: string;
  icon: React.ElementType;
  ocid: string;
}

const ADVOCATE_TABS: BottomNavTab[] = [
  { id: "home", label: "Home", icon: House, ocid: "bottom_nav.home_tab" },
  {
    id: "cases",
    label: "Cases",
    icon: Scale,
    ocid: "bottom_nav.cases_tab",
  },
  {
    id: "clients",
    label: "Clients",
    icon: Users,
    ocid: "bottom_nav.clients_tab",
  },
  {
    id: "network",
    label: "Network",
    icon: Globe,
    ocid: "bottom_nav.network_tab",
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageSquare,
    ocid: "bottom_nav.messages_tab",
  },
];

const CLIENT_TABS: BottomNavTab[] = [
  { id: "home", label: "Home", icon: House, ocid: "bottom_nav.home_tab" },
  {
    id: "cases",
    label: "Cases",
    icon: Scale,
    ocid: "bottom_nav.cases_tab",
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageSquare,
    ocid: "bottom_nav.messages_tab",
  },
  { id: "find", label: "Find", icon: Search, ocid: "bottom_nav.find_tab" },
];

function BottomNav({
  userRole,
  activeTab,
  onTabChange,
  messageUnreadCount = 0,
  networkUnreadCount = 0,
}: {
  userRole: "advocate" | "client";
  activeTab: string;
  onTabChange: (tab: string) => void;
  messageUnreadCount?: number;
  networkUnreadCount?: number;
}) {
  const tabs = userRole === "advocate" ? ADVOCATE_TABS : CLIENT_TABS;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] z-40 flex items-stretch bg-white border-t border-gray-100 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]"
      style={{ height: 64 }}
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        const showMsgBadge = tab.id === "messages" && messageUnreadCount > 0;
        const showNetworkBadge = tab.id === "network" && networkUnreadCount > 0;
        const showBadge = showMsgBadge || showNetworkBadge;
        const badgeCount = showMsgBadge
          ? messageUnreadCount
          : networkUnreadCount;
        return (
          <button
            key={tab.id}
            data-ocid={tab.ocid}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            className="flex flex-col items-center justify-center flex-1 gap-0.5 pt-1.5 pb-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            {/* Icon with highlight pill */}
            <div
              className="relative flex items-center justify-center transition-all duration-200"
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: isActive ? "#DBEAFE" : "transparent",
              }}
            >
              <Icon
                className="transition-all duration-200"
                style={{
                  width: 20,
                  height: 20,
                  color: isActive ? "#2563EB" : "#9CA3AF",
                }}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              {showBadge && (
                <span
                  className="absolute -top-1 -right-0.5 min-w-[14px] h-[14px] rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center px-0.5 leading-none"
                  aria-label={`${badgeCount} pending`}
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </span>
              )}
            </div>
            <span
              className="transition-all duration-200"
              style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                lineHeight: 1,
                color: isActive ? "#2563EB" : "#9CA3AF",
                letterSpacing: isActive ? "0.01em" : "normal",
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

// ─── Side Drawer ──────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-rose-600",
  "bg-amber-600",
];

function getAvatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

interface DrawerMenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  ocid: string;
  danger?: boolean;
  iconBg: string;
  iconColor: string;
}

const DRAWER_MENU_ITEMS: DrawerMenuItem[] = [
  {
    id: "my-profile",
    label: "My Profile",
    icon: User,
    ocid: "drawer.my_profile_button",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "calendar",
    label: "Hearing Calendar",
    icon: Calendar,
    ocid: "drawer.calendar_button",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    ocid: "drawer.documents_button",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
  },
  {
    id: "statistics",
    label: "Case Statistics",
    icon: BarChart2,
    ocid: "drawer.statistics_button",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    ocid: "drawer.notifications_button",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    ocid: "drawer.settings_button",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  {
    id: "help",
    label: "Help",
    icon: HelpCircle,
    ocid: "drawer.help_button",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-600",
  },
];

function SideDrawer({
  open,
  onClose,
  userRole,
  userProfile,
  onLogout,
  onDrawerAction,
}: {
  open: boolean;
  onClose: () => void;
  userRole: "advocate" | "client";
  userProfile: UserProfile | null;
  onLogout: () => void;
  onDrawerAction: (action: string) => void;
}) {
  const displayName = userProfile?.fullName || "User";
  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(displayName);

  function handleMenuItemClick(itemId: string) {
    onClose();
    onDrawerAction(itemId);
  }

  function handleLogout() {
    onClose();
    onLogout();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        data-ocid="drawer.section"
        side="left"
        className="w-[280px] max-w-[85vw] p-0 flex flex-col overflow-hidden"
      >
        {/* Visually hidden title for accessibility */}
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>

        {/* ── Premium gradient header ─────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-5 pt-10 pb-5 shrink-0">
          {/* Avatar + info */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="w-14 h-14 border-[3px] border-white/30 shadow-lg shrink-0">
              {userProfile?.profilePhoto ? (
                <AvatarImage src={userProfile.profilePhoto} alt={displayName} />
              ) : null}
              <AvatarFallback
                className={`${avatarColor} text-white text-base font-bold`}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1.5 min-w-0">
              <p className="text-sm font-bold text-white truncate leading-tight">
                {displayName}
              </p>
              <Badge
                variant="outline"
                className={`text-[10px] font-semibold w-fit px-2 py-0.5 border-white/40 ${
                  userRole === "advocate"
                    ? "text-white bg-white/15"
                    : "text-white bg-white/15"
                }`}
              >
                {userRole === "advocate" ? "Advocate" : "Client"}
              </Badge>
            </div>
          </div>

          {/* View Profile quick link */}
          <button
            data-ocid="drawer.view_profile_button"
            type="button"
            onClick={() => handleMenuItemClick("my-profile")}
            className="text-xs text-white/80 font-medium hover:text-white transition-colors focus-visible:outline-none underline-offset-2 hover:underline"
          >
            View Profile →
          </button>
        </div>

        {/* ── Menu area ──────────────────────────────────────────────────── */}
        <nav
          className="flex-1 overflow-y-auto bg-white"
          aria-label="Side navigation"
        >
          {/* Section label */}
          <p className="px-5 pt-4 pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Navigation
          </p>

          {DRAWER_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                data-ocid={item.ocid}
                type="button"
                onClick={() => handleMenuItemClick(item.id)}
                className="flex items-center gap-3 w-full px-4 py-3.5 text-sm text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                {/* Colorful icon box */}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}
                >
                  <Icon className={`w-[18px] h-[18px] ${item.iconColor}`} />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
              </button>
            );
          })}

          <Separator className="my-2 mx-4 w-auto" />

          {/* Logout */}
          <button
            data-ocid="drawer.logout_button"
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-sm hover:bg-red-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset mb-2"
          >
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-red-50">
              <LogOut className="w-[18px] h-[18px] text-red-500" />
            </div>
            <span className="text-sm font-medium text-destructive">Logout</span>
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

// ─── Tab Placeholder Content ──────────────────────────────────────────────────

function TabPlaceholder({ tab }: { tab: string }) {
  const labels: Record<string, string> = {
    home: "Home feed coming soon…",
    cases: "Cases coming soon…",
    clients: "Clients coming soon…",
    network: "Advocate Network coming soon…",
    messages: "Messages coming soon…",
    find: "Find Advocates coming soon…",
    profile: "Profile coming soon…",
  };

  return (
    <div className="p-4 text-center text-muted-foreground">
      {labels[tab] ?? "Coming soon…"}
    </div>
  );
}

// ─── AppShell ─────────────────────────────────────────────────────────────────

export function AppShell({
  userRole,
  userProfile,
  onLogout,
  activeTab,
  onTabChange,
  onDrawerAction,
  messageUnreadCount = 0,
  notificationUnreadCount = 0,
  networkUnreadCount = 0,
  onNotificationClick,
  children,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function handleSearchClick() {
    setSearchOpen(true);
    setSearchQuery("");
  }

  function handleNotificationClick() {
    onNotificationClick?.();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Fixed top header */}
      <TopHeader
        onHamburgerClick={() => setDrawerOpen(true)}
        onSearchClick={handleSearchClick}
        onNotificationClick={handleNotificationClick}
        notificationUnreadCount={notificationUnreadCount}
      />

      {/* Side drawer */}
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userRole={userRole}
        userProfile={userProfile}
        onLogout={onLogout}
        onDrawerAction={(action) => {
          onDrawerAction(action);
        }}
      />

      {/* Search Overlay */}
      <SearchOverlay
        open={searchOpen}
        query={searchQuery}
        onQueryChange={setSearchQuery}
        onClose={() => setSearchOpen(false)}
      />

      {/* Main content area — padded to avoid header/nav overlap */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: 76, paddingBottom: 64 }}
      >
        {children ?? <TabPlaceholder tab={activeTab} />}
      </main>

      {/* Fixed bottom navigation */}
      <BottomNav
        userRole={userRole}
        activeTab={activeTab}
        onTabChange={onTabChange}
        messageUnreadCount={messageUnreadCount}
        networkUnreadCount={networkUnreadCount}
      />
    </div>
  );
}
