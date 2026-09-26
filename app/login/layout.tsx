import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Sabrang 2026",
  description: "Sign in to access your Sabrang 2026 festival dashboard and registered passes.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
