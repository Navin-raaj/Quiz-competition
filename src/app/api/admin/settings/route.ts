import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { level2Start, resultsPublished, level2Limit } = await req.json();

        // Upsert settings
        if (level2Start) {
            await prisma.globalSettings.upsert({
                where: { key: 'LEVEL_2_START' },
                update: { value: level2Start },
                create: { key: 'LEVEL_2_START', value: level2Start }
            });
        }

        if (resultsPublished) {
            await prisma.globalSettings.upsert({
                where: { key: 'RESULTS_PUBLISHED' },
                update: { value: resultsPublished },
                create: { key: 'RESULTS_PUBLISHED', value: resultsPublished }
            });
        }

        if (level2Limit) {
            await prisma.globalSettings.upsert({
                where: { key: 'LEVEL_2_LIMIT' },
                update: { value: String(level2Limit) },
                create: { key: 'LEVEL_2_LIMIT', value: String(level2Limit) }
            });
        }


        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Settings Save Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
