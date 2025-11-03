import React from 'react';
import { Page } from '../types.ts';

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-brand-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
);

interface DepositRequiredScreenProps {
    setCurrentPage: (page: Page) => void;
}

const DepositRequiredScreen: React.FC<DepositRequiredScreenProps> = ({ setCurrentPage }) => {
    return (
        <div className="p-4 text-white animate-fade-in flex flex-col items-center justify-center h-full text-center">
            <div className="bg-brand-gray p-8 rounded-xl border border-brand-light-gray max-w-sm">
                <div className="w-16 h-16 bg-brand-yellow rounded-full flex items-center justify-center mx-auto mb-6">
                    <LockIcon />
                </div>
                <h2 className="text-2xl font-bold text-brand-yellow mb-3">Acesso ao Jogo Real</h2>
                <p className="text-gray-300 mb-6">
                    Para verificar a sua conta e começar a jogar com apostas reais, é necessário fazer um depósito inicial.
                </p>
                <button
                    onClick={() => setCurrentPage('HOME')}
                    className="w-full bg-brand-yellow text-brand-black font-bold py-3 px-8 rounded-lg hover:bg-yellow-300 transition-colors"
                >
                    Fazer Primeiro Depósito
                </button>
            </div>
        </div>
    );
};

export default DepositRequiredScreen;