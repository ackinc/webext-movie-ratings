import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const ubuntu = Ubuntu({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-ubuntu",
});

export const metadata: Metadata = {
  title: "Sift - IMDB Ratings on Netflix, Prime Video & More",
  description:
    "Free & open-source browser extension that adds IMDB ratings to Netflix, Prime Video, Disney+, and other streaming platforms. Available for Chrome, Edge, and Firefox.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={ubuntu.variable}>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={false}
          storageKey="sift-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
