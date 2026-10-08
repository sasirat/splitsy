// The core loop, end to end, with two people: Mint creates a bill and adds
// items, Ploy joins through an invite link, both claim, and the summary shows
// who owes whom.
import { expect, test, type Page } from "@playwright/test";
import { cleanupBill, cleanupGroup, resetPayment, setBillStatus, unnameUser } from "./db";

const TITLE = `E2E dinner ${Date.now()}`;
const LOCKED_TITLE = `E2E locked ${Date.now()}`;
const GROUP_NAME = `E2E flat ${Date.now()}`;
const NEWBIE_TITLE = `E2E newbie ${Date.now()}`;

async function signInAs(page: Page, name: string) {
  await page.goto("/login");
  await page.getByRole("button", { name: `Continue as ${name}` }).click();
  await expect(page).toHaveURL("/");
}

/** The smallest valid PNG, standing in for a QR screenshot. */
const ONE_PIXEL_PNG =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Open the invite sheet and read the link out of it. */
async function inviteLink(page: Page) {
  await page.getByRole("button", { name: "Invite friends" }).click();
  const sheet = page.getByRole("dialog", { name: "Invite friends" });
  const field = sheet.getByLabel("Invite link");
  await expect(field).toHaveValue(/\/join\/[A-Za-z0-9_-]{43}\?bill=[^&]+$/);
  const url = new URL(await field.inputValue());
  await sheet.getByRole("button", { name: "Done" }).click();
  return url.pathname + url.search;
}

async function claim(page: Page, item: string) {
  await page.getByRole("button", { name: new RegExp(`^${item}`) }).click();
  const sheet = page.getByRole("dialog", { name: item });
  // Your own row is always first and the only enabled checkbox.
  await sheet.getByRole("checkbox").first().click();
  await expect(sheet.getByRole("checkbox").first()).toBeChecked();
  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(sheet).toBeHidden();
}

test.afterAll(() => {
  cleanupBill(TITLE);
  cleanupBill(LOCKED_TITLE);
  cleanupGroup(GROUP_NAME);
  cleanupBill(NEWBIE_TITLE);
  unnameUser("seed_user_newbie");
  resetPayment("seed_user_mint");
});

async function newBill(page: Page, title: string) {
  await page.getByRole("link", { name: "+ New bill" }).click();
  await page.getByLabel("Bill name").fill(title);
  await page.getByRole("button", { name: "Start bill" }).click();
  // /bills/new also matches /bills/<segment>, so exclude it explicitly.
  await expect(page).toHaveURL(/\/bills\/(?!new$)[^/]+$/);
}

