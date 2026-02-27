"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";

export default function ResultsPage() {
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetch("/api/results")
            .then(async (res) => {
                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to fetch results");
                }
                return res.json();
            })
            .then((data) => {
                setResults(data.results);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-pulse text-xl font-medium text-muted-foreground">Loading results...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 space-y-4">
                <div className="text-destructive font-bold text-xl">{error}</div>
                <Button onClick={() => router.push("/dashboard")}>Return to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => router.push("/dashboard")} className="gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Trophy className="text-yellow-500" />
                        Competition Results
                    </h1>
                </header>

                <Card>
                    <CardHeader>
                        <CardTitle>Final Standings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full overflow-auto">
                            <table className="w-full caption-bottom text-sm">
                                <thead className="[&_tr]:border-b">
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[80px]">Rank</th>
                                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total Score</th>
                                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Total Time</th>
                                    </tr>
                                </thead>
                                <tbody className="[&_tr:last-child]:border-0">
                                    {results.map((r) => (
                                        <tr key={r.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-bold">{r.rank}</td>
                                            <td className="p-4 align-middle">
                                                <div className="font-medium">{r.name}</div>
                                                <div className="text-xs text-muted-foreground hidden md:block">{r.email}</div>
                                            </td>
                                            <td className="p-4 align-middle text-right font-mono font-medium">{r.totalScore}</td>
                                            <td className="p-4 align-middle text-right font-mono text-muted-foreground">{r.totalTime}s</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
