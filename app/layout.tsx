import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "모찌보카 · MochiVoca",
  description: "하루 10분, 귀엽게 일본어 단어를 마스터하는 JLPT 학습 앱",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7F2" },
    { media: "(prefers-color-scheme: dark)", color: "#100D08" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="surface-base text-default">
        <Providers>
          <div className="min-h-screen w-full flex justify-center">
            <main className="relative w-full max-w-md min-h-screen px-4 pt-6 pb-28 flex flex-col">
              {children}
            </main>
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
