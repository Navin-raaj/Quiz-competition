import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding...')

    // Create 200 Users
    for (let i = 1; i <= 200; i++) {
        const email = `user${i}@example.com`
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                name: `User ${i}`,
                role: 'USER',
            },
        })

        // Simulate random Level 1 score (0-10)
        const score = Math.floor(Math.random() * 11);
        const timeTaken = Math.floor(Math.random() * 300) + 30; // 30s to 330s

        await prisma.submission.create({
            data: {
                userId: user.id,
                level: 1,
                score,
                timeTaken,
            }
        });
    }

    console.log(`Seeding finished. Created 200 users with Level 1 submissions.`)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
