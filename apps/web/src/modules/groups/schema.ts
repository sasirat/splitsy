import { z } from "zod";

export const createGroupInput = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the group a name")
    .max(60, "Keep the name under 60 characters"),
});

export type CreateGroupInput = z.input<typeof createGroupInput>;

export const createInviteInput = z.object({ groupId: z.string().min(1) });
export type CreateInviteInput = z.input<typeof createInviteInput>;

export const joinGroupInput = z.object({ token: z.string().min(1).max(100) });
export type JoinGroupInput = z.input<typeof joinGroupInput>;
