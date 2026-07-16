import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Harmony Growth Command Center",
  description:
    "Marketing & patient growth dashboard for Harmony MedSpa — powered by CodeSquad AI Solutions",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var p=localStorage.getItem('harmony-dashboard-theme');if(p!=='dark'&&p!=='light'&&p!=='system')p='light';var r=p==='system'?(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):p;var d=document.documentElement;d.dataset.theme=r;d.dataset.themePreference=p;d.style.colorScheme=r}catch(e){document.documentElement.dataset.theme='light';document.documentElement.dataset.themePreference='light';document.documentElement.style.colorScheme='light'}})();`,
          }}
        />
      </head>
      <body
        className="h-full antialiased"
        style={{ fontFamily: "var(--font-inter), sans-serif" }}
      >
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