test("create a bill, add items, split it between two people, see the summary", async ({
  browser,
}) => {
  // Clipboard access for Nudge's copy fallback (checked below).
  const mint = await (
    await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] })
  ).newPage();
  // No share sheet in a test browser: make Nudge fall back to copying.
  await mint.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined });
  });
  await signInAs(mint, "Mint");

  await newBill(mint, TITLE);
  const billUrl = new URL(mint.url()).pathname;
  await expect(mint.getByText("No items yet")).toBeVisible();

  // Add items in one go via the rapid-entry sheet.
  await mint.getByRole("button", { name: "Add item +" }).click();
  for (const [name, price] of [
    ["Pad thai", "180"],
    ["Singha", "100.50"],
    ["Som tam", "120"],
  ]) {
    await mint.getByLabel("Item name").fill(name);
    await mint.getByLabel("Price in baht").fill(price);
    await mint.getByRole("button", { name: "Add item", exact: true }).click();
    await expect(mint.getByText(name, { exact: true })).toBeVisible();
  }
  await mint.getByRole("button", { name: "Done" }).click();
  await expect(mint.getByText("saving…")).toHaveCount(0);
  await expect(mint.getByText("฿400.50").first()).toBeVisible();

  const invite = await inviteLink(mint);
  await claim(mint, "Pad thai");
  await claim(mint, "Singha");

  // Ploy opens the link while signed out → login → back to the invite → Join.
  const ploy = await (await browser.newContext()).newPage();
  await ploy.goto(invite);
  await ploy.getByRole("button", { name: "Continue as Ploy" }).click();
  await expect(
    ploy.getByRole("heading", { name: new RegExp(`Mint invited you to split ${TITLE}`) }),
  ).toBeVisible();
  await ploy.getByRole("button", { name: "Join" }).click();
  await expect(ploy).toHaveURL(billUrl);
  await claim(ploy, "Pad thai");

  // Ploy's view: Pad thai split 2 ways; Som tam unclaimed.
  await ploy.getByRole("link", { name: "See summary →" }).click();
  await expect(ploy.getByText("You owe Mint")).toBeVisible();
  await expect(ploy.getByText("฿90", { exact: true }).last()).toBeVisible();
  await expect(ploy.getByText(/฿120 not claimed yet/)).toBeVisible();

  // Mint's view: Mint ฿90 + ฿100.50, Ploy owes ฿90.
  await mint.reload();
  await mint.getByRole("link", { name: "See summary →" }).click();
  await expect(mint.getByText("Friends owe you")).toBeVisible();
  await expect(mint.getByText("฿190.50")).toBeVisible();
  const owed = mint.getByText("Friends owe you").locator("..");
  await expect(owed).toContainText("฿90");

  // Som tam is still unclaimed, so Mint can't settle up yet.
  await expect(mint.getByRole("button", { name: "Settle up" })).toBeDisabled();
  await expect(mint.getByText("Every item needs claiming before you can settle up.")).toBeVisible();

  // Ploy claims it; now Mint settles up and lands on "You fronted it".
  await ploy.goto(billUrl);
  await claim(ploy, "Som tam");
  // The claim shows optimistically, so retry until it has reached the server.
  const settleUp = mint.getByRole("button", { name: "Settle up" });
  await expect(async () => {
    await mint.reload();
    await expect(settleUp).toBeEnabled({ timeout: 1_000 });
  }).toPass();
  // It locks the bill, so it asks first — and Cancel leaves it open.
  const confirm = mint.getByRole("dialog", { name: "Lock the bill and settle up?" });
  await settleUp.click();
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(confirm).toBeHidden();
  await expect(mint).toHaveURL(`${billUrl}/summary`);
  await settleUp.click();
  await confirm.getByRole("button", { name: "Lock and settle up" }).click();
  await expect(mint).toHaveURL(`${billUrl}/settle`);
  await expect(mint.getByText("You fronted it")).toBeVisible();
  await expect(mint.getByText("฿210").first()).toBeVisible();
  await expect(mint.getByText("Waiting to pay")).toBeVisible();

  // Ploy sees what they owe, and the bill is locked with a link here.
  await ploy.reload();
  await expect(ploy.getByText("Settling up — items are locked.")).toBeVisible();
  await ploy.getByRole("link", { name: "See settle-up →" }).click();
  await expect(ploy.getByText("You owe Mint")).toBeVisible();

  // Mint adds how to be paid: a bank account and a QR image.
  await mint.getByRole("button", { name: /Add how friends pay you|Edit/ }).click();
  const details = mint.getByRole("dialog", { name: "How friends pay you" });
  await details.getByLabel("Bank", { exact: true }).selectOption("SCB");
  await details.getByLabel("Account number").fill("123-4-56789-0");
  await details.getByLabel("Name on the account").fill("Mint E2E");
  await details.getByRole("button", { name: /^(Save|Update) bank account$/ }).click();
  await details.getByLabel(/QR image/).setInputFiles({
    name: "qr.png",
    mimeType: "image/png",
    buffer: Buffer.from(ONE_PIXEL_PNG, "base64"),
  });
  await expect(details.getByRole("img", { name: "Your payment QR" })).toBeVisible();
  await details.getByRole("button", { name: "Done" }).click();
  await expect(mint.getByText("SCB · 123-4-56789-0 · Mint E2E")).toBeVisible();

  // Ploy sees it, with the account number ready to copy and the QR.
  await ploy.reload();
  await expect(ploy.getByText("Pay Mint")).toBeVisible();
  await expect(ploy.getByText("123-4-56789-0")).toBeVisible();
  await expect(ploy.getByRole("button", { name: "Copy account number" })).toBeVisible();
  await expect(ploy.getByRole("img", { name: "Mint's payment QR" })).toBeVisible();

  // Mint nudges Ploy: the reminder is copied, and the row says when.
  await mint.getByRole("button", { name: "Nudge Ploy" }).click();
  await expect(mint.getByText("Reminder copied — paste it in your chat")).toBeVisible();
  const reminder = await mint.evaluate(() => navigator.clipboard.readText());
  expect(reminder).toContain(`Hi Ploy! Friendly reminder for ${TITLE}`);
  expect(reminder).toContain("you owe ฿210.");
  expect(reminder).toContain(`${billUrl}/settle`);
  await expect(mint.getByText("Nudged just now")).toBeVisible();

  // Ploy says they've paid; Mint sees it and confirms — the only debt, so
  // the bill is settled.
  await ploy.getByRole("button", { name: "I've paid" }).click();
  await expect(ploy.getByText("You told Mint you've paid")).toBeVisible();
  await mint.reload();
  await expect(mint.getByText(/Says they've paid/)).toBeVisible();
  // A double tap must not mark it paid and then straight back to unpaid.
  await mint.getByRole("button", { name: "Mark Ploy paid" }).dblclick();
  await expect(mint.getByText("Everyone has paid you back — all settled.")).toBeVisible();
  // That shows optimistically, so retry until the save has landed.
  await expect(async () => {
    await ploy.reload();
    await expect(ploy.getByText("You're all square with Mint.")).toBeVisible({ timeout: 1_000 });
  }).toPass();

  // Home shows the bill as settled.
  await mint.goto("/");
  const card = mint.getByRole("link", { name: new RegExp(escapeRegExp(TITLE)) });
  await expect(card).toContainText("Settled");
});

