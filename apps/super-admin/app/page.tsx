"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../lib/api";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TOKEN_KEY = "superadmin_token";

type Org = {
  id: string;
  name: string;
  createdAt: string;
  _count?: { users: number; flags: number };
};

export default function Page() {
  const [token, setToken] = useState<string | null>(null);

  // Promote to the dashboard if a token was persisted (no hydration mismatch:
  // first paint is the login form on both server and client).
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  function login(t: string) {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  }
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Super Admin</h1>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          host
        </span>
      </div>
      {token ? <Dashboard token={token} onLogout={logout} /> : <Login onLogin={login} />}
    </main>
  );
}

function Login({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail] = useState("superadmin@host.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api<{ token: string }>("/auth/super-admin/login", {
        method: "POST",
        body: { email, password },
      });
      onLogin(res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Sign in with your super-admin credentials.</CardDescription>
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Logging in…" : "Log in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Dashboard({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadOrgs() {
    setError("");
    try {
      const data = await api<Org[]>("/organizations", { token });
      setOrgs(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onLogout();
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    }
  }

  useEffect(() => {
    loadOrgs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createOrg(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await api("/organizations", { method: "POST", body: { name }, token });
      setMessage(`Created organization "${name}".`);
      setName("");
      await loadOrgs();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return onLogout();
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Signed in as Super Admin</p>
        <Button variant="outline" size="sm" type="button" onClick={onLogout}>
          Log out
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createOrg} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="orgname">Name</Label>
              <Input
                id="orgname"
                placeholder="Acme Corp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Creating…" : "Create"}
            </Button>
          </form>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          {message && <p className="mt-3 text-sm text-emerald-600">{message}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organizations ({orgs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orgs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No organizations yet. Create the first one above.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.name}</TableCell>
                    <TableCell>{o._count?.users ?? 0}</TableCell>
                    <TableCell>{o._count?.flags ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString()}
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
