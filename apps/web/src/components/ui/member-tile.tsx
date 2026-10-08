import { cn } from "cn";
import { Avatar } from "./avatar";

/** A big initials avatar with the name underneath — one person in a grid
 *  (a group's members, "who pays the bill?"). */
function MemberTile({
  initials,
  name,
  className,
}: {
  initials: string;
  name: string;
  className?: string;
}) {
  return (
    <div className={cn("flex w-full max-w-16 flex-col items-center gap-1.5", className)}>
      <Avatar size="xl" className="text-md">
        {initials}
      </Avatar>
      <span title={name} className="w-full truncate text-center text-xs font-bold text-primary">
        {name}
      </span>
    </div>
  );
}

export { MemberTile };
