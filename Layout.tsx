import React, { useState, useEffect } from 'react';
import { Page, ActiveInvestment, InvestmentLevel, User, Withdrawal, Deposit, ChatMessage, AppNotification, SimpleFirebaseUser } from '../types.ts';
// FIX: Changed default import to named import to match the export from Dashboard.tsx
import Dashboard from '../components/Dashboard.tsx';
import Invest from '../components/Invest.tsx';
import Tasks from '../components/Tasks.tsx';
import RealGame from '../components/RealGame.tsx';
import DemoGame from '../components/DemoGame.tsx';
import Account from '../components/Account.tsx';
import GameOver from '../components/GameOver.tsx';
import BettingScreen from '../components/BettingScreen.tsx';
import ChatModal from '../components/ChatModal.tsx';
import DepositRequiredScreen from '../components/DepositRequiredScreen.tsx';
import NotificationHandler from '../components/NotificationHandler.tsx';
import NotificationToast, { ToastProps } from '../components/NotificationToast.tsx';
import SpinGame from '../components/SpinGame.tsx';
import Header from '../components/Header.tsx';
import BottomNav from '../components/BottomNav.tsx';
import FloatingChatButton from '../components/FloatingChatButton.tsx';
import { SpinIcon } from '../components/Icons.tsx';
import { db, auth, doc, onSnapshot, updateDoc, arrayUnion, addDoc, collection, serverTimestamp, query, orderBy, updateProfile, getDoc, increment, where, getDocs } from '../services/firebase.ts';
import { Spinner } from '../components/Icons.tsx';
import { INVESTMENT_LEVELS } from '../constants.ts';


interface LayoutProps {
    firebaseUser: SimpleFirebaseUser;
    logout: () => void;
    toasts: Omit<ToastProps, 'onDismiss'>[];
    showNotification: (message: string) => void;
    dismissNotification: (id: string) => void;
}

const FloatingSpinButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button
        onClick={onClick}
        className="fixed bottom-20 left-4 flex flex-col items-center z-20 group"
        aria-label="Roda da Sorte"
    >
        <div className="bg-brand-yellow text-brand-black w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
            <SpinIcon />
        </div>
        <span className="text-white text-xs font-bold mt-2">
            Roda da Sorte
        </span>
    </button>
);


