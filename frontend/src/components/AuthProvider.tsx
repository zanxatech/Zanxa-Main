import { SessionProvider } from "next-auth/react";
import { AuthProvider as FirebaseAuthProvider } from "@/context/AuthContext";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <FirebaseAuthProvider>
        {children}
      </FirebaseAuthProvider>
    </SessionProvider>
  );
}
