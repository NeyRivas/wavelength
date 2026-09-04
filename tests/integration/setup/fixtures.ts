import { asRequest, createTestUser } from "./db";

export interface FixtureQuestion {
  category: string;
  type: "choice" | "scale" | "situation";
  text: string;
  options: string[] | null;
}

export const DEFAULT_QUESTIONS: FixtureQuestion[] = [
  {
    category: "relationship",
    type: "choice",
    text: "Ideal weekend",
    options: ["Stay in", "Go out"],
  },
  { category: "lifestyle", type: "scale", text: "Importance of routine", options: null },
  {
    category: "money",
    type: "situation",
    text: "Unexpected bonus arrives",
    options: ["Save it", "Spend it", "Invest it"],
  },
  {
    category: "future",
    type: "choice",
    text: "Five years from now",
    options: ["Same city", "Different city"],
  },
  {
    category: "values_priorities",
    type: "scale",
    text: "Importance of family time",
    options: null,
  },
];

export async function createDraft(
  overrides: { questionCount?: number; categories?: string[] } = {},
): Promise<{ aId: string; wavelengthId: string; shareToken: string }> {
  const aId = await createTestUser();
  const questionCount = overrides.questionCount ?? DEFAULT_QUESTIONS.length;
  const categories = overrides.categories ?? [
    "relationship",
    "lifestyle",
    "money",
    "future",
    "values_priorities",
  ];

  const row = await asRequest(aId, async (client) => {
    const { rows } = await client.query<{ id: string; share_token: string }>(
      `insert into wavelengths (participant_a_id, question_count, categories)
       values ($1, $2, $3::wavelength_category[])
       returning id, share_token`,
      [aId, questionCount, categories],
    );
    return rows[0]!;
  });

  return { aId, wavelengthId: row.id, shareToken: row.share_token };
}

export interface CreatedQuestion {
  id: string;
  type: FixtureQuestion["type"];
  optionCount: number;
}

export async function addQuestions(
  aId: string,
  wavelengthId: string,
  count: number = DEFAULT_QUESTIONS.length,
): Promise<CreatedQuestion[]> {
  const created: CreatedQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const q = DEFAULT_QUESTIONS[i % DEFAULT_QUESTIONS.length]!;
    const id = await asRequest(aId, async (client) => {
      const { rows } = await client.query<{ id: string }>(
        `insert into questions (wavelength_id, category, type, text, options, order_index)
         values ($1, $2::wavelength_category, $3::question_type, $4, $5::jsonb, $6)
         returning id`,
        [
          wavelengthId,
          q.category,
          q.type,
          `${q.text} #${i}`,
          q.options ? JSON.stringify(q.options) : null,
          i,
        ],
      );
      return rows[0]!.id;
    });
    created.push({ id, type: q.type, optionCount: q.options?.length ?? 0 });
  }
  return created;
}

/** A deterministically valid answer value for a given question (used when
 * the specific value doesn't matter to the test). */
export function validAnswerValue(q: CreatedQuestion): number {
  return q.type === "scale" ? 3 : 0;
}

export async function answerAll(
  userId: string,
  wavelengthId: string,
  questions: CreatedQuestion[],
  participant: "A" | "B",
): Promise<void> {
  for (const q of questions) {
    await asRequest(userId, (client) =>
      client.query(
        `insert into answers (wavelength_id, question_id, participant, value)
         values ($1, $2, $3::participant_role, $4::jsonb)`,
        [wavelengthId, q.id, participant, JSON.stringify(validAnswerValue(q))],
      ),
    );
  }
}

export async function finalizeAsA(
  aId: string,
  wavelengthId: string,
  alias = "Alex",
): Promise<void> {
  await asRequest(aId, (client) =>
    client.query("select finalize_draft($1, $2)", [wavelengthId, alias]),
  );
}

export async function claimAsB(bId: string, shareToken: string, alias = "Bailey"): Promise<string> {
  return asRequest(bId, async (client) => {
    const { rows } = await client.query<{ claim_participant_b: string }>(
      "select claim_participant_b($1, $2)",
      [shareToken, alias],
    );
    return rows[0]!.claim_participant_b;
  });
}

/** Builds a full DRAFT -> WAITING -> IN_PROGRESS -> COMPLETED wavelength,
 * ready for read-privacy assertions. Returns every id a test typically needs. */
export async function createCompletedWavelength(): Promise<{
  aId: string;
  bId: string;
  wavelengthId: string;
  shareToken: string;
  questions: CreatedQuestion[];
}> {
  const { aId, wavelengthId, shareToken } = await createDraft();
  const questions = await addQuestions(aId, wavelengthId);
  await answerAll(aId, wavelengthId, questions, "A");
  await finalizeAsA(aId, wavelengthId);

  const bId = await createTestUser();
  await claimAsB(bId, shareToken);
  await answerAll(bId, wavelengthId, questions, "B");
  await asRequest(bId, (client) => client.query("select submit_final_b($1)", [wavelengthId]));

  return { aId, bId, wavelengthId, shareToken, questions };
}
