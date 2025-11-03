import React, { useState, useEffect, useCallback } from 'react';
import { REAL_QUESTIONS } from '../constants.ts';
import { QuizQuestion } from '../types.ts';
import { Spinner } from './Icons.tsx';

interface RealGameProps {
    betAmount: number;
    balance: number;
    addBalance: (amount: number) => void;
    onEndGame: (score: number, totalQuestions: number) => void;
    showNotification: (message: string) => void;
}

// Definindo os padrões de ciclo de jogo
const cyclePatterns = {
    A: [true, false, false, true, true, false, false], // Começa com 1 correta
    B: [false, false, true, true, false, false, true], // Começa com 2 incorretas
};

// Função para obter a chave do ciclo inicial do localStorage
const getInitialCycleKey = (): 'A' | 'B' => {
    const savedKey = localStorage.getItem('gameCycleKey');
    if (savedKey === 'A' || savedKey === 'B') {
        return savedKey;
    }
    return 'A'; // Padrão 'A' se nada for encontrado
};

// Função para obter o nível de penalidade do localStorage
const getInitialPenaltyLevel = (): number => {
    const savedLevel = localStorage.getItem('penaltyLevel');
    const level = parseInt(savedLevel || '0', 10);
    // Garante que o nível seja 0, 1 ou 2. Padrão é 0.
    return isNaN(level) || level < 0 || level > 2 ? 0 : level;
};

// Função para obter o histórico de perguntas do localStorage
const getInitialAskedQuestions = (): Set<string> => {
    const savedHistory = localStorage.getItem('askedQuestionHistory');
    if (savedHistory) {
        try {
            return new Set(JSON.parse(savedHistory));
        } catch (e) {
            console.error("Failed to parse asked question history:", e);
            return new Set();
        }
    }
    return new Set();
};

// Função pura para gerar um novo conjunto de perguntas e o novo histórico
const getNewQuestionsAndHistory = (currentHistory: Set<string>): { finalSet: QuizQuestion[], newHistory: Set<string> } => {
    let availableQuestions = REAL_QUESTIONS.filter(q => !currentHistory.has(q.question));

    // Se tivermos menos de 10 perguntas novas, é hora de reiniciar o histórico
    if (availableQuestions.length < 10) {
        currentHistory = new Set<string>(); // Reinicia o histórico para esta geração
        availableQuestions = [...REAL_QUESTIONS];
    }

    const shuffledAvailable = availableQuestions.sort(() => 0.5 - Math.random());
    const baseSet = shuffledAvailable.slice(0, 10);
    
    const questionsFromHistory = REAL_QUESTIONS.filter(q => currentHistory.has(q.question));
    
    const finalSet = baseSet.map(question => {
        // Com 1% de chance, substitui uma nova pergunta por uma do histórico
        const shouldRepeat = Math.random() < 0.01 && questionsFromHistory.length > 0;
        if (shouldRepeat) {
            const randomIndex = Math.floor(Math.random() * questionsFromHistory.length);
            return questionsFromHistory[randomIndex];
        }
        return question;
    });

    const newHistory = new Set(currentHistory);
    finalSet.forEach(q => newHistory.add(q.question));
    
    return { finalSet, newHistory };
};


