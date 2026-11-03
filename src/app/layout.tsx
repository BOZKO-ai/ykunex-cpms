import type { Metadata } from "next";
import "./globals.css";
import { getSettings } from "@/lib/settings";
import { readableText } from "@/lib/color";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: `${s.companyName} · Client & Project Manager`, template: `%s · ${s.companyName}` },
    description: "Internal client and project management system",
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  // Branding comes from the Settings screen: colours become CSS variables used across the whole UI.
  const style = {
    "--primary": s.primaryColor,
    "--primary-contrast": readableText(s.primaryColor),
    "--accent": s.accentColor,
    "--accent-contrast": readableText(s.accentColor),
  } as React.CSSProperties;
  return (
    <html lang="en">
      <body style={style}>{children}</body>
    </html>
  );
}
