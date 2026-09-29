import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Shell from "@/components/Shell";

const cairo = Cairo({ variable: "--font-cairo", subsets: ["arabic", "latin"] });

export const metadata: Metadata = {
  title: "مسار مادا",
  description: "خطة مادا لمنهج Computer Science: كل يوم خطوة، من الموبايل أو الكمبيوتر.",
  appleWebApp: { capable: true, title: "مسار مادا", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f5f1" },
    { media: "(prefers-color-scheme: dark)", color: "#121412" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full font-sans" suppressHydrationWarning>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
