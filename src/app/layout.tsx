import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://baspana-kz.onrender.com"),
  title: {
    default: "Baspana.kz — поиск соседей и квартир в Казахстане",
    template: "%s | Baspana.kz",
  },
  description: "Baspana.kz — платформа для поиска соседей и квартир в Казахстане. Алматы, Астана, Шымкент и другие города.",
  keywords: ["аренда квартиры", "соседи", "руммейт", "Алматы", "Астана", "Казахстан", "снять квартиру", "поиск соседа"],
  authors: [{ name: "Baspana.kz" }],
  creator: "Baspana.kz",
  publisher: "Baspana.kz",
  openGraph: {
    title: "Baspana.kz — поиск соседей и квартир",
    description: "Сотни объявлений от реальных людей. Найди идеального соседа или квартиру рядом.",
    type: "website",
    locale: "ru_RU",
    siteName: "Baspana.kz",
    url: "https://baspana-kz.onrender.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Baspana.kz — поиск соседей и квартир в Казахстане",
      },
    ],
  },
  // Icon is provided by src/app/icon.svg (Next.js auto-generates the <link>).
  // Avoid referencing PNG/ico files that don't exist (they 404ed in console).
  manifest: "/manifest.json",
  verification: {
    google: "AabU3NSCUCWuu5vpB7NK6ak9SIUk-g8WiXpJHRsaMsc",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Allow pinch-zoom — disabling it (maximumScale:1 / userScalable:false) is a
  // WCAG accessibility failure for low-vision users.
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
