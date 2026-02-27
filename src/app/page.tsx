"use client";

import { AuthForm } from "@/components/auth/auth-form";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-2 text-primary">
          Quiz Competition
        </h1>
        <p className="text-lg text-muted-foreground">
          Join the challenge. Test your skills.
        </p>
      </div>
      <AuthForm />
      <footer className="mt-8 text-sm text-muted-foreground">
        <a href="/admin" className="hover:underline">Admin Panel</a>
      </footer>
    </main>
  );
}
