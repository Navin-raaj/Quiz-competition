import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { submissions: true },
        });

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Get Global Settings for Schedules
        const settings = await prisma.globalSettings.findMany();
        const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);

        const level2StartTime = settingsMap['LEVEL_2_START'] ? new Date(settingsMap['LEVEL_2_START']) : null;
        const level3StartTime = settingsMap['LEVEL_3_START'] ? new Date(settingsMap['LEVEL_3_START']) : null;
        const now = new Date();

        const level2Limit = parseInt(settingsMap['LEVEL_2_LIMIT'] || '25');
        const level3Limit = parseInt(settingsMap['LEVEL_3_LIMIT'] || '5');

        // Check Logic
        // Level 1: Always open if not taken.
        // Level 2: Open if Level 1 passed AND in Top X AND Time is reached.
        // Level 3: Open if Level 2 passed AND in Top Y AND Time is reached.

        const level1Submission = user.submissions.find(s => s.level === 1);
        const level2Submission = user.submissions.find(s => s.level === 2);

        let highestLevel = 1;
        let qualificationStatus = {
            level2: { qualified: false, reason: 'Complete Level 1 first' },
        };

        // --- Level 2 Qualification Logic ---
        if (level1Submission) {
            // Check if Top X
            // Get all Level 1 submissions, sort by score desc, time asc
            const allLevel1 = await prisma.submission.findMany({
                where: { level: 1 },
                orderBy: [
                    { score: 'desc' },
                    { timeTaken: 'asc' }
                ]
            });

            const rank = allLevel1.findIndex(s => s.userId === userId) + 1;
            const isTopX = rank <= level2Limit;

            if (isTopX) {
                if (level2StartTime && now >= level2StartTime) {
                    highestLevel = 2;
                    qualificationStatus.level2 = { qualified: true, reason: 'Qualified' };
                } else {
                    qualificationStatus.level2 = { qualified: true, reason: 'SCHEDULED' };
                }

            } else {
                qualificationStatus.level2 = { qualified: false, reason: `Rank ${rank}. Top ${level2Limit} qualify.` };
            }
        }

        return NextResponse.json({
            highestLevel,
            submissions: user.submissions,
            qualificationStatus,
            schedules: {
                level2: level2StartTime,
            },
            limits: {
                level2: level2Limit,
            },
            resultsPublished: settingsMap['RESULTS_PUBLISHED'] === 'true'
        });


    } catch (error) {
        console.error('Status Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
