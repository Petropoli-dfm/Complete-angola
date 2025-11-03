import React, { useMemo } from 'react';
import { Deposit, Withdrawal } from '../../types.ts';

interface StatsProps {
    deposits: Deposit[];
    withdrawals: Withdrawal[];
    onDeleteDeposit: (depositId: string) => void;
    onDeleteWithdrawal: (withdrawalId: string) => void;
}

const Stats: React.FC<StatsProps> = ({ deposits, withdrawals, onDeleteDeposit, onDeleteWithdrawal }) => {
    const totalDeposited = useMemo(() => {
        return deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
    }, [deposits]);

    const totalWithdrawn = useMemo(() => {
        return withdrawals.reduce((sum, withdrawal) => sum + withdrawal.amount, 0);
    }, [withdrawals]);

    const handleDeleteDeposit = (deposit: Deposit) => {
        if (window.confirm(`Tem a certeza que deseja excluir o depósito de ${deposit.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} de ${deposit.userName}? Esta ação irá subtrair o valor do total aprovado.`)) {
            onDeleteDeposit(deposit.id);
        }
    };

    const handleDeleteWithdrawal = (withdrawal: Withdrawal) => {
        if (window.confirm(`Tem a certeza que deseja excluir o saque de ${withdrawal.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} de ${withdrawal.userName}? Esta ação irá subtrair o valor do total de saques.`)) {
            onDeleteWithdrawal(withdrawal.id);
        }
    };

    return (
        <div className="animate-fade-in space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-brand-gray border border-brand-light-gray rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-400 uppercase">Total Aprovado (Depósitos)</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">
                        {totalDeposited.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                    </p>
                </div>
                <div className="bg-brand-gray border border-brand-light-gray rounded-lg p-4 text-center">
                    <p className="text-sm text-gray-400 uppercase">Total Aprovado (Saques)</p>
                    <p className="text-3xl font-bold text-brand-red mt-1">
                        {totalWithdrawn.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                    </p>
                </div>
            </div>
            
            <div className="bg-brand-gray border border-brand-light-gray rounded-lg">
                <h3 className="p-3 font-bold border-b border-brand-light-gray">Histórico de Depósitos Aprovados</h3>
                {deposits.length > 0 ? (
                    <ul className="divide-y divide-brand-light-gray">
                        {[...deposits].sort((a,b) => b.date.getTime() - a.date.getTime()).map(deposit => (
                            <li key={deposit.id} className="p-3 flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-semibold text-white">{deposit.userName}</p>
                                    <p className="text-xs text-gray-400">{new Date(deposit.date).toLocaleString('pt-AO')}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <p className="font-bold text-green-400">
                                        +{deposit.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                    </p>
                                    <button 
                                        onClick={() => handleDeleteDeposit(deposit)}
                                        className="bg-red-600/50 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-md transition-colors"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-4 text-center text-gray-500">Nenhum depósito aprovado encontrado.</p>
                )}
            </div>

            <div className="bg-brand-gray border border-brand-light-gray rounded-lg">
                <h3 className="p-3 font-bold border-b border-brand-light-gray">Histórico de Saques Aprovados</h3>
                {withdrawals.length > 0 ? (
                    <ul className="divide-y divide-brand-light-gray">
                        {[...withdrawals].sort((a,b) => b.date.getTime() - a.date.getTime()).map(withdrawal => (
                            <li key={withdrawal.id} className="p-3 flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-semibold text-white">{withdrawal.userName}</p>
                                    <p className="text-xs text-gray-400">{new Date(withdrawal.date).toLocaleString('pt-AO')}</p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <p className="font-bold text-red-400">
                                        -{withdrawal.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                                    </p>
                                    <button 
                                        onClick={() => handleDeleteWithdrawal(withdrawal)}
                                        className="bg-red-600/50 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded-md transition-colors"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="p-4 text-center text-gray-500">Nenhum saque aprovado encontrado.</p>
                )}
            </div>
        </div>
    );
};

export default Stats;