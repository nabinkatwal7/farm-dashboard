import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Sidebar from "./components/Sidebar";
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
        <Sidebar />
        <main
          style={{
            flex: 1,
            marginLeft: "var(--sidebar-width)",
            minHeight: "100vh",
            overflow: "auto",
          }}
        >
          {children}
        </main>
      </body>
    </html>
  );
}
