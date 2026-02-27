"use client";

import { useQuiz } from "@/lib/quiz-context";
import { QuestionCard } from "./question-card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function QuizView() {
    const { state, submitAnswer, nextQuestion, finishQuiz, resetQuiz } = useQuiz();
    const router = useRouter();

    // If quiz is not active, redirect to dashboard
    useEffect(() => {
        if (!state.active && !state.isFinished && !state.hasViolatedSecurity) {
            router.push("/dashboard");
        }
    }, [state.active, state.isFinished, state.hasViolatedSecurity, router]);

    if (state.hasViolatedSecurity) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-6">
                <AlertTriangle className="w-20 h-20 text-destructive" />
                <h1 className="text-3xl font-bold text-destructive">Quiz Terminated</h1>
                <p className="text-lg text-muted-foreground max-w-md">
                    Implementation of security protocols detected a tab switch or focus loss.
                    Your participation has been flagged and the quiz was stopped to ensure fairness.
                </p>
                <Button onClick={() => { resetQuiz(); router.push("/dashboard"); }}>Return to Dashboard</Button>
            </div>
        );
    }

    if (state.isFinished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <Trophy className="w-24 h-24 text-yellow-500 mb-4" />
                <h1 className="text-4xl font-bold text-primary">Quiz Submitted!</h1>
                <p className="text-xl text-muted-foreground p-6 bg-card rounded-xl border shadow-sm max-w-md">
                    Your answers have been recorded. <br />
                    Results will be announced after the competition window closes.
                </p>
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">
                        Level {state.currentLevel} Completed.
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                        Check your dashboard for qualification status.
                    </p>
                </div>

                <Button size="lg" onClick={() => { resetQuiz(); router.push("/dashboard"); }}>
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    const currentQuestion = state.questions[state.currentQuestionIndex];
    if (!currentQuestion) return null;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col p-4">
            {/* Header */}
            <div className="w-full max-w-4xl mx-auto flex justify-between items-center py-4 mb-8">
                <div className="flex flex-col">
                    <div className="text-lg font-semibold text-muted-foreground">
                        Level {state.currentLevel}
                    </div>
                    <div className="text-2xl font-mono font-bold text-primary">
                        {formatTime(state.timeLeft)}
                    </div>
                </div>

                <div className="text-xl font-bold">
                    Question {state.currentQuestionIndex + 1} / {state.questions.length}
                </div>
                <Button variant="ghost" className="text-destructive" onClick={finishQuiz}>
                    Quit
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl mx-auto">
                <QuestionCard
                    question={currentQuestion}
                    selectedOptionIndex={state.answers[currentQuestion.id]}
                    onSelectOption={(index) => submitAnswer(currentQuestion.id, index)}
                />

                <div className="mt-8 flex justify-end w-full max-w-2xl">
                    <Button
                        size="lg"
                        onClick={nextQuestion}
                        disabled={state.answers[currentQuestion.id] === undefined}
                    >
                        {state.currentQuestionIndex === state.questions.length - 1 ? "Finish" : "Next Question"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
