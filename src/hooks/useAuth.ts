import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
        } else {
          setUser(null);
          router.push("/login");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error de autenticación");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        if (event === "SIGNED_OUT") {
          router.push("/login");
        }
      }
    });

    return () => subscription?.unsubscribe();
  }, [router, supabase.auth]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cerrar sesión");
    }
  };

  return { user, isLoading, error, signOut };
}
