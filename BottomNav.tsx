import React from 'react';
import { Page } from '../types.ts';
import { HomeIcon, InvestIcon, TasksIcon, GameIcon, AccountIcon, LogoutIcon, LightBulbIcon } from './Icons.tsx';

interface BottomNavProps {
    activePage: Page;
    setPage: (page: Page | 'LOGOUT') => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, setPage }) => {
    const navItems = [
        { id: 'HOME', label: 'Início', icon: HomeIcon },
        { id: 'INVEST', label: 'Investir', icon: InvestIcon },
        { id: 'TASKS', label: 'Tarefas', icon: TasksIcon },
        { id: 'DEMO_GAME', label: 'Demo', icon: LightBulbIcon },
        { id: 'REAL_GAME', label: 'Jogo Real', icon: GameIcon },
        { id: 'ACCOUNT', label: 'Conta', icon: AccountIcon },
    ] as const;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-brand-bg-card border-t border-brand-bg-light p-2 z-20">
            <div className="flex justify-around items-start">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setPage(item.id)} className="flex flex-1 flex-col items-center justify-center text-center py-1">
                        <item.icon active={activePage === item.id} />
                        <span className={`text-xs mt-1 ${activePage === item.id ? 'text-brand-primary' : 'text-gray-400'}`}>{item.label}</span>
                        {activePage === item.id && <div className="w-4 h-1 bg-brand-primary rounded-full mt-1"></div>}
                    </button>
                ))}
                 <button onClick={() => setPage('LOGOUT')} className="flex flex-1 flex-col items-center justify-center text-center py-1">
                    <LogoutIcon />
                    <span className="text-xs mt-1 text-gray-400">Sair</span>
                </button>
            </div>
        </nav>
    );
};

export default BottomNav;
