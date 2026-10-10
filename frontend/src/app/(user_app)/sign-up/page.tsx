import { AuthPage } from "@/components/auth-page";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthPage mode="sign-up" next={next} />;
}
