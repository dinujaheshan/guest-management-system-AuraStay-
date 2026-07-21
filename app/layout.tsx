import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

import { AuthProvider } from "@/components/auth-provider";
import { SettingsProvider } from "@/components/settings-provider";
import { BusinessSetting } from "@/models/BusinessSetting";

const inter = Inter({ subsets: ["latin"] });

import connectToDatabase from "@/lib/db";
import { SystemSetting } from "@/models/SystemSetting";

export async function generateMetadata(): Promise<Metadata> {
  let title = "Guest Management System";
  try {
    await connectToDatabase();
    const settings = await SystemSetting.findOne({});
    if (settings && settings.systemName) {
      title = settings.systemName;
    }
  } catch(e) {}
  
  return {
    title: title,
    description: "Premium Guest House & Room Rental Management System",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let systemName = "AuraStay";
  let businessName = "Guest House Management";
  let logo = "";

  try {
    await connectToDatabase();
    const sys = await SystemSetting.findOne({});
    if (sys && sys.systemName) systemName = sys.systemName;
    
    const bus = await BusinessSetting.findOne({});
    if (bus) {
      if (bus.businessName) businessName = bus.businessName;
      if (bus.logo) logo = bus.logo;
    }
  } catch (e) {}

  const initialSettings = { systemName, businessName, logo };

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider initialSettings={initialSettings}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
