import Link from "next/link";

import { SameishDemo } from "@/components/overprint/sameish-demo";

/**
 * Home hero. The headline and the one real entry point (/play) stay a
 * plain server-rendered heading and link, so they paint first and work
 * without JavaScript. The right-hand side is not an illustration but a
 * playable round of the game (components/overprint/sameish-demo.tsx):
 * visitors understand the product by trying it rather than reading
 * about it.
 */
export function LandingHero() {
  return (
    <section className="op-hero" aria-labelledby="home-heading">
      <div className="op-hero__copy">
        <h1 id="home-heading" className="op-hero__heading">
          Are you really on the same page?
        </h1>
        <p className="op-hero__lede">
          Answer the same questions on your own. Then see where you overlap.
        </p>
        <div className="op-hero__actions">
          <Link href="/play" className="op-button op-button--ink">
            Let&apos;s play
          </Link>
          <span className="op-hero__note">Free. No sign-up.</span>
        </div>
      </div>

      <div className="op-hero__demo">
        <SameishDemo />
      </div>
    </section>
  );
}
