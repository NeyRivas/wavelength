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
  state: "WAITING" | "IN_PROGRESS" | "COMPLETED";
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
      {state === "COMPLETED" && <p>Complete! The results screen is coming soon.</p>}
    </section>
  );
}
