import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Baspana.kz — поиск соседей и квартир в Казахстане",
    template: "%s | Baspana.kz",
  },
  description: "Baspana.kz — платформа для поиска соседей и квартир в Казахстане. Алматы, Астана, Шымкент и другие города.",
  keywords: ["аренда квартиры", "соседи", "руммейт", "Алматы", "Астана", "Казахстан"],
  openGraph: {
    title: "Baspana.kz — поиск соседей и квартир",
    description: "Сотни объявлений от реальных людей. Найди идеального соседа или квартиру рядом.",
    type: "website",
    locale: "ru_RU",
    siteName: "Baspana.kz",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${montserrat.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Apply saved theme before first paint — prevents flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `try{var s=localStorage.getItem('baspana-kz-storage');if(s){var p=JSON.parse(s);if(p&&p.state&&p.state.theme==='dark'){document.documentElement.classList.add('dark');}}}catch(e){}` }} />
        {/* Preconnect for faster icon font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Material Symbols Outlined — variable icon font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300..600,0..1,-25..0&display=swap"
        />
      </head>
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-montserrat), Montserrat, -apple-system, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
