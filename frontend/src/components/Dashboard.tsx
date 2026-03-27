import { useState, useEffect } from "react";
import { useAuth, useUser, RedirectToSignIn } from "@clerk/clerk-react";
import AuthProvider from "./AuthProvider";

const API_BASE = import.meta.env.PUBLIC_API_URL ?? "/api";

interface SavedIdea {
  idea_id: string;
  rating: number | null;
  saved_at: string;
  title: string;
  one_liner: string;
  confidence_score: number;
  build_complexity: string;
  source_type: string;
}

const complexityConfig: Record<string, { color: string; label: string }> = {
  low: { color: "bg-complexity-low", label: "Low" },
  medium: { color: "bg-complexity-med", label: "Med" },
  high: { color: "bg-complexity-high", label: "High" },
};

function DashboardContent() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [saved, setSaved] = useState<SavedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_BASE}/saved`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        setSaved(data.saved);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load saved ideas");
      } finally {
        setLoading(false);
      }
    })();
  }, [isSignedIn]);

  async function unsave(ideaId: string) {
    const token = await getToken();
    await fetch(`${API_BASE}/saved/${ideaId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setSaved(saved.filter((s) => s.idea_id !== ideaId));
  }

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-surface animate-pulse rounded border border-border" />
        ))}
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-bold text-text-primary">
          {user?.firstName ? `${user.firstName}'s` : "Your"} Dashboard
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {saved.length} saved idea{saved.length !== 1 ? "s" : ""}
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface animate-pulse rounded border border-border" />
          ))}
        </div>
      )}

      {error && (
        <div className="border border-border rounded bg-surface p-8 text-center">
          <p className="text-text-secondary text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && saved.length === 0 && (
        <div className="border border-border rounded bg-surface p-8 text-center">
          <p className="text-text-primary font-bold mb-1">No saved ideas yet.</p>
          <p className="text-text-secondary text-sm mb-3">
            Browse the feed and save ideas you want to explore further.
          </p>
          <a href="/" className="text-accent hover:underline text-sm">
            Browse ideas
          </a>
        </div>
      )}

      {!loading && !error && saved.length > 0 && (
        <div className="space-y-3">
          {saved.map((item) => {
            const cx = complexityConfig[item.build_complexity] ?? complexityConfig.medium;
            return (
              <article
                key={item.idea_id}
                className="border border-border rounded bg-surface p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${cx.color} flex-shrink-0`}
                      />
                      <span className="text-[11px] font-mono text-text-secondary uppercase">
                        {cx.label}
                      </span>
                      <a
                        href={`/ideas/${item.idea_id}`}
                        className="font-bold text-text-primary hover:underline truncate"
                      >
                        {item.title}
                      </a>
                    </div>
                    <p className="text-sm text-text-secondary leading-snug">
                      {item.one_liner}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-mono font-bold text-xs text-text-primary">
                      {item.confidence_score}
                    </span>
                    {item.rating && (
                      <span className="text-amber-400 text-sm">
                        {"★".repeat(item.rating)}
                        <span className="text-border">{"★".repeat(5 - item.rating)}</span>
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-text-secondary uppercase">
                      {item.source_type}
                    </span>
                    <button
                      onClick={() => unsave(item.idea_id)}
                      className="text-xs text-text-secondary hover:text-red-400 cursor-pointer"
                      aria-label="Remove saved idea"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
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
