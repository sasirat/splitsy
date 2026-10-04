import { getPaymentQr } from "@/modules/settlement/queries";

/** A user's payment QR image, for people allowed to see it (see getPaymentQr).
 *  Same 404 for "no QR" and "not allowed", so it can't be probed. The URL
 *  carries ?v=<version>, so the browser can cache each version privately. */
export async function GET(_request: Request, ctx: RouteContext<"/payment-qr/[userId]">) {
  const { userId } = await ctx.params;
  const qr = await getPaymentQr(userId);
  if (!qr) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(qr.image), {
    headers: {
      "Content-Type": qr.mimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
