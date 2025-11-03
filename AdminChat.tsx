import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage, AppNotification } from '../../types.ts';
import { db, collection, addDoc, serverTimestamp, doc, updateDoc, arrayUnion } from '../../services/firebase.ts';

interface AdminChatProps {
    users: User[];
    chatMessages: Record<string, ChatMessage[]>;
}

const ChatWindow: React.FC<{
    user: User;
    messages: ChatMessage[];
    onSend: (text: string) => void;
    onBack: () => void;
}> = ({ user, messages, onSend, onBack }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSend(input.trim());
            setInput('');
        }
    };

    return (
        <div className="bg-brand-black flex flex-col h-full rounded-lg">
            <header className="p-3 flex items-center border-b border-brand-light-gray bg-brand-gray sticky top-0">
                <button onClick={onBack} className="mr-3 text-white">←</button>
                <h2 className="font-semibold text-white text-sm">Conversando com {user.name}</h2>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] py-2 px-3 rounded-2xl text-sm ${
                            msg.sender === 'admin' 
                            ? 'bg-brand-yellow text-brand-black rounded-br-none' 
                            : 'bg-brand-light-gray text-white rounded-bl-none'
                        }`}>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-2 border-t border-brand-light-gray bg-brand-gray sticky bottom-0">
                <form onSubmit={handleSend} className="flex space-x-2">
                    <input 
                        type="text" 
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Sua mensagem..."
                        className="flex-1 bg-brand-black border border-brand-light-gray rounded-full px-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                    />
                    <button type="submit" className="bg-brand-yellow text-brand-black font-bold py-2 px-4 rounded-full hover:bg-yellow-300 transition-colors">
                        Enviar
                    </button>
                </form>
            </footer>
        </div>
    );
}

const AdminChat: React.FC<AdminChatProps> = ({ users, chatMessages }) => {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const handleSend = async (text: string) => {
        if (selectedUserId) {
            // Send chat message to Firestore
            const messagesColRef = collection(db, "chats", selectedUserId, "messages");
            await addDoc(messagesColRef, {
                sender: 'admin',
                text,
                timestamp: serverTimestamp()
            });

            // Also add notification to user
            const userDocRef = doc(db, "users", selectedUserId);
            const newNotification: AppNotification = {
                id: `notif-${Date.now()}`,
                message: `Você tem uma nova mensagem do suporte.`,
                timestamp: Date.now(),
                read: false,
            };
            await updateDoc(userDocRef, {
                notifications: arrayUnion(newNotification)
            });
        }
    };

    if (users.length === 0) {
        return (
            <div className="flex items-center justify-center h-full bg-brand-gray rounded-lg">
                <p className="text-gray-500">Nenhum usuário para conversar.</p>
            </div>
        )
    }

    if (selectedUserId) {
        const selectedUser = users.find(u => u.id === selectedUserId);
        if (!selectedUser) return null; // Should not happen
        
        return (
            <ChatWindow 
                user={selectedUser}
                messages={chatMessages[selectedUserId] || []}
                onSend={handleSend}
                onBack={() => setSelectedUserId(null)}
            />
        );
    }

    return (
        <div className="animate-fade-in bg-brand-gray border border-brand-light-gray rounded-lg">
             <div className="p-4 border-b border-brand-light-gray">
                <h2 className="font-bold text-base">Conversas</h2>
            </div>
            <ul className="overflow-y-auto">
                {users.map(user => (
                    <li key={user.id} className="border-b border-brand-light-gray last:border-b-0">
                        <button 
                            onClick={() => setSelectedUserId(user.id)}
                            className={`w-full text-left p-3 transition-colors hover:bg-brand-light-gray/50`}
                        >
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AdminChat;