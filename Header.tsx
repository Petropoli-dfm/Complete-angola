import React from 'react';
import { RefreshIcon, FullscreenIcon } from './Icons.tsx';

const Header: React.FC = () => {
    const handleRefresh = () => window.location.reload();
    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };
    return (
        <header className="bg-brand-bg sticky top-0 z-10 p-4 flex justify-between items-center text-white border-b border-brand-bg-light">
            <h1 className="text-xl font-bold text-brand-primary">Complete Angola</h1>
            <div className="flex items-center space-x-4">
                <button onClick={handleRefresh}><RefreshIcon /></button>
                <button onClick={handleFullscreen}><FullscreenIcon /></button>
            </div>
        </header>
    );
};

export default Header;
