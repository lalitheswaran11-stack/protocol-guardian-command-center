import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Providers } from "./providers";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);

  return {
    metadataBase,
    title: "Protocol Guardian Command Center",
    description:
      "A read-only DeFi protocol operations and safety-simulation console.",
    openGraph: {
      title: "Protocol Guardian Command Center",
      description: "Read-only protocol operations and safety simulation.",
      type: "website",
      images: [
        {
          url: "/og.jpg",
          width: 1271,
          height: 715,
          alt: "Protocol Guardian operations dashboard",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Protocol Guardian Command Center",
      description: "Read-only protocol operations and safety simulation.",
      images: ["/og.jpg"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} ${mono.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
