import { CopyLinkButton } from "./copy-link-button";

/**
 * A's post-finalization view. Deliberately shows nothing about B's
 * progress beyond "has B joined yet" (approved rule: A can know B has
 * started, but not see answers or exact progress) — this component never
 * receives an answer count, only a status and B's alias once claimed.
 *
 * Presentation only: same two props/states as before. The link itself is
 * kept visually secondary (smaller, muted, truncating) — "Copy link" is
 * the one prominent action in this card, matching the brief's "invitation
 * area is the main functional focus" without turning the link display
 * itself into a competing CTA.
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
    <section className="share-card">
      <p className="share-card__label">Your invitation link</p>

      <div className="share-card__link-row">
        <label htmlFor="share-link" className="share-link-visually-hidden">
          Your invitation link
        </label>
        <input id="share-link" className="share-link" type="text" value={link} readOnly />
        <CopyLinkButton link={link} />
      </div>

      <p className="share-status">
        <span
          className={`share-status__dot share-status__dot--${state === "IN_PROGRESS" ? "joined" : "waiting"}`}
          aria-hidden="true"
        />
        {state === "WAITING" && "Waiting for someone to open your link."}
        {state === "IN_PROGRESS" &&
          `${bAlias ?? "Someone"} has joined and is answering — you'll see the result once they finish.`}
      </p>
    </section>
  );
}
