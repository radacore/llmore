import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/queryProvider";
import { ThemeProvider, ThemeScript } from "@/components/theme/ThemeProvider";
import { ToastContainer } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LLMora — API AI Gateway",
  description:
    "Platform API AI Gateway Indonesia. Akses layanan AI premium dengan pembayaran lokal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Anti-FOUC: set data-theme sebelum body render */}
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
          <ToastContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
