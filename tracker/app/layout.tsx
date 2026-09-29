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

// بعض إضافات المتصفح بتحط bis_skin_checked على كل div قبل ما React يحمّل، فيطلع hydration warning.
// الـ script ده بيشيل الـ attribute لحد ما الصفحة تحمّل، وبعدها بيقف.
const STRIP_EXTENSION_ATTRS = `(function(){var a="bis_skin_checked";function c(n){if(n.nodeType!==1)return;n.removeAttribute(a);n.querySelectorAll("["+a+"]").forEach(function(e){e.removeAttribute(a)})}var o=new MutationObserver(function(m){m.forEach(function(r){if(r.type==="attributes")r.target.removeAttribute(a);else r.addedNodes.forEach(c)})});o.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:[a]});addEventListener("load",function(){setTimeout(function(){o.disconnect()},2000)})})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: STRIP_EXTENSION_ATTRS }} />
      </head>
      <body className="min-h-full font-sans" suppressHydrationWarning>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
