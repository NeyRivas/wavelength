import Link from "next/link";

// Minimal landing screen (replaces the Phase 0 scaffolding placeholder).
// Its only job is to get a visitor into the existing Participant A flow at
// /create — no new functionality, no styling system, no session/Supabase
// logic here.
export default function HomePage() {
  return (
    <main>
      <h1>Wavelength</h1>
      <p>Are we on the same wavelength? Create a set of questions and find out together.</p>
      <Link href="/create">Create your Wavelength</Link>
    </main>
  );
}
