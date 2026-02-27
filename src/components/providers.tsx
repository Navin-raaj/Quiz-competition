"use client";

import { AuthProvider } from "@/lib/auth-context";
import { QuizProvider } from "@/lib/quiz-context";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <QuizProvider>{children}</QuizProvider>
        </AuthProvider>
    );
}