const Layout: React.FC<LayoutProps> = ({ firebaseUser, logout, toasts, showNotification, dismissNotification }) => {
    const [user, setUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState<Page>('HOME');
    
    const [gameConfig, setGameConfig] = useState<{ bet: number } | null>(null);
    const [gameResult, setGameResult] = useState<{ score: number; totalQuestions: number; winnings: number | null } | null>(null);
    const [balanceBeforeGame, setBalanceBeforeGame] = useState<number | null>(null);

    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    
    const [isRequestingReactivation, setIsRequestingReactivation] = useState(false);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);


    // Fetch user data from Firestore
    useEffect(() => {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                
                // Create a clean user object to avoid circular structures from Firestore SDK objects
                const cleanUser: User = {
                    id: doc.id,
                    name: data.name,
                    email: data.email,
                    balance: data.balance,
                    level: data.level,
                    activeInvestments: data.activeInvestments || [],
                    withdrawalHistory: (data.withdrawalHistory || []).map((w: any) => ({
                        id: w.id,
                        userId: w.userId,
                        userName: w.userName,
                        amount: w.amount,
                        details: w.details,
                        status: w.status,
                        date: (w.date && typeof w.date.toDate === 'function') ? w.date.toDate() : new Date(),
                    })),
                    hasDeposited: data.hasDeposited,
                    fcmToken: data.fcmToken,
                    gamesPlayed: data.gamesPlayed,
                    notifications: data.notifications || [],
                    isActive: data.isActive,
                    phoneNumber: data.phoneNumber,
                    iban: data.iban,
                    referrerId: data.referrerId,
                    invitedUsersCount: data.invitedUsersCount,
                    hasPurchasedLevelZero: data.hasPurchasedLevelZero || false,
                    investmentsMigrated_v2: data.investmentsMigrated_v2 || false,
                };

                setUser(cleanUser);
            } else {
                console.log("No such user document!");
                // This might happen if registration succeeded but Firestore doc creation failed.
                // Could handle this by logging out or attempting to create the doc again.
            }
        });
        return () => unsubscribe();
    }, [firebaseUser.uid]);
    
     // Fetch chat history
    useEffect(() => {
        if (!user) return;
        const messagesColRef = collection(db, "chats", user.id, "messages");
        const q = query(messagesColRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const messages: ChatMessage[] = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                messages.push({
                    id: doc.id,
                    sender: data.sender,
                    text: data.text,
                    timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
                } as ChatMessage);
            });
            setChatHistory(messages);
        });

        return () => unsubscribe();
    }, [user]);

    // Check for pending reactivation requests
    useEffect(() => {
        if (!user || user.isActive) return;

        const requestsRef = collection(db, "reactivationRequests");
        const q = query(requestsRef, where("userId", "==", user.id), where("status", "==", "Pendente"));
        
        getDocs(q).then(querySnapshot => {
            if (!querySnapshot.empty) {
                setHasPendingRequest(true);
            }
        });
    }, [user]);

    // Effect to migrate active investments to new values
    useEffect(() => {
        if (!user || user.investmentsMigrated_v2) {
            return;
        }

        const runInvestmentMigration = async () => {
            const userDocRef = doc(db, "users", user.id);

            if (!user.activeInvestments || user.activeInvestments.length === 0) {
                // No investments to migrate, just set the flag.
                await updateDoc(userDocRef, { investmentsMigrated_v2: true });
                return;
            }

            let needsUpdate = false;
            const updatedInvestments = user.activeInvestments.map(investment => {
                const newLevelData = INVESTMENT_LEVELS.find(level => level.nivel === investment.nivel);
                
                // Determine if an update is needed for this specific investment
                const valuesChanged = newLevelData && (
                    investment.compra !== newLevelData.compra || 
                    investment.ganho !== newLevelData.ganho || 
                    investment.dias !== newLevelData.dias
                );
                const dateMissing = !investment.lastCheckedDate;

                if (valuesChanged || dateMissing) {
                    needsUpdate = true; // Mark that a batch update is needed
                    
                    const updatedInv = { ...investment };

                    if (dateMissing) {
                        // For old investments that don't have this field, initialize it
                        updatedInv.lastCheckedDate = updatedInv.purchaseDate;
                    }
                    if (valuesChanged) {
                        // Update to the latest values from constants.ts
                        updatedInv.compra = newLevelData.compra;
                        updatedInv.ganho = newLevelData.ganho;
                        updatedInv.dias = newLevelData.dias;
                    }
                    return updatedInv;
                }

                // If no changes, return the original object
                return investment;
            });

            if (needsUpdate) {
                try {
                    await updateDoc(userDocRef, {
                        activeInvestments: updatedInvestments,
                        investmentsMigrated_v2: true
                    });
                    showNotification("Os seus planos de investimento foram atualizados para a nova versão!");
                } catch (error) {
                    console.error("Erro ao migrar investimentos:", error);
                    showNotification("Ocorreu um erro ao atualizar os seus investimentos.");
                }
            } else {
                // If no updates were needed, just set the flag to avoid re-checking.
                await updateDoc(userDocRef, { investmentsMigrated_v2: true });
            }
        };

        runInvestmentMigration();

    }, [user, showNotification]);


    // Effect to calculate and add earnings from investments
    useEffect(() => {
        if (!user || !user.activeInvestments) return;

        const earningsInterval = setInterval(async () => {
            const now = Date.now();
            let totalEarnings = 0;
            const newActiveInvestments: ActiveInvestment[] = [];
            let stateChanged = false;

            for (const inv of user.activeInvestments) {
                const isExpired = (now - inv.purchaseDate) / (1000 * 60 * 60 * 24) >= inv.dias;

                if (inv.nivel === 0) {
                    if (isExpired) {
                        totalEarnings += inv.ganho * inv.dias;
                        stateChanged = true;
                    } else {
                        newActiveInvestments.push(inv);
                    }
                    continue;
                }

                if (isExpired) {
                    stateChanged = true;
                    const hoursSinceLastCheck = (now - inv.lastCheckedDate) / (1000 * 60 * 60);
                    const cyclesToCredit = Math.floor(hoursSinceLastCheck / 24);

                    if (cyclesToCredit > 0) {
                        const daysAlreadyAccountedFor = (inv.lastCheckedDate - inv.purchaseDate) / (1000 * 60 * 60 * 24);
                        const remainingDays = inv.dias - daysAlreadyAccountedFor;
                        const actualCyclesToCredit = Math.min(cyclesToCredit, Math.floor(remainingDays));
                        
                        if (actualCyclesToCredit > 0) {
                            totalEarnings += actualCyclesToCredit * inv.ganho;
                        }
                    }
                } else {
                    const hoursSinceLastCheck = (now - inv.lastCheckedDate) / (1000 * 60 * 60);
                    if (hoursSinceLastCheck >= 24) {
                        const cyclesToCredit = Math.floor(hoursSinceLastCheck / 24);
                        totalEarnings += cyclesToCredit * inv.ganho;
                        stateChanged = true;
                        newActiveInvestments.push({
                            ...inv,
                            lastCheckedDate: inv.lastCheckedDate + cyclesToCredit * 24 * 60 * 60 * 1000,
                        });
                    } else {
                        newActiveInvestments.push(inv);
                    }
                }
            }

            if (stateChanged) {
                const userDocRef = doc(db, "users", user.id);
                const updateData: { [key: string]: any } = {
                    balance: increment(totalEarnings),
                    activeInvestments: newActiveInvestments
                };
                await updateDoc(userDocRef, updateData);
                if (totalEarnings > 0) {
                     showNotification(`Você recebeu ${totalEarnings.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} dos seus investimentos!`);
                }
            }
        }, 1000 * 60); // Verifica a cada minuto

        return () => clearInterval(earningsInterval);
    }, [user, showNotification]);
    
    // Effect to show unread notifications from user object on login
    useEffect(() => {
        if (user?.notifications) {
            const unread = user.notifications.filter(n => !n.read);
            if (unread.length > 0) {
                unread.forEach((n, index) => {
                    setTimeout(() => showNotification(n.message), 500 * (index + 1));
                });
                // Mark all as read in Firestore
                const userDocRef = doc(db, "users", user.id);
                updateDoc(userDocRef, {
                    notifications: user.notifications.map(n => ({...n, read: true}))
                });
            }
        }
    }, [user?.id, user?.notifications, showNotification]);

    const handleSetPage = (page: Page) => {
        if (page !== 'REAL_GAME') {
            setGameConfig(null);
            setGameResult(null);
        }
        if(page === 'LOGOUT') {
            logout();
            return;
        }
        setCurrentPage(page);
    };

    const handleAutoApproveDeposit = async (amount: number, receiptHash: string) => {
        if (!user) return;
        
        // 1. Update user balance and hasDeposited status
        const userDocRef = doc(db, "users", user.id);
        await updateDoc(userDocRef, {
            balance: increment(amount),
            hasDeposited: true,
        });

        // 2. Create a record of the approved deposit for tracking
        await addDoc(collection(db, "deposits"), {
            userId: user.id,
            userName: user.name,
            amount,
            senderPhone: "Auto-Aprovado",
            date: serverTimestamp(),
            status: 'Aprovado',
            receiptHash: receiptHash,
        });
    };

    const handleManualDepositRequest = async (amount: number, senderPhone: string, receiptHash: string) => {
        if (!user) return;
        
        // Create pending deposit request with image hash for manual verification
        await addDoc(collection(db, "deposits"), {
            userId: user.id,
            userName: user.name,
            amount,
            senderPhone,
            date: serverTimestamp(),
            status: 'Pendente',
            receiptHash: receiptHash,
        });
    };


    const handleAddWithdrawal = async (amount: number, name: string, details: string) => {
        if (!user) return;

        const newWithdrawalRequest = {
            userId: user.id,
            userName: name,
            amount,
            details,
            date: serverTimestamp(),
            status: 'Pendente'
        };

        const newWithdrawalRef = await addDoc(collection(db, "withdrawals"), newWithdrawalRequest);

        const userDocRef = doc(db, "users", user.id);
        await updateDoc(userDocRef, {
            balance: user.balance - amount,
            withdrawalHistory: arrayUnion({
                id: newWithdrawalRef.id,
                ...newWithdrawalRequest,
                date: new Date() // for local state consistency before Firestore sync
            })
        });
    };

    const handleBuyLevel = async (level: InvestmentLevel) => {
        if (user && user.balance >= level.compra) {
            const newInvestment: ActiveInvestment = {
                ...level,
                purchaseDate: Date.now(),
                lastCheckedDate: Date.now(),
            };
            const userDocRef = doc(db, "users", user.id);
            const updateData: { [key: string]: any } = {
                 balance: user.balance - level.compra,
                 activeInvestments: arrayUnion(newInvestment)
            };

            // Se o nível 0 for comprado, marca que o usuário já o comprou uma vez.
            if (level.nivel === 0) {
                updateData.hasPurchasedLevelZero = true;
            }

            await updateDoc(userDocRef, updateData);
            showNotification(`Nível ${level.nivel} comprado com sucesso!`);
        } else {
            showNotification("Saldo insuficiente para comprar este nível.");
        }
    };
    
    const handleStartGame = (bet: number) => {
        if (!user) return;
        setBalanceBeforeGame(user.balance);
        // A dedução do saldo foi removida daqui para ser tratada pergunta a pergunta.
        setGameConfig({ bet });
    };

    const handleEndGame = (score: number, totalQuestions: number) => {
        if (balanceBeforeGame === null || !user) return;
    
        // Mostra imediatamente o ecrã de resultados com um estado de carregamento para os ganhos
        setGameResult({ score, totalQuestions, winnings: null });
        setGameConfig(null);
    
        // Executa as operações de base de dados em segundo plano
        const processGameEnd = async () => {
            const userDocRef = doc(db, "users", user.id);
            try {
                // Obtém o saldo mais recente do banco de dados após as atualizações do jogo
                const updatedUserDoc = await getDoc(userDocRef);
                const currentBalance = updatedUserDoc.exists() ? updatedUserDoc.data().balance : user.balance;
                const finalWinnings = currentBalance - balanceBeforeGame;
    
                // Atualiza o número de jogos jogados
                await updateDoc(userDocRef, {
                    gamesPlayed: increment(1)
                });
    
                // Atualiza a UI novamente com os ganhos finais
                setGameResult({ score, totalQuestions, winnings: finalWinnings });
            } catch (error) {
                console.error("Erro ao finalizar o jogo:", error);
                // Em caso de erro, exibe 0 ganhos e notifica o utilizador
                setGameResult({ score, totalQuestions, winnings: 0 });
                showNotification("Erro ao calcular os ganhos.");
            } finally {
                setBalanceBeforeGame(null);
            }
        };
    
        processGameEnd();
    };

    const handleRestartGame = () => {
        setGameResult(null);
        handleSetPage('HOME');
    };

     const sendChatMessage = async (text: string) => {
        if (!user) return;
        const messagesColRef = collection(db, "chats", user.id, "messages");
        await addDoc(messagesColRef, {
            sender: 'user',
            text,
            timestamp: serverTimestamp()
        });
    };
    
    const handleUpdateUser = async (updatedData: Partial<User>) => {
        if (!user) return;
        const userDocRef = doc(db, "users", user.id);
        await updateDoc(userDocRef, updatedData);
        if (updatedData.name && auth.currentUser) {
            await updateProfile(auth.currentUser, { displayName: updatedData.name });
        }
        showNotification("Perfil atualizado com sucesso!");
    };
    
    const handleAddBalance = async (amount: number) => {
        if (!user) return;
        const userDocRef = doc(db, "users", user.id);
        await updateDoc(userDocRef, { balance: increment(amount) });
    };

    const handleReactivationRequest = async () => {
        if (!user) return;
        setIsRequestingReactivation(true);
        try {
            await addDoc(collection(db, "reactivationRequests"), {
                userId: user.id,
                userName: user.name || user.email || 'Utilizador Desconhecido',
                userEmail: user.email,
                date: serverTimestamp(),
                status: 'Pendente'
            });
            showNotification("Pedido de reativação enviado, aguarde!");
            setHasPendingRequest(true);
        } catch (error) {
            showNotification("Erro ao enviar o pedido.");
            console.error("Reactivation request error:", error);
        } finally {
            setIsRequestingReactivation(false);
        }
    };


    const renderPage = () => {
        if (!user) return <div className="bg-brand-black min-h-screen flex items-center justify-center"><Spinner className="w-10 h-10 text-brand-yellow" /></div>;
        
        switch (currentPage) {
            case 'HOME':
                return <Dashboard user={user} setCurrentPage={handleSetPage} handleAddWithdrawal={handleAddWithdrawal} handleManualDepositRequest={handleManualDepositRequest} handleAutoApproveDeposit={handleAutoApproveDeposit} showNotification={showNotification} />;
            case 'INVEST':
                return <Invest user={user} handleBuyLevel={handleBuyLevel} />;
            case 'TASKS':
                return <Tasks user={user} showNotification={showNotification} />;
            case 'SPIN_GAME':
                return <SpinGame user={user} showNotification={showNotification} onUpdateBalance={handleAddBalance} />;
            case 'REAL_GAME':
                if (!user.hasDeposited) {
                    return <DepositRequiredScreen setCurrentPage={handleSetPage} />;
                }
                if (gameResult) {
                    return <GameOver score={gameResult.score} totalQuestions={gameResult.totalQuestions} winnings={gameResult.winnings} onRestart={handleRestartGame} />;
                }
                if (gameConfig) {
                    return <RealGame betAmount={gameConfig.bet} balance={user.balance} addBalance={handleAddBalance} onEndGame={handleEndGame} showNotification={showNotification} />;
                }
                return <BettingScreen balance={user.balance} onStartGame={handleStartGame} />;
            case 'DEMO_GAME':
                return <DemoGame setCurrentPage={handleSetPage} showNotification={showNotification} />;
            case 'ACCOUNT':
                return <Account user={user} onUpdateUser={handleUpdateUser} showNotification={showNotification} />;
            default:
                return <Dashboard user={user} setCurrentPage={handleSetPage} handleAddWithdrawal={handleAddWithdrawal} handleManualDepositRequest={handleManualDepositRequest} handleAutoApproveDeposit={handleAutoApproveDeposit} showNotification={showNotification}/>;
        }
    };

    if (!user) {
         return (
            <div className="bg-brand-black min-h-screen flex items-center justify-center">
                <Spinner className="w-10 h-10 text-brand-yellow" />
            </div>
        );
    }
    
    if (!user.isActive) {
        return (
             <div className="bg-brand-black min-h-screen flex flex-col items-center justify-center text-white text-center p-4">
                <h2 className="text-2xl font-bold text-brand-red mb-4">Conta Desativada</h2>
                <p className="text-gray-300 mb-6 max-w-sm">
                     {hasPendingRequest 
                        ? "O seu pedido de reativação foi enviado e está a ser analisado. Por favor, aguarde."
                        : "A sua conta foi temporariamente desativada. Pode solicitar a reativação ou contactar o suporte."
                    }
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                    <button onClick={logout} className="bg-brand-light-gray text-white font-bold py-2 px-6 rounded-lg">Sair</button>
                     {!hasPendingRequest && (
                        <button 
                            onClick={handleReactivationRequest}
                            disabled={isRequestingReactivation}
                            className="bg-brand-yellow text-brand-black font-bold py-2 px-6 rounded-lg flex items-center justify-center disabled:opacity-70"
                        >
                            {isRequestingReactivation ? <Spinner className="w-5 h-5" /> : 'Pedir Reativação'}
                        </button>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen">
            <Header />
             <div className="fixed top-20 right-4 z-50 space-y-2 w-full max-w-sm">
                {toasts.map(toast => (
                    <NotificationToast key={toast.id} {...toast} onDismiss={dismissNotification} />
                ))}
            </div>
            <main className="flex-grow overflow-y-auto bg-brand-black">
                {renderPage()}
            </main>
            <NotificationHandler user={user} showNotification={showNotification} />
            {currentPage === 'HOME' && <FloatingSpinButton onClick={() => setCurrentPage('SPIN_GAME')} />}
            {currentPage === 'HOME' && <FloatingChatButton onClick={() => setIsChatOpen(true)} />}
            {isChatOpen && <ChatModal messages={chatHistory} onSendMessage={sendChatMessage} onClose={() => setIsChatOpen(false)} />}
            <BottomNav activePage={currentPage} setPage={handleSetPage} />
        </div>
    );
};

export default Layout;