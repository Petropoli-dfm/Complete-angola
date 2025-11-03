import React, { useState } from 'react';
import { Spinner, EyeIcon, EyeOffIcon } from './Icons.tsx';

interface AuthProps {
    login: (email: string, pass: string) => Promise<void>;
    register: (name: string, email: string, pass: string) => Promise<void>;
    onSuccess: (message: string) => void;
}

const Auth: React.FC<AuthProps> = ({ login, register, onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const clearFormState = () => {
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null); // Clear previous errors on new submission
        
        if (!isLogin) {
            if (password !== confirmPassword) {
                setError('As palavras-passe não coincidem.');
                return;
            }
            if (password.length < 6) {
                setError('A palavra-passe deve ter pelo menos 6 caracteres.');
                return;
            }
        }
        
        setIsLoading(true);
        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(name, email, password);
                onSuccess('Registro realizado com sucesso! Bem-vindo(a).');
            }
        } catch (error: any) {
            setError(error.message || 'Ocorreu um erro. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-brand-black min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <h1 className="text-4xl font-black text-center text-brand-yellow mb-2 animate-pulse-glow">
                    Complete Angola
                </h1>
                <p className="text-center text-gray-400 mb-8">{isLogin ? 'Faça login para continuar' : 'Crie a sua conta'}</p>
                
                <div className="bg-brand-gray p-8 rounded-2xl border border-brand-light-gray">
                    <form onSubmit={handleSubmit} className="space-y-6">
                         {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    placeholder="Seu nome"
                                    required
                                    value={name}
                                    onChange={e => { setName(e.target.value); setError(null); }}
                                    className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                required
                                value={email}
                                onChange={e => { setEmail(e.target.value); setError(null); }}
                                className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Palavra-passe
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="********"
                                    required
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(null); }}
                                    className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400">
                                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {!isLogin && (
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Confirmar Palavra-passe
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        placeholder="********"
                                        required
                                        value={confirmPassword}
                                        onChange={e => { setConfirmPassword(e.target.value); setError(null); }}
                                        className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400">
                                        {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-900/20 border border-red-500 text-red-400 text-sm rounded-lg p-3 text-center transition-all" role="alert">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-brand-yellow text-brand-black font-bold py-3 px-4 rounded-lg hover:bg-yellow-300 transition-colors flex items-center justify-center disabled:opacity-70"
                        >
                           {isLoading ? <Spinner className="w-5 h-5" /> : (isLogin ? 'Entrar' : 'Registe-se')}
                        </button>
                    </form>
                    
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-400">
                            {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
                            <button onClick={() => { setIsLogin(!isLogin); clearFormState(); }} className="font-bold text-brand-yellow hover:underline">
                                {isLogin ? 'Registe-se' : 'Faça login'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;