import type { Metadata } from "next";
import "./globals.css";
import { JarvisProvider } from "@/hooks/useJarvis";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoginDialog } from "@/components/shared/LoginDialog";
import { ToastProvider } from "@/components/shared/Toast";

export const metadata: Metadata = {
  title: "JARVIS Console",
  description: "Control room for the JARVIS AI gateway",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <JarvisProvider>
          <ToastProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[300] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
            >
              Skip to main content
            </a>
            <LoginDialog />
            <Sidebar />
            <main id="main" tabIndex={-1} className="ml-16 min-h-screen p-6 outline-none">
              {children}
            </main>
          </ToastProvider>
        </JarvisProvider>
      </body>
    </html>
  );
}
