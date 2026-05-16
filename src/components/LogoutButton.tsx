"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ children }: { children: React.ReactNode }) {
  return (
    <button className="button button-ghost" onClick={() => signOut()}>
      {children}
    </button>
  );
}
