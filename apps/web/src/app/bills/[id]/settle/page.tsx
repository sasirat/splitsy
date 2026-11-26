import { redirect } from "next/navigation";

/** The settle-up lives on the summary page now. Kept as a redirect so links in
 *  reminders already sent ("Pay here: …/settle") still land in the right place. */
export default async function SettlePage({ params }: PageProps<"/bills/[id]/settle">) {
  const { id } = await params;
  redirect(`/bills/${id}/summary`);
}
