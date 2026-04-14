/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from "firebase/auth";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { auth, isFirebaseAvailable } from "@/lib/firebase";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  register: (email: string, pass: string) => Promise<any>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (firebaseUser: FirebaseUser, token: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      console.log("[Auth Debug] Syncing profile with token:", token.substring(0, 10) + "...");
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("[Auth Debug] Backend response status:", res.status);
      if (res.ok) {
        const profileData = await res.json();
        console.log("[Auth Debug] Profile data received:", profileData);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          backendToken: token,
          ...profileData.user
        });
      } else {
        const errText = await res.text();
        console.error("[Auth Debug] Backend sync failed text:", errText);
        // Fallback to basic Firebase info if backend profile fails
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          backendToken: token
        });
      }
    } catch (err) {
      console.error("Profile sync failed:", err);
    }
  };

  useEffect(() => {
    if (!isFirebaseAvailable || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[Auth Debug] Auth state changed, user:", firebaseUser?.uid);
      if (firebaseUser) {
        setLoading(true);
        const token = await firebaseUser.getIdToken(true);
        await fetchProfile(firebaseUser, token);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update token periodically
  useEffect(() => {
    if (!isFirebaseAvailable || !auth) return;

    const handle = setInterval(async () => {
      if (!auth) return;
      const firebaseUser = auth.currentUser;
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken(true);
        setUser((prev: any) => prev ? { ...prev, backendToken: token } : null);
      }
    }, 10 * 60 * 1000); // 10 mins

    return () => clearInterval(handle);
  }, []);

  // Sync NextAuth (Admin) session
  useEffect(() => {
    if (sessionStatus === "loading") return;

    if (session?.user) {
      console.log("[Auth Debug] NextAuth session detected:", session.user.email);
      const sessionUser = session.user as any;
      setUser({
        ...sessionUser,
        backendToken: sessionUser.backendToken,
        role: sessionUser.role || "ADMIN",
        isNextAuth: true
      });
      setLoading(false);
    } else {
      // If no NextAuth session, let Firebase handle it (it's already managed by onAuthStateChanged)
      if (!isFirebaseAvailable || !auth?.currentUser) {
        // Only clear if NOT loading and NO firebase user
        if (sessionStatus === "unauthenticated" && !loading) {
          // setUser(null); // Be careful not to fight with Firebase
        }
      }
    }
  }, [session, sessionStatus]);

  const login = async (email: string, pass: string) => {
    if (!isFirebaseAvailable || !auth) throw new Error("Authentication service is unavailable.");
    return await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string) => {
    if (!isFirebaseAvailable || !auth) throw new Error("Authentication service is unavailable.");
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    return res.user;
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseAvailable || !auth) throw new Error("Authentication service is unavailable.");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();

    // Sync with backend (auto-register on first time)
    await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: result.user.displayName || "Google User",
        email: result.user.email,
        firebaseUid: result.user.uid,
        isFirebaseUser: true,
        role: "USER"
      })
    });
  };

  const logout = async () => {
    if (isFirebaseAvailable && auth) {
      await firebaseSignOut(auth);
    }
    await nextAuthSignOut({ redirect: false });
    setUser(null);
  };

  const refreshProfile = async () => {
    if (auth?.currentUser) {
      const token = await auth.currentUser.getIdToken(true);
      await fetchProfile(auth.currentUser, token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
