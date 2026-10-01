"use client";

import { useMemo, useState } from "react";

import {
  DATE_NIGHT_QUESTIONS,
  DATE_NIGHT_QUESTIONS_BY_ID,
  MOOD_LABELS,
  type DateNightQuestion,
  type Mood,
} from "@/lib/date-night/questions";

type MoodFilter = "all" | Mood;

const MOOD_FILTERS: { id: MoodFilter; label: string; tint: string }[] = [
  { id: "all", label: "All", tint: "lavender" },
  { id: "flirty", label: MOOD_LABELS.flirty, tint: "pink" },
  { id: "funny", label: MOOD_LABELS.funny, tint: "peach" },
  { id: "romantic", label: MOOD_LABELS.romantic, tint: "pink" },
  { id: "random", label: MOOD_LABELS.random, tint: "blue" },
  { id: "deep", label: MOOD_LABELS.deep, tint: "lavender" },
  { id: "hypothetical", label: MOOD_LABELS.hypothetical, tint: "mint" },
];

const FAVORITES_STORAGE_KEY = "sameeeish:date-night:favorites";

function loadFavoriteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

function saveFavoriteIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — favorites
    // just won't persist this session; nothing else depends on this write.
  }
}

function filterQuestions(mood: MoodFilter, query: string): DateNightQuestion[] {
  const q = query.trim().toLowerCase();
  return DATE_NIGHT_QUESTIONS.filter((question) => {
    const matchesMood = mood === "all" || question.moods.includes(mood);
    const matchesSearch = q === "" || question.text.toLowerCase().includes(q);
    return matchesMood && matchesSearch;
  });
}

/** Picks a random question from `pool`, avoiding `excludeId` when there's
 * an actual alternative to pick instead. Returns undefined for an empty
 * pool (the caller renders the empty state). */
