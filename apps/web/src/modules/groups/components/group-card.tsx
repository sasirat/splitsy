import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { initialsOf } from "@/lib/format";

/** One group in the home list: name, member and bill counts, and the first
 *  few members as avatars — a white card like the group page's. */
function GroupCard({
  id,
  name,
  memberCount,
  billCount,
  memberPreview,
}: {
  id: string;
  name: string;
  memberCount: number;
  billCount: number;
  /** The first few members, in join order. */
  memberPreview: { id: string; name: string }[];
}) {
  return (
    <Link
      href={`/groups/${id}`}
      className="flex items-center justify-between gap-3 rounded-lg bg-white px-5 py-4 shadow-[0_4px_4px_rgb(193_190_190/0.25)] transition-[filter] hover:brightness-97 focus-visible:ring-2 focus-visible:ring-blush focus-visible:outline-none"
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-2xl wrap-anywhere text-primary">{name}</span>
        <span className="text-sm text-pebble">
          {memberCount} member{memberCount === 1 ? "" : "s"} · {billCount} bill
          {billCount === 1 ? "" : "s"}
        </span>
      </span>
      {/* Decorative: the count above already says who's in, and the initials
          would otherwise be read out as part of the link's name. */}
      <span aria-hidden className="shrink-0">
        <AvatarStack extra={memberCount - memberPreview.length}>
          {memberPreview.map((member) => (
            <Avatar key={member.id} size="md">
              {initialsOf(member.name)}
            </Avatar>
          ))}
        </AvatarStack>
      </span>
    </Link>
  );
}

export { GroupCard };
