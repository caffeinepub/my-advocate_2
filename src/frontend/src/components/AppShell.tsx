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
  Briefcase,
  Calendar,
  FileText,
  HelpCircle,
  Home,
  LogOut,
  Menu,
  MessageCircle,
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
  children?: React.ReactNode;
}

// ─── Top Header ───────────────────────────────────────────────────────────────

function TopHeader({
  onHamburgerClick,
  onSearchClick,
  onNotificationClick,
}: {
  onHamburgerClick: () => void;
  onSearchClick: () => void;
  onNotificationClick: () => void;
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
          className="flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          style={{ width: 44, height: 44 }}
        >
          <Bell className="w-5 h-5" />
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
  { id: "home", label: "Home", icon: Home, ocid: "bottom_nav.home_tab" },
  {
    id: "cases",
    label: "Cases",
    icon: Briefcase,
    ocid: "bottom_nav.cases_tab",
  },
  {
    id: "clients",
    label: "Clients",
    icon: Users,
    ocid: "bottom_nav.clients_tab",
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageCircle,
    ocid: "bottom_nav.messages_tab",
  },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    ocid: "bottom_nav.profile_tab",
  },
];

const CLIENT_TABS: BottomNavTab[] = [
  { id: "home", label: "Home", icon: Home, ocid: "bottom_nav.home_tab" },
  {
    id: "cases",
    label: "Cases",
    icon: Briefcase,
    ocid: "bottom_nav.cases_tab",
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageCircle,
    ocid: "bottom_nav.messages_tab",
  },
  { id: "find", label: "Find", icon: Search, ocid: "bottom_nav.find_tab" },
  {
    id: "profile",
    label: "Profile",
    icon: User,
    ocid: "bottom_nav.profile_tab",
  },
];

function BottomNav({
  userRole,
  activeTab,
  onTabChange,
}: {
  userRole: "advocate" | "client";
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  const tabs = userRole === "advocate" ? ADVOCATE_TABS : CLIENT_TABS;

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[400px] z-40 flex items-stretch bg-white border-t border-border shadow-sm"
      style={{ height: 56 }}
      aria-label="Main navigation"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            data-ocid={tab.ocid}
            type="button"
            onClick={() => onTabChange(tab.id)}
            aria-label={tab.label}
            aria-current={isActive ? "page" : undefined}
            className={`flex flex-col items-center justify-center flex-1 gap-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon
              className={`transition-transform ${isActive ? "scale-110" : "scale-100"}`}
              style={{ width: 20, height: 20 }}
              strokeWidth={isActive ? 2.5 : 1.75}
            />
            <span
              className={`text-[10px] font-medium leading-none ${isActive ? "text-primary font-semibold" : ""}`}
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
}

const DRAWER_MENU_ITEMS: DrawerMenuItem[] = [
  {
    id: "my-profile",
    label: "My Profile",
    icon: User,
    ocid: "drawer.my_profile_button",
  },
  {
    id: "calendar",
    label: "Hearing Calendar",
    icon: Calendar,
    ocid: "drawer.calendar_button",
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    ocid: "drawer.documents_button",
  },
  {
    id: "statistics",
    label: "Case Statistics",
    icon: BarChart2,
    ocid: "drawer.statistics_button",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    ocid: "drawer.notifications_button",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    ocid: "drawer.settings_button",
  },
  { id: "help", label: "Help", icon: HelpCircle, ocid: "drawer.help_button" },
];

function SideDrawer({
  open,
  onClose,
  userRole,
  userProfile,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  userRole: "advocate" | "client";
  userProfile: UserProfile | null;
  onLogout: () => void;
}) {
  const displayName = userProfile?.fullName || "User";
  const initials = getInitials(displayName);
  const avatarColor = getAvatarColor(displayName);

  function handleMenuItemClick(itemId: string) {
    onClose();
    if (itemId !== "logout") {
      toast.info("Coming soon");
    }
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
        className="w-[280px] max-w-[85vw] p-0 flex flex-col"
      >
        {/* Visually hidden title for accessibility */}
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>

        {/* Profile header */}
        <div className="px-5 pt-8 pb-5 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
              {userProfile?.profilePhoto ? (
                <AvatarImage src={userProfile.profilePhoto} alt={displayName} />
              ) : null}
              <AvatarFallback
                className={`${avatarColor} text-white text-sm font-bold`}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate leading-tight">
                {displayName}
              </p>
              <Badge
                variant="secondary"
                className={`text-[10px] font-semibold w-fit px-2 py-0.5 ${
                  userRole === "advocate"
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {userRole === "advocate" ? "Advocate" : "Client"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <nav
          className="flex-1 overflow-y-auto py-2"
          aria-label="Side navigation"
        >
          {DRAWER_MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                data-ocid={item.ocid}
                type="button"
                onClick={() => handleMenuItemClick(item.id)}
                className="flex items-center gap-3 w-full px-5 py-3 text-sm text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}

          <Separator className="my-2" />

          {/* Logout */}
          <button
            data-ocid="drawer.logout_button"
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-5 py-3 text-sm text-destructive hover:bg-destructive/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-semibold">Logout</span>
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
  children,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleSearchClick() {
    toast.info("Search coming soon");
  }

  function handleNotificationClick() {
    toast.info("Notifications coming soon");
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Fixed top header */}
      <TopHeader
        onHamburgerClick={() => setDrawerOpen(true)}
        onSearchClick={handleSearchClick}
        onNotificationClick={handleNotificationClick}
      />

      {/* Side drawer */}
      <SideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userRole={userRole}
        userProfile={userProfile}
        onLogout={onLogout}
      />

      {/* Main content area — padded to avoid header/nav overlap */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingTop: 56, paddingBottom: 56 }}
      >
        {children ?? <TabPlaceholder tab={activeTab} />}
      </main>

      {/* Fixed bottom navigation */}
      <BottomNav
        userRole={userRole}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
    </div>
  );
}