test("an unknown bill shows the not-found page", async ({ page }) => {
  await signInAs(page, "Mint");
  await page.goto("/bills/does-not-exist");
  await expect(page.getByRole("heading", { name: "Bill not found" })).toBeVisible();
});

test("a settling bill is read-only but its summary still loads", async ({ page }) => {
  await signInAs(page, "Mint");
  await newBill(page, LOCKED_TITLE);
  await page.getByRole("button", { name: "Add item +" }).click();
  await page.getByLabel("Item name").fill("Coffee");
  await page.getByLabel("Price in baht").fill("65");
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await expect(page.getByText("saving…")).toHaveCount(0);

  setBillStatus(LOCKED_TITLE, "SETTLING");
  await page.reload();

  await expect(page.getByRole("button", { name: "Add item +" })).toHaveCount(0);
  await expect(page.getByText("Settling up — items are locked.")).toBeVisible();
  await page.getByRole("button", { name: /^Coffee/ }).click();
  const sheet = page.getByRole("dialog", { name: "Coffee" });
  await expect(sheet.getByText("Settling up — claims are locked.")).toBeVisible();
  await expect(sheet.getByRole("checkbox").first()).toHaveAttribute("aria-disabled", "true");
  await sheet.getByRole("button", { name: "Done" }).click();

  await page.getByRole("link", { name: "See summary →" }).click();
  await expect(page.getByText(/฿65 not claimed yet/)).toBeVisible();
});

