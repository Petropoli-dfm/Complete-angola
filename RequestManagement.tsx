import React, { useState, useEffect } from 'react';
import { Deposit, Withdrawal, ReactivationRequest, AppNotification, User } from '../../types.ts';
import { db, doc, updateDoc, arrayUnion, writeBatch, increment, getDoc } from '../../services/firebase.ts';
import { RefreshIcon, ArrowDownCircleIcon, ArrowUpCircleIcon, CopyIcon } from '../Icons.tsx';

interface RequestManagementProps {
    deposits: Deposit[];
    withdrawals: Withdrawal[];
    reactivationRequests: ReactivationRequest[];
}

type RequestType = 'reactivation' | 'deposit' | 'withdrawal';

interface RequestCardProps {
    userName: string;
    amount: number;
    details: React.ReactNode;
    date: Date;
    onApprove: () => void;
    onReject: () => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ userName, amount, details, date, onApprove, onReject }) => (
    <div className="bg-brand-black border border-brand-light-gray rounded-lg p-3 transition-shadow hover:shadow-lg">
        <div className="flex justify-between items-start mb-2">
            <div>
                <h3 className="font-semibold text-white text-sm">{userName}</h3>
                {typeof details === 'string' ? (
                     <p className="text-gray-400 text-xs">{details}</p>
                ) : (
                    details
                )}
                <p className="text-gray-500 text-xs mt-1">
                    {date.toLocaleString('pt-AO', { dateStyle: 'short', timeStyle: 'medium' })}
                </p>
            </div>
            {amount > 0 &&
                <p className="text-base font-bold text-brand-yellow">{amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
            }
        </div>
        <div className="flex space-x-2 mt-4">
            <button onClick={onApprove} className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-md transition-colors">Aprovar</button>
            <button onClick={onReject} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-md transition-colors">Rejeitar</button>
        </div>
    </div>
);

const WithdrawalDetails: React.FC<{ details: string }> = ({ details }) => {
    const [iban, setIban] = useState<string | null>(null);

    useEffect(() => {
        const parts = details.split('|');
        const mainInfo = parts[0];
        if (mainInfo.includes('IBAN:')) {
            const ibanMatch = mainInfo.match(/IBAN: (.*?)(,|$)/);
            if (ibanMatch) {
                setIban(ibanMatch[1].trim());
            }
        }
    }, [details]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert(`IBAN copiado: ${text}`);
    };

    return (
        <div>
            <p className="text-gray-400 text-xs">{details}</p>
            {iban && (
                <div className="mt-2">
                    <button
                        onClick={() => copyToClipboard(iban)}
                        className="flex items-center space-x-1 text-xs font-semibold bg-brand-light-gray text-gray-300 px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                    >
                        <CopyIcon className="w-3 h-3" />
                        <span>Copiar IBAN</span>
                    </button>
                </div>
            )}
        </div>
    );
};

const DepositDetails: React.FC<{ deposit: Deposit }> = ({ deposit }) => (
    <p className="text-gray-400 text-xs">Telefone: {deposit.senderPhone}</p>
);


const RequestManagement: React.FC<RequestManagementProps> = ({ deposits, withdrawals, reactivationRequests }) => {
    const [activeTab, setActiveTab] = useState<RequestType>('reactivation');
    
    const handleApproveDeposit = async (deposit: Deposit) => {
        const userRef = doc(db, "users", deposit.userId);
        const userDoc = await getDoc(userRef);
    
        if (!userDoc.exists()) {
            console.error("User not found for deposit approval");
            alert(`Erro: Utilizador com ID ${deposit.userId} não encontrado.`);
            return;
        }
    
        const userData = userDoc.data() as User;
        const isFirstDeposit = !userData.hasDeposited;
        const referrerId = userData.referrerId;
        
        const batch = writeBatch(db);
    
        // 1. Handle referral bonus if it's the first deposit and there's a referrer
        if (isFirstDeposit && referrerId) {
            const bonusAmount = deposit.amount * 0.15;
            const referrerRef = doc(db, "users", referrerId);
            
            const referrerDoc = await getDoc(referrerRef);
            if (referrerDoc.exists()) {
                const referrerNotification: AppNotification = {
                    id: `notif-bonus-${Date.now()}`,
                    message: `O seu convidado ${userData.name} fez o primeiro depósito. Ganhou ${bonusAmount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}!`,
                    timestamp: Date.now(),
                    read: false,
                };
                batch.update(referrerRef, {
                    balance: increment(bonusAmount),
                    notifications: arrayUnion(referrerNotification)
                });
            }
        }
        
        // 2. Update the depositor's account
        const depositorNotification: AppNotification = {
            id: `notif-deposit-${Date.now()}`,
            message: `Seu depósito de ${deposit.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} foi aprovado!`,
            timestamp: Date.now(),
            read: false,
        };
        batch.update(userRef, {
            balance: increment(deposit.amount),
            hasDeposited: true,
            notifications: arrayUnion(depositorNotification)
        });
        
        // 3. Update the deposit request status
        const depositRef = doc(db, "deposits", deposit.id);
        batch.update(depositRef, { status: "Aprovado" });
        
        await batch.commit();
    };
    
    const handleRejectDeposit = async (depositId: string) => {
        const depositRef = doc(db, "deposits", depositId);
        await updateDoc(depositRef, { status: "Rejeitado" });
    };

    const handleApproveWithdrawal = async (withdrawal: Withdrawal) => {
        const userRef = doc(db, "users", withdrawal.userId);
        const withdrawalRef = doc(db, "withdrawals", withdrawal.id);

        try {
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                console.error("User not found for withdrawal approval");
                return;
            }

            const userData = userDoc.data() as User;
            // FIX: Reconstruct the history array, converting Timestamps to Dates to prevent circular structure errors.
            const updatedHistory = (userData.withdrawalHistory || []).map((w: any) => {
                 const plainWithdrawal = {
                    id: w.id,
                    userId: w.userId,
                    userName: w.userName,
                    amount: w.amount,
                    details: w.details,
                    date: w.date && typeof w.date.toDate === 'function' ? w.date.toDate() : w.date,
                    status: w.status,
                };
                if (plainWithdrawal.id === withdrawal.id) {
                    plainWithdrawal.status = 'Aprovado';
                }
                return plainWithdrawal;
            });

            const newNotification: AppNotification = {
                id: `notif-${Date.now()}`,
                message: `Seu saque de ${withdrawal.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} foi aprovado.`,
                timestamp: Date.now(),
                read: false,
            };
            
            const batch = writeBatch(db);

            batch.update(userRef, {
                withdrawalHistory: updatedHistory,
                notifications: arrayUnion(newNotification)
            });

            batch.update(withdrawalRef, { status: "Aprovado" });

            await batch.commit();
        } catch (error) {
            console.error("Error approving withdrawal:", error);
        }
    };

    const handleRejectWithdrawal = async (withdrawal: Withdrawal) => {
         const userRef = doc(db, "users", withdrawal.userId);
        const withdrawalRef = doc(db, "withdrawals", withdrawal.id);

        try {
            const userDoc = await getDoc(userRef);
            if (!userDoc.exists()) {
                console.error("User not found for withdrawal rejection");
                return;
            }

            const userData = userDoc.data() as User;
            // FIX: Reconstruct the history array, converting Timestamps to Dates to prevent circular structure errors.
            const updatedHistory = (userData.withdrawalHistory || []).map((w: any) => {
                const plainWithdrawal = {
                    id: w.id,
                    userId: w.userId,
                    userName: w.userName,
                    amount: w.amount,
                    details: w.details,
                    date: w.date && typeof w.date.toDate === 'function' ? w.date.toDate() : w.date,
                    status: w.status,
                };
                if (plainWithdrawal.id === withdrawal.id) {
                    plainWithdrawal.status = 'Rejeitado';
                }
                return plainWithdrawal;
            });

            const newNotification: AppNotification = {
                id: `notif-${Date.now()}`,
                message: `Seu saque de ${withdrawal.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} foi rejeitado e o valor foi estornado.`,
                timestamp: Date.now(),
                read: false,
            };

            const batch = writeBatch(db);
            
            batch.update(userRef, {
                balance: increment(withdrawal.amount),
                withdrawalHistory: updatedHistory,
                notifications: arrayUnion(newNotification)
            });

            batch.update(withdrawalRef, { status: "Rejeitado" });
            
            await batch.commit();
        } catch (error) {
            console.error("Error rejecting withdrawal:", error);
        }
    };
    
    const handleApproveReactivation = async (request: ReactivationRequest) => {
        const batch = writeBatch(db);

        const userRef = doc(db, "users", request.userId);
        const newNotification: AppNotification = {
            id: `notif-${Date.now()}`,
            message: `A sua conta foi reativada com sucesso! Bem-vindo de volta.`,
            timestamp: Date.now(),
            read: false,
        };
        batch.update(userRef, {
            isActive: true,
            notifications: arrayUnion(newNotification)
        });

        const requestRef = doc(db, "reactivationRequests", request.id);
        batch.update(requestRef, { status: "Aprovado" });
        
        await batch.commit();
    };
    
    const handleRejectReactivation = async (request: ReactivationRequest) => {
        const batch = writeBatch(db);
        
        const userRef = doc(db, "users", request.userId);
        const newNotification: AppNotification = {
            id: `notif-${Date.now()}`,
            message: `O seu pedido de reativação foi rejeitado. Por favor, contacte o suporte.`,
            timestamp: Date.now(),
            read: false,
        };
        batch.update(userRef, {
            notifications: arrayUnion(newNotification)
        });

        const requestRef = doc(db, "reactivationRequests", request.id);
        batch.update(requestRef, { status: "Rejeitado" });
        
        await batch.commit();
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'reactivation':
                return (
                    <div className="space-y-3">
                        {reactivationRequests.length > 0 ? reactivationRequests.map(r => (
                            <RequestCard 
                                key={r.id} 
                                userName={r.userName}
                                amount={0}
                                details={`Email: ${r.userEmail}`}
                                date={r.date}
                                onApprove={() => handleApproveReactivation(r)} 
                                onReject={() => handleRejectReactivation(r)}
                            />
                        )) : <p className="text-gray-500 text-center py-4">Nenhum pedido de reativação.</p>}
                    </div>
                );
            case 'deposit':
                return (
                    <div className="space-y-3">
                        {deposits.length > 0 ? deposits.map(d => (
                            <RequestCard 
                                key={d.id} 
                                userName={d.userName}
                                amount={d.amount}
                                details={<DepositDetails deposit={d} />}
                                date={d.date}
                                onApprove={() => handleApproveDeposit(d)} 
                                onReject={() => handleRejectDeposit(d.id)}
                            />
                        )) : <p className="text-gray-500 text-center py-4">Nenhum pedido de depósito.</p>}
                    </div>
                );
            case 'withdrawal':
                return (
                     <div className="space-y-3">
                        {withdrawals.length > 0 ? withdrawals.map(w => (
                             <RequestCard 
                                 key={w.id} 
                                 userName={w.userName}
                                 amount={w.amount}
                                 details={<WithdrawalDetails details={w.details} />}
                                 date={w.date}
                                 onApprove={() => handleApproveWithdrawal(w)} 
                                 onReject={() => handleRejectWithdrawal(w)}
                             />
                        )) : <p className="text-gray-500 text-center py-4">Nenhum pedido de saque.</p>}
                    </div>
                );
            default:
                return null;
        }
    };
    
    const getTabButtonClass = (tab: RequestType) => {
        return activeTab === tab
            ? 'bg-brand-yellow text-brand-black'
            : 'bg-brand-gray text-white hover:bg-brand-light-gray';
    };

    return (
        <div className="animate-fade-in space-y-4">
            <div className="grid grid-cols-3 gap-2 p-2 bg-brand-black rounded-lg">
                 <button onClick={() => setActiveTab('reactivation')} className={`p-2 rounded-md flex flex-col items-center justify-center transition-colors ${getTabButtonClass('reactivation')}`}>
                    <RefreshIcon className="w-5 h-5 mb-1" active={activeTab === 'reactivation'} />
                    <span className="text-xs font-semibold">Reativação ({reactivationRequests.length})</span>
                </button>
                 <button onClick={() => setActiveTab('deposit')} className={`p-2 rounded-md flex flex-col items-center justify-center transition-colors ${getTabButtonClass('deposit')}`}>
                    <ArrowDownCircleIcon className="w-5 h-5 mb-1" active={activeTab === 'deposit'}/>
                    <span className="text-xs font-semibold">Depósito ({deposits.length})</span>
                </button>
                 <button onClick={() => setActiveTab('withdrawal')} className={`p-2 rounded-md flex flex-col items-center justify-center transition-colors ${getTabButtonClass('withdrawal')}`}>
                    <ArrowUpCircleIcon className="w-5 h-5 mb-1" active={activeTab === 'withdrawal'}/>
                    <span className="text-xs font-semibold">Saque ({withdrawals.length})</span>
                </button>
            </div>

            <div className="p-3 bg-brand-gray rounded-lg border border-brand-light-gray min-h-[200px]">
                {renderContent()}
            </div>
        </div>
    );
};

export default RequestManagement;