import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, Spinner } from './Icons.tsx';
import { ActiveInvestment, Withdrawal, User } from '../types.ts';

interface AccountProps {
    user: User;
    onUpdateUser: (updatedData: Partial<User>) => void;
    showNotification: (message: string) => void;
}

interface AccordionItemProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    setIsOpen: () => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, isOpen, setIsOpen }) => (
    <div className="bg-brand-gray border border-brand-light-gray rounded-lg overflow-hidden">
        <button onClick={setIsOpen} className="w-full flex justify-between items-center p-4 text-left">
            <h3 className="font-bold text-white">{title}</h3>
            {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
        </button>
        {isOpen && (
            <div className="p-4 border-t border-brand-light-gray animate-fade-in">
                {children}
            </div>
        )}
    </div>
);

const ProfileForm: React.FC<{user: User, onUpdateUser: (data: Partial<User>) => void}> = ({ user, onUpdateUser }) => {
     const [isLoading, setIsLoading] = useState(false);
     const [name, setName] = useState(user.name);
     const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
     const [iban, setIban] = useState(user.iban || '');

     const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        onUpdateUser({ name, phoneNumber, iban });
        // The parent component will handle showing notification on success
        setTimeout(() => setIsLoading(false), 1000); // Simulate network delay
     }
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo" className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nº de Telefone</label>
                <input type="tel" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Seu número" className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">IBAN para Saque</label>
                <input type="text" value={iban} onChange={e => setIban(e.target.value)} placeholder="Seu IBAN" className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow" />
            </div>
            <button type="submit" disabled={isLoading} className="w-full bg-brand-yellow text-brand-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors flex items-center justify-center disabled:opacity-70">
                {isLoading ? <Spinner className="w-5 h-5" /> : 'Guardar Alterações'}
            </button>
        </form>
    )
}

const WithdrawalHistory: React.FC<{ history: Withdrawal[] }> = ({ history }) => (
    <div className="space-y-3">
        {history.length === 0 ? (
            <p className="text-gray-300">Nenhum levantamento foi realizado.</p>
        ) : (
            <ul className="space-y-2">
                {[...history].sort((a, b) => b.date.getTime() - a.date.getTime()).map((item, index) => (
                    <li key={item.id || index} className="bg-brand-black p-3 rounded-lg text-sm">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-white">{item.amount.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                item.status === 'Pendente' ? 'text-yellow-400 bg-yellow-900/50' : 
                                item.status === 'Aprovado' ? 'text-green-400 bg-green-900/50' : 
                                'text-red-400 bg-red-900/50'
                            }`}>{item.status}</span>
                        </div>
                        <p className="text-gray-400 text-xs mt-1">{item.date.toLocaleString('pt-AO', { dateStyle: 'short', timeStyle: 'short' })}</p>
                    </li>
                ))}
            </ul>
        )}
    </div>
)

const ReferralLink: React.FC<{user: User, showNotification: (msg: string) => void}> = ({ user, showNotification }) => {
    const [link, setLink] = useState<string | null>(null);

    const generateLink = () => {
        const referralLink = `${window.location.origin}/?invite=complete-angola-${user.id}`;
        setLink(referralLink);
    };

    const copyLink = () => {
        if (link) {
            navigator.clipboard.writeText(link);
            showNotification("Link copiado ✅");
        }
    };

    return (
        <div>
            <p className="text-sm text-gray-300 mb-4">
                Gere o seu link de convite pessoal. O bônus será creditado no seu saldo real após completar o ciclo de membros e as tarefas.
            </p>
            {link ? (
                <div className="bg-brand-black p-3 rounded-lg flex justify-between items-center">
                    <span className="text-brand-yellow truncate">{link}</span>
                    <button onClick={copyLink} className="text-white font-bold py-1 px-3 bg-brand-light-gray rounded-lg hover:bg-gray-600">
                        Copiar
                    </button>
                </div>
            ) : (
                <button onClick={generateLink} className="w-full bg-brand-yellow text-brand-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-300">
                    Gerar Link
                </button>
            )}
        </div>
    );
}

const InvestmentDetails: React.FC<{ investments: ActiveInvestment[] }> = ({ investments }) => {
    if (investments.length === 0) {
        return <p className="text-gray-300">Você ainda não possui nenhum investimento ativo.</p>;
    }

    return (
        <div className="space-y-3">
            {investments.map(inv => {
                const expiryDate = new Date(inv.purchaseDate + inv.dias * 24 * 60 * 60 * 1000);
                return (
                    <div key={inv.nivel} className="bg-brand-black p-3 rounded-lg text-sm">
                        <div className="flex justify-between items-center">
                             <span className="font-bold text-white">Nível {inv.nivel}</span>
                             <span className="text-xs text-green-400 bg-green-900/50 px-2 py-1 rounded-full">Ativo</span>
                        </div>
                         <div className="text-gray-400 text-xs mt-2 space-y-1">
                            <p>Ganho Diário: <span className="font-semibold text-gray-200">{inv.ganho.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</span></p>
                            <p>Expira em: <span className="font-semibold text-gray-200">{expiryDate.toLocaleDateString('pt-AO')}</span></p>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};


const Account: React.FC<AccountProps> = ({ user, onUpdateUser, showNotification }) => {
    const [openAccordion, setOpenAccordion] = useState<string | null>('investment');
    const { balance, withdrawalHistory, activeInvestments } = user;

    const toggleAccordion = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id);
    };

    return (
        <div className="p-3 text-white animate-fade-in space-y-3 pb-24">
            <div className="text-center">
                <p className="text-gray-400">Saldo Atual</p>
                <p className="text-2xl font-bold text-brand-yellow">{balance.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
            </div>
            <h2 className="text-xl font-bold text-white text-center">Minha Conta</h2>

            <AccordionItem title="Detalhes do Investimento" isOpen={openAccordion === 'investment'} setIsOpen={() => toggleAccordion('investment')}>
                <InvestmentDetails investments={activeInvestments} />
            </AccordionItem>
             <AccordionItem title="Dados do Perfil e Saque" isOpen={openAccordion === 'profile'} setIsOpen={() => toggleAccordion('profile')}>
                <ProfileForm user={user} onUpdateUser={onUpdateUser} />
            </AccordionItem>
            <AccordionItem title="Link de Convite" isOpen={openAccordion === 'referral'} setIsOpen={() => toggleAccordion('referral')}>
                <ReferralLink user={user} showNotification={showNotification} />
            </AccordionItem>
            <AccordionItem title="Bônus de Convite" isOpen={openAccordion === 'bonus'} setIsOpen={() => toggleAccordion('bonus')}>
                 <div className="space-y-2 text-sm text-gray-300">
                    <p>
                        Ganhe <span className="font-bold text-brand-yellow">15% do valor do primeiro depósito</span> de cada amigo que convidar. O bônus é creditado automaticamente na sua conta assim que o depósito do seu convidado for aprovado.
                    </p>
                    <p>
                        Convide mais amigos e ganhe um bônus de <span className="font-bold text-brand-yellow">5.000 Kz</span> ao completar o ciclo de 40 convidados!
                    </p>
                </div>
            </AccordionItem>
            <AccordionItem title="Histórico de Levantamentos" isOpen={openAccordion === 'history'} setIsOpen={() => toggleAccordion('history')}>
                <WithdrawalHistory history={withdrawalHistory} />
            </AccordionItem>
        </div>
    );
};

export default Account;