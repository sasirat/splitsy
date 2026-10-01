import Link from "next/link";

/** One group in the home list: name plus member and bill counts. */
function GroupCard({
  id,
  name,
  memberCount,
  billCount,
}: {
  id: string;
  name: string;
  memberCount: number;
  billCount: number;
}) {
  return (
    <Link
      href={`/groups/${id}`}
      className="flex flex-col gap-1 rounded-xl bg-paper px-5 py-4 shadow-card transition-[filter] hover:brightness-97 focus-visible:ring-2 focus-visible:ring-blush focus-visible:outline-none"
    >
      <span className="text-h4 wrap-anywhere text-primary">{name}</span>
      <span className="text-caption text-muted-foreground">
        {memberCount} member{memberCount === 1 ? "" : "s"} · {billCount} bill
        {billCount === 1 ? "" : "s"}
      </span>
    </Link>
  );
}

export { GroupCard };
