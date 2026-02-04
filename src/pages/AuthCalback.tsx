// src/pages/AuthCallback.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../frontend/src/lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    (async () => {
      // Supabase will parse tokens from the URL because detectSessionInUrl: true
      // This call ensures the session is available before routing
      const { data, error } = await supabase.auth.getSession();

      if (!alive) return;

      if (error || !data.session) {
        navigate("/login", { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
    })();

    return () => {
      alive = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      Signing you in…
    </div>
  );
}
