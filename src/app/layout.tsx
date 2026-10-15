import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavRail from "@/components/NavRail";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NestJS Study — Practica NestJS con TypeORM",
  description:
    "Plataforma de ejercicios para aprender NestJS con repositorios TypeORM: entidades, relaciones, CRUD, servicios, validación y pruebas unitarias.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full bg-app text-ink">
        <NavRail />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(localStorage.getItem('nestjs-study:theme')==='light')document.documentElement.dataset.theme='light'}catch(e){}",
          }}
        />
        <div className="pl-14">{children}</div>
      </body>
    </html>
  );
}
