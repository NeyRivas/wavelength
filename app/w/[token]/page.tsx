import { redirect } from "next/navigation";

import { ReadOnlyAnswers } from "@/components/questionnaire/read-only-answers";
import { JoinForm } from "@/components/wavelength/join-form";
import { ShareView } from "@/components/wavelength/share-view";
import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { absoluteUrl } from "@/lib/wavelength/absolute-url";

/**
 * The entry router for a Wavelength link (ARCHITECTURE.md §12 Phase 5).
 * The share token is an invitation, not authorization (§4) — this page
 * never trusts it alone. It first tries an RLS-scoped direct SELECT, which
 * only returns a row at all if the caller is already a participant (A or
 * B); everyone else falls through to `get_wavelength_preview`, the
 * SECURITY DEFINER RPC that returns only a safe, minimal projection —
 * never participant ids, never questions or answers.
 */
export default async function WavelengthPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();

  const { data: wavelength } = await supabase
    .from("wavelengths")
    .select(
      "id, state, participant_a_id, participant_b_id, participant_a_alias, participant_b_alias",
    )
    .eq("share_token", token)
    .maybeSingle();

  if (wavelength && wavelength.participant_a_id === userId) {
    if (wavelength.state === "DRAFT") {
      // Not shared yet — finish building at /create first.
      redirect("/create");
    }
    if (wavelength.state === "COMPLETED") {
      redirect(`/w/${token}/result`);
    }
    const link = await absoluteUrl(`/w/${token}`);
    // QA fix: A can no longer see their own questions/answers at all once
    // the questionnaire is locked (shared). Read-only by construction — no
    // edit controls, no way to change an answer — and additive only: it
    // never runs for DRAFT (redirected above) or COMPLETED (redirected
    // above, straight to the real shared result instead).
    const [{ data: questions }, { data: answers }] = await Promise.all([
      supabase
        .from("questions")
        .select("id, category, type, text, options, order_index")
        .eq("wavelength_id", wavelength.id)
        .order("order_index", { ascending: true }),
      supabase
        .from("answers")
        .select("question_id, value")
        .eq("wavelength_id", wavelength.id)
        .eq("participant", "A"),
    ]);
    return (
      <main>
        <h1>Your Wavelength</h1>
        <ShareView link={link} state={wavelength.state} bAlias={wavelength.participant_b_alias} />
        <ReadOnlyAnswers questions={questions ?? []} answers={answers ?? []} />
      </main>
    );
  }

  if (wavelength && wavelength.participant_b_id === userId) {
    if (wavelength.state === "IN_PROGRESS") {
      redirect(`/w/${token}/answer`);
    }
    if (wavelength.state === "COMPLETED") {
      redirect(`/w/${token}/result`);
    }
  }

  // Not (yet) a participant: fall back to the safe pre-claim preview.
  const { data: previewRows } = await supabase.rpc("get_wavelength_preview", {
    p_token: token,
  });
  const preview = previewRows?.[0];

  if (!preview) {
    return (
      <main>
        <h1>Wavelength not found</h1>
        <p>This link isn&apos;t valid, or the questionnaire hasn&apos;t been shared yet.</p>
      </main>
    );
  }

  if (preview.is_taken) {
    return (
      <main>
        <h1>This Wavelength is already in progress</h1>
        <p>It already has two participants.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>You&apos;ve been invited to a Wavelength</h1>
      <JoinForm token={token} aAlias={preview.participant_a_alias} />
    </main>
  );
}
