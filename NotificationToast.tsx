import React, { useEffect } from 'react';

export interface ToastProps {
    id: string;
    message: string;
    onDismiss: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(id);
        }, 5000); // Auto-dismiss after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [id, onDismiss]);

    return (
        <div className="bg-brand-yellow text-brand-black p-4 rounded-lg shadow-lg flex items-center justify-between animate-fade-in" role="alert" aria-live="assertive">
            <p className="font-semibold mr-4">{message}</p>
            <button onClick={() => onDismiss(id)} className="text-brand-black opacity-70 hover:opacity-100 font-bold text-xl" aria-label="Fechar notificação">&times;</button>
        </div>
    );
};

export default Toast;
