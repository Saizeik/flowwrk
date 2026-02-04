import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    (async () => {
      // This ensures the session is hydrated after redirect
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
    <div className="min-h-screen flex items-center justify-center text-slate-200">
      Signing you in…
    </div>
  );
}
