"use client";

import {
  Avatar,
  Menu,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core";
import { LogOut, Moon, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { CurrentUser } from "@/app/lib/user-context";

const routeMeta = [
  { href: "/", title: "Dashboard", section: "Operations" },
  { href: "/operations", title: "Operations", section: "Operations" },
  { href: "/crops", title: "Crops & Fields", section: "Production" },
  { href: "/livestock", title: "Livestock", section: "Production" },
  { href: "/seeding", title: "Precision Farming", section: "Production" },
  { href: "/inventory", title: "Inventory", section: "Commerce" },
  { href: "/orders", title: "Orders", section: "Commerce" },
  { href: "/shop", title: "Shop & POS", section: "Commerce" },
  { href: "/customers", title: "Customers", section: "Commerce" },
  { href: "/finance", title: "Finance", section: "Administration" },
  { href: "/users", title: "Users", section: "Administration" },
  { href: "/profile", title: "Profile", section: "Account" },
] as const;

function pageMeta(pathname: string) {
  if (pathname === "/") return routeMeta[0];

  return (
    routeMeta.find(
      (route) => route.href !== "/" && pathname.startsWith(route.href)
    ) ?? { title: "Workspace", section: "FieldPilot" }
  );
}

function initials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function roleLabel(role?: string | null) {
  if (!role) return "User";
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AppTopBar({ user }: { user: CurrentUser | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const currentPage = pageMeta(pathname);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="truncate text-base font-semibold tracking-tight text-primary">
            {currentPage.title}
          </div>
          <div className="truncate text-xs text-muted">
            {currentPage.section}
          </div>
        </div>

        <Menu position="bottom-end" width={260} shadow="lg">
          <Menu.Target>
            <UnstyledButton className="flex items-center gap-3 rounded-xl border border-border bg-card px-2.5 py-2 transition-colors hover:bg-card-hover">
              <Avatar radius="xl" color="farmGreen" size={34}>
                {initials(user?.name)}
              </Avatar>
              <div className="hidden min-w-0 text-left sm:block">
                <div className="max-w-36 truncate text-sm font-semibold text-primary">
                  {user?.name ?? "User"}
                </div>
                <div className="text-xs text-muted">{roleLabel(user?.role)}</div>
              </div>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <div className="px-3 py-2">
              <Text size="sm" fw={700}>
                {user?.name ?? "User"}
              </Text>
              <Text size="xs" c="dimmed" truncate>
                {user?.email ?? "No email"}
              </Text>
            </div>
            <Menu.Divider />
            <Menu.Item
              component={Link}
              href="/profile"
              leftSection={<UserRound size={16} />}
            >
              View profile
            </Menu.Item>
            <Menu.Item
              leftSection={
                colorScheme === "dark" ? <Sun size={16} /> : <Moon size={16} />
              }
              onClick={toggleColorScheme}
            >
              {colorScheme === "dark" ? "Light mode" : "Dark mode"}
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<LogOut size={16} />} onClick={logout}>
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </header>
  );
}
