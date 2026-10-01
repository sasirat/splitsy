import { redirect } from "next/navigation";
import { LoginScreen } from "@/modules/auth/components/login-screen";
import { listDevUsers } from "@/modules/auth/queries";
import { getCurrentUser } from "@/server/auth";
import { devSignInEnabled, safeRedirectPath } from "@/server/session";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const nextPath = typeof next === "string" ? safeRedirectPath(next) : undefined;

  if (await getCurrentUser()) redirect(safeRedirectPath(nextPath));

  const users = devSignInEnabled ? await listDevUsers() : [];
  return <LoginScreen users={users} next={nextPath} devSignIn={devSignInEnabled} />;
}
