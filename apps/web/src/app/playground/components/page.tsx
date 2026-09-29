"use client";

import Link from "next/link";
import * as React from "react";
import { Avatar } from "@/components/ui/avatar";
import { AvatarStack } from "@/components/ui/avatar-stack";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MemberRow } from "@/components/ui/member-row";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { Pill } from "@/components/ui/pill";
import { ItemRow } from "@/modules/bills/components/item-row";
import { ReceiptCard } from "@/modules/bills/components/receipt-card";
import { TotalDisplay } from "@/modules/bills/components/total-display";
import { splitItem } from "@/modules/items/service";
import { DebtorRow } from "@/modules/settlement/components/debtor-row";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-micro text-muted-foreground">{title}</h2>
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
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetSplit, setSheetSplit] = React.useState<Record<string, boolean>>({
    Nan: true,
    Tee: true,
  });
  const sharers = MEMBERS.filter((m) => split[m]);
  // Amounts are satang: ฿390 split evenly, exact to the satang.
  const shares = splitItem(
    39000,
    sharers.map((userId) => ({ userId, shares: 1 })),
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl font-black text-primary">Components</h1>
        <p className="font-body text-md text-muted-foreground">
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
        <h2 className="text-micro text-muted-foreground">
          Member rows · ฿390 split {sharers.length} way{sharers.length === 1 ? "" : "s"}
        </h2>
        <div className="overflow-hidden rounded-xl border border-primary bg-white">
          {MEMBERS.map((m) => (
            <MemberRow
              key={m}
              name={m}
              initials={m.charAt(0)}
              amount={split[m] ? (shares[m] ?? 0) : 0}
              checked={Boolean(split[m])}
              onCheckedChange={(c) => setSplit((s) => ({ ...s, [m]: Boolean(c) }))}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-micro text-muted-foreground">Receipt · modules/bills</h2>
        <div className="rounded-2xl bg-scene-green p-6 pt-8">
          <ReceiptCard title="Ramen night" date="16/09/2569 · THONGLOR" subtotal={117000}>
            <ItemRow
              name="Tonkotsu ramen ×2"
              price={64000}
              sharers={[{ initials: "SC" }, { initials: "KK" }]}
            />
            <ItemRow
              name="Gyoza"
              price={12000}
              sharers={[{ initials: "SC" }, { initials: "KK" }]}
            />
            <ItemRow
              name="Hoegaarden ×2"
              price={26000}
              sharers={[{ initials: "SC" }, { initials: "KK" }]}
            />
            <ItemRow
              name="Matcha soft serve"
              price={15000}
              sharers={[{ initials: "SC" }, { initials: "KK" }]}
            />
          </ReceiptCard>
          <TotalDisplay amount={135000} className="pt-8" />
        </div>
      </section>

      <Section title="Phone frame · components/ui">
        <PhoneFrame
          scene="green"
          className="h-[260px] min-h-0 items-center justify-center gap-2 rounded-2xl"
        >
          <span className="text-h3 text-white">Scene: green</span>
          <span className="text-caption text-white/80">430px centered · full-bleed on phones</span>
        </PhoneFrame>
      </Section>

      <Section title="Bottom sheet · components/ui">
        <Button onClick={() => setSheetOpen(true)}>Open sheet</Button>
        <BottomSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          title="Add item"
          footer={
            <Button
              variant="solid"
              size="lg"
              className="w-full"
              onClick={() => setSheetOpen(false)}
            >
              Add item
            </Button>
          }
        >
          <div className="flex flex-col gap-4 pb-2">
            <div className="flex gap-3">
              <Input placeholder="Item name" className="flex-1" />
              <Input placeholder="0" inputMode="numeric" className="w-24 text-center" />
            </div>
            <span className="text-label text-ink">Who&apos;s splitting this?</span>
            <div className="overflow-hidden rounded-xl border border-primary bg-white">
              {(["Nan", "Tee"] as const).map((m) => (
                <MemberRow
                  key={m}
                  name={m}
                  initials={m.charAt(0)}
                  amount={sheetSplit[m] ? 19500 : 0}
                  checked={Boolean(sheetSplit[m])}
                  onCheckedChange={(c) => setSheetSplit((s) => ({ ...s, [m]: Boolean(c) }))}
                />
              ))}
            </div>
          </div>
        </BottomSheet>
      </Section>

      <section className="flex flex-col gap-4">
        <h2 className="text-micro text-muted-foreground">Debtor rows · modules/settlement</h2>
        <div className="overflow-hidden rounded-xl border border-primary bg-white">
          <DebtorRow name="Tee" initials="T" amount={23500} status="Waiting for slip" state="owe" />
          <DebtorRow
            name="Mook"
            initials="M"
            amount={20000}
            status="Settle verified"
            state="paid"
          />
          <DebtorRow
            name="Ploy"
            initials="P"
            amount={16000}
            status="Waiting for slip"
            state="owe"
          />
        </div>
      </section>
    </main>
  );
}
