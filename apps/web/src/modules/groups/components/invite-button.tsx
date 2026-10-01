"use client";

import { cn } from "cn";
import { useState, useTransition } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionResult } from "@/lib/action-result";
import { callAction } from "@/lib/call-action";
import { formatShortDate } from "@/lib/format";
import { getOrCreateInvite, resetInvite } from "../actions";

type Link = { url: string; expiresAt: Date };

/** "Invite friends" button + sheet with the group's share link: copy, native
 *  share, or reset. Works for a quick bill's hidden group and named groups. */
function InviteButton({
  groupId,
  billId,
  label = "Invite friends",
  className,
}: {
  groupId: string;
  /** When sharing from a bill, the joiner lands on it (if it's in the group). */
  billId?: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [link, setLink] = useState<Link | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function load(action: () => Promise<ActionResult<{ path: string; expiresAt: Date }>>) {
    setError(null);
    setCopied(false);
    startTransition(async () => {
      const result = await callAction(action);
      if (!result.ok) return setError(result.error);
      // The server returns a path; our own origin makes it a full link.
      const query = billId ? `?bill=${encodeURIComponent(billId)}` : "";
      setLink({
        url: `${window.location.origin}${result.path}${query}`,
        expiresAt: result.expiresAt,
      });
    });
  }

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next && !link) load(() => getOrCreateInvite({ groupId }));
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
    } catch {
      setError("Couldn't copy — select the link and copy it yourself.");
    }
  }

  async function share() {
    if (!link) return;
    try {
      await navigator.share({ title: "Join me on Splitsy", url: link.url });
    } catch {
      // Dismissing the share menu rejects too; nothing to report.
    }
  }

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <>
      <Button
        variant="dashed"
        size="lg"
        className={cn("w-full", className)}
        onClick={() => onOpenChange(true)}
      >
        {label}
      </Button>

      <BottomSheet open={open} onOpenChange={onOpenChange} title="Invite friends" closeLabel="Done">
        <div className="flex flex-col gap-3 pb-6">
          <p className="text-body text-muted-foreground">
            Anyone with this link can join and claim items.
          </p>
          <label htmlFor="invite-link" className="sr-only">
            Invite link
          </label>
          <Input
            id="invite-link"
            readOnly
            value={link?.url ?? (pending ? "Making a link…" : "")}
            onFocus={(event) => event.currentTarget.select()}
            className="text-caption"
          />
          <div className="flex gap-2">
            <Button variant="solid" className="flex-1" onClick={copy} disabled={!link || pending}>
              {copied ? "Copied!" : "Copy link"}
            </Button>
            {canShare ? (
              <Button className="flex-1" onClick={share} disabled={!link || pending}>
                Share…
              </Button>
            ) : null}
          </div>
          <p
            role={error ? "alert" : undefined}
            className={error ? "text-body text-primary" : "text-caption text-muted-foreground"}
          >
            {error ?? (link ? `Expires ${formatShortDate(link.expiresAt)}.` : "")}
          </p>
          <button
            type="button"
            onClick={() => load(() => resetInvite({ groupId }))}
            disabled={pending}
            className="self-start text-caption text-muted-foreground underline underline-offset-2 disabled:opacity-50"
          >
            Reset link (the old one stops working)
          </button>
        </div>
      </BottomSheet>
    </>
  );
}

export { InviteButton };
