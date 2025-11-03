import React, { useState, useMemo } from 'react';
import { User, ActiveInvestment } from '../../types.ts';
import { Spinner } from '../Icons.tsx';
import { db, doc, updateDoc, deleteDoc } from '../../services/firebase.ts';

interface UserManagementProps {
    users: User[];
}

const UserCard: React.FC<{ 
    user: User; 
    onEdit: () => void; 
    onToggleActive: () => void;
    onDelete: () => void;
    onDeleteInvestment: (investmentPurchaseDate: number) => void;
    isInvestorView?: boolean;
}> = ({ user, onEdit, onToggleActive, onDelete, onDeleteInvestment, isInvestorView }) => {
    const dailyEarnings = useMemo(() => {
        if (!isInvestorView || !user.activeInvestments || user.activeInvestments.length === 0) {
            return 0;
        }
        return user.activeInvestments.reduce((total, investment) => total + investment.ganho, 0);
    }, [user.activeInvestments, isInvestorView]);

    return (
        <div className="bg-brand-gray border border-brand-light-gray rounded-lg p-3">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-bold text-white">{user.name}</h3>
                    <p className="text-sm text-gray-400">{user.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                </span>
            </div>
            <div className={`mb-4 ${isInvestorView ? 'grid grid-cols-2 gap-4' : ''}`}>
                 <div>
                    <p className="text-xs text-gray-400 uppercase">Saldo</p>
                    <p className="font-bold text-lg text-brand-yellow">{user.balance.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                 </div>
                 {isInvestorView && (
                    <div>
                        <p className="text-xs text-gray-400 uppercase">Rendimento Diário</p>
                        <p className="font-bold text-lg text-green-400">+{dailyEarnings.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                    </div>
                 )}
            </div>

            {isInvestorView && user.activeInvestments?.length > 0 && (
                <div className="mt-2 mb-4 border-t border-brand-light-gray pt-3">
                    <h4 className="text-xs text-gray-400 uppercase mb-2">Investimentos Ativos</h4>
                    <ul className="space-y-2">
                        {user.activeInvestments.map(inv => (
                            <li key={inv.purchaseDate} className="bg-brand-black p-2 rounded-md flex justify-between items-center text-sm">
                                <div>
                                    <span className="font-semibold text-white">Nível {inv.nivel}</span>
                                    <span className="text-gray-400 text-xs block">Ganho diário: {inv.ganho.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                                </div>
                                <button onClick={() => onDeleteInvestment(inv.purchaseDate)} className="text-red-500 hover:text-red-400 text-xs font-bold px-2 py-1 rounded hover:bg-red-500/10">Excluir</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm">
                 <button onClick={onEdit} className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition-colors">Editar Saldo</button>
                 {user.isActive ? (
                    <button onClick={onToggleActive} className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 rounded-md transition-colors">
                        Desativar
                    </button>
                 ) : (
                    <button onClick={onToggleActive} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition-colors">
                        Ativar
                    </button>
                 )}
                 <button onClick={onDelete} className="bg-brand-red-dark hover:bg-red-800 text-white font-semibold py-2 rounded-md transition-colors">Excluir</button>
            </div>
        </div>
    );
};


const UserManagement: React.FC<UserManagementProps> = ({ users }) => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newBalance, setNewBalance] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'investors' | 'activeBalance'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const handleEditBalance = (user: User) => {
        setSelectedUser(user);
        setNewBalance(user.balance.toString());
    };

    const handleSaveBalance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setIsSaving(true);
        const userDocRef = doc(db, 'users', selectedUser.id);
        await updateDoc(userDocRef, { balance: parseFloat(newBalance) || 0 });
        setIsSaving(false);
        setSelectedUser(null);
        setNewBalance('');
    };
    
    const handleToggleActive = async (user: User) => {
        const confirmationText = user.isActive 
            ? 'Tem certeza que deseja desativar este usuário?' 
            : 'Tem certeza que deseja reativar este usuário?';
            
        if (window.confirm(confirmationText)) {
            const userDocRef = doc(db, 'users', user.id);
            await updateDoc(userDocRef, { isActive: !user.isActive });
        }
    };
    
    const handleDeleteUser = async (user: User) => {
        const confirmation = window.confirm(`Tem certeza que deseja EXCLUIR PERMANENTEMENTE o usuário ${user.name} (${user.email}) e todos os seus dados? Esta ação não pode ser desfeita.`);
        if (confirmation) {
            try {
                const userDocRef = doc(db, 'users', user.id);
                await deleteDoc(userDocRef);
                alert('Usuário excluído com sucesso.');
            } catch (error) {
                console.error("Error deleting user:", error);
                alert('Ocorreu um erro ao excluir o usuário.');
            }
        }
    };

    const handleDeleteInvestment = async (user: User, investmentPurchaseDate: number) => {
        if (!window.confirm(`Tem certeza que deseja excluir este investimento ativo para ${user.name}?`)) {
            return;
        }
        
        try {
            const updatedInvestments = user.activeInvestments.filter(
                inv => inv.purchaseDate !== investmentPurchaseDate
            );

            const userDocRef = doc(db, 'users', user.id);
            await updateDoc(userDocRef, { activeInvestments: updatedInvestments });
            alert('Investimento excluído com sucesso.');
        } catch (error) {
            console.error("Error deleting investment:", error);
            alert('Erro ao excluir o investimento.');
        }
    };


    const filteredUsers = useMemo(() => {
        let usersToFilter = users;

        if (searchQuery) {
            usersToFilter = usersToFilter.filter(user => 
                user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                user.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filter === 'active') {
            return usersToFilter.filter(user => user.isActive);
        }
        if (filter === 'inactive') {
            return usersToFilter.filter(user => !user.isActive);
        }
        if (filter === 'investors') {
            return usersToFilter.filter(user => user.activeInvestments && user.activeInvestments.length > 0);
        }
        if (filter === 'activeBalance') {
            return usersToFilter.filter(user => user.balance > 0);
        }
        
        return usersToFilter;
    }, [users, filter, searchQuery]);


    const getFilterButtonClass = (buttonFilter: typeof filter) => {
        return filter === buttonFilter
            ? 'bg-brand-yellow text-brand-black'
            : 'bg-brand-light-gray text-gray-300 hover:bg-opacity-80';
    };


    return (
        <div className="animate-fade-in">
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Pesquisar por nome ou email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                />
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${getFilterButtonClass('all')}`}>
                    Todos ({users.length})
                </button>
                <button onClick={() => setFilter('active')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${getFilterButtonClass('active')}`}>
                    Ativos ({users.filter(u => u.isActive).length})
                </button>
                <button onClick={() => setFilter('inactive')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${getFilterButtonClass('inactive')}`}>
                    Inativos ({users.filter(u => !u.isActive).length})
                </button>
                 <button onClick={() => setFilter('investors')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${getFilterButtonClass('investors')}`}>
                    Investidores ({users.filter(u => u.activeInvestments && u.activeInvestments.length > 0).length})
                </button>
                 <button onClick={() => setFilter('activeBalance')} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${getFilterButtonClass('activeBalance')}`}>
                    Saldos Ativos ({users.filter(u => u.balance > 0).length})
                </button>
            </div>

            {filteredUsers.length > 0 ? (
                <div className="space-y-4">
                    {filteredUsers.map(user => (
                       <UserCard 
                           key={user.id}
                           user={user}
                           onEdit={() => handleEditBalance(user)}
                           onToggleActive={() => handleToggleActive(user)}
                           onDelete={() => handleDeleteUser(user)}
                           onDeleteInvestment={(purchaseDate) => handleDeleteInvestment(user, purchaseDate)}
                           isInvestorView={filter === 'investors'}
                       />
                    ))}
                </div>
            ) : (
                <div className="text-center p-8 text-gray-500 bg-brand-gray rounded-lg">
                    <p>Nenhum usuário corresponde à pesquisa ou filtro selecionado.</p>
                </div>
            )}

            {selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-brand-gray rounded-xl p-6 w-full max-w-sm border border-brand-light-gray shadow-lg">
                        <h3 className="text-lg font-bold mb-4">Editar Saldo de {selectedUser.name}</h3>
                        <form onSubmit={handleSaveBalance}>
                             <label className="block text-sm font-medium text-gray-400 mb-2">Novo Saldo</label>
                            <input
                                type="number"
                                value={newBalance}
                                onChange={e => setNewBalance(e.target.value)}
                                className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-yellow mb-4"
                                placeholder="0.00"
                            />
                            <div className="flex space-x-4 mt-2">
                                <button type="button" onClick={() => setSelectedUser(null)} className="flex-1 bg-brand-light-gray py-2.5 rounded-lg hover:bg-opacity-80 transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSaving} className="flex-1 bg-brand-yellow text-brand-black font-bold py-2.5 rounded-lg flex items-center justify-center hover:bg-yellow-300 transition-colors">
                                    {isSaving ? <Spinner /> : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;