import type { LoginInput } from "@robustify/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, createContext, useContext } from "react";
import { ApiError, api } from "../api/client";
import type { User } from "../api/types";

interface Auth {
  user: User | null;
  loading: boolean;
  signIn: (input: LoginInput) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<Auth | null>(null);

const ME = ["me"];

async function fetchMe(): Promise<User | null> {
  try {
    return (await api<{ user: User }>("/auth/me")).user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const me = useQuery({ queryKey: ME, queryFn: fetchMe, staleTime: Infinity });

  const login = useMutation({
    mutationFn: (input: LoginInput) =>
      api<{ user: User }>("/auth/login", { method: "POST", body: input }),
    onSuccess: ({ user }) => client.setQueryData(ME, user),
  });

  const value: Auth = {
    user: me.data ?? null,
    loading: me.isPending,
    signIn: async (input) => (await login.mutateAsync(input)).user,
    signOut: async () => {
      await api<void>("/auth/logout", { method: "POST" }).catch(() => {});
      // Drop every cached response so the next user starts clean.
      client.clear();
      client.setQueryData(ME, null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside AuthProvider");
  return auth;
}

/** The signed-in user, for components that only render behind RequireAuth. */
export function useUser(): User {
  const { user } = useAuth();
  if (!user) throw new Error("useUser called while signed out");
  return user;
}
