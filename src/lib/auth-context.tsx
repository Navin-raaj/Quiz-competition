"use client";

import { User } from "@/types";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthContextType = {
    user: User | null;
    login: (name: string, email: string, type: 'login' | 'signup') => Promise<void>;
    logout: () => void;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check local storage for persisted session (basic)
        const storedUser = localStorage.getItem("quiz-user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse user data", e);
                localStorage.removeItem("quiz-user");
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (name: string, email: string, type: 'login' | 'signup') => {
        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, type }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Login failed");
            }

            const userData = await res.json();
            setUser(userData);
            localStorage.setItem("quiz-user", JSON.stringify(userData));
        } catch (error) {
            console.error("Login Error:", error);
            throw error;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("quiz-user");
        router.push("/");
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
