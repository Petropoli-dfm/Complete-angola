import React, { useState, useEffect } from 'react';
import { User } from '../types.ts';

const TaskItem: React.FC<{ title: string; description: string }> = ({ title, description }) => (
    <div className="bg-brand-gray p-4 rounded-lg border border-brand-light-gray">
        <h3 className="font-bold text-brand-yellow">{title}</h3>
        <p className="text-sm text-gray-300">{description}</p>
    </div>
);

interface TasksProps {
    user: User;
    showNotification: (message: string) => void;
}

const Tasks: React.FC<TasksProps> = ({ user, showNotification }) => {
    const invitedCount = user.invitedUsersCount || 0;
    const [referralLink, setReferralLink] = useState('');
    const goal = 40;
    const progress = (invitedCount / goal) * 100;

    useEffect(() => {
        // Reverted to use the current page's origin to generate the link dynamically.
        setReferralLink(`${window.location.origin}/?invite=complete-angola-${user.id}`);
    }, [user.id]);


    const copyLink = () => {
        if (referralLink) {
            navigator.clipboard.writeText(referralLink);
            showNotification("Link copiado ✅");
        }
    };

    return (
        <div className="p-3 text-white animate-fade-in">
            <h2 className="text-2xl font-black text-center mb-2 text-brand-yellow">Tarefas Diárias</h2>
            <p className="text-center text-gray-400 mb-6">Complete as tarefas para ganhar bônus. O saldo ganho será creditado no seu saldo real.</p>
            
            {/* Simplified Invite Section */}
            <div className="bg-brand-gray p-6 rounded-xl border border-brand-yellow mb-8">
                 <div className="text-center mb-2">
                    <span className="text-white font-bold">{invitedCount}</span>
                    <span className="text-gray-400"> / {goal} Convidados</span>
                </div>
                <div className="w-full bg-brand-black rounded-full h-4 border border-brand-light-gray">
                    <div 
                        className="bg-brand-yellow h-full rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                
                <button onClick={copyLink} className="w-full mt-4 bg-brand-yellow text-brand-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors">
                    Copiar Link de Convite
                </button>
            </div>

            <div className="space-y-4">
                <TaskItem 
                    title="Partilhar o Link"
                    description="Partilhe o seu link de convite com 10 contactos no WhatsApp."
                />
                <TaskItem 
                    title="Publicar em Grupos"
                    description="Poste sobre a Complete Angola em 3 grupos do WhatsApp."
                />
                <TaskItem 
                    title="Acessos Diários"
                    description="Acesse a plataforma 5 vezes ao dia para verificar seus ganhos."
                />
                 <TaskItem 
                    title="Convidar para o Grupo"
                    description="Adicione novos membros ao grupo oficial da plataforma no WhatsApp."
                />
            </div>
        </div>
    );
};

export default Tasks;