import React from 'react';
import { ChatIcon } from './Icons.tsx';

const FloatingChatButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button onClick={onClick} className="fixed bottom-24 right-4 bg-brand-primary text-brand-bg w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-20 hover:bg-brand-primary-dark transition-colors">
        <ChatIcon />
    </button>
);

export default FloatingChatButton;
