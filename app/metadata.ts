import type { Metadata } from "next"

import { SITE_INFO, SITE_URL } from "@/site/brand"

export const baseMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_INFO.title,
    template: "%s — Peprin",
  },
  description: SITE_INFO.description,
  openGraph: {
    type: "website",
    title: SITE_INFO.title,
    description: SITE_INFO.description,
    url: SITE_URL,
    siteName: "Peprin",
    locale: "en_US",
    images: [
      {
        url: SITE_INFO.openGraphImage,
        width: 1200,
        height: 630,
        alt: "Peprin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_INFO.title,
    description: SITE_INFO.description,
    images: [SITE_INFO.twitterImage],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.ico",
  },
}
