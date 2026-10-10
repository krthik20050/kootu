import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== "true") return children;
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/passenger"
      signUpFallbackRedirectUrl="/passenger"
      appearance={{
        theme: shadcn,
        variables: {
          colorBackground: "#fffef9",
          colorForeground: "#183d33",
          colorInput: "#ffffff",
          colorInputForeground: "#183d33",
          colorPrimary: "#254b40",
          colorPrimaryForeground: "#ffffff",
          colorMuted: "#eef1e7",
          colorMutedForeground: "#51685d",
          colorBorder: "#b9c6b6",
          colorDanger: "#9a351b",
          colorRing: "#a74916",
          colorModalBackdrop: "rgba(12, 29, 24, 0.55)",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: "0.9375rem",
          borderRadius: "0.75rem",
        },
        options: { socialButtonsVariant: "blockButton", socialButtonsPlacement: "top" },
        elements: {
          card: { backgroundColor: "#fffef9", opacity: 1, width: "100%", minWidth: 0 },
          cardBox: { backgroundColor: "#fffef9", width: "100%", minWidth: 0, boxShadow: "none" },
          rootBox: { width: "100%", minWidth: 0 },
          footer: { background: "#eef1e7" },
          socialButtonsBlockButton: { minHeight: "48px", backgroundColor: "#ffffff" },
          formFieldInput: { minHeight: "48px", backgroundColor: "#ffffff" },
          formButtonPrimary: { minHeight: "48px" },
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}
