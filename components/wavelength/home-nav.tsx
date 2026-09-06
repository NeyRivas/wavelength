"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * A clickable "Wavelength" wordmark that starts a new Wavelength (QA fix
 * §8.5). Only ever rendered by the result page, and only for Participant A
 * (see app/w/[token]/result/page.tsx) — before A has seen their result,
 * there is no way to navigate away from the current Wavelength via this
 * element at all, so the main create → answer → share flow can't be
 * abandoned by accident.
 *
 * Clicking always confirms first: leaving via this link starts a brand new
 * Wavelength, and A's only way back to this one is the link they were given
 * when they created it — if they didn't save it, they lose access.
 */
export function HomeNav() {
  const router = useRouter();

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    const confirmed = window.confirm(
      "Start a new Wavelength? If you haven't saved this one's link, you won't be able to get back to it.",
    );
    if (confirmed) {
      router.push("/create");
    }
  }

  return (
    <Link href="/create" onClick={handleClick}>
      Wavelength
    </Link>
  );
}
