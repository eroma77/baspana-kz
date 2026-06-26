import type { Metadata, Viewport } from "next";
import { Unbounded, Montserrat } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
    <html
      lang="ru"
      className={`${unbounded.variable} ${montserrat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
