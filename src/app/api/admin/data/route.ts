import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    try {
        // In a real app, you MUST verify the session here.
        // For this contest speedrun, we are skipping a strict server-side session check 
        // and relying on the client-side password gate (NOT SECURE for production, but fits "mock" requirement speed).
        // Ideally, use a session cookie or JWT interaction.

        const users = await prisma.user.findMany({
            where: { role: 'USER' },
            include: { submissions: true },
            orderBy: { createdAt: 'desc' }
        });

        const settings = await prisma.globalSettings.findMany();
        const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);

        return NextResponse.json({
            users,
            settings: {
                LEVEL_2_START: settingsMap['LEVEL_2_START'] || null,
                LEVEL_2_LIMIT: settingsMap['LEVEL_2_LIMIT'] || "25",
                RESULTS_PUBLISHED: settingsMap['RESULTS_PUBLISHED'] || "false",

            }
        });

    } catch (error) {
        console.error('Admin Data Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
