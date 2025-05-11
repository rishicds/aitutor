"use client";

import { useState, useEffect } from "react";

const educationalAnimations = [
    { id: 1, text: "Did you know? The human brain processes images 60,000 times faster than text." },
    { id: 2, text: "Learning fact: We remember 10% of what we read, 20% of what we hear, and 90% of what we do." },
    { id: 3, text: "AI Insight: Modern neural networks are inspired by the human brain's structure." },
    { id: 4, text: "Fun fact: The word 'education' comes from the Latin word 'educare' meaning 'to draw out'." },
    { id: 5, text: "Tech fact: JavaScript was created in just 10 days in 1995." },
];

export default function Loading() {
    const [currentAnimation, setCurrentAnimation] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentAnimation((prev) => (prev + 1) % educationalAnimations.length);
        }, 3000);
        
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="text-center p-6 max-w-md">
                <div className="flex justify-center mb-6">
                    {[...Array(5)].map((_, i) => (
                        <div 
                            key={i} 
                            className="h-3 w-3 mx-1 rounded-full bg-blue-500 animate-pulse" 
                            style={{ animationDelay: `${i * 0.15}s` }} 
                        />
                    ))}
                </div>
                <div className="bg-white p-4 rounded-lg shadow-md"></div>
                    <p className="text-gray-700 text-sm md:text-base transition-opacity duration-300">{educationalAnimations[currentAnimation].text}</p>
                </div>
            </div>
    );
}