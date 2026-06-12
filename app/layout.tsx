import type { Metadata } from "next";
import { Work_Sans } from "next/font/google";
import AuthShell from "./components/AuthShell";
import { Providers } from "./components/Providers";
import "./globals.css";

const workSans = Work_Sans({ subsets: ["latin"] });

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
    <html lang="en" className={workSans.className} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem("farmos-theme");
                if (!theme || theme === "auto") {
                  theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
                }
                document.documentElement.setAttribute("data-theme", theme);
                document.documentElement.setAttribute("data-mantine-color-scheme", theme);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-text-main font-sans antialiased">
        <Providers>
          <AuthShell>
            {children}
          </AuthShell>
        </Providers>
      </body>
    </html>
  );
}
