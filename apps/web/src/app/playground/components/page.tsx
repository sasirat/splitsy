"use client";

import Link from "next/link";
import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MemberRow } from "@/components/ui/member-row";
import { Pill } from "@/components/ui/pill";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono text-xs uppercase tracking-wide text-muted">{title}</h2>
      <div className="flex flex-wrap items-center gap-4 rounded-xl bg-paper p-6 shadow-card">
        {children}
      </div>
    </section>
  );
}

const MEMBERS = ["Nan", "Tee", "Mook", "Ploy"] as const;

export default function ComponentsPlayground() {
  const [checked, setChecked] = React.useState(true);
  const [split, setSplit] = React.useState<Record<string, boolean>>({
    Nan: true,
    Tee: true,
    Mook: false,
    Ploy: false,
  });
  const count = MEMBERS.filter((m) => split[m]).length;
  const perHead = count > 0 ? Math.round(390 / count) : 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl font-black text-primary">Components</h1>
        <p className="font-body text-md text-muted">
          shadcn/ui + Splitsy tokens · S4.{" "}
          <Link href="/playground" className="text-primary underline">
            tokens
          </Link>
          {" · "}
          <Link href="/" className="text-primary underline">
            home
          </Link>
        </p>
      </header>

      <Section title="Buttons">
        <Button variant="primary">Continue with Google</Button>
        <Button variant="solid">Add item</Button>
        <Button variant="dashed" className="text-primary">
          more item?
        </Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </Section>

      <Section title="Button sizes">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </Section>

      <Section title="Avatars">
        <Avatar size="sm">SC</Avatar>
        <Avatar size="md">KK</Avatar>
        <Avatar size="lg" tone="pink">
          N
        </Avatar>
        <Avatar size="xl" tone="blush">
          NN
        </Avatar>
        <Avatar size="lg" tone="white">
          +1
        </Avatar>
      </Section>

      <Section title="Avatar stack">
        <AvatarStack extra={1} size="md">
          <Avatar size="md">SC</Avatar>
          <Avatar size="md">KK</Avatar>
          <Avatar size="md">AM</Avatar>
        </AvatarStack>
      </Section>

      <Section title="Pill & badges">
        <Pill>⚡ everyone!</Pill>
        <Badge variant="owe">Owe</Badge>
        <Badge variant="paid">Paid</Badge>
        <Badge variant="neutral">Pending</Badge>
      </Section>

      <Section title="Inputs">
        <Input placeholder="Item name" className="max-w-60" />
        <Input placeholder="0" inputMode="numeric" className="w-24 text-center" />
      </Section>

      <Section title="Checkbox">
        <label className="flex items-center gap-3 font-body text-base text-ink">
          <Checkbox checked={checked} onCheckedChange={(c) => setChecked(Boolean(c))} />
          Split this item
        </label>
      </Section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-wide text-muted">
          Member rows · ฿390 split {count} way{count === 1 ? "" : "s"}
        </h2>
        <div className="overflow-hidden rounded-xl border border-primary bg-white">
          {MEMBERS.map((m) => (
            <MemberRow
              key={m}
              name={m}
              initials={m.charAt(0)}
              amount={split[m] ? perHead : 0}
              checked={Boolean(split[m])}
              onCheckedChange={(c) => setSplit((s) => ({ ...s, [m]: Boolean(c) }))}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
