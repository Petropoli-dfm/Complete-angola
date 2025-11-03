import React, { useState, useEffect } from 'react';
import { User, Deposit, Withdrawal, ChatMessage, ReactivationRequest } from '../../types.ts';
import UserManagement from './UserManagement.tsx';
import RequestManagement from './RequestManagement.tsx';
import AdminChat from './AdminChat.tsx';
import Stats from './Stats.tsx';
import { HomeIcon, AccountIcon, ChatIcon, LogoutIcon, ChartBarIcon } from '../Icons.tsx';
import { db, collection, onSnapshot, query, where, orderBy, doc, deleteDoc } from '../../services/firebase.ts';

type AdminPage = 'requests' | 'users' | 'chat' | 'stats';

interface AdminLayoutProps {
    logout: () => void;
}

const AdminBottomNav: React.FC<{ activePage: AdminPage; setPage: (page: AdminPage) => void; requestCount: number; }> = ({ activePage, setPage, requestCount }) => {
    const navItems = [
        { id: 'requests', label: 'Pedidos', icon: HomeIcon, count: requestCount },
        { id: 'users', label: 'Usuários', icon: AccountIcon, count: 0 },
        { id: 'stats', label: 'Estatísticas', icon: ChartBarIcon, count: 0 },
        { id: 'chat', label: 'Chat', icon: ChatIcon, count: 0 },
    ] as const;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-brand-gray border-t border-brand-light-gray p-2 z-20">
            <div className="flex justify-around items-start">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setPage(item.id)} className="relative flex flex-1 flex-col items-center justify-center text-center py-1">
                        <item.icon active={activePage === item.id} />
                        <span className={`text-xs mt-1 ${activePage === item.id ? 'text-brand-yellow' : 'text-gray-400'}`}>{item.label}</span>
                         {item.count > 0 && (
                            <span className="absolute top-0 right-4 text-xs font-bold bg-brand-red text-white rounded-full px-1.5 py-0.5">
                                {item.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </nav>
    );
};


const AdminLayout: React.FC<AdminLayoutProps> = ({ logout }) => {
    const [currentPage, setCurrentPage] = useState<AdminPage>('requests');
    
    const [users, setUsers] = useState<User[]>([]);
    const [deposits, setDeposits] = useState<Deposit[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [reactivationRequests, setReactivationRequests] = useState<ReactivationRequest[]>([]);
    const [chatMessages, setChatMessages] = useState<Record<string, ChatMessage[]>>({});

    useEffect(() => {
        // Listen to all users
        const usersQuery = query(collection(db, "users"), orderBy("name", "asc"));
        const unsubscribeUsers = onSnapshot(usersQuery, snapshot => {
            const usersData = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
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
                } as User;
            });
            setUsers(usersData);
        });

        // Listen to all deposits
        const depositsQuery = query(collection(db, "deposits"), orderBy("date", "desc"));
        const unsubscribeDeposits = onSnapshot(depositsQuery, snapshot => {
            const depositsData = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        userId: data.userId,
                        userName: data.userName,
                        amount: data.amount,
                        senderPhone: data.senderPhone,
                        status: data.status,
                        receiptHash: data.receiptHash,
                        date: data.date?.toDate ? data.date.toDate() : new Date(),
                    } as Deposit;
                });
            setDeposits(depositsData);
        });

        // Listen to all withdrawals
        const withdrawalsQuery = query(collection(db, "withdrawals"), orderBy("date", "desc"));
        const unsubscribeWithdrawals = onSnapshot(withdrawalsQuery, snapshot => {
            const withdrawalsData = snapshot.docs
                .map(doc => {
                     const data = doc.data();
                    return {
                        id: doc.id,
                        userId: data.userId,
                        userName: data.userName,
                        amount: data.amount,
                        details: data.details,
                        status: data.status,
                        date: data.date?.toDate ? data.date.toDate() : new Date(),
                    } as Withdrawal;
                });
            setWithdrawals(withdrawalsData);
        });

        // Listen to all pending reactivation requests
        const reactivationQuery = query(collection(db, "reactivationRequests"), orderBy("date", "desc"));
        const unsubscribeReactivation = onSnapshot(reactivationQuery, snapshot => {
            const requestsData = snapshot.docs
                .map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        userId: data.userId,
                        userName: data.userName,
                        userEmail: data.userEmail,
                        status: data.status,
                        date: data.date?.toDate ? data.date.toDate() : new Date(),
                    } as ReactivationRequest;
                })
                .filter(r => r.status === "Pendente");
            setReactivationRequests(requestsData);
        });
        
         // Listen to all chat messages
        const chatsQuery = query(collection(db, "chats"));
        const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const userId = change.doc.id;
                const messagesColRef = collection(db, "chats", userId, "messages");
                const q = query(messagesColRef, orderBy("timestamp", "asc"));
                onSnapshot(q, (messagesSnapshot) => {
                    const messages = messagesSnapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            sender: data.sender,
                            text: data.text,
                            timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(),
                        } as ChatMessage;
                    });
                    setChatMessages(prev => ({...prev, [userId]: messages}));
                });
            });
        });


        return () => {
            unsubscribeUsers();
            unsubscribeDeposits();
            unsubscribeWithdrawals();
            unsubscribeReactivation();
            unsubscribeChats();
        };
    }, []);

    const pendingRequestsCount = deposits.filter(d => d.status === "Pendente").length + withdrawals.filter(w => w.status === "Pendente").length + reactivationRequests.length;

    const handleDeleteDeposit = async (depositId: string) => {
        try {
            const depositRef = doc(db, "deposits", depositId);
            await deleteDoc(depositRef);
            // A notificação de sucesso pode ser adicionada aqui se necessário.
        } catch (error) {
            console.error("Erro ao excluir o depósito:", error);
            alert("Ocorreu um erro ao excluir o depósito.");
        }
    };
    
    const handleDeleteWithdrawal = async (withdrawalId: string) => {
        try {
            const withdrawalRef = doc(db, "withdrawals", withdrawalId);
            await deleteDoc(withdrawalRef);
        } catch (error) {
            console.error("Erro ao excluir o saque:", error);
            alert("Ocorreu um erro ao excluir o saque.");
        }
    };

    const renderPage = () => {
        const pendingDeposits = deposits.filter(d => d.status === 'Pendente');
        const pendingWithdrawals = withdrawals.filter(w => w.status === 'Pendente');
        const approvedDeposits = deposits.filter(d => d.status === 'Aprovado');
        const approvedWithdrawals = withdrawals.filter(w => w.status === 'Aprovado');

        switch(currentPage) {
            case 'users':
                return <UserManagement users={users} />;
            case 'requests':
                return <RequestManagement deposits={pendingDeposits} withdrawals={pendingWithdrawals} reactivationRequests={reactivationRequests} />;
            case 'chat':
                return <AdminChat users={users} chatMessages={chatMessages} />;
            case 'stats':
                return <Stats
                    deposits={approvedDeposits}
                    withdrawals={approvedWithdrawals}
                    onDeleteDeposit={handleDeleteDeposit}
                    onDeleteWithdrawal={handleDeleteWithdrawal}
                />;
            default:
                return <RequestManagement deposits={pendingDeposits} withdrawals={pendingWithdrawals} reactivationRequests={reactivationRequests} />;
        }
    };

    return (
        <div className="bg-brand-black min-h-screen text-white flex flex-col">
            <header className="bg-brand-gray p-4 flex justify-between items-center border-b border-brand-light-gray sticky top-0 z-10">
                <h2 className="text-base font-bold">
                     {currentPage === 'requests' && 'Pedidos Pendentes'}
                     {currentPage === 'users' && 'Gestão de Usuários'}
                     {currentPage === 'chat' && 'Suporte via Chat'}
                     {currentPage === 'stats' && 'Estatísticas de Depósitos e Saques'}
                </h2>
                 <button onClick={logout} className='flex items-center text-gray-300 hover:text-brand-red transition-colors'>
                    <LogoutIcon />
                    <span className="ml-2 text-sm font-semibold">Sair</span>
                </button>
            </header>
            <main className="p-2 flex-grow overflow-y-auto pb-24">
                {renderPage()}
            </main>
            <AdminBottomNav activePage={currentPage} setPage={setCurrentPage} requestCount={pendingRequestsCount} />
        </div>
    );
};

export default AdminLayout;