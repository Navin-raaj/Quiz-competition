export type User = {
    id: string;
    name: string;
    email: string;
    highestLevelUnlocked: number;
};

export type Question = {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number; // Index of the correct option (0-3)
    level: 1 | 2 | 3;
};

export type QuizState = {
    active: boolean;
    currentLevel: 1 | 2 | 3;
    questions: Question[];
    currentQuestionIndex: number;
    answers: Record<string, number>; // questionId -> selectedOptionIndex
    score: number;
    isFinished: boolean;
    hasViolatedSecurity: boolean;
};
