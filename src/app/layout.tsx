import type { Metadata } from "next";
import "./globals.css";
import { JarvisProvider } from "@/hooks/useJarvis";
import { Sidebar } from "@/components/layout/Sidebar";
import { LoginDialog } from "@/components/shared/LoginDialog";

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
          <LoginDialog />
          <Sidebar />
          <main className="ml-16 min-h-screen p-6">{children}</main>
        </JarvisProvider>
      </body>
    </html>
  );
}
