import type React from "react";
import type { Metadata } from "next";
import ClientRootLayout from "./clientlayout";

export const metadata: Metadata = {
  title: "CBT Wellness",
  description:
    "A comprehensive platform for self-administered Cognitive Behavioral Therapy",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientRootLayout>{children}</ClientRootLayout>;
}
