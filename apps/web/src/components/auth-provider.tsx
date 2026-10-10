import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== "true") return children;
  return <ClerkProvider appearance={{ theme: shadcn }}>{children}</ClerkProvider>;
}
