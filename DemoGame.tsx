import React, { useState, useEffect } from 'react';
import { DEMO_QUESTIONS } from '../constants.ts';
import { Page } from '../types.ts';

interface DemoGameProps {
    setCurrentPage: (page: Page) => void;
    showNotification: (message: string) => void;
}

const DemoGame: React.FC<DemoGameProps> = ({ setCurrentPage, showNotification }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [answer, setAnswer] = useState<string | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [timeLeft, setTimeLeft] = useState(10);

    const currentQuestion = DEMO_QUESTIONS[currentQuestionIndex];
    const circleCircumference = 2 * Math.PI * 45; // 2 * pi * r

    const handleNext = () => {
        if (currentQuestionIndex < DEMO_QUESTIONS.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setAnswer(null);
            setTimeLeft(10);
        } else {
            setIsGameOver(true);
        }
    };

    useEffect(() => {
        if (answer || isGameOver) return;

        const timerId = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerId);
                    handleNext();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [currentQuestionIndex, answer, isGameOver]);


    const handleAnswer = (selectedAnswer: string) => {
        if (answer) return;

        setAnswer(selectedAnswer);
        const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
        
        if (isCorrect) {
            setScore(prev => prev + 1);
            showNotification("Correto!");
        } else {
            showNotification("Incorreto!");
        }

        setTimeout(handleNext, 1500);
    };

    const getButtonClass = (buttonAnswer: 'Verdade' | 'Falso') => {
        if (!answer) {
            return 'bg-brand-light-gray hover:bg-gray-600';
        }
        const isCorrect = currentQuestion.correctAnswer === buttonAnswer;
        const isSelected = answer === buttonAnswer;

        if (isCorrect) return 'bg-green-600';
        if (isSelected && !isCorrect) return 'bg-red-600';
        return 'bg-brand-gray opacity-50';
    };

    if (isGameOver) {
        return (
            <div className="p-4 text-white animate-fade-in flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-3xl font-bold text-brand-yellow mb-4">Demo Terminado!</h2>
                <p className="text-xl mb-6">Você acertou {score} de {DEMO_QUESTIONS.length} perguntas.</p>
                <button
                    onClick={() => setCurrentPage('HOME')}
                    className="bg-brand-yellow text-brand-black font-bold py-3 px-8 rounded-lg hover:bg-yellow-300"
                >
                    Voltar ao Início
                </button>
            </div>
        );
    }

    return (
        <div className="p-4 text-white animate-fade-in flex flex-col items-center justify-center h-full text-center">
            <div className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                     <p className="font-bold text-lg">Modo Demonstração</p>
                     <p className="font-bold text-lg">{score} Pontos</p>
                </div>
                
                <div className="relative w-24 h-24 mx-auto mb-4">
                    <svg className="w-full h-full" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}>
                        <circle className="text-brand-light-gray" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                        <circle
                            className="text-brand-yellow"
                            strokeWidth="8"
                            strokeDasharray={circleCircumference}
                            strokeDashoffset={circleCircumference - (timeLeft / 10) * circleCircumference}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="45"
                            cx="50"
                            cy="50"
                            style={{ transition: 'stroke-dashoffset 1s linear' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold">{timeLeft}</div>
                </div>


                <div className="bg-brand-gray p-6 rounded-xl border border-brand-light-gray min-h-[150px] flex items-center justify-center mb-6">
                    <p className="text-sm font-semibold">{currentQuestion.question}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                     <button
                        onClick={() => handleAnswer('Verdade')}
                        disabled={!!answer}
                        className={`font-bold py-3 px-4 rounded-lg transition-colors text-lg ${getButtonClass('Verdade')}`}
                    >
                        Verdade
                    </button>
                    <button
                        onClick={() => handleAnswer('Falso')}
                        disabled={!!answer}
                        className={`font-bold py-3 px-4 rounded-lg transition-colors text-lg ${getButtonClass('Falso')}`}
                    >
                        Falso
                    </button>
                </div>
                 <button
                    onClick={() => setCurrentPage('HOME')}
                    className="w-full mt-4 bg-transparent border border-brand-light-gray text-gray-300 font-semibold py-2 px-4 rounded-lg hover:bg-brand-light-gray hover:text-white transition-colors"
                >
                   Sair da Demo
                </button>
            </div>
        </div>
    );
};

export default DemoGame;