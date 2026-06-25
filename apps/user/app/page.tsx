"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TOKEN_KEY = "user_token";
const USER_KEY = "user_user";

type AuthUser = {
  id: string;
  email: string;
  role: string;
  orgId: string;
  orgName: string;
};
type Org = { id: string; name: string };
type CheckResult = { key: string; enabled: boolean };

export default function Page() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (t && u) {
      setToken(t);
      setUser(JSON.parse(u));
    }
  }, []);

  function onAuth(t: string, u: AuthUser) {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setToken(t);
    setUser(u);
  }
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Feature Check</h1>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          end user
        </span>
      </div>
      {token && user ? (
        <CheckPanel token={token} user={user} onLogout={logout} />
      ) : (
        <AuthScreen onAuth={onAuth} />
      )}
    </main>
  );
}

function AuthScreen({ onAuth }: { onAuth: (t: string, u: AuthUser) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgId, setOrgId] = useState("");
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Load the list of organizations for the signup dropdown.
  useEffect(() => {
    api<Org[]>("/organizations/public")
      .then(setOrgs)
      .catch(() => setOrgs([]));
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!orgId) {
          setError("Please choose an organization.");
          return;
        }
        const res = await api<{ token: string; user: AuthUser }>("/auth/signup", {
          method: "POST",
          body: { email, password, orgId, role: "end_user" },
        });
        onAuth(res.token, res.user);
      } else {
        const res = await api<{ token: string; user: AuthUser }>("/auth/login", {
          method: "POST",
          body: { email, password },
        });
        onAuth(res.token, res.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>{mode === "login" ? "Log in" : "Sign up"}</CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Log in to check your organization's features."
              : "Create an account in an existing organization."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {mode === "signup" && (
              <div className="space-y-2">
                <Label>Organization</Label>
                <Select value={orgId} onValueChange={(v) => setOrgId(v as string)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose your organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {orgs.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No organizations yet — ask the Super Admin to create one.
                  </p>
                )}
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="font-medium text-foreground underline underline-offset-4"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError("");
              }}
            >
              {mode === "login" ? "Sign up" : "Log in"}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CheckPanel({
  token,
  user,
  onLogout,
}: {
  token: string;
  user: AuthUser;
  onLogout: () => void;
}) {
  const [key, setKey] = useState("");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function check(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await api<CheckResult>(
        `/flags/check?key=${encodeURIComponent(key.trim())}`,
        { token }
      );
      setResult(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onLogout();
      setError(err instanceof Error ? err.message : "Check failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{user.orgName}</p>
          <p className="text-xs text-muted-foreground">Signed in as {user.email}</p>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={onLogout}>
          Log out
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Is a feature enabled?</CardTitle>
          <CardDescription>
            Enter a feature key to check whether it&apos;s enabled for {user.orgName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={check} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="key">Feature key</Label>
              <Input
                id="key"
                placeholder="dark_mode"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Checking…" : "Check"}
            </Button>
          </form>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          {result && (
            <div
              className={cn(
                "mt-4 rounded-lg border p-4 text-sm",
                result.enabled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-border bg-muted/40 text-muted-foreground"
              )}
            >
              <span className="font-medium">{result.key}</span> is{" "}
              <span className="font-semibold">
                {result.enabled ? "ENABLED" : "DISABLED"}
              </span>{" "}
              for {user.orgName}.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
