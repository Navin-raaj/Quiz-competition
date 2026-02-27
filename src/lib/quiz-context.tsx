"use client";

import { Question, QuizState } from "@/types";
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

// Mock Data for fallback or types if needed, but we use API now.
const INITIAL_STATE: QuizState = {
    active: false,
    currentLevel: 1,
    questions: [],
    currentQuestionIndex: 0,
    answers: {},
    score: 0,
    isFinished: false,
    hasViolatedSecurity: false,
};

type QuizContextType = {
    state: QuizState & { timeLeft: number };
    startQuiz: (level?: number) => void;
    submitAnswer: (questionId: string, answerIndex: number) => void;
    nextQuestion: () => void;
    finishQuiz: () => void;
    resetQuiz: () => void;
};

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: React.ReactNode }) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentLevel, setCurrentLevel] = useState<1 | 2>(1);

    const [active, setActive] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [hasViolatedSecurity, setHasViolatedSecurity] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const { user } = useAuth();
    const router = useRouter();

    const enterFullScreen = () => {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error("Error attempting to enable full-screen mode:", err);
            });
        }
    };

    const exitFullScreen = () => {
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(console.error);
        }
    };

    const finishQuiz = async () => {
        setActive(false);
        setIsFinished(true);
        exitFullScreen();

        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correctAnswer) {
                score++;
            }
        });

        const totalQuizTime = 300;
        const timeTaken = totalQuizTime - timeLeft;

        if (user) {
            try {
                await fetch("/api/quiz/submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: user.id,
                        level: currentLevel,
                        score,
                        timeTaken,
                        securityViolation: hasViolatedSecurity
                    })
                });
            } catch (error) {
                console.error("Submission error:", error);
            }
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            finishQuiz();
        }
    };

    // Timer Logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (active && timeLeft > 0 && !isFinished) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        // We can't call finishQuiz directly here if it depends on state that might be stale
                        // but since we rely on 'answers' state which is ref'd, it should be ok or we use a ref.
                        // For simplicity in this fix, we'll just call it.
                        // But wait, finishQuiz is an async function defined in scope. 
                        // To avoid stale closures, we might need to be careful.
                        // However, 'timeLeft' is the only thing changing rapidly. 
                        // 'questions', 'answers' change less often. 
                        // A safety trigger:
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        if (active && timeLeft === 0 && !isFinished) {
            finishQuiz();
        }
        return () => clearInterval(timer);
    }, [active, timeLeft, isFinished]);
    // ^ Added timeLeft to dependency to trigger check at 0. 
    // Performance note: Ticking every second re-renders effect. 
    // Optimization: separate timer effect from finish effect.

    const startQuiz = async (level = 1) => {
        if (!user) return;
        try {
            const res = await fetch("/api/quiz/start", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: user.id, level }),
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Cannot start quiz");
                return;
            }

            const data = await res.json();
            setQuestions(data.questions);
            setCurrentLevel(level as 1 | 2);

            setAnswers({});
            setCurrentQuestionIndex(0);
            setIsFinished(false);
            setHasViolatedSecurity(false);
            setTimeLeft(300); // 5 Minutes
            setActive(true);
            enterFullScreen();
        } catch (e) {
            console.error(e);
            alert("Error starting quiz");
        }
    };

    const submitAnswer = (questionId: string, answerIndex: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
    };

    // Security check
    useEffect(() => {
        if (!active || isFinished) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                setHasViolatedSecurity(true);
                // We could finish immediately or just flag it. 
                // User requirement: "The quiz has been terminated."
                // So we finish.
                finishQuiz();
            }
        };

        const handleBlur = () => {
            setHasViolatedSecurity(true);
            finishQuiz();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [active, isFinished]);


    const resetQuiz = () => {
        exitFullScreen();
        setIsFinished(false);
        setActive(false);
        setQuestions([]);
        setCurrentLevel(1);
        setCurrentQuestionIndex(0);
        setAnswers({});
        setHasViolatedSecurity(false);
        setTimeLeft(0);
    };

    const value = {
        state: {
            questions,
            currentLevel,
            active,
            currentQuestionIndex,
            answers,
            isFinished,
            score: 0, // Computed on fly usually, but satisfying type
            hasViolatedSecurity,
            timeLeft
        },
        startQuiz,
        submitAnswer,
        nextQuestion,
        finishQuiz,
        resetQuiz
    };

    return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
    const context = useContext(QuizContext);
    if (context === undefined) {
        throw new Error("useQuiz must be used within a QuizProvider");
    }
    return context;
}
