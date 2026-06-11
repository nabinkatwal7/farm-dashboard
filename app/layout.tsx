import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthShell from "./components/AuthShell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FarmOS — Farm Management Dashboard",
  description:
    "Complete farm management platform for crop tracking, livestock management, inventory control, retail POS, and field operations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          background: "var(--bg-base)",
        }}
      >
        <AuthShell>
          {children}
        </AuthShell>
      </body>
    </html>
  );
}
