import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types.ts';

interface ChatModalProps {
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
    onClose: () => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ messages, onSendMessage, onClose }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-gray w-full max-w-lg h-[80vh] flex flex-col rounded-xl border border-brand-light-gray">
                <header className="flex justify-between items-center p-4 border-b border-brand-light-gray">
                    <h2 className="font-bold text-white">Suporte ao Cliente</h2>
                    <button onClick={onClose} className="text-gray-400 text-2xl">&times;</button>
                </header>
                <main className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg ${
                                msg.sender === 'user' 
                                ? 'bg-brand-yellow text-brand-black' 
                                : 'bg-brand-light-gray text-white'
                            }`}>
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </main>
                <footer className="p-4 border-t border-brand-light-gray">
                    <form onSubmit={handleSend} className="flex space-x-2">
                        <input 
                            type="text" 
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder="Digite sua mensagem..."
                            className="flex-1 bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-yellow"
                        />
                        <button type="submit" className="bg-brand-yellow text-brand-black font-bold py-2 px-4 rounded-lg">
                            Enviar
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default ChatModal;