"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Copies `value` and says so for a moment. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (e.g. insecure context) — the number is on screen to copy by hand.
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={copy} aria-label={copied ? undefined : label}>
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </Button>
  );
}

export { CopyButton };