function pickRandomQuestion(
  pool: DateNightQuestion[],
  excludeId: string | null,
): DateNightQuestion | undefined {
  if (pool.length === 0) return undefined;
  const candidates = excludeId && pool.length > 1 ? pool.filter((q) => q.id !== excludeId) : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Date Night — Conversation Starters: a conversation-starter library, not
 * a questionnaire. Everything here is local component state plus
 * localStorage for favorites — no Supabase, no account, no scoring, no
 * question numbers/progress.
 *
 * This component is rendered client-only (see the `ssr: false` dynamic
 * import in app/play/dating-couples/date-night/page.tsx), so its initial
 * state can safely call `Math.random()`/read localStorage directly in
 * lazy `useState` initializers — there's no server-rendered markup for
 * it to mismatch against. `currentId` is the explicitly *requested*
 * question (set by Next/Shuffle, picking a mood, or clicking a
 * favorite); `displayedQuestion` below derives what's actually shown
 * from that plus the active mood/search filters, entirely during
 * render — so typing in search or switching moods never needs an effect
 * to "correct" state afterwards, it just recomputes on the next render.
 */
export function DateNightExperience() {
  const [activeMood, setActiveMood] = useState<MoodFilter>("all");
  const [search, setSearch] = useState("");
  const [currentId, setCurrentId] = useState<string | null>(
    () => pickRandomQuestion(DATE_NIGHT_QUESTIONS, null)?.id ?? null,
  );
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadFavoriteIds());

  const activeQuestions = useMemo(() => filterQuestions(activeMood, search), [activeMood, search]);

  // What's actually shown: the explicitly-requested question if it still
  // matches the active mood/search, otherwise the first match in the
  // active set (or none, rendering the empty state) — e.g. typing a
  // search that filters out the question on screen gracefully swaps to
  // one that still matches, without needing an effect to react to it.
  const displayedQuestion = useMemo(() => {
    const requested = currentId ? DATE_NIGHT_QUESTIONS_BY_ID.get(currentId) : undefined;
    if (requested && activeQuestions.some((q) => q.id === requested.id)) return requested;
    return activeQuestions[0] ?? null;
  }, [currentId, activeQuestions]);

  function handleSelectMood(mood: MoodFilter) {
    setActiveMood(mood);
    const nextPool = filterQuestions(mood, search);
    setCurrentId(pickRandomQuestion(nextPool, displayedQuestion?.id ?? null)?.id ?? null);
  }

  function handlePickAnother() {
    const next = pickRandomQuestion(activeQuestions, displayedQuestion?.id ?? null);
    if (next) setCurrentId(next.id);
  }

  function toggleFavorite(id: string) {
    setFavoriteIds((previous) => {
      const next = previous.includes(id)
        ? previous.filter((favoriteId) => favoriteId !== id)
        : [...previous, id];
      saveFavoriteIds(next);
      return next;
    });
  }

  const hasResults = activeQuestions.length > 0;
  const favoriteQuestions = favoriteIds
    .map((id) => DATE_NIGHT_QUESTIONS_BY_ID.get(id))
    .filter((q): q is DateNightQuestion => q !== undefined);

  return (
    <div className="dn-experience">
      <div className="dn-controls">
        <div className="dn-mood-filters-wrap">
          <p className="dn-controls__label">Browse by mood</p>
          <div className="dn-mood-filters" role="tablist" aria-label="Browse by mood">
            {MOOD_FILTERS.map((filter) => {
              const isActive = filter.id === activeMood;
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`dn-mood-filter${isActive ? ` dn-mood-filter--active dn-mood-filter--${filter.tint}` : ""}`}
                  onClick={() => handleSelectMood(filter.id)}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="dn-search">
          <input
            type="search"
            className="dn-search__input"
            placeholder="Search questions…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search questions"
          />
        </div>
      </div>

      <div className="dn-card-stage">
        {displayedQuestion ? (
          <DateNightCard
            question={displayedQuestion}
            isFavorite={favoriteIds.includes(displayedQuestion.id)}
            onToggleFavorite={() => toggleFavorite(displayedQuestion.id)}
          />
        ) : (
          <div className="dn-card dn-card--empty">
            <p className="dn-card__text dn-card__text--empty">
              No questions match that yet. Try a different mood or search.
            </p>
          </div>
        )}
      </div>

      <div className="dn-actions">
        <button
          type="button"
          className="dn-btn dn-btn--primary"
          onClick={handlePickAnother}
          disabled={!hasResults}
        >
          Next <span aria-hidden="true">→</span>
        </button>
        <button
          type="button"
          className="dn-btn dn-btn--secondary"
          onClick={handlePickAnother}
          disabled={!hasResults}
        >
          <span aria-hidden="true">↻</span> Shuffle
        </button>
      </div>

      <section className="dn-favorites">
        <h2 className="dn-favorites__heading">
          <span aria-hidden="true">♥</span> Your favorites
        </h2>
        {favoriteQuestions.length === 0 ? (
          <p className="dn-favorites__empty">Questions you save will appear here.</p>
        ) : (
          <ul className="dn-favorites__list">
            {favoriteQuestions.map((question) => (
              <li key={question.id} className="dn-favorite-item">
                <button
                  type="button"
                  className="dn-favorite-item__main"
                  onClick={() => setCurrentId(question.id)}
                >
                  <span className="dn-favorite-item__text">{question.text}</span>
                  <span className="dn-favorite-item__tags">
                    {question.moods.map((mood) => MOOD_LABELS[mood]).join(" · ")}
                  </span>
                </button>
                <button
                  type="button"
                  className="dn-favorite-item__heart"
                  aria-label="Remove from favorites"
                  onClick={() => toggleFavorite(question.id)}
                >
                  ♥
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DateNightCard({
  question,
  isFavorite,
  onToggleFavorite,
}: {
  question: DateNightQuestion;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <article className="dn-card" aria-label={`Question: ${question.text}`}>
      <button
        type="button"
        className="dn-card__favorite"
        aria-pressed={isFavorite}
        aria-label={isFavorite ? "Remove from favorites" : "Save to favorites"}
        onClick={onToggleFavorite}
      >
        {isFavorite ? "♥" : "♡"}
      </button>
      <p className="dn-card__text">{question.text}</p>
      <p className="dn-card__tags">{question.moods.map((mood) => MOOD_LABELS[mood]).join(" · ")}</p>
    </article>
  );
}
