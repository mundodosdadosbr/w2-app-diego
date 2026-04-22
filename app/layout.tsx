import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { PostHogProvider } from "@/components/layout/posthog-provider";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "W2 App — Speak English for real.",
    template: "%s · W2 App",
  },
  description:
    "Trilha guiada, speaking com IA e revisão espaçada em American English. Feito para brasileiros que querem falar — não só entender.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={cn(inter.variable, jetbrainsMono.variable, "dark")}
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased"
        suppressHydrationWarning
      >
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
