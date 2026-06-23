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
import { AdminPreferences, useAdminLocale } from "@/components/admin/admin-preferences";

export function LoginForm() {
  const router = useRouter();
  const { text, dir: textDir } = useAdminLocale();
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
      setError(err instanceof Error ? friendlyAuthError(err.message, text) : text.loginFailed);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    setError("");
    setMessage("");
    if (!email) {
      setError(text.enterEmailFirst);
      return;
    }
    try {
      await sendAdminPasswordReset(email);
      setMessage(text.resetSent);
    } catch (err) {
      setError(err instanceof Error ? friendlyAuthError(err.message, text) : text.resetFailed);
    }
  }

  return (
    <main dir="ltr" className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md" dir="ltr">
        <CardHeader>
          <AdminPreferences />
          <CardTitle dir={textDir}>{text.loginTitle}</CardTitle>
          <CardDescription dir={textDir}>{text.loginDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasFirebaseClientConfig() ? (
            <p dir={textDir} className="mb-4 rounded-md border border-accent bg-accent/15 p-3 text-sm">
              {text.missingFirebase}
            </p>
          ) : null}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Field label={text.email} labelDir={textDir} htmlFor="email">
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </Field>
            <Field label={text.password} labelDir={textDir} htmlFor="password">
              <div className="flex gap-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <Button type="button" variant="outline" size="icon" onClick={() => setShowPassword((value) => !value)} aria-label={text.showPassword}>
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                </Button>
              </div>
            </Field>
            {error ? (
              <p dir={textDir} className="text-sm text-destructive">
                {error}
              </p>
            ) : null}
            {message ? (
              <p dir={textDir} className="text-sm text-primary">
                {message}
              </p>
            ) : null}
            <Button className="w-full" type="submit" disabled={loading}>
              <span dir={textDir}>{loading ? text.signingIn : text.signIn}</span>
            </Button>
            <Button className="w-full" type="button" variant="ghost" onClick={handlePasswordReset}>
              <span dir={textDir}>{text.forgotPassword}</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function friendlyAuthError(message: string, text: ReturnType<typeof useAdminLocale>["text"]) {
  if (message.includes("auth/invalid-credential")) return text.invalidCredential;
  if (message.includes("auth/too-many-requests")) return text.tooManyRequests;
  if (message.includes("not approved")) return message;
  if (message.includes("not configured")) return message;
  return text.authFailed;
}
