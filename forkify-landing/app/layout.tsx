import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forkify ERP — Restaurant Operations Platform",
  description:
    "The complete multi-branch restaurant ERP. Recipes, inventory, procurement, meal planning, sales, QR menus and more — all in one platform.",
  keywords: "restaurant ERP, food management, inventory, recipes, procurement, multi-branch",
  openGraph: {
    title: "Forkify ERP",
    description: "The complete restaurant operations platform for multi-branch food businesses.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
