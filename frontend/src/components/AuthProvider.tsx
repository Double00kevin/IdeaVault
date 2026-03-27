import { ClerkProvider } from "@clerk/clerk-react";
import type { ReactNode } from "react";

const PUBLISHABLE_KEY = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY;

interface Props {
  children: ReactNode;
}

export default function AuthProvider({ children }: Props) {
  if (!PUBLISHABLE_KEY) {
    // Graceful degradation: render children without auth if key not set
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}
