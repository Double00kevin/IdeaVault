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
        <a href="/dashboard" className="hover:text-text-primary">
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
        <button className="hover:text-text-primary cursor-pointer">
          Sign in
        </button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="bg-accent text-white px-3 py-1 rounded text-xs font-medium hover:opacity-90 cursor-pointer">
          Sign up
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
