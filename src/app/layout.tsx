import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Focalis - Plateforme SaaS pour Freelances",
  description: "Gérez vos clients, projets, tâches et factures en un seul endroit avec Focalis",
  keywords: [
    "freelance",
    "CRM",
    "gestion",
    "projets",
    "clients",
    "factures",
    "tâches",
    "productivité"
  ],
  authors: [{ name: "Focalis" }],
  creator: "Focalis",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://focalis.com",
    title: "Focalis - Plateforme SaaS pour Freelances",
    description: "Gérez vos clients, projets, tâches et factures en un seul endroit avec Focalis",
    siteName: "Focalis",
  },
  twitter: {
    card: "summary_large_image",
    title: "Focalis - Plateforme SaaS pour Freelances",
    description: "Gérez vos clients, projets, tâches et factures en un seul endroit avec Focalis",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          defaultTheme="system"
        >
          <AuthProvider>
            {children}
            <Toaster 
              position="bottom-right"
              toastOptions={{
                duration: 4000,
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
