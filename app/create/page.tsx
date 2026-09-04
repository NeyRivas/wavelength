import { DraftSetupForm } from "@/components/questionnaire/draft-setup-form";
import { QuestionnaireBuilder } from "@/components/questionnaire/questionnaire-builder";
import { requireUserId } from "@/lib/supabase/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Participant A's DRAFT flow (ARCHITECTURE.md §12 Phase 4). Not implemented
// here: finalization ("Create my Wavelength"), the share link, Participant
// B's flow, or the result screen — see ARCHITECTURE.md §12 for the phase
// plan.
export default async function CreatePage() {
  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();

  // Resume the most recent DRAFT if A already has one; otherwise show setup.
  // One active draft at a time is a Phase 4 engineering default (not a
  // product-behavior decision) — the spec describes building exactly one
  // questionnaire, and this keeps the flow simple without a draft-picker UI.
  const { data: draft } = await supabase
    .from("wavelengths")
    .select("id, question_count, categories")
    .eq("participant_a_id", userId)
    .eq("state", "DRAFT")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!draft) {
    return (
      <main>
        <h1>Create your Wavelength</h1>
        <DraftSetupForm />
      </main>
    );
  }

  const [{ data: questions }, { data: answers }] = await Promise.all([
    supabase
      .from("questions")
      .select("id, category, type, text, options, order_index")
      .eq("wavelength_id", draft.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("answers")
      .select("question_id, value")
      .eq("wavelength_id", draft.id)
      .eq("participant", "A"),
  ]);

  return (
    <main>
      <h1>Build your questionnaire</h1>
      <QuestionnaireBuilder
        wavelength={draft}
        questions={questions ?? []}
        answers={answers ?? []}
      />
    </main>
  );
}
