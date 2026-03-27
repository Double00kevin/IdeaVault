import { useAuth, RedirectToSignIn } from "@clerk/clerk-react";
import AuthProvider from "./AuthProvider";

function DashboardContent() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-surface animate-pulse rounded border border-border" />
        ))}
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <div>
      <h1 className="text-lg font-bold text-text-primary mb-1">Your Dashboard</h1>
      <p className="text-sm text-text-secondary mb-6">
        Saved ideas, ratings, and email digest settings.
      </p>

      <div className="border border-border rounded bg-surface p-8 text-center">
        <p className="text-text-secondary text-sm">
          Saved ideas and ratings coming soon.
        </p>
        <a href="/" className="text-accent hover:underline text-sm mt-3 inline-block">
          Browse ideas
        </a>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  );
}
