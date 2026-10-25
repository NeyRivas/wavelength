import Link from "next/link";

import { CreateNewWavelengthCta } from "@/components/result/create-new-wavelength-cta";
import type {
  ConversationExperience,
  ConversationRecordStage,
} from "@/lib/wavelength/conversation-experiences";

import { ConversationRecord } from "./conversation-record";

/**
 * The shared ending of a fixed conversation experience
 * (app/w/[token]/result, COMPLETED only). The outcome is the conversation
 * itself — both participants' answers to every question, stage by stage —
 * never a score, percentage, tier, or verdict.
 */
export function ConversationResult({
  experience,
  record,
  aliasA,
  aliasB,
  viewer,
}: {
  experience: ConversationExperience;
  record: ConversationRecordStage[];
  aliasA: string;
  aliasB: string;
  viewer: "A" | "B";
}) {
  const labelA = viewer === "A" ? `${aliasA} (you)` : aliasA;
  const labelB = viewer === "B" ? `${aliasB} (you)` : aliasB;
  const otherAlias = viewer === "A" ? aliasB : aliasA;
  const stages = record.map(({ stage, entries }) => ({
    stage,
    entries: entries.map((entry) => ({
      id: entry.id,
      number: entry.number,
      text: entry.text,
      answers: [
        { label: labelA, text: entry.answerA },
        { label: labelB, text: entry.answerB },
      ],
    })),
  }));

  return (
    <div className="conv-result">
      <header className="conv-result__intro">
        <p className="conv-result__eyebrow">{experience.title}</p>
        <h1 className="conv-result__heading">Your conversation</h1>
        <p className="conv-result__text">
          You and {otherAlias} both made it through all three stages. Here&apos;s every answer, side
          by side — read them together, and talk about what surprised you.
        </p>
      </header>

      <ConversationRecord stages={stages} />

      <section className="conv-result__closing" aria-labelledby="conv-closing-heading">
        <h2 id="conv-closing-heading" className="conv-result__closing-heading">
          Thank you for opening up
        </h2>
        <p className="conv-result__closing-text">
          Come back to this conversation whenever you like — it stays at this private link on this
          browser. When you&apos;re ready for another one, there&apos;s more to explore.
        </p>
        <div className="conv-result__closing-actions">
          <Link href="/play/dating-couples" className="conv-button conv-button--secondary">
            More for couples
          </Link>
          <CreateNewWavelengthCta />
        </div>
      </section>
    </div>
  );
}
