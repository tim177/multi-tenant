"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { api, ApiError } from "../lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TOKEN_KEY = "admin_token";
const USER_KEY = "admin_user";

type AuthUser = {
  id: string;
  email: string;
  role: string;
  orgId: string;
  orgName: string;
};
type Org = { id: string; name: string };
type Flag = { id: string; key: string; enabled: boolean; createdAt: string };

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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Organization Admin</h1>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          flags
        </span>
      </div>
      {token && user ? (
        <Dashboard token={token} user={user} onLogout={logout} />
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
          body: { email, password, orgId, role: "org_admin" },
        });
        onAuth(res.token, res.user);
      } else {
        const res = await api<{ token: string; user: AuthUser }>("/auth/login", {
          method: "POST",
          body: { email, password },
        });
        if (res.user.role !== "org_admin") {
          setError("This account is not an organization admin.");
          return;
        }
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
              ? "Access your organization's feature flags."
              : "Create an admin account in an existing organization."}
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

function Dashboard({
  token,
  user,
  onLogout,
}: {
  token: string;
  user: AuthUser;
  onLogout: () => void;
}) {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [key, setKey] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function loadFlags() {
    setError("");
    try {
      const data = await api<Flag[]>("/flags", { token });
      setFlags(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onLogout();
      setError(err instanceof Error ? err.message : "Failed to load flags");
    }
  }

  useEffect(() => {
    loadFlags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createFlag(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const flag = await api<Flag>("/flags", {
        method: "POST",
        body: { key, enabled },
        token,
      });
      setFlags((prev) => [flag, ...prev]);
      setKey("");
      setEnabled(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onLogout();
      setError(err instanceof Error ? err.message : "Failed to create flag");
    } finally {
      setLoading(false);
    }
  }

  async function toggle(flag: Flag, value: boolean) {
    setBusyId(flag.id);
    setError("");
    try {
      const updated = await api<Flag>(`/flags/${flag.id}`, {
        method: "PATCH",
        body: { enabled: value },
        token,
      });
      setFlags((prev) => prev.map((f) => (f.id === flag.id ? updated : f)));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onLogout();
      setError(err instanceof Error ? err.message : "Failed to update flag");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(flag: Flag) {
    setBusyId(flag.id);
    setError("");
    try {
      await api(`/flags/${flag.id}`, { method: "DELETE", token });
      setFlags((prev) => prev.filter((f) => f.id !== flag.id));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onLogout();
      setError(err instanceof Error ? err.message : "Failed to delete flag");
    } finally {
      setBusyId(null);
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
          <CardTitle>Create feature flag</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createFlag} className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
            <div className="flex items-center gap-2 pb-1">
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={(c) => setEnabled(Boolean(c))}
              />
              <Label htmlFor="enabled">Enabled</Label>
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Adding…" : "Add flag"}
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature flags ({flags.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No flags yet. Create your first one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.key}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={f.enabled}
                          disabled={busyId === f.id}
                          onCheckedChange={(c) => toggle(f, Boolean(c))}
                        />
                        <span className="text-xs text-muted-foreground">
                          {f.enabled ? "Enabled" : "Disabled"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(f.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        type="button"
                        disabled={busyId === f.id}
                        onClick={() => remove(f)}
                        aria-label={`Delete ${f.key}`}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
