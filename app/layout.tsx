import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Orderbook Depth 3D Visualizer",
  description:
    "Real-time cryptocurrency orderbook visualization with pressure zone analysis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#111827" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-gray-900 text-white touch-manipulation overscroll-none">
        {children}
      </body>
    </html>
  );
}
