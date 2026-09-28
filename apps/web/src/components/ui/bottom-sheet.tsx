"use client";

import { Dialog } from "@base-ui/react/dialog";
import type * as React from "react";
import { cn } from "cn";

/** A bottom-anchored sheet built on Base UI Dialog (focus trap, Esc, scroll lock).
 *  Controlled via `open` / `onOpenChange`; slides up from the bottom. */
function BottomSheet({
  open,
  onOpenChange,
  title,
  footer,
  children,
  className,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Required — provides the dialog's accessible name. */
  title: string;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-ink/40 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full max-w-[430px] flex-col rounded-t-2xl bg-paper pt-3 shadow-card outline-none transition-transform duration-300 data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full",
            className,
          )}
        >
          <div aria-hidden className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-border" />
          <div className="flex shrink-0 items-center justify-between px-6 pt-2 pb-4">
            <Dialog.Title className="text-h2 text-ink">{title}</Dialog.Title>
            <Dialog.Close className="font-body text-sm text-muted-foreground uppercase underline outline-none">
              Cancel
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6">{children}</div>
          {footer ? <div className="shrink-0 px-6 pt-4 pb-6">{footer}</div> : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { BottomSheet };
