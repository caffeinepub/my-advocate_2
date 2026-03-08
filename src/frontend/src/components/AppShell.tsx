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
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
      className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] z-40 flex items-center justify-between px-4 bg-white border-b border-border shadow-sm"
      style={{ height: 56 }}
    >
      {/* Hamburger menu */}
      <button
        data-ocid="header.hamburger_button"
        type="button"
        aria-label="Open menu"
        onClick={onHamburgerClick}
        className="flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ width: 44, height: 44 }}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Center logo */}
      <button
        type="button"
        aria-label="My Advocate – home"
        className="absolute left-1/2 -translate-x-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <img
          src="/assets/uploads/file_0000000067dc720b979aa33b95fe860c-2.png"
          alt="My Advocate"
          style={{ height: 32, width: "auto" }}
          className="object-contain"
          draggable={false}
        />
      </button>

      {/* Right icons */}
      <div className="flex items-center gap-1">
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
                height: 28,
                borderRadius: 14,
                backgroundColor: isActive ? "#EFF6FF" : "transparent",
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

  function handleSearchClick() {
    toast.info("Search coming soon");
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

      {/* Main content area — padded to avoid header/nav overlap */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: 56, paddingBottom: 64 }}
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
