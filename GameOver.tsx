import React from 'react';
import { Spinner } from './Icons.tsx';

interface GameOverProps {
    score: number;
    totalQuestions: number;
    winnings: number | null;
    onRestart: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ score, totalQuestions, winnings, onRestart }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-white animate-fade-in text-center p-4">
            <h1 className="text-3xl font-black text-brand-yellow mb-4">Jogo Terminado!</h1>
            <p className="text-lg text-gray-300 mb-2">
                Você acertou {score} de {totalQuestions} perguntas.
            </p>

            {winnings === null ? (
                <div className="flex items-center justify-center h-10 mb-8">
                    <Spinner className="w-6 h-6 mr-3 text-brand-yellow" />
                    <p className="text-xl font-bold text-gray-300">A calcular ganhos...</p>
                </div>
            ) : winnings > 0 ? (
                <p className="text-xl font-bold text-green-400 mb-8">
                    Parabéns! Você ganhou {winnings.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}.
                </p>
            ) : (
                 <p className="text-xl font-bold text-brand-red mb-8">
                    Mais sorte da próxima vez.
                </p>
            )}

            <button
                onClick={onRestart}
                className="bg-brand-yellow text-brand-black font-bold py-3 px-8 rounded-lg hover:bg-yellow-300 transition-colors"
            >
                Voltar ao Painel
            </button>
        </div>
    );
};

export default GameOver;