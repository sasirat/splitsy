import { cn } from "cn";
import { CircleCheckIcon } from "lucide-react";
import Image from "next/image";
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
const LONG_NAME = 14;

export default async function JoinPage({ params, searchParams }: PageProps<"/join/[token]">) {
  const { token } = await params;
  const { bill } = await searchParams;
  const billId = typeof bill === "string" ? bill : undefined;
  const user = await requireUser();
  // New users pick a name first, then come straight back here.
  if (!user.displayName) {
    const back = `/join/${token}${billId ? `?bill=${encodeURIComponent(billId)}` : ""}`;
    redirect(`/onboarding?next=${encodeURIComponent(back)}`);
  }

  const invite = await getInvitePreview(token, billId);

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
  // The sheet narrows into the envelope's V below the first line, so a long
  // name gets a smaller size to wrap inside it.
  const longName = invite.name.length > LONG_NAME;
  return (
    <PhoneFrame className="relative isolate overflow-hidden bg-scene-green px-6 pt-10 pb-8 text-center">
      {/* Figma "invited": a garden photo with the envelope in front of it. */}
      <Image
        src="/art/invite-bg.jpg"
        alt=""
        fill
        priority
        sizes="(max-width: 430px) 100vw, 430px"
        className="-z-10 object-cover"
      />
      {/* Keeps the white footer text readable over the grass. */}
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-linear-to-t from-black/40 to-transparent" />

      <div className="flex flex-1 flex-col justify-center">
        <p className="relative z-10 -mb-8 self-end pr-2 text-royale text-white">
          You&apos;re invited
        </p>
        {/* The card's writing area is the white sheet in the art: % of 888×928.
            Text sizes follow the envelope's width (cqw), so a long name stays
            on the sheet and off the wax seal on small phones. */}
        <div className="@container relative -mr-6 ml-auto aspect-[888/928] w-[calc(100%+0.5rem)]">
          <Image
            src="/art/invited.png"
            alt=""
            fill
            priority
            sizes="(max-width: 430px) 100vw, 430px"
            className="object-contain"
          />
          <h1 className="absolute top-[24%] right-[25%] left-[14%] flex flex-col gap-1">
            <span className="text-[length:min(16px,4.4cqw)] text-ink">
              <span className="text-scene-green">{invite.inviterName}</span> invited you to{" "}
              {invite.kind === "bill" ? "split" : "join"}{" "}
            </span>
            <span
              className={cn(
                "line-clamp-2 leading-tight font-bold wrap-anywhere text-lagoon",
                longName
                  ? "px-[6%] text-[length:min(26px,6.5cqw)]"
                  : "text-[length:min(36px,9cqw)]",
              )}
            >
              {invite.name}
            </span>
            {invite.groupName ? (
              <span className="truncate text-[length:min(13px,3.6cqw)] text-ink/70">
                in {invite.groupName}
              </span>
            ) : null}
          </h1>
        </div>
        {invite.alreadyMember ? (
          <p className="mt-2 inline-flex items-center gap-2 self-center rounded-full bg-white/10 px-4 py-2 text-base font-bold text-white backdrop-blur-sm">
            <CircleCheckIcon aria-hidden className="size-4" />
            You&apos;re already in.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col items-center gap-2 border-t border-white/80 pt-5">
        <AvatarStack extra={invite.members.length - shown.length}>
          {shown.map((member) => (
            <Avatar key={member.id} size="md">
              {initialsOf(personName(member))}
            </Avatar>
          ))}
        </AvatarStack>
        <p className="text-sm text-white">
          {invite.members.length} {invite.members.length === 1 ? "person" : "people"} in so far
        </p>
      </div>

      <div className="mt-6">
        {invite.alreadyMember ? (
          <Link
            href={invite.destination}
            className={buttonVariants({ size: "lg", className: "w-full" })}
          >
            Open {invite.kind === "bill" ? "bill" : "group"}
          </Link>
        ) : (
          <JoinButton token={token} billId={billId} />
        )}
      </div>
    </PhoneFrame>
  );
}
