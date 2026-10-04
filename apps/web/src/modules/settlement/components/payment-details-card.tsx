"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatAccountNumber } from "../service";
import { PaymentDetailsSheet, type PaymentDetails } from "./payment-details-sheet";

/** The payer's own view of how friends pay them, with Add / Edit. */
function PaymentDetailsCard({ details }: { details: PaymentDetails | null }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {details ? (
        <div className="flex items-start justify-between gap-3 rounded-lg bg-paper px-4 py-3 text-ink">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-label text-muted-foreground">Friends pay you by</span>
            {details.accountNumber ? (
              <span className="text-body wrap-anywhere">
                {details.bankName} · {formatAccountNumber(details.accountNumber)} ·{" "}
                {details.accountName}
              </span>
            ) : null}
            {details.qrUrl ? <span className="text-body">QR image</span> : null}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
            Edit
          </Button>
        </div>
      ) : (
        <Button
          variant="dashed"
          size="lg"
          className="w-full text-cream"
          onClick={() => setOpen(true)}
        >
          Add how friends pay you
        </Button>
      )}
      <PaymentDetailsSheet open={open} onOpenChange={setOpen} details={details} />
    </>
  );
}

export { PaymentDetailsCard };