test("create a group and start a bill inside it", async ({ page }) => {
  await signInAs(page, "Mint");

  await page.getByRole("link", { name: "+ New group" }).click();
  // No name yet: the error shows under the plate.
  await page.getByRole("button", { name: "Create Group +" }).click();
  await expect(page.getByLabel("Group name")).toHaveAccessibleDescription("Give the group a name");
  // A quick pick writes on the plate; typing replaces it.
  await page.getByRole("button", { name: "Flatmates" }).click();
  await expect(page.getByLabel("Group name")).toHaveValue("Flatmates");
  await page.getByLabel("Group name").fill(GROUP_NAME);
  await page.getByRole("button", { name: "Create Group +" }).click();
  await expect(page).toHaveURL(/\/groups\/(?!new$)[^/]+$/);
  await expect(page.getByRole("heading", { name: GROUP_NAME })).toBeVisible();
  await expect(page.getByText("No bills in this group yet.")).toBeVisible();

  await page.getByRole("link", { name: "+ New bill in this group" }).click();
  await expect(page.getByText(`In ${GROUP_NAME}`)).toBeVisible();
  await page.getByLabel("Bill name").fill("Rent October");
  await page.getByRole("button", { name: "Start bill" }).click();
  await expect(page).toHaveURL(/\/bills\/(?!new)[^/?]+$/);

  // The bill links back to its group, which now lists it.
  await page.getByRole("link", { name: `← ${GROUP_NAME}` }).click();
  await expect(page.getByRole("link", { name: /Rent October/ })).toBeVisible();

  // Home shows the group, and the bill tagged with the group's name.
  await page.goto("/");
  await expect(page.getByRole("link", { name: new RegExp(GROUP_NAME) }).first()).toBeVisible();
  const billCard = page.getByRole("link", { name: /Rent October/ });
  await expect(billCard).toContainText(GROUP_NAME);
});

test("an unknown group shows the not-found page", async ({ page }) => {
  await signInAs(page, "Mint");
  await page.goto("/groups/does-not-exist");
  await expect(page.getByRole("heading", { name: "Group not found" })).toBeVisible();
  await page.goto("/bills/new?group=does-not-exist");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("a brand-new user joins through onboarding without losing the invite", async ({ browser }) => {
  const mint = await (await browser.newContext()).newPage();
  await signInAs(mint, "Mint");
  await newBill(mint, NEWBIE_TITLE);
  const billUrl = new URL(mint.url()).pathname;
  const invite = await inviteLink(mint);

  // Reset link: the old one dies, the new one works.
  await mint.getByRole("button", { name: "Invite friends" }).click();
  const sheet = mint.getByRole("dialog", { name: "Invite friends" });
  await expect(sheet.getByLabel("Invite link")).toHaveValue(new RegExp(`${escapeRegExp(invite)}$`));
  await sheet.getByRole("button", { name: /Reset link/ }).click();
  await expect(sheet.getByLabel("Invite link")).not.toHaveValue(
    new RegExp(`${escapeRegExp(invite)}$`),
  );
  await expect(sheet.getByLabel("Invite link")).toHaveValue(/\/join\//);
  const freshUrl = new URL(await sheet.getByLabel("Invite link").inputValue());
  const fresh = freshUrl.pathname + freshUrl.search;

  // Signed out, no name yet: login → onboarding → straight back to the invite.
  const newbie = await (await browser.newContext()).newPage();
  await newbie.goto(fresh);
  await newbie.getByRole("button", { name: "Continue as newbie@seed.splitsy.dev" }).click();
  await expect(newbie).toHaveURL(/\/onboarding\?next=/);
  await newbie.getByLabel("Your name").fill("Newbie");
  await newbie.getByRole("button", { name: "Continue" }).click();
  await expect(newbie).toHaveURL(fresh);
  await newbie.getByRole("button", { name: "Join" }).click();
  await expect(newbie).toHaveURL(billUrl);

  // The link from before the reset no longer works.
  await newbie.goto(invite);
  await expect(newbie.getByRole("heading", { name: /doesn't work any more/ })).toBeVisible();
});
