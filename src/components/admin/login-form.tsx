"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sendAdminPasswordReset, signInAdmin } from "@/lib/firebase/auth";
import { hasFirebaseClientConfig } from "@/lib/firebase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await signInAdmin(email, password);
      router.replace("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? friendlyAuthError(err.message) : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    setError("");
    setMessage("");
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    try {
      await sendAdminPasswordReset(email);
      setMessage("Password reset email sent.");
    } catch (err) {
      setError(err instanceof Error ? friendlyAuthError(err.message) : "Password reset failed.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Use an approved Firebase admin account. Public registration is disabled.</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasFirebaseClientConfig() ? (
            <p className="mb-4 rounded-md border border-accent bg-accent/15 p-3 text-sm">
              Firebase client environment variables are missing. Add `.env.local` before signing in.
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label="Email" htmlFor="email">
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <Field label="Password" htmlFor="password">
              <div className="flex gap-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setShowPassword((value) => !value)} aria-label="Show or hide password">
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </Button>
              </div>
            </Field>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {message ? <p className="text-sm text-primary">{message}</p> : null}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <Button className="w-full" type="button" variant="ghost" onClick={handlePasswordReset}>
              Forgot password
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function friendlyAuthError(message: string) {
  if (message.includes("auth/invalid-credential")) return "Email or password is incorrect.";
  if (message.includes("auth/too-many-requests")) return "Too many attempts. Try again later.";
  if (message.includes("not approved")) return message;
  if (message.includes("not configured")) return message;
  return "Authentication failed. Check your details and try again.";
}
