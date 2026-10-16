import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// Keeps a few statements in app/privacy/page.tsx tied to the code they
// describe, so changing one without the other fails here.

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), "utf8");

const policy = read("app/privacy/page.tsx")
  .replace(/&apos;/g, "'")
  .replace(/\s+/g, " ");

const NAME_FORMS = [
  "components/questionnaire/finalize-form.tsx",
  "components/wavelength/join-form.tsx",
];

describe("privacy policy", () => {
  it("describes the name field the create/join forms actually require", () => {
    for (const form of NAME_FORMS) {
      // The alias input is mandatory in both forms...
      expect(read(form), form).toMatch(/name="alias"[\s\S]{0,80}\brequired\b/);
    }
    // ...so the policy can't say no name is asked for, and has to say one is.
    expect(policy).not.toMatch(/doesn't ask for a name/i);
    expect(policy).toMatch(/you do type a name/i);
  });

  it("says Google Analytics stays off on pages outside the public ones", () => {
    expect(policy).toMatch(/only runs on Sameeeish's public pages/);
    expect(policy).toMatch(/page not found/i);
  });

  it("lists the only query parameters the guard keeps in page addresses", () => {
    const guard = read("lib/analytics/ga-privacy-guard.ts");
    expect(guard).toContain(
      "var campaignKey = /^(?:utm_[a-z0-9_]+|fbclid|gclid|gbraid|wbraid)$/i;",
    );
    expect(policy).toMatch(/trimmed to the page itself plus standard campaign tags/);
    for (const name of ["utm_source", "fbclid", "gclid"]) expect(policy).toContain(name);
  });
});