const RealGame: React.FC<RealGameProps> = ({ betAmount, balance, addBalance, onEndGame, showNotification }) => {
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(22);
    const [answer, setAnswer] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ message: string; type: 'correct' | 'incorrect' } | null>(null);
    
    // State para a posição no ciclo de lógica do jogo
    const [cyclePosition, setCyclePosition] = useState(0);
    // State para a chave do ciclo atual, lida do localStorage
    const [cycleKey, setCycleKey] = useState<'A' | 'B'>(getInitialCycleKey());
    // Novo state para rodada de penalidade, usando níveis
    const [penaltyLevel, setPenaltyLevel] = useState<number>(getInitialPenaltyLevel());

    // Novo state para o histórico de perguntas
    const [askedQuestionHistory, setAskedQuestionHistory] = useState<Set<string>>(getInitialAskedQuestions());

    // State para o prompt de continuar/encerrar
    const [showContinuePrompt, setShowContinuePrompt] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);

    // Salva o histórico no localStorage sempre que ele muda
    useEffect(() => {
        localStorage.setItem('askedQuestionHistory', JSON.stringify(Array.from(askedQuestionHistory)));
    }, [askedQuestionHistory]);

    // Este efeito é executado apenas na montagem para definir as perguntas iniciais
    useEffect(() => {
        const { finalSet, newHistory } = getNewQuestionsAndHistory(askedQuestionHistory);
        setQuestions(finalSet);
        setAskedQuestionHistory(newHistory);
        setGameStarted(true);
        // Este efeito DEVE ser executado apenas uma vez na montagem.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    // Encerra o jogo se o saldo for insuficiente
    useEffect(() => {
        if (!gameStarted || feedback || showContinuePrompt || answer) return;

        if (balance < betAmount) {
            showNotification("Saldo insuficiente. O jogo terminou.");
            onEndGame(score, currentQuestionIndex);
        }
    }, [balance, betAmount, gameStarted, feedback, showContinuePrompt, answer, onEndGame, score, currentQuestionIndex]);

    const currentQuestion = questions[currentQuestionIndex];

    const handleNextQuestion = useCallback(() => {
        setTimeout(() => {
            setFeedback(null);
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(prev => prev + 1);
                setTimeLeft(22);
                setAnswer(null);
            } else {
                setShowContinuePrompt(true);
            }
        }, 2000);
    }, [currentQuestionIndex, questions.length]);

    const handleTimeout = useCallback(() => {
        if (answer) return; // Previne respostas múltiplas
        setAnswer('Tempo esgotado'); // Bloqueia botões e mostra feedback
        
        addBalance(-betAmount);
        setFeedback({ message: `Tempo esgotado! -${betAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`, type: 'incorrect' });
        
        handleNextQuestion();
    }, [answer, addBalance, betAmount, handleNextQuestion]);
    
    useEffect(() => {
        if (!currentQuestion || answer || showContinuePrompt) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === 1) {
                    handleTimeout();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [currentQuestion, answer, showContinuePrompt, handleTimeout]);
    
    // Alterna a chave do ciclo e salva no localStorage para a rodada ATUAL
    const toggleAndSaveCycleForCurrentRound = () => {
        const newKey = cycleKey === 'A' ? 'B' : 'A';
        localStorage.setItem('gameCycleKey', newKey);
        setCycleKey(newKey);
    };

    const handlePrematureExit = () => {
        const newPenaltyLevel = Math.min(penaltyLevel + 1, 2);
        localStorage.setItem('penaltyLevel', newPenaltyLevel.toString());
        onEndGame(score, currentQuestionIndex);
    };


    const handleContinueGame = () => {
        if (penaltyLevel > 0) {
            const newPenaltyLevel = penaltyLevel - 1;
            localStorage.setItem('penaltyLevel', newPenaltyLevel.toString());
            setPenaltyLevel(newPenaltyLevel);
        } else {
            // Apenas alterna o ciclo em rodadas normais
            toggleAndSaveCycleForCurrentRound();
        }

        showNotification('Novo ciclo! As perguntas foram atualizadas.');
        
        // Usa a atualização funcional para evitar problemas de dependência.
        setAskedQuestionHistory(currentHistory => {
            const { finalSet, newHistory } = getNewQuestionsAndHistory(currentHistory);
            setQuestions(finalSet);
            return newHistory;
        });

        setCurrentQuestionIndex(0);
        setTimeLeft(22);
        setAnswer(null);
        setShowContinuePrompt(false);
    };

    const handleStopGame = () => {
        if (penaltyLevel > 0) {
            const newPenaltyLevel = penaltyLevel - 1;
            localStorage.setItem('penaltyLevel', newPenaltyLevel.toString());
        } else {
            // Prepara a chave do próximo ciclo para quando o jogador voltar
            const nextKey = cycleKey === 'A' ? 'B' : 'A';
            localStorage.setItem('gameCycleKey', nextKey);
        }
        onEndGame(score, questions.length);
    };

    const handleAnswer = (selectedAnswer: string) => {
        if (answer) return; // Previne múltiplas respostas

        setAnswer(selectedAnswer);
        
        let isFinalResultCorrect;
        if (penaltyLevel === 1) {
            isFinalResultCorrect = false;
        } else if (penaltyLevel === 2) {
            // A última pergunta é correta na segunda rodada de penalidade
            isFinalResultCorrect = currentQuestionIndex === questions.length - 1;
        } else { // penaltyLevel === 0
            const currentPattern = cyclePatterns[cycleKey];
            const positionInCycle = cyclePosition % currentPattern.length;
            isFinalResultCorrect = currentPattern[positionInCycle];
        }
        
        setCyclePosition(prev => prev + 1);
        
        if (isFinalResultCorrect) {
            const winAmount = betAmount;
            addBalance(winAmount);
            setFeedback({ message: `Correto! +${winAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`, type: 'correct' });
            setScore(prev => prev + 1);
        } else {
            addBalance(-betAmount);
            setFeedback({ message: `Incorreto! -${betAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}`, type: 'incorrect' });
        }
        
        handleNextQuestion();
    };

    const getButtonClass = (buttonAnswer: 'Verdade' | 'Falso') => {
        if (!answer || answer === 'Tempo esgotado') {
            return 'bg-brand-light-gray hover:bg-gray-600';
        }
        const isCorrect = currentQuestion.correctAnswer === buttonAnswer;
        const isSelected = answer === buttonAnswer;

        if (isCorrect) return 'bg-green-600'; // Mostra resposta correta
        if (isSelected && !isCorrect) return 'bg-red-600'; // Mostra resposta errada selecionada
        return 'bg-brand-gray opacity-50'; // Diminui os outros botões
    };

    if (showContinuePrompt) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white animate-fade-in text-center p-4">
                <h2 className="text-3xl font-bold text-brand-yellow mb-4">Fim do Ciclo!</h2>
                <p className="text-xl mb-6">Você completou 10 perguntas. O que deseja fazer?</p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 w-full max-w-sm">
                    <button
                        onClick={handleStopGame}
                        className="w-full bg-brand-red text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-red-dark transition-colors"
                    >
                        Encerrar Partida
                    </button>
                    <button
                        onClick={handleContinueGame}
                        className="w-full bg-brand-yellow text-brand-black font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition-colors"
                    >
                        Continuar
                    </button>
                </div>
                <p className="text-lg text-gray-300 mt-8">Pontuação Atual: <span className="font-bold">{score}</span></p>
            </div>
        );
    }

    if (!currentQuestion) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-white text-center p-4">
                <Spinner className="w-10 h-10 mb-4" />
                <p>A preparar o jogo...</p>
            </div>
        );
    }

    return (
        <div className="p-4 text-white animate-fade-in flex flex-col items-center justify-center h-full text-center">
            <div className="w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-left">
                        <p className="text-gray-400 text-sm">Aposta</p>
                        <p className="font-bold text-lg text-brand-yellow">{betAmount.toLocaleString('pt-AO')} Kz</p>
                    </div>
                     <div className="text-right">
                        <p className="text-gray-400 text-sm">Pontos</p>
                        <p className="font-bold text-lg">{score}</p>
                    </div>
                </div>
                
                <div className="relative h-2 bg-brand-black rounded-full mb-6">
                    <div className="absolute top-0 left-0 h-full bg-brand-yellow rounded-full" style={{ width: `${(timeLeft / 22) * 100}%`, transition: 'width 1s linear' }}></div>
                </div>

                <div className="bg-brand-gray p-6 rounded-xl border border-brand-light-gray min-h-[150px] flex items-center justify-center mb-6">
                    {feedback ? (
                        <p className={`text-2xl font-bold ${feedback.type === 'correct' ? 'text-green-400' : 'text-brand-red'}`}>
                            {feedback.message}
                        </p>
                    ) : (
                        <p className="text-sm font-semibold">{currentQuestion.question}</p>
                    )}
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
                    onClick={handlePrematureExit}
                    disabled={!!answer}
                    className="w-full mt-4 bg-transparent border border-brand-light-gray text-gray-300 font-semibold py-2 px-4 rounded-lg hover:bg-brand-light-gray hover:text-white transition-colors disabled:opacity-50"
                >
                    Sair do Jogo
                </button>
            </div>
        </div>
    );
};

export default RealGame;