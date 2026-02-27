import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { userId, level, score, timeTaken, securityViolation } = await req.json();

        if (!userId || !level) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Prevent retakes for Level 1 if already passed/attempted
        // For this contest, we might want to allow only ONE attempt per level.
        const existingSubmission = await prisma.submission.findFirst({
            where: {
                userId,
                level,
            }
        });

        if (existingSubmission) {
            return NextResponse.json({ error: 'You have already submitted this level.' }, { status: 403 });
        }

        // If security violation occurred, score is 0 or marked invalid.
        // For now, let's just record it.
        const finalScore = securityViolation ? 0 : score;

        const submission = await prisma.submission.create({
            data: {
                userId,
                level,
                score: finalScore,
                timeTaken: timeTaken || 0,
            }
        });

        return NextResponse.json({ success: true, submissionId: submission.id });

    } catch (error) {
        console.error('Submission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
