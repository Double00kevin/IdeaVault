import { useState, useEffect } from "react";
import IdeaCard from "./IdeaCard";

interface GatedIdea {
  id: string;
  title: string;
  one_liner?: string;
  source_type?: string;
  confidence_score?: number;
  created_at: string;
  gated: boolean;
  signup_required?: boolean;
  upgrade_url?: string;
}

const API_BASE = import.meta.env.PUBLIC_API_URL ?? "/api";

/**
 * Client-side component for gated idea detail pages.
 * On mount, re-fetches with auth to check if the user can see the full idea.
 * Falls back to teaser + CTA if still gated.
 */
export default function IdeaDetailGated({ idea }: { idea: GatedIdea }) {
  const [fullIdea, setFullIdea] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Wait for Clerk to attach to window (race condition with client:load)
        let clerk = (window as any).Clerk;
        if (!clerk) {
          for (let i = 0; i < 50 && !clerk; i++) {
            await new Promise((r) => setTimeout(r, 100));
            clerk = (window as any).Clerk;
          }
        }
        if (!clerk) {
          setLoading(false);
          return;
        }
        await clerk.load();
        if (!clerk.user) {
          setLoading(false);
          return;
        }
        const token = await clerk.session?.getToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/ideas/${idea.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (!data.gated) {
            setFullIdea(data);
          }
        }
      } catch {
        // Fall through to gated view
      } finally {
        setLoading(false);
      }
    })();
  }, [idea.id]);

  if (loading) {
    return (
      <div className="border border-gray-800 rounded-lg bg-gray-900 p-6 animate-pulse">
        <div className="h-5 bg-gray-800 rounded w-3/4 mb-3" />
        <div className="h-4 bg-gray-800 rounded w-1/2" />
      </div>
    );
  }

  // User is authenticated and can see the full idea
  if (fullIdea) {
    return <IdeaCard idea={fullIdea} />;
  }

  // Gated teaser view
  return (
    <article className="border border-gray-800 rounded-lg bg-gray-900 p-6">
      <h1 className="text-xl font-bold text-white mb-3">{idea.title}</h1>

      {idea.one_liner && (
        <p className="text-gray-400 leading-relaxed mb-6">{idea.one_liner}</p>
      )}

      {idea.source_type && (
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wide">
          {idea.source_type}
        </span>
      )}

      <div className="mt-6 pt-6 border-t border-gray-800 text-center">
        {idea.signup_required ? (
          <>
            <div className="flex items-center justify-center gap-2 text-gray-400 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-sm">Sign up to see the full analysis</span>
            </div>
            <a
              href="/sign-up"
              className="inline-block px-5 py-2 rounded bg-cyan-500 text-white font-medium text-sm hover:bg-cyan-400 transition-colors"
            >
              Create free account
            </a>
          </>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 text-gray-400 mb-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-sm">Upgrade to Pro for full access to all ideas</span>
            </div>
            <a
              href="/pro"
              className="inline-block px-5 py-2 rounded bg-cyan-500 text-white font-medium text-sm hover:bg-cyan-400 transition-colors"
            >
              See Pro plans
            </a>
          </>
        )}
      </div>
    </article>
  );
}
