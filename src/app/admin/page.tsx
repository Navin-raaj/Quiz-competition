"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context"; // Reuse mostly for the user object, but admin login is separate flow often
import { useRouter } from "next/navigation";
import { Trash2, Plus, Users, Clock, Trophy, BarChart, Lock, CheckCircle } from "lucide-react";

export default function AdminPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);

    // Schedule States
    const [level2Time, setLevel2Time] = useState("");
    const [level2Limit, setLevel2Limit] = useState("");


    // Results Publishing State
    const [isPublished, setIsPublished] = useState(false);

    // New User States
    const [newUserName, setNewUserName] = useState("");
    const [newUserEmail, setNewUserEmail] = useState("");
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // We use the same auth route but different flow for admin
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email || "admin@quiz.com", password, isAdmin: true }),
            });

            if (res.ok) {
                setIsAuthenticated(true);
                fetchData();
            } else {
                alert("Invalid Admin Password");
            }
        } catch (error) {
            console.error(error);
            alert("Error logging in");
        } finally {
            setLoading(false);
        }
    };

    const fetchData = async () => {
        // Fetch all users and submission data (Need a new admin route ideally, or just reuse/expand)
        // For speed, let's create a specialized admin data route or just fetch status for list.
        // Let's create `api/admin/data`
        const res = await fetch("/api/admin/data");
        if (res.ok) {
            const data = await res.json();
            setUsers(data.users);
            if (data.settings.LEVEL_2_START) {
                const date = new Date(data.settings.LEVEL_2_START);
                // Convert back to YYYY-MM-DDTHH:mm for datetime-local input
                const localStr = date.getFullYear() + '-' +
                    String(date.getMonth() + 1).padStart(2, '0') + '-' +
                    String(date.getDate()).padStart(2, '0') + 'T' +
                    String(date.getHours()).padStart(2, '0') + ':' +
                    String(date.getMinutes()).padStart(2, '0');
                setLevel2Time(localStr);
            }
            if (data.settings.LEVEL_2_LIMIT) setLevel2Limit(data.settings.LEVEL_2_LIMIT);


            if (data.settings.RESULTS_PUBLISHED === "true") setIsPublished(true);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUserName || !newUserEmail) return;
        setIsCreatingUser(true);
        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newUserName, email: newUserEmail }),
            });
            if (res.ok) {
                setNewUserName("");
                setNewUserEmail("");
                fetchData();
                alert("User created successfully!");
            } else {
                const data = await res.json();
                alert(data.error || "Failed to create user");
            }
        } catch (error) {
            console.error(error);
            alert("Error creating user");
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? All their submissions will also be deleted.")) return;
        try {
            const res = await fetch(`/api/admin/users?userId=${userId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                fetchData();
                alert("User deleted successfully!");
            } else {
                alert("Failed to delete user");
            }
        } catch (error) {
            console.error(error);
            alert("Error deleting user");
        }
    };

    const getRankedUsers = () => {
        // Calculate totals
        const processedUsers = users.map(u => {
            const l1 = u.submissions.find((s: any) => s.level === 1);
            const l2 = u.submissions.find((s: any) => s.level === 2);

            const s1 = l1 ? l1.score : 0;
            const s2 = l2 ? l2.score : 0;
            const totalScore = s1 + s2;

            const t1 = l1 ? l1.timeTaken : 0;
            const t2 = l2 ? l2.timeTaken : 0;
            const totalTime = t1 + t2;

            return { ...u, totalScore, totalTime, l1, l2 };
        });

        // Sort: High Score first, then Low Time
        processedUsers.sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            return a.totalTime - b.totalTime;
        });

        // Add Rank
        return processedUsers.map((u, index) => ({ ...u, rank: index + 1 }));
    };

    const handleDownload = () => {
        if (!users.length) return;

        const rankedUsers = getRankedUsers();

        const headers = ["Rank", "ID", "Name", "Email", "Total Score", "Total Time", "L1 Score", "L1 Time", "L2 Score", "L2 Time"];
        const rows = rankedUsers.map(u => {
            return [
                u.rank,
                u.id,
                u.name,
                u.email,
                u.totalScore,
                u.totalTime,
                u.l1 ? u.l1.score : "N/A",
                u.l1 ? u.l1.timeTaken : "N/A",
                u.l2 ? u.l2.score : "N/A",
                u.l2 ? u.l2.timeTaken : "N/A"
            ].join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "quiz_results_ranked.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSaveSchedule = async () => {
        if (!level2Time) return;
        const utcTime = new Date(level2Time).toISOString();
        await fetch("/api/admin/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                level2Start: utcTime,
                level2Limit: level2Limit
            })
        });

        alert("Schedule Updated");
    };


    const handlePublishToggle = async () => {
        const newState = !isPublished;
        try {
            await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    resultsPublished: newState ? "true" : "false"
                })
            });
            setIsPublished(newState);
            alert(newState ? "Results Published!" : "Results Unpublished.");
        } catch (error) {
            console.error(error);
            alert("Failed to update status");
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <Card className="w-[350px]">
                    <CardHeader>
                        <CardTitle>Admin Access</CardTitle>
                        <CardDescription>Enter admin password to continue.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <Input
                                type="email"
                                placeholder="Admin Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? "Verifying..." : "Login"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex justify-between items-center bg-card p-6 rounded-lg shadow-sm border">
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <div className="space-x-4">
                        <Button
                            onClick={handlePublishToggle}
                            variant={isPublished ? "destructive" : "default"}
                        >
                            {isPublished ? "Unpublish Results" : "Publish Results"}
                        </Button>
                        <Button onClick={handleDownload} variant="outline">Download Ranked CSV</Button>
                        <Button onClick={() => setIsAuthenticated(false)} variant="ghost" className="text-red-500">Logout</Button>
                    </div>
                </header>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Competition Settings</CardTitle>
                            <CardDescription>Set start times & qualification limits.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Next Level Start Time</label>
                                <Input
                                    type="datetime-local"
                                    value={level2Time}
                                    onChange={(e) => setLevel2Time(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Next Level Max Candidates</label>
                                <Input
                                    type="number"
                                    placeholder="25"
                                    value={level2Limit}
                                    onChange={(e) => setLevel2Limit(e.target.value)}
                                />
                            </div>

                            <Button onClick={handleSaveSchedule} className="w-full">Save Settings</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Register New Component</CardTitle>
                            <CardDescription>Add a person who can log in.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Full Name</label>
                                    <Input
                                        placeholder="John Doe"
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email Address</label>
                                    <Input
                                        type="email"
                                        placeholder="john@example.com"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isCreatingUser}>
                                    {isCreatingUser ? "Adding..." : "Add User"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="text-2xl font-bold">{users.length}</div>
                                <p className="text-muted-foreground">Total Registered Users</p>
                            </div>
                            <div className="mt-6 pt-6 border-t">
                                <p className="font-semibold mb-2">Publishing Status:</p>
                                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {isPublished ? "Published (Visible to Users)" : "Draft (Hidden from Users)"}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>User List / Ranking Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {getRankedUsers().map(u => (
                                <div key={u.id} className="flex justify-between border-b pb-4 items-center last:border-0 pt-2">
                                    <div className="flex gap-4 items-center">
                                        <span className="font-mono bg-muted w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold">
                                            {u.rank}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{u.name}</span>
                                            <span className="text-xs text-muted-foreground">{u.email}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right text-sm">
                                            <div className="font-medium">Score: {u.totalScore}</div>
                                            <div className="text-muted-foreground">{u.totalTime}s</div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDeleteUser(u.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {users.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    No users registered yet.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
