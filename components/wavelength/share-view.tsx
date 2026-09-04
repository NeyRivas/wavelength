import { CopyLinkButton } from "./copy-link-button";

/**
 * A's post-finalization view. Deliberately shows nothing about B's
 * progress beyond "has B joined yet" (approved rule: A can know B has
 * started, but not see answers or exact progress) — this component never
 * receives an answer count, only a status and B's alias once claimed.
 */
export function ShareView({
  link,
  state,
  bAlias,
}: {
  link: string;
  // COMPLETED is handled one level up (app/w/[token]/page.tsx redirects to
  // /w/[token]/result before this component ever renders for that state).
  state: "WAITING" | "IN_PROGRESS";
  bAlias: string | null;
}) {
  return (
    <section>
      <p>
        <label htmlFor="share-link">Your link</label>
        <br />
        <input id="share-link" type="text" value={link} readOnly />
        <CopyLinkButton link={link} />
      </p>

      {state === "WAITING" && <p>Waiting for someone to open your link.</p>}
      {state === "IN_PROGRESS" && (
        <p>
          {bAlias ?? "Someone"} has joined and is answering — you&apos;ll see the result once they
          finish.
        </p>
      )}
    </section>
  );
}
