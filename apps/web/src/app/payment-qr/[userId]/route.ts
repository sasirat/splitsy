import { getPaymentQr } from "@/modules/settlement/queries";

/** A user's payment QR image, for people allowed to see it (see getPaymentQr).
 *  Same 404 for "no QR" and "not allowed", so it can't be probed.
 *  The browser cache is shared by everyone who signs in on that browser, so
 *  it must ask again on every view ("no-cache"): the access check runs each
 *  time, and an unchanged image costs only a bodiless 304 via its ETag. */
export async function GET(request: Request, ctx: RouteContext<"/payment-qr/[userId]">) {
  const { userId } = await ctx.params;
  const qr = await getPaymentQr(userId);
  if (!qr) return notFound();

  const headers = {
    "Cache-Control": "private, no-cache",
    ETag: `"${qr.updatedAt.getTime()}"`,
    "X-Content-Type-Options": "nosniff",
  };
  if (matchesETag(request.headers.get("If-None-Match"), headers.ETag)) {
    return new Response(null, { status: 304, headers });
  }
  // Removed since the check above? Then there's nothing to show.
  const image = await qr.loadImage();
  if (!image) return notFound();
  return new Response(new Uint8Array(image), {
    headers: { ...headers, "Content-Type": qr.mimeType },
  });
}

/** Never cached, so a viewer who gains access sees the image right away. */
const notFound = () =>
  new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

/** If-None-Match compares weakly: any tag in the list, W/ ignored, or "*". */
function matchesETag(ifNoneMatch: string | null, etag: string): boolean {
  if (!ifNoneMatch) return false;
  return ifNoneMatch
    .split(",")
    .map((tag) => tag.trim())
    .some((tag) => tag === "*" || tag.replace(/^W\//, "") === etag);
}
