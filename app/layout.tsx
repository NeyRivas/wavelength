import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wavelength",
  description: "Are we on the same wavelength?",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
