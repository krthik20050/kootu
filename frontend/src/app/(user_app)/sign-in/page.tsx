import { AuthPage } from "@/components/auth-page";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthPage mode="sign-in" next={next} />;
}
