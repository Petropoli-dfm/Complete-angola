import React, { useState } from 'react';
import { INVESTMENT_LEVELS } from '../constants.ts';
import { InvestmentLevel, User } from '../types.ts';
import { Spinner } from './Icons.tsx';

interface InvestmentCardProps {
    level: InvestmentLevel;
    user: User;
    onBuy: (level: InvestmentLevel) => void;
}

const InvestmentCard: React.FC<InvestmentCardProps> = ({ level, user, onBuy }) => {
    const totalGanho = level.ganho * level.dias;
    const [isLoading, setIsLoading] = useState(false);
    
    const canAfford = user.balance >= level.compra;
    const hasPurchasedLevelZero = user.hasPurchasedLevelZero || false;
    
    const isFinalReward = level.nivel === 0;

    let isDisabled = isLoading || !canAfford;
    let buttonText = canAfford ? 'Comprar Nível' : 'Saldo Insuficiente';

    // Regra: Deve COMPRAR o Nível 0 antes de comprar outros níveis.
    if (level.nivel !== 0 && !hasPurchasedLevelZero) {
        isDisabled = true;
        buttonText = 'Compre o Nível 0 primeiro';
    }

    // Regra: Não pode comprar o Nível 0 se já o comprou antes.
    if (level.nivel === 0 && hasPurchasedLevelZero) {
        isDisabled = true;
        buttonText = 'Nível 0 já comprado';
    }


    const handleBuy = () => {
        setIsLoading(true);
        // Simulate network delay
        setTimeout(() => {
            onBuy(level);
            setIsLoading(false);
        }, 1000);
    };

    return (
        <div className={`bg-brand-gray border border-brand-light-gray rounded-xl p-4 flex flex-col justify-between shadow-lg transform hover:scale-105 transition-all duration-300 ${isDisabled && !isLoading && 'opacity-60'}`}>
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-brand-yellow">Nível {level.nivel}</h3>
                    <div className="text-xs font-semibold bg-brand-light-gray text-gray-300 px-2 py-1 rounded-full">{level.dias} dias</div>
                </div>
                <p className="text-sm text-gray-400">Investimento</p>
                <p className="text-2xl font-semibold text-white mb-3">{level.compra.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                
                {isFinalReward ? (
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                             <span className="text-gray-400">Recompensa Final (após {level.dias} dias):</span>
                            <span className="font-medium text-white">{totalGanho.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                        </div>
                         <p className="text-xs text-gray-500 pt-1">O saldo é creditado de uma só vez no final do ciclo.</p>
                    </div>
                ) : (
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Ganho Diário:</span>
                            <span className="font-medium text-green-400">+{level.ganho.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Ganho Total:</span>
                            <span className="font-medium text-white">{totalGanho.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                        </div>
                    </div>
                )}
            </div>
            <button 
                onClick={handleBuy}
                disabled={isDisabled}
                className="w-full mt-4 bg-brand-yellow text-brand-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors flex items-center justify-center disabled:bg-yellow-400 disabled:opacity-70 disabled:cursor-not-allowed">
                {isLoading ? <Spinner className="w-5 h-5" /> : buttonText}
            </button>
        </div>
    );
};

interface InvestProps {
    user: User;
    handleBuyLevel: (level: InvestmentLevel) => void;
}

const Invest: React.FC<InvestProps> = ({ user, handleBuyLevel }) => {
    return (
        <div className="p-2 text-white animate-fade-in pb-24">
            <h2 className="text-2xl font-black text-center mb-2 text-brand-yellow">Níveis de Investimento</h2>
            <p className="text-center text-gray-400 mb-4">Escolha um nível para começar a render seus ganhos diariamente.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {INVESTMENT_LEVELS.map(level => (
                    <InvestmentCard key={level.nivel} level={level} user={user} onBuy={handleBuyLevel} />
                ))}
            </div>
        </div>
    );
};

export default Invest;