"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth, hasFirebaseClientConfig } from "@/lib/firebase/client";
import { verifyApprovedAdmin } from "@/lib/firebase/auth";

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      setIsAdmin(false);
      return;
    }

    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setIsAdmin(nextUser ? await verifyApprovedAdmin(nextUser.uid) : false);
      setLoading(false);
    });
  }, []);

  return {
    user,
    loading,
    isAdmin,
    isConfigured: hasFirebaseClientConfig()
  };
}
