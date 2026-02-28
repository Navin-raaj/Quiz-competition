"use client";

import { Question } from "@/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QuestionCardProps = {
    question: Question;
    selectedOptionIndex?: number;
    onSelectOption: (index: number) => void;
};

export function QuestionCard({ question, selectedOptionIndex, onSelectOption }: QuestionCardProps) {
    return (
        <Card className="w-full max-w-2xl mx-auto shadow-lg border-2">
            <CardHeader>
                <CardTitle className="text-xl md:text-2xl text-primary">
                    {question.text}
                </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
                {question.options.map((option, index) => {
                    const isSelected = selectedOptionIndex === index;
                    return (
                        <div
                            key={index}
                            onClick={() => onSelectOption(index)}
                            className={cn(
                                "p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:bg-accent",
                                isSelected
                                    ? "border-primary bg-primary/20 text-foreground font-bold shadow-md ring-1 ring-primary"
                                    : "border-muted bg-card text-muted-foreground hover:border-primary/50"
                            )}
                        >
                            <div className="flex items-center space-x-3">
                                <div
                                    className={cn(
                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs",
                                        isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"
                                    )}
                                >
                                    {String.fromCharCode(65 + index)}
                                </div>
                                <span>{option}</span>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
