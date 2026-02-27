"use client";

import { useAuth } from "@/lib/auth-context";
import { useQuiz } from "@/lib/quiz-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Timer, Monitor, ShieldAlert, Lock, CheckCircle, Trophy, BarChart } from "lucide-react";
import { useEffect, useState } from "react";

type UserStatus = {
    highestLevel: number;
    submissions: any[];
    qualificationStatus: {
        level2: { qualified: boolean; reason: string };
    };
    schedules: {
        level2: string | null;
    };
    limits: {
        level2: number;
    };

    resultsPublished: boolean;
};

export default function DashboardPage() {
    const { user, isLoading: isAuthLoading, logout } = useAuth();
    const { startQuiz } = useQuiz();
    const router = useRouter();
    const [status, setStatus] = useState<UserStatus | null>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push("/");
            return;
        }

        if (user) {
            fetch(`/api/user/status?userId=${user.id}`)
                .then((res) => res.json())
                .then((data) => {
                    setStatus(data);
                    setLoadingStatus(false);
                })
                .catch((err) => {
                    console.error("Failed to fetch status", err);
                    setLoadingStatus(false);
                });
        }
    }, [user, isAuthLoading, router]);

    const handleStart = (level: number) => {
        startQuiz(level);
        router.push("/quiz");
    };

    if (isAuthLoading || loadingStatus) return <div className="p-8 text-center">Loading dashboard...</div>;
    if (!user || !status) return <div className="p-8 text-center">Loading user data...</div>;

    const submissions = status.submissions || [];
    const level1Done = submissions.some((s: any) => s.level === 1);
    const level2Done = submissions.some((s: any) => s.level === 2);


    return (
        <div className="min-h-screen bg-background p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <header className="flex justify-between items-center bg-card p-6 rounded-lg shadow-sm border">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Welcome, {user.name}!</h1>
                        <p className="text-muted-foreground">Competitor Dashboard</p>
                    </div>
                    <div className="flex gap-4">
                        {status.resultsPublished && (
                            <Button onClick={() => router.push("/results")} className="gap-2">
                                <BarChart className="w-4 h-4" />
                                View Results
                            </Button>
                        )}
                        <Button variant="outline" onClick={logout}>Sign Out</Button>
                    </div>
                </header>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Level 1 Card */}
                    <Card className={`border-2 ${level1Done ? 'border-green-500/50 bg-green-500/5' : 'border-primary'}`}>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="text-lg">Level 1: Qualifiers</span>
                                {level1Done && <CheckCircle className="text-green-500 w-5 h-5" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">Top {status.limits.level2} scorers advance to Level 2.</p>


                                <div className="text-xs font-mono bg-muted p-2 rounded">Status: {level1Done ? "COMPLETED" : "OPEN"}</div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            {level1Done ? (
                                <Button disabled className="w-full">Already Attempted</Button>
                            ) : (
                                <Button className="w-full" onClick={() => handleStart(1)}>Start Level 1</Button>
                            )}
                        </CardFooter>
                    </Card>

                    {/* Level 2 Card */}
                    <Card className={`border-2 relative ${!status.qualificationStatus.level2.qualified ? 'opacity-75' : 'border-primary'}`}>
                        {!status.qualificationStatus.level2.qualified && (
                            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-lg">
                                <div className="bg-card p-3 rounded shadow border flex items-center gap-2">
                                    <Lock className="w-4 h-4" /> Locked
                                </div>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="text-lg">Level 2: Next Level</span>
                                {level2Done && <Trophy className="text-yellow-500 w-5 h-5" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">The final challenge of the competition.</p>
                                <div className="text-xs font-mono bg-muted p-2 rounded">
                                    Condition: {status.qualificationStatus.level2.reason === 'SCHEDULED'
                                        ? `Starts at ${new Date(status.schedules.level2!).toLocaleString()}`
                                        : status.qualificationStatus.level2.reason}
                                </div>

                            </div>
                        </CardContent>
                        <CardFooter>
                            {level2Done ? (
                                <Button disabled className="w-full">Already Attempted</Button>
                            ) : (
                                <Button
                                    className="w-full"
                                    disabled={!status.qualificationStatus.level2.qualified}
                                    onClick={() => handleStart(2)}
                                >
                                    Start Level 2
                                </Button>
                            )}
                        </CardFooter>
                    </Card>

                </div>
            </div>
        </div>
    );
}
