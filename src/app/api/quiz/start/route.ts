
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { userId, level } = await req.json();

        if (!userId || !level) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { submissions: true },
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // Check if level already completed
        const existing = user.submissions.find((s) => s.level === level);
        if (existing) {
            return NextResponse.json({ error: "Level already completed" }, { status: 403 });
        }

        // Check Schedule
        const settings = await prisma.globalSettings.findMany();
        const settingsMap = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {} as Record<string, string>);
        const now = new Date();

        if (level === 2) {
            const startTime = settingsMap["LEVEL_2_START"] ? new Date(settingsMap["LEVEL_2_START"]) : null;
            if (startTime && now < startTime) {
                return NextResponse.json({ error: `Level 2 has not started yet. Starts at ${startTime.toLocaleString()}` }, { status: 403 });
            }

            // Qualification Check for Level 2 (Based on Level 1 Performance)
            if (settingsMap["LEVEL_2_LIMIT"]) {
                const limit = parseInt(settingsMap["LEVEL_2_LIMIT"]);
                if (!isNaN(limit) && limit > 0) {
                    // Get all Level 1 submissions
                    const allLevel1 = await prisma.submission.findMany({
                        where: { level: 1 },
                        orderBy: [
                            { score: 'desc' },
                            { timeTaken: 'asc' }
                        ]
                    });

                    // Find current user's rank
                    const userRank = allLevel1.findIndex(s => s.userId === userId) + 1;

                    // If user hasn't completed L1 or is outside limit
                    if (userRank === 0 || userRank > limit) {
                        return NextResponse.json({ error: `You did not qualify for Level 2. Top ${limit} candidates only.` }, { status: 403 });
                    }
                }
            }

        } else if (level === 3) {
            const startTime = settingsMap["LEVEL_3_START"] ? new Date(settingsMap["LEVEL_3_START"]) : null;
            if (startTime && now < startTime) {
                return NextResponse.json({ error: `Level 3 has not started yet. Starts at ${startTime.toLocaleString()}` }, { status: 403 });
            }

            // Qualification Check for Level 3 (Based on Total Performance L1+L2)
            if (settingsMap["LEVEL_3_LIMIT"]) {
                const limit = parseInt(settingsMap["LEVEL_3_LIMIT"]);
                if (!isNaN(limit) && limit > 0) {
                    // Fetch all users to calculate aggregate ranks (complex query or in-memory)
                    // For simplicity and correctness with small user base (<200): In-memory sort
                    const allUsers = await prisma.user.findMany({
                        include: { submissions: true }
                    });

                    const rankedUsers = allUsers.map(u => {
                        const l1 = u.submissions.find(s => s.level === 1);
                        const l2 = u.submissions.find(s => s.level === 2);
                        const score = (l1?.score || 0) + (l2?.score || 0);
                        const time = (l1?.timeTaken || 0) + (l2?.timeTaken || 0);
                        return { userId: u.id, score, time };
                    }).sort((a, b) => {
                        if (b.score !== a.score) return b.score - a.score;
                        return a.time - b.time;
                    });

                    const userRank = rankedUsers.findIndex(u => u.userId === userId) + 1;

                    if (userRank === 0 || userRank > limit) {
                        return NextResponse.json({ error: `You did not qualify for Level 3. Top ${limit} candidates only.` }, { status: 403 });
                    }
                }
            }
        }

        // If allowed, return questions (In a real app, fetch dynamically or random subset)
        // For this mock app, we'll return a static set based on level, but ideally this comes from DB.

        // MOCK QUESTION POOL (Expanded)
        // ideally efficient DB query: SELECT * FROM Question WHERE level = X ORDER BY RANDOM() LIMIT 10
        const allQuestions = [
            // Level 1 Pool
            { id: "1-1", text: "Which country launched the world’s first artificial satellite, Sputnik 1?", options: ["United States", "China", "Soviet Union", "Germany"], correctAnswer: 2, level: 1 },
            { id: "1-2", text: "Who was the first Indian woman to become the President of the Indian National Congress?", options: ["Sarojini Naidu", "Annie Besant", "Indira Gandhi", "Vijaya Lakshmi Pandit"], correctAnswer: 0, level: 1 },
            { id: "1-3", text: "Which blood group is known as the universal donor?", options: ["A+", "AB+", "O+", "O−"], correctAnswer: 3, level: 1 },
            { id: "1-4", text: "Which country is known as the “Land of the Rising Sun”?", options: ["China", "Thailand", "Japan", "South Korea"], correctAnswer: 2, level: 1 },
            { id: "1-5", text: "Which is the smallest country in the world by area?", options: ["Monaco", "Maldives", "Vatican City", "San Marino"], correctAnswer: 2, level: 1 },
            { id: "1-6", text: "Which is the smallest bone in the human body?", options: ["Femur", "Stapes", "Tibia", "Radius"], correctAnswer: 1, level: 1 },
            { id: "1-7", text: "The Gulf of Mannar lies between:", options: ["India and Maldives", "India and Sri Lanka", "India and Myanmar", "India and Bangladesh"], correctAnswer: 1, level: 1 },
            { id: "1-8", text: "Which state has the longest coastline in India?", options: ["Tamil Nadu", "Gujarat", "Maharashtra", "Andhra Pradesh"], correctAnswer: 1, level: 1 },
            { id: "1-9", text: "SIPCOT is related to:", options: ["Agriculture", "Industrial development", "Tourism", "Education"], correctAnswer: 1, level: 1 },
            { id: "1-10", text: "The pH of pure water is:", options: ["5", "6", "7", "8"], correctAnswer: 2, level: 1 },
            { id: "1-11", text: "The powerhouse of the cell is:", options: ["Ribosome", "Nucleus", "Mitochondria", "Lysosome"], correctAnswer: 2, level: 1 },
            { id: "1-12", text: "The chemical formula of baking soda is:", options: ["NaCl", "NaHCO₃", "Na₂CO₃", "KCl"], correctAnswer: 1, level: 1 },
            { id: "1-13", text: "The first Tamil newspaper was:", options: ["Swadesamitran", "Dinamani", "The Hindu", "Viduthalai"], correctAnswer: 0, level: 1 },
            { id: "1-14", text: "GST was introduced in India in:", options: ["2016", "2017", "2018", "2015"], correctAnswer: 1, level: 1 },
            { id: "1-15", text: "Which element has the highest melting point?", options: ["Iron", "Gold", "Tungsten", "Platinum"], correctAnswer: 2, level: 1 },
            { id: "1-16", text: "Which country was the first to land a spacecraft on the far side of the Moon?", options: ["USA", "Russia", "China", "India"], correctAnswer: 2, level: 1 },
            { id: "1-17", text: "Which is the largest desert in the world?", options: ["Sahara", "Antarctica", "Gobi", "Kalahari"], correctAnswer: 1, level: 1 },
            { id: "1-18", text: "Where is the Silicon Valley located?", options: ["New York", "Texas", "California", "Washington D.C."], correctAnswer: 2, level: 1 },
            { id: "1-19", text: "Which country launched the Aditya‑L1 mission to study the Sun in 2023?", options: ["USA", "China", "India", "Japan"], correctAnswer: 2, level: 1 },
            { id: "1-20", text: "Which is the smallest ocean in the world?", options: ["Indian Ocean", "Arctic Ocean", "Atlantic Ocean", "Pacific Ocean"], correctAnswer: 1, level: 1 },
            { id: "1-21", text: "What is the study of earthquakes called?", options: ["Seismology", "Meteorology", "Geology", "Volcanology"], correctAnswer: 0, level: 1 },
            { id: "1-22", text: "Which Indian state has the highest installed solar energy capacity (2025 data)?", options: ["Gujarat", "Rajasthan", "Tamil Nadu", "Karnataka"], correctAnswer: 1, level: 1 },
            { id: "1-23", text: "Who was the first woman to command a private space mission (SpaceX, 2023)?", options: ["Peggy Whitson", "Jessica Meir", "Kalpana Chawla", "Christina Koch"], correctAnswer: 0, level: 1 },
            { id: "1-24", text: "Which is the highest civilian award in India?", options: ["Padma Shri", "Bharat Ratna", "Padma Bhushan", "Padma Vibhushan"], correctAnswer: 1, level: 1 },
            { id: "1-25", text: "In which state is the Sundarbans National Park located?", options: ["Assam", "West Bengal", "Odisha", "Bihar"], correctAnswer: 1, level: 1 },
            { id: "1-26", text: "The Indian Constitution came into effect on:", options: ["15th August 1947", "26th January 1950", "2nd October 1949", "14th November 1950"], correctAnswer: 1, level: 1 },
            { id: "1-27", text: "Who designed the Indian National Flag?", options: ["Rabindranath Tagore", "Pingali Venkayya", "Mahatma Gandhi", "Jawaharlal Nehru"], correctAnswer: 1, level: 1 },
            { id: "1-28", text: "Which Indian state is known as the “Land of Five Rivers”?", options: ["Punjab", "Haryana", "Gujarat", "Assam"], correctAnswer: 0, level: 1 },
            { id: "1-29", text: "Who is known as the “Father of Indian Green Revolution”?", options: ["Dr. M.S. Swaminathan", "Dr. A.P.J. Abdul Kalam", "Dr. Verghese Kurien", "C. Subramaniam"], correctAnswer: 0, level: 1 },
            { id: "1-30", text: "Which state became India’s first 100% LPG-enabled state?", options: ["Tamil Nadu", "Himachal Pradesh", "Sikkim", "Kerala"], correctAnswer: 1, level: 1 },

            // Level 2 Pool (Add more as needed)
            { id: "2-1", text: "What does URL stand for?", options: ["Uniform Resource Locator", "Universal Resource List", "Unified Reference Link", "Universal Reference Locator"], correctAnswer: 0, level: 2 },
            { id: "2-2", text: "Which of the following is not an operating system?", options: ["Linux", "Unix", "Oracle", "macOS"], correctAnswer: 2, level: 2 },
            { id: "2-3", text: "What does the acronym BIOS stand for?", options: ["Basic Input Output System", "Binary Integrated Operating System", "Built-in Operating System", "Basic Internal Output Setup"], correctAnswer: 0, level: 2 },
            { id: "2-4", text: "Which of the following describes the function of the motherboard in a computer system?", options: ["Stores data", "Processes instructions", "Connects and allows communication between various components", "Displays output"], correctAnswer: 2, level: 2 },
            { id: "2-5", text: "Who invented the World Wide Web?", options: ["Bill Gates", "Tim Berners-Lee", "Steve Jobs", "Vint Cerf"], correctAnswer: 1, level: 2 },
            { id: "2-6", text: "Which data structure follows LIFO principle?", options: ["Queue", "Stack", "Tree", "Graph"], correctAnswer: 1, level: 2 },
            { id: "2-7", text: "What is the default port number for HTTPS?", options: ["21", "80", "443", "25"], correctAnswer: 2, level: 2 },
            { id: "2-8", text: "Which is NOT stable sorting?", options: ["Merge", "Insertion", "Quick", "Cyclic"], correctAnswer: 2, level: 2 },
            { id: "2-9", text: "Binary of decimal 10:", options: ["1010", "1001", "1100", "1110"], correctAnswer: 0, level: 2 },
            { id: "2-10", text: "Which symbol is used for pointer declaration in C?", options: ["&", "*", "%", "#"], correctAnswer: 1, level: 2 },
            { id: "2-11", text: "Which country has the longest written constitution in the world?", options: ["USA", "UK", "India", "Canada"], correctAnswer: 2, level: 2 },
            { id: "2-12", text: "Which planet has the maximum number of known moons (as of recent discoveries)?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], correctAnswer: 1, level: 2 },
            { id: "2-13", text: "Which planet is known as the “Morning Star”?", options: ["Mars", "Venus", "Mercury", "Jupiter"], correctAnswer: 1, level: 2 },
            { id: "2-14", text: "The headquarters of UNESCO is located in:", options: ["New York", "Geneva", "Paris", "London"], correctAnswer: 2, level: 2 },
            { id: "2-15", text: "Who was the first Indian woman to win an Olympic medal?", options: ["P.T. Usha", "Mary Kom", "Karnam Malleswari", "Saina Nehwal"], correctAnswer: 2, level: 2 },
            { id: "2-16", text: "Who was the first woman Chief Justice of a High Court in India?", options: ["Leila Seth", "Ruma Pal", "Sujata V Manohar", "Fathima Beevi"], correctAnswer: 0, level: 2 },
            { id: "2-17", text: "The retirement age of the judges of the Supreme Court of India is:", options: ["58 years", "60 years", "65 years", "62 years"], correctAnswer: 2, level: 2 },
            { id: "2-18", text: "Which of the following is NOT a valid C data type?", options: ["int", "float", "real", "char"], correctAnswer: 2, level: 2 },
            { id: "2-19", text: "Which operator is used for bitwise AND?", options: ["&&", "&", "||", "|"], correctAnswer: 1, level: 2 },
            { id: "2-20", text: "Which keyword prevents modification of variable?", options: ["static", "volatile", "const", "register"], correctAnswer: 2, level: 2 },
            { id: "2-21", text: "What is the output? print(2 ** 3)", options: ["6", "8", "9", "5"], correctAnswer: 1, level: 2 },
            { id: "2-22", text: "Which data type is immutable in python?", options: ["list", "set", "dictionary", "tuple"], correctAnswer: 3, level: 2 },
            { id: "2-23", text: "What is lambda in Python?", options: ["Loop", "Anonymous function", "Class", "Module"], correctAnswer: 1, level: 2 },
            { id: "2-24", text: "Which exception occurs in python when dividing by zero?", options: ["ValueError", "ZeroDivisionError", "TypeError", "ArithmeticError"], correctAnswer: 1, level: 2 },
            { id: "2-25", text: "Which algorithm is used for finding bridges in a graph?", options: ["Dijkstra", "BFS", "Tarjan’s Algorithm", "Prim"], correctAnswer: 2, level: 2 },
            { id: "2-26", text: "In DBMS, which index structure is most common?", options: ["B-Tree", "Graph", "HashSet", "LinkedList"], correctAnswer: 0, level: 2 },
            { id: "2-27", text: "In Java, which exception is unchecked?", options: ["IOException", "SQLException", "NullPointerException", "InterruptedException"], correctAnswer: 2, level: 2 },
            { id: "2-28", text: "In DBMS, ACID stands for:", options: ["Atomicity, Consistency, Isolation, Durability", "Access, Control, Integrity, Data", "Array, Column, Index, Data", "None"], correctAnswer: 0, level: 2 },
            { id: "2-29", text: "Which package contains Collection framework?", options: ["java.io", "java.lang", "java.util", "java.net"], correctAnswer: 2, level: 2 },
            { id: "2-30", text: "Primary key must be:", options: ["Nullable", "Unique", "Duplicate", "Repeating"], correctAnswer: 1, level: 2 },
            { id: "2-31", text: "In Java, JVM stands for:", options: ["Java Variable Machine", "Java Virtual Machine", "Java Verified Model", "Joint Virtual Module"], correctAnswer: 1, level: 2 },
            { id: "2-32", text: "In Java, which memory area stores objects?", options: ["Stack", "Heap", "Method area", "Register"], correctAnswer: 1, level: 2 },


        ];

        // Filter by level and shuffle
        const levelQuestions = allQuestions.filter(q => q.level === level)
            .sort(() => Math.random() - 0.5)
            .slice(0, 10); // Take top 10

        return NextResponse.json({ allowed: true, questions: levelQuestions });

    } catch (error) {
        console.error("Start Quiz Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
