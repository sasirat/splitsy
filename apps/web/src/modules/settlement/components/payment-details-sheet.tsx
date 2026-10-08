"use client";

import { useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firstIssue, type ActionResult } from "@/lib/action-result";
import { callAction } from "@/lib/call-action";
import {
  removePaymentDetails,
  removePaymentQr,
  savePaymentDetails,
  uploadPaymentQr,
} from "../actions";
import { paymentDetailsInput, THAI_BANKS } from "../schema";
import { formatAccountNumber } from "../service";

export type PaymentDetails = {
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  /** Where the current QR image is served; null when there's none. */
  qrUrl: string | null;
};

const FORM_ID = "payment-details-form";
const fieldClass =
  "flex h-14 w-full rounded-lg border-[1.5px] border-border bg-white px-4 font-body text-md text-ink outline-none focus-visible:border-primary";

/** Longest side of the uploaded image. QR uploads are usually full-screen
 *  bank-app screenshots with the code in the middle, so keep enough pixels
 *  for it to scan from another phone. */
const QR_MAX_PX = 1200;
/** Must match the server's limit in uploadPaymentQr. */
const QR_MAX_BYTES = 512 * 1024;

/** Shrink a QR screenshot in the browser before uploading it. High-quality
 *  JPEG keeps QR edges crisp at a fraction of PNG's size; quality only drops
 *  if a busy screenshot would still be over the limit. */
async function resizeQr(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, QR_MAX_PX / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("no canvas");
  // JPEG has no transparency; a transparent PNG would turn black without this.
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.92, 0.8, 0.65]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) throw new Error("resize failed");
    if (blob.size <= QR_MAX_BYTES) return blob;
  }
  throw new Error("still too big");
}

/** The payer's "How friends pay you" sheet: a bank account, a QR image from
 *  their bank app, or both. Each part saves on its own. */
function PaymentDetailsSheet({
  open,
  onOpenChange,
  details,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: PaymentDetails | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hasBank = Boolean(details?.accountNumber);

  function run(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await callAction(action);
      if (!result.ok) setError(result.error);
    });
  }

  function onSaveBank(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = {
      bankName: String(data.get("bankName") ?? ""),
      accountNumber: String(data.get("accountNumber") ?? ""),
      accountName: String(data.get("accountName") ?? ""),
    };
    const parsed = paymentDetailsInput.safeParse(input);
    if (!parsed.success) return setError(firstIssue(parsed.error));
    run(() => savePaymentDetails(parsed.data));
  }

  function onPickQr(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    startTransition(async () => {
      let image: Blob;
      try {
        image = await resizeQr(file);
      } catch {
        setError("Couldn't read that image — try a PNG or JPEG screenshot");
        return;
      }
      const form = new FormData();
      form.set("qr", image, "qr.jpg");
      const result = await callAction(() => uploadPaymentQr(form));
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="How friends pay you"
      closeLabel="Done"
      footer={
        <Button
          form={FORM_ID}
          type="submit"
          variant="solid"
          size="lg"
          className="w-full"
          disabled={pending}
        >
          {pending ? "Saving…" : hasBank ? "Update bank account" : "Save bank account"}
        </Button>
      }
    >
      <div className="flex flex-col gap-6 pb-2">
        {/* Keyed on the saved account so the uncontrolled fields remount with
            the new values after a save, instead of their defaultValue changing
            under them (Base UI warns about that). */}
        <form
          key={`${details?.bankName}|${details?.accountNumber}|${details?.accountName}`}
          id={FORM_ID}
          onSubmit={onSaveBank}
          className="flex flex-col gap-3"
          noValidate
        >
          <h3 className="text-label text-muted-foreground">Bank account</h3>
          <label className="sr-only" htmlFor="bank-name">
            Bank
          </label>
          <select
            id="bank-name"
            name="bankName"
            defaultValue={details?.bankName ?? ""}
            className={fieldClass}
          >
            <option value="" disabled>
              Pick your bank
            </option>
            {THAI_BANKS.map((bank) => (
              <option key={bank} value={bank}>
                {bank}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="account-number">
            Account number
          </label>
          <Input
            id="account-number"
            name="accountNumber"
            placeholder="Account number"
            inputMode="numeric"
            autoComplete="off"
            defaultValue={details?.accountNumber ? formatAccountNumber(details.accountNumber) : ""}
          />
          <label className="sr-only" htmlFor="account-name">
            Name on the account
          </label>
          <Input
            id="account-name"
            name="accountName"
            placeholder="Name on the account"
            maxLength={80}
            autoComplete="off"
            defaultValue={details?.accountName ?? ""}
          />
          {hasBank ? (
            <button
              type="button"
              className="self-start text-caption text-muted-foreground underline"
              onClick={() => run(removePaymentDetails)}
              disabled={pending}
            >
              Remove bank account
            </button>
          ) : null}
        </form>

        <section className="flex flex-col gap-3">
          <h3 className="text-label text-muted-foreground">QR from your bank app</h3>
          {details?.qrUrl ? (
            // A user upload served from our own route — next/image adds nothing here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={details.qrUrl}
              alt="Your payment QR"
              className="mx-auto max-h-72 w-auto rounded-lg border border-border bg-white"
            />
          ) : null}
          <label className="flex h-14 cursor-pointer items-center justify-center rounded-full border border-dashed border-primary text-lg font-bold text-primary has-[:disabled]:opacity-50">
            {details?.qrUrl ? "Replace QR image" : "Upload QR image"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={onPickQr}
              disabled={pending}
            />
          </label>
          {details?.qrUrl ? (
            <button
              type="button"
              className="self-start text-caption text-muted-foreground underline"
              onClick={() => run(removePaymentQr)}
              disabled={pending}
            >
              Remove QR image
            </button>
          ) : null}
        </section>

        {error ? (
          <p role="alert" className="text-body text-primary">
            {error}
          </p>
        ) : null}
      </div>
    </BottomSheet>
  );
}

export { PaymentDetailsSheet };
