import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

export const metadata = {
  title: "CW VoC v1 - Voice of Customer Dashboard",
  description: "PM Dashboard for Feedback and AI Insights",
  icons: {
    icon: '/CoverWallet_Logo.png',
    shortcut: '/CoverWallet_Logo.png',
    apple: '/CoverWallet_Logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
