import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/clerk-react";
import AuthProvider from "./AuthProvider";

function AuthButtons() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div className="w-20 h-6 bg-surface animate-pulse rounded" />;
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <a href="/dashboard" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
          Dashboard
        </a>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-7 h-7",
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <SignInButton mode="modal">
        <button className="text-sm text-text-secondary hover:text-text-primary cursor-pointer transition-colors">
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="bg-accent hover:bg-accent-hover text-white px-4 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors">
          Get Started Free
        </button>
      </SignUpButton>
    </div>
  );
}

export default function HeaderAuth() {
  return (
    <AuthProvider>
      <AuthButtons />
    </AuthProvider>
  );
}
