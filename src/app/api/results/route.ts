import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        // Check if results are published
        const publishedSetting = await prisma.globalSettings.findUnique({
            where: { key: 'RESULTS_PUBLISHED' }
        });

        if (publishedSetting?.value !== 'true') {
            return NextResponse.json({ error: 'Results not published yet' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            where: { role: 'USER' },
            include: { submissions: true },
        });

        const rankedUsers = users.map(u => {
            const l1 = u.submissions.find((s) => s.level === 1);
            const l2 = u.submissions.find((s) => s.level === 2);

            const s1 = l1 ? l1.score : 0;
            const s2 = l2 ? l2.score : 0;
            const totalScore = s1 + s2;

            const t1 = l1 ? l1.timeTaken : 0;
            const t2 = l2 ? l2.timeTaken : 0;
            const totalTime = t1 + t2;

            return {
                id: u.id,
                name: u.name,
                email: u.email,
                totalScore,
                totalTime,
                l1: l1 ? { score: l1.score, time: l1.timeTaken } : null,
                l2: l2 ? { score: l2.score, time: l2.timeTaken } : null,
            };
        });


        // Sort: High Score first, then Low Time
        rankedUsers.sort((a, b) => {
            if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
            return a.totalTime - b.totalTime;
        });

        // Add Rank
        const finalResults = rankedUsers.map((u, index) => ({ ...u, rank: index + 1 }));

        return NextResponse.json({ results: finalResults });

    } catch (error) {
        console.error('Results Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
