import { describe, expect, it } from "vitest";

import {
  DEMO_CAPTIONS,
  DEMO_CHOICE_PICK,
  DEMO_CLICKS_MS,
  DEMO_DURATION_MS,
  DEMO_SCALE_PICK,
  DEMO_SCENES,
  DEMO_SCORE,
  REDUCED_MOTION_FRAME_MS,
  getDemoFrame,
  sceneIndexAt,
} from "../../components/landing/hero-demo-timeline";
import { RESULT_CARDS } from "../../components/result/cards/result-card-content";
import { alignmentLevel } from "../../lib/scoring/score";
import { SCALE_VALUES } from "../../lib/wavelength/categories";
import { getReadyMadeGame } from "../../lib/wavelength/ready-made-games";
import { GRADIENT_PRESETS } from "../../lib/wavelength/result-cards";

describe("hero demo timeline", () => {
  it("covers the whole loop with back-to-back scenes", () => {
    expect(DEMO_SCENES[0]!.start).toBe(0);
    DEMO_SCENES.forEach((scene, i) => {
      expect(scene.end).toBeGreaterThan(scene.start);
      expect(scene.still).toBeGreaterThanOrEqual(scene.start);
      expect(scene.still).toBeLessThan(scene.end);
      if (i > 0) expect(scene.start).toBe(DEMO_SCENES[i - 1]!.end);
    });
    expect(DEMO_SCENES.at(-1)!.end).toBe(DEMO_DURATION_MS);
  });

  it("covers the whole loop with back-to-back captions", () => {
    expect(DEMO_CAPTIONS[0]!.start).toBe(0);
    DEMO_CAPTIONS.forEach((caption, i) => {
      if (i > 0) expect(caption.start).toBe(DEMO_CAPTIONS[i - 1]!.end);
    });
    expect(DEMO_CAPTIONS.at(-1)!.end).toBe(DEMO_DURATION_MS);
    for (let t = 0; t < DEMO_DURATION_MS; t += 50) {
      expect(getDemoFrame(t).captionIndex).toBeGreaterThanOrEqual(0);
    }
  });

  it("wraps around the loop", () => {
    expect(sceneIndexAt(DEMO_DURATION_MS)).toBe(0);
    expect(getDemoFrame(DEMO_DURATION_MS + 100).t).toBe(100);
  });

  it("shows a choice question, then a scale question, each answered by a click", () => {
    expect(getDemoFrame(1_000).questions).toMatchObject({ showScale: false, choicePicked: false });
    expect(getDemoFrame(1_400).questions).toMatchObject({ showScale: false, choicePicked: true });
    expect(getDemoFrame(3_000).questions).toMatchObject({ showScale: true, scalePicked: false });
    expect(getDemoFrame(4_800).questions).toMatchObject({ showScale: true, scalePicked: true });
  });

  it("copies the link, then shows the partner joining", () => {
    expect(getDemoFrame(6_000).invite).toEqual({ copied: false, joined: false });
    expect(getDemoFrame(7_000).invite).toEqual({ copied: true, joined: false });
    expect(getDemoFrame(9_000).invite).toEqual({ copied: true, joined: true });
  });

  it("reveals the result, counts the meter up to the score and scrolls to the categories", () => {
    expect(getDemoFrame(9_500).result.phase).toBe("finding");
    expect(getDemoFrame(10_500).result.phase).toBe("ready");
    const counting = getDemoFrame(11_500).result;
    expect(counting.phase).toBe("revealed");
    expect(counting.meterScore).toBeGreaterThan(0);
    expect(counting.meterScore).toBeLessThan(DEMO_SCORE);
    const settled = getDemoFrame(REDUCED_MOTION_FRAME_MS).result;
    expect(settled).toMatchObject({
      phase: "revealed",
      meterScore: DEMO_SCORE,
      detailsVisible: true,
      scrolled: false,
    });
    expect(getDemoFrame(14_000).result.scrolled).toBe(true);
  });

  it("goes through every share card before changing the colors", () => {
    const share = (t: number) => getDemoFrame(t).share;
    const seen: number[] = [];
    let lastCardChange = 0;
    let firstPresetChange = Infinity;
    for (let t = DEMO_SCENES[3]!.start; t < DEMO_DURATION_MS; t += 50) {
      const { cardIndex, presetIndex } = share(t);
      if (seen.at(-1) !== cardIndex) {
        seen.push(cardIndex);
        lastCardChange = t;
      }
      if (presetIndex !== 0) firstPresetChange = Math.min(firstPresetChange, t);
      expect(presetIndex).toBeLessThan(GRADIENT_PRESETS.length);
    }
    expect(seen).toEqual(RESULT_CARDS.map((_, i) => i));
    expect(firstPresetChange).toBeGreaterThan(lastCardChange);
  });

  it("only clicks while the pointer is on a target", () => {
    for (const click of DEMO_CLICKS_MS) {
      const { cursor } = getDemoFrame(click);
      expect(cursor.visible).toBe(true);
      expect(cursor.target).not.toBeNull();
      expect(cursor.clicking).toBe(true);
    }
  });

  it("holds the pointer out of sight on every still frame", () => {
    for (const scene of DEMO_SCENES) {
      expect(getDemoFrame(scene.still).cursor.visible).toBe(false);
    }
  });

  it("does not fade a scene out while paused", () => {
    const nearEnd = DEMO_SCENES[0]!.end - 100;
    expect(getDemoFrame(nearEnd).leaving).toBe(true);
    expect(getDemoFrame(nearEnd, { paused: true }).leaving).toBe(false);
  });
});

describe("hero demo content", () => {
  const quiz = getReadyMadeGame("how-well-do-you-know-each-other")?.questions ?? [];

  it("demos a real choice question and a real scale question from the couples quiz", () => {
    const choice = quiz[3];
    expect(choice?.type).toBe("choice");
    expect(choice?.options?.length ?? 0).toBeGreaterThan(DEMO_CHOICE_PICK);
    expect(quiz.some((q) => q.type === "scale")).toBe(true);
    expect(SCALE_VALUES.length).toBeGreaterThan(DEMO_SCALE_PICK);
  });

  it("uses a score the result page would call high alignment", () => {
    expect(alignmentLevel(DEMO_SCORE)).toBe("High Alignment");
  });
});

describe("hero markup", () => {
  it("renders the demo with the app's own quiz UI on the server", async () => {
    const { createElement } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { HeroDemo } = await import("../../components/landing/hero-demo");
    const html = renderToStaticMarkup(createElement(HeroDemo));
    expect(html).toContain('class="quiz-card quiz-card--pink');
    expect(html).toContain("Question 4 of 12");
    expect(html).toContain('aria-label="Pause demo"');
    expect(html).not.toContain("<h1");
    expect(html).not.toContain("<h2");
  });

  it("links the hero to the four main ways to play", async () => {
    const { createElement } = await import("react");
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { LandingHero } = await import("../../components/landing/landing-hero");
    const html = renderToStaticMarkup(createElement(LandingHero));
    expect(html.match(/<h1/g)).toHaveLength(1);
    for (const href of [
      "/play/dating-couples/couples-compatibility-test",
      "/play/friends/friendship-test",
      "/play/dating-couples/date-night",
      "/create",
    ]) {
      expect(html).toContain(`href="${href}"`);
    }
  });
});
