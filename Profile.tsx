import React, { useState } from 'react';
import { Spinner } from './Icons.tsx';

const Profile: React.FC = () => {
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [iban, setIban] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [referralLink, setReferralLink] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Here you would typically save the data to a backend
        setTimeout(() => {
            setIsLoading(false);
            alert('Perfil atualizado com sucesso! (simulado)');
            setIsEditing(false);
        }, 1500);
    };

    const generateLink = () => {
        setReferralLink("https://complete-angola.ao/invite?ref=XYZ123");
    };

    const copyLink = () => {
        if (referralLink) {
            navigator.clipboard.writeText(referralLink);
            alert("Link copiado!");
        }
    };

    return (
        <div className="p-4 text-white animate-fade-in max-w-lg mx-auto">
            <h2 className="text-2xl font-black text-center mb-6 text-brand-yellow">Meu Perfil</h2>
            
            <div className="bg-brand-gray p-6 rounded-xl border border-brand-light-gray mb-6">
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                            <input 
                                type="text" 
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                readOnly={!isEditing}
                                placeholder="Seu nome completo"
                                className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow read-only:bg-brand-light-gray read-only:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Número Oficial</label>
                             <input 
                                type="tel" 
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                readOnly={!isEditing}
                                placeholder="Ex: 9XX XXX XXX"
                                className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow read-only:bg-brand-light-gray read-only:cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Número / IBAN para Saque</label>
                             <input 
                                type="text" 
                                value={iban}
                                onChange={(e) => setIban(e.target.value)}
                                readOnly={!isEditing}
                                placeholder="Seu número de conta ou IBAN"
                                className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow read-only:bg-brand-light-gray read-only:cursor-not-allowed"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        {isEditing ? (
                            <div className="flex space-x-4">
                                <button type="submit" disabled={isLoading} className="flex-1 bg-brand-yellow text-brand-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors flex items-center justify-center disabled:bg-yellow-400">
                                    {isLoading ? <Spinner className="w-5 h-5" /> : 'Salvar Alterações'}
                                </button>
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-brand-light-gray text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors">
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                             <button type="button" onClick={() => setIsEditing(true)} className="w-full bg-brand-yellow text-brand-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors">
                                Editar Perfil
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-brand-gray p-6 rounded-xl border border-brand-light-gray">
                <h3 className="font-bold text-white mb-3">Link de Convite</h3>
                 <p className="text-sm text-gray-300 mb-4">
                    Gere o seu link de convite. O bônus será creditado no seu saldo real após completar o ciclo de membros e as tarefas.
                </p>
                {referralLink ? (
                    <div className="bg-brand-black p-3 rounded-lg flex justify-between items-center">
                        <span className="text-brand-yellow truncate">{referralLink}</span>
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
        </div>
    );
};

export default Profile;