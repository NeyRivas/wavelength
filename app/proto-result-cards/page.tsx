import { Fraunces, Nunito_Sans } from "next/font/google";

import { ResultCardsPrototype } from "./result-cards-prototype";

// Isolated visual prototype route for the "Wavelength Result Cards"
// concept (social-share cards, Instagram Stories 9:16 first). Not linked
// from any nav, not wired to Share/Download/Results or any real
// wavelength data. Safe to delete once the concept is approved and
// rebuilt for real inside the actual Share flow.
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export default function ProtoResultCardsPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable}`}>
      <ResultCardsPrototype />
    </div>
  );
}
