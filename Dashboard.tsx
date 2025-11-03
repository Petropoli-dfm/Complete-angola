import React from 'react';
import { Page, User } from '../types.ts';
import { Spinner, CopyIcon, LightBulbIcon } from './Icons.tsx';
import { analyzeReceipt, getAngolaFact } from '../services/geminiService.ts';
import { db, collection, query, where, getDocs } from '../services/firebase.ts';


interface DashboardProps {
    user: User;
    setCurrentPage: (page: Page) => void;
    handleAddWithdrawal: (amount: number, name: string, details: string) => void;
    handleManualDepositRequest: (amount: number, senderPhone: string, receiptHash: string) => void;
    handleAutoApproveDeposit: (amount: number, receiptHash: string) => void;
    showNotification: (message: string) => void;
}

// Helper function to create a SHA-256 hash from a string (like base64)
async function sha256(str: string): Promise<string> {
    const textAsBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', textAsBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const Dashboard: React.FC<DashboardProps> = ({ user, setCurrentPage, handleAddWithdrawal, handleManualDepositRequest, handleAutoApproveDeposit, showNotification }) => {
    const { name: userName, balance } = user;
    const [showDepositModal, setShowDepositModal] = React.useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = React.useState(false);
    
    const [depositLoading, setDepositLoading] = React.useState(false);
    const [depositStatusMessage, setDepositStatusMessage] = React.useState('');

    const [withdrawLoading, setWithdrawLoading] = React.useState(false);
    const [depositRequestSent, setDepositRequestSent] = React.useState(false);
    const [autoApproved, setAutoApproved] = React.useState(false);

    // State for forms
    const [withdrawDetails, setWithdrawDetails] = React.useState('');
    const [withdrawAmount, setWithdrawAmount] = React.useState('');
    const [depositAmount, setDepositAmount] = React.useState('');
    const [depositPhone, setDepositPhone] = React.useState('');
    const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
    
    // New states for withdrawal method
    const [selectedBank, setSelectedBank] = React.useState('');
    const BANK_LIST = ['BFA', 'BAI', 'ATLÂNTICO', 'BIC', 'BPC', 'KEVE', 'BCI', 'ECONÔMICO', 'SOL'];

    // State for Gemini Fact
    const [fact, setFact] = React.useState<string | null>(null);
    const [isFactLoading, setIsFactLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchFact = async () => {
            setIsFactLoading(true);
            const newFact = await getAngolaFact();
            setFact(newFact);
            setIsFactLoading(false);
        };

        fetchFact(); // Fetch on initial render
        const intervalId = setInterval(fetchFact, 60000); // Fetch every 60 seconds

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, []);


    const handleCloseDepositModal = () => {
        setShowDepositModal(false);
        setDepositRequestSent(false);
        setAutoApproved(false);
        setDepositAmount('');
        setDepositPhone('');
        setReceiptFile(null);
        setDepositStatusMessage('');
    };
    
    const handleCloseWithdrawModal = () => {
        setShowWithdrawModal(false);
        setWithdrawDetails('');
        setWithdrawAmount('');
        setSelectedBank('');
        setWithdrawLoading(false);
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result as string;
                // Remove the data URI prefix
                resolve(result.split(',')[1]);
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReceiptFile(e.target.files[0]);
        }
    };

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        const amountNumber = parseFloat(depositAmount);

        if (isNaN(amountNumber) || amountNumber < 1000) {
            showNotification("Por favor, insira um valor de depósito válido (mínimo 1000 Kz).");
            return;
        }
        if (!receiptFile) {
            showNotification("Por favor, anexe o comprovativo de depósito.");
            return;
        }
        if (!depositPhone.trim()) {
            showNotification("Por favor, insira o seu número de telefone.");
            return;
        }

        setDepositLoading(true);
        setDepositStatusMessage("A processar imagem...");

        const base64Image = await fileToBase64(receiptFile);
        
        setDepositStatusMessage("A verificar comprovativo...");
        const imageHash = await sha256(base64Image);

        try {
            const depositsRef = collection(db, "deposits");
            const q = query(depositsRef, where("receiptHash", "==", imageHash), where("status", "==", "Aprovado"));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                showNotification("Esse comprovante já foi validado❌");
                setDepositLoading(false);
                setDepositStatusMessage('');
                return;
            }
        } catch (error) {
            console.error("Erro ao verificar duplicidade do comprovativo:", error);
            showNotification("Ocorreu um erro ao verificar o comprovativo. Tente novamente.");
            setDepositLoading(false);
            return;
        }

        setDepositStatusMessage("A analisar comprovativo com IA...");
        const analysisResult = await analyzeReceipt(base64Image);

        if (analysisResult && analysisResult.isForged) {
            setDepositStatusMessage("Comprovativo suspeito. A submeter para revisão manual...");
        } else if (analysisResult && analysisResult.amount && analysisResult.date && analysisResult.time) {
            const receiptDate = new Date(`${analysisResult.date}T${analysisResult.time}`);
            const now = new Date();
            const timeDiffSeconds = (now.getTime() - receiptDate.getTime()) / 1000;

            const isAmountMatch = analysisResult.amount === amountNumber;
            const isWithinTime = timeDiffSeconds > 0 && timeDiffSeconds <= 600;

            if (isAmountMatch && isWithinTime) {
                setDepositStatusMessage("Verificação bem-sucedida! A creditar saldo...");
                await handleAutoApproveDeposit(amountNumber, imageHash);
                setAutoApproved(true);
                setDepositRequestSent(true);
                setDepositLoading(false);
                return;
            } else {
                 setDepositStatusMessage("Verificação automática falhou. A submeter para revisão manual...");
            }
        } else {
            setDepositStatusMessage("Análise automática falhou. A submeter para revisão manual...");
        }

        // Fallback to manual review (WhatsApp flow)
        await handleManualDepositRequest(amountNumber, depositPhone, imageHash);
        setAutoApproved(false);
        setDepositRequestSent(true);
        setDepositLoading(false);
    }

    const handleWithdraw = (e: React.FormEvent) => {
        e.preventDefault();

        const now = new Date();
        const currentHour = now.getHours();

        if (currentHour < 12 || currentHour >= 15) {
            showNotification("Os saques estão disponíveis apenas entre as 12:00 e as 15:00.");
            return;
        }

        const amountNumber = parseFloat(withdrawAmount);

        if (isNaN(amountNumber) || amountNumber < 4000) {
            showNotification("Por favor, insira um valor de saque válido (mínimo 4000 Kz).");
            return;
        }

        if (!selectedBank) {
            showNotification("Por favor, selecione o seu banco.");
            return;
        }

        if (!withdrawDetails.trim()) {
            showNotification("Por favor, insira o seu IBAN ou número de conta.");
            return;
        }

        if (amountNumber > user.balance) {
            showNotification("Saldo insuficiente para este saque.");
            return;
        }

        const dailyLimit = 20000;
        if (amountNumber > dailyLimit) {
            showNotification(`O valor máximo por saque é de ${dailyLimit.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}.`);
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaysWithdrawals = user.withdrawalHistory
            .filter(w => {
                const withdrawalDate = new Date(w.date);
                return withdrawalDate >= today && (w.status === 'Pendente' || w.status === 'Aprovado');
            })
            .reduce((sum, w) => sum + w.amount, 0);

        if (todaysWithdrawals + amountNumber > dailyLimit) {
            showNotification(`Limite de saque diário de ${dailyLimit.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} excedido.`);
            return;
        }
        
        setWithdrawLoading(true);

        const details = `Banco: ${selectedBank} | IBAN: ${withdrawDetails}`;

        // Simulate network delay for better UX
        setTimeout(() => {
            try {
                handleAddWithdrawal(amountNumber, userName, details);
                showNotification("Pedido de saque enviado com sucesso!");
                handleCloseWithdrawModal();
            } catch (error) {
                showNotification("Ocorreu um erro ao processar o seu pedido.");
                console.error("Withdrawal error:", error);
            } finally {
                setWithdrawLoading(false);
            }
        }, 1500);
    };

    return (
        <div className="p-3 text-white animate-fade-in pb-24">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                {/* User Info & Balance */}
                <div>
                    <p className="text-gray-400 text-sm">
                        Olá, <span className="font-bold text-green-400" style={{ textShadow: '0 0 8px rgba(52, 211, 153, 0.8)' }}>{userName}</span>
                    </p>
                    <p className="text-2xl font-black text-brand-yellow">
                        {balance.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}
                    </p>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span>ID: {user.id.substring(0, 8)}...</span>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(user.id);
                                showNotification("ID de usuário copiado!");
                            }} 
                            className="ml-2 text-gray-400 hover:text-white"
                        >
                            <CopyIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {/* Action Buttons */}
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowDepositModal(true)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                        Depositar
                    </button>
                    <button
                        onClick={() => setShowWithdrawModal(true)}
                        className="bg-brand-red hover:bg-brand-red-dark text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
                    >
                        Sacar
                    </button>
                </div>
            </div>

            {/* Gemini Fact Card */}
            <div className="bg-brand-gray border border-brand-light-gray rounded-xl p-4 mb-6 min-h-[120px] flex flex-col justify-center">
                <div className="flex items-start">
                    <LightBulbIcon active className="w-6 h-6 mr-3 flex-shrink-0 text-brand-yellow" />
                    <div className="flex-grow">
                        <h3 className="text-sm font-bold text-brand-yellow mb-1">Curiosidade do Minuto</h3>
                        {isFactLoading && !fact ? (
                            <div className="flex items-center">
                                <Spinner className="w-4 h-4 mr-2" />
                                <p className="text-sm text-gray-400">A gerar um facto interessante...</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-300 animate-fade-in">{fact}</p>
                        )}
                    </div>
                </div>
                 <p className="text-right text-xs text-gray-600 mt-2">Powered by Gemini</p>
            </div>

            {/* Quick Navigation */}
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setCurrentPage('INVEST')} className="bg-brand-gray hover:bg-brand-light-gray p-4 rounded-xl text-left transition-colors">
                    <p className="font-bold">Investir</p>
                    <p className="text-xs text-gray-400">Veja os níveis e ganhos.</p>
                </button>
                <button onClick={() => setCurrentPage('TASKS')} className="bg-brand-gray hover:bg-brand-light-gray p-4 rounded-xl text-left transition-colors">
                    <p className="font-bold">Tarefas</p>
                    <p className="text-xs text-gray-400">Complete para ganhar bônus.</p>
                </button>
                <button onClick={() => setCurrentPage('REAL_GAME')} className="bg-brand-gray hover:bg-brand-light-gray p-4 rounded-xl text-left transition-colors">
                    <p className="font-bold">Jogo Real</p>
                    <p className="text-xs text-gray-400">Aposte e teste seus conhecimentos.</p>
                </button>
                <button onClick={() => setCurrentPage('ACCOUNT')} className="bg-brand-gray hover:bg-brand-light-gray p-4 rounded-xl text-left transition-colors">
                    <p className="font-bold">Minha Conta</p>
                    <p className="text-xs text-gray-400">Veja seu perfil e histórico.</p>
                </button>
            </div>

            {/* Deposit Modal */}
            {showDepositModal && (
                 <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-brand-gray rounded-xl p-6 w-full max-w-sm border border-brand-light-gray shadow-lg animate-fade-in">
                        {depositRequestSent ? (
                             <div className="text-center">
                                <h3 className="text-lg font-bold text-brand-yellow mb-2">
                                    {autoApproved ? 'Depósito Aprovado!' : 'Pedido Recebido!'}
                                </h3>
                                {autoApproved ? (
                                    <p className="text-gray-300 text-sm mb-4">
                                        {`O valor de ${parseFloat(depositAmount).toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })} foi adicionado ao seu saldo.`}
                                    </p>
                                ) : (
                                    <>
                                        <p className="text-gray-300 text-sm mb-4">
                                            A verificação automática não foi concluída. Por favor, reenvie o comprovante via WhatsApp para o número abaixo para aprovação manual.
                                        </p>
                                        <div className="bg-brand-black p-3 rounded-lg flex justify-between items-center my-4">
                                            <span className="font-mono text-lg text-brand-red font-bold">942345333</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText('942345333');
                                                    showNotification("Número copiado!");
                                                }}
                                                className="flex items-center space-x-1 bg-brand-light-gray text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                                                aria-label="Copiar número de telefone"
                                            >
                                                <CopyIcon className="w-4 h-4" />
                                                <span>Copiar</span>
                                            </button>
                                        </div>
                                        <p className="text-gray-400 text-xs mb-4">O seu pedido já foi registado no sistema.</p>
                                    </>
                                )}
                                <button onClick={handleCloseDepositModal} className="w-full bg-brand-yellow text-brand-black font-bold py-2 rounded-lg mt-4">Fechar</button>
                            </div>
                        ) : (
                             <>
                                <h3 className="text-lg font-bold mb-4 text-white">Fazer Depósito</h3>
                                {depositLoading ? (
                                    <div className="flex flex-col items-center justify-center h-48">
                                        <Spinner className="w-8 h-8 text-brand-yellow"/>
                                        <p className="mt-4 text-gray-300">{depositStatusMessage}</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleDeposit}>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Valor a Depositar (Kz)</label>
                                                <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow" placeholder="Mínimo 1,000" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Seu Nº de Telefone</label>
                                                <input type="tel" value={depositPhone} onChange={e => setDepositPhone(e.target.value)} className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow" placeholder="Número que enviou o valor" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Comprovativo</label>
                                                <input type="file" onChange={handleFileChange} accept="image/*" className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-yellow file:text-brand-black hover:file:bg-yellow-300" />
                                            </div>
                                        </div>
                                        <div className="flex space-x-4 mt-6">
                                            <button type="button" onClick={handleCloseDepositModal} className="flex-1 bg-brand-light-gray py-2.5 rounded-lg hover:bg-opacity-80 transition-colors">Cancelar</button>
                                            <button type="submit" disabled={depositLoading} className="flex-1 bg-brand-yellow text-brand-black font-bold py-2.5 rounded-lg flex items-center justify-center hover:bg-yellow-300 transition-colors">
                                                Confirmar
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Withdrawal Modal */}
            {showWithdrawModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-brand-gray rounded-xl p-6 w-full max-w-sm border border-brand-light-gray shadow-lg animate-fade-in">
                        <h3 className="text-lg font-bold mb-4 text-white">Solicitar Saque</h3>
                        <form onSubmit={handleWithdraw}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Valor a Sacar (Kz)</label>
                                    <input
                                        type="number"
                                        value={withdrawAmount}
                                        onChange={e => setWithdrawAmount(e.target.value)}
                                        className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                                        placeholder="Mínimo 4,000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Banco</label>
                                    <select 
                                        value={selectedBank} 
                                        onChange={e => setSelectedBank(e.target.value)}
                                        className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                                    >
                                        <option value="" disabled>Selecione um banco</option>
                                        {BANK_LIST.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">IBAN / Nº de Conta</label>
                                    <input
                                        type="text"
                                        value={withdrawDetails}
                                        onChange={e => setWithdrawDetails(e.target.value)}
                                        className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                                        placeholder="Insira os detalhes para pagamento"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-4 mt-6">
                                <button type="button" onClick={handleCloseWithdrawModal} className="flex-1 bg-brand-light-gray py-2.5 rounded-lg hover:bg-opacity-80 transition-colors">Cancelar</button>
                                <button type="submit" disabled={withdrawLoading} className="flex-1 bg-brand-yellow text-brand-black font-bold py-2.5 rounded-lg flex items-center justify-center hover:bg-yellow-300 transition-colors disabled:opacity-70">
                                    {withdrawLoading ? <Spinner /> : 'Confirmar Saque'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;