import React from 'react';

interface BettingScreenProps {
    balance: number;
    onStartGame: (bet: number) => void;
}

const BET_AMOUNTS = [100, 200, 300, 400, 500, 1000, 2000, 2500, 5000];

const BettingScreen: React.FC<BettingScreenProps> = ({ balance, onStartGame }) => {
    return (
        <div className="p-3 text-white animate-fade-in flex flex-col items-center justify-center h-full pb-24">
            <h2 className="text-2xl font-black text-center mb-2 text-brand-yellow">Jogo Real</h2>
            <p className="text-center text-gray-400 mb-5">Selecione o valor da sua aposta para começar.</p>
            <div className="w-full max-w-md bg-brand-gray p-5 rounded-xl border border-brand-light-gray">
                <div className="grid grid-cols-3 gap-2">
                    {BET_AMOUNTS.map(amount => {
                        const canAfford = balance >= amount;
                        return (
                            <button
                                key={amount}
                                onClick={() => onStartGame(amount)}
                                disabled={!canAfford}
                                className={`p-3 rounded-lg text-center font-bold transition-colors duration-300 ${
                                    canAfford 
                                    ? 'bg-brand-yellow text-brand-black hover:bg-yellow-300' 
                                    : 'bg-brand-light-gray text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {amount.toLocaleString('pt-AO')} Kz
                            </button>
                        );
                    })}
                </div>
            </div>
             <div className="mt-4 text-center">
                <p className="text-gray-400">Seu Saldo</p>
                <p className="text-lg font-bold text-brand-yellow">{balance.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
            </div>
        </div>
    );
};

export default BettingScreen;