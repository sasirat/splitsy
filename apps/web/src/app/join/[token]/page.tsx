import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { buttonVariants } from "@/components/ui/button";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { initialsOf, personName } from "@/lib/format";
import { JoinButton } from "@/modules/groups/components/join-button";
import { getInvitePreview } from "@/modules/groups/queries";
import { requireUser } from "@/server/auth";

const MAX_AVATARS = 5;

export default async function JoinPage({ params }: PageProps<"/join/[token]">) {
  const { token } = await params;
  const user = await requireUser();
  // New users pick a name first, then come straight back here.
  if (!user.displayName) redirect(`/onboarding?next=${encodeURIComponent(`/join/${token}`)}`);

  const invite = await getInvitePreview(token);

  if (!invite) {
    return (
      <PhoneFrame scene="cream" className="items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-h2 text-ink">This invite link doesn&apos;t work any more</h1>
        <p className="text-body text-muted-foreground">
          It may have expired or been reset. Ask whoever sent it for a new one.
        </p>
        <Link href="/" className="text-caption text-primary underline underline-offset-4">
          Back to your bills
        </Link>
      </PhoneFrame>
    );
  }

  const shown = invite.members.slice(0, MAX_AVATARS);
  return (
    <PhoneFrame scene="cream" className="items-center justify-center gap-6 px-6 text-center">
      <p className="text-label text-primary">You&apos;re invited</p>
      <h1 className="text-h2 wrap-anywhere text-ink">
        {invite.inviterName} invited you to {invite.kind === "bill" ? "split" : "join"}{" "}
        <span className="text-primary">{invite.name}</span>
      </h1>
      <div className="flex flex-col items-center gap-2">
        <AvatarStack extra={invite.members.length - shown.length}>
          {shown.map((member) => (
            <Avatar key={member.id} size="md" tone="pink">
              {initialsOf(personName(member))}
            </Avatar>
          ))}
        </AvatarStack>
        <p className="text-caption text-muted-foreground">
          {invite.members.length} {invite.members.length === 1 ? "person" : "people"} in so far
        </p>
      </div>

      {invite.alreadyMember ? (
        <div className="flex w-full flex-col gap-2">
          <p className="text-body text-muted-foreground">You&apos;re already in.</p>
          <Link
            href={invite.destination}
            className={buttonVariants({ size: "lg", className: "w-full" })}
          >
            Open {invite.kind === "bill" ? "bill" : "group"}
          </Link>
        </div>
      ) : (
        <JoinButton token={token} />
      )}
    </PhoneFrame>
  );
}
