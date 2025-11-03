import React, { useState, useEffect, useRef } from 'react';
import { User } from '../types.ts';
import { Spinner } from './Icons.tsx';

interface SpinGameProps {
    user: User;
    showNotification: (message: string) => void;
    onUpdateBalance: (amount: number) => Promise<void>;
}

// Based on the provided image, clockwise from top
const WHEEL_SEGMENTS = [
    { value: 0, color: '#FFD700' },   // Yellow
    { value: 5, color: '#DC2626' },   // Red
    { value: 10, color: '#FFD700' },  // Yellow
    { value: 20, color: '#121212' },  // Black
    { value: 20, color: '#DC2626' },  // Red
    { value: 30, color: '#121212' }   // Black
];
const DEGREES_PER_SEGMENT = 360 / WHEEL_SEGMENTS.length;
const MIN_BET = 50;
const MAX_BET = 1000;

// --- Audio Frequencies ---
const noteToFreq: { [key: string]: number } = {
    'C3': 130.81, 'G4': 392.00,
    'C5': 523.25, 'E5': 659.25, 'G5': 783.99, 'C6': 1046.50
};

const SpinGame: React.FC<SpinGameProps> = ({ user, showNotification, onUpdateBalance }) => {
    const [betAmount, setBetAmount] = useState<number | ''>('');
    const [isSpinning, setIsSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const spinningSoundIntervalRef = useRef<number | null>(null);

    // --- Audio Logic ---
    useEffect(() => {
        // Cleanup on unmount
        return () => {
            stopSpinningSound();
            if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
                audioCtxRef.current.close();
            }
        };
    }, []);

    const initAudio = () => {
        if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    };
    
    const playTickSound = () => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        
        // Creates a short burst of white noise
        const bufferSize = ctx.sampleRate * 0.05; // 50ms duration
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        // A bandpass filter to make it sound like a 'click'
        const bandpass = ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 1500;
        bandpass.Q.value = 20;

        // A gain node for a sharp attack and quick decay (the envelope)
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

        noise.connect(bandpass);
        bandpass.connect(gain);
        gain.connect(ctx.destination);

        noise.start(ctx.currentTime);
        noise.stop(ctx.currentTime + 0.05);
    };

    const playSpinningSound = () => {
        let interval = 50; // start fast
        const spinDuration = 5000; // 5 seconds
        const startTime = Date.now();

        const tick = () => {
            const elapsedTime = Date.now() - startTime;
            if (elapsedTime >= spinDuration) {
                stopSpinningSound();
                return;
            }
            playTickSound();
            // Gradually increase the interval to slow down the ticks
            const progress = elapsedTime / spinDuration;
            interval = 50 + (250 * progress * progress); // Exponential slowdown
            spinningSoundIntervalRef.current = window.setTimeout(tick, interval);
        };
        
        tick();
    };

    const stopSpinningSound = () => {
        if (spinningSoundIntervalRef.current) {
            clearTimeout(spinningSoundIntervalRef.current);
            spinningSoundIntervalRef.current = null;
        }
    };

    const playSound = (type: 'win' | 'loss') => {
        if (!audioCtxRef.current) return;
        const ctx = audioCtxRef.current;
        const startTime = ctx.currentTime;

        if (type === 'win') {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            const notes = ['C5', 'E5', 'G5', 'C6'];
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.05);

            notes.forEach((note, i) => {
                osc.frequency.setValueAtTime(noteToFreq[note], startTime + i * 0.1);
            });

            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);
            osc.start(startTime);
            osc.stop(startTime + 0.6);
        } else { // 'loss' sound
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            gain.gain.setValueAtTime(0.2, startTime);
            osc.frequency.setValueAtTime(noteToFreq['G4'], startTime);
            osc.frequency.exponentialRampToValueAtTime(noteToFreq['C3'], startTime + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.5);

            osc.start(startTime);
            osc.stop(startTime + 0.5);
        }
    };
    // --- End Audio Logic ---

    const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const valueStr = e.target.value;
        if (valueStr === '') {
            setBetAmount('');
            return;
        }
        let value = parseInt(valueStr, 10);
        if (isNaN(value) || value < 0) value = 0;
        if (value > MAX_BET) value = MAX_BET;
        
        if (value > user.balance) {
            showNotification(`Seu saldo é insuficiente.`);
            value = user.balance;
        }
        setBetAmount(value);
    };

    const handleSpin = async () => {
        if (typeof betAmount !== 'number' || betAmount < MIN_BET) {
            showNotification(`A aposta mínima é de ${MIN_BET.toLocaleString('pt-AO')} Kz.`);
            return;
        }
        if (isSpinning || user.balance < betAmount) {
            showNotification('Saldo insuficiente para esta aposta.');
            return;
        }
        
        initAudio();
        setIsSpinning(true);
        playSpinningSound();
        await onUpdateBalance(-betAmount);

        const isWinner = Math.random() < 0.15;
        let winningSegmentIndex: number;

        if (isWinner) {
            const winningSegments = WHEEL_SEGMENTS.map((seg, i) => ({ ...seg, index: i })).filter(seg => seg.value > 0);
            winningSegmentIndex = winningSegments[Math.floor(Math.random() * winningSegments.length)].index;
        } else {
            winningSegmentIndex = WHEEL_SEGMENTS.findIndex(seg => seg.value === 0);
        }

        const prizeMultiplier = betAmount / MIN_BET;
        const prizeValue = WHEEL_SEGMENTS[winningSegmentIndex].value * prizeMultiplier;
        
        const randomOffset = (Math.random() - 0.5) * (DEGREES_PER_SEGMENT * 0.8);
        const targetAngle = (360 - (winningSegmentIndex * DEGREES_PER_SEGMENT)) - (DEGREES_PER_SEGMENT / 2) + randomOffset;
        const fullSpins = 5 * 360;
        const finalRotation = rotation - (rotation % 360) + fullSpins + targetAngle;
        
        setRotation(finalRotation);

        setTimeout(async () => {
            stopSpinningSound();
            if (prizeValue > 0) {
                await onUpdateBalance(prizeValue);
                showNotification(`Parabéns! Você ganhou ${prizeValue.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}.`);
                playSound('win');
            } else {
                showNotification('Mais sorte da próxima vez!');
                playSound('loss');
            }
            setIsSpinning(false);
        }, 5500);
    };
    
    const prizeMultiplier = (Number(betAmount) || 0) / MIN_BET;

    return (
        <div className="p-4 text-white animate-fade-in flex flex-col items-center justify-center h-full text-center">
            <h2 className="text-2xl font-black text-center mb-1 text-brand-yellow">Roda da Sorte</h2>
            <p className="text-center text-gray-400 mb-6">Aumente sua aposta para aumentar os prêmios!</p>

            <div className="relative mb-8">
                <div className="wheel-pointer"></div>
                <div className="wheel-container" style={{ transform: `rotate(${rotation}deg)` }}>
                    {WHEEL_SEGMENTS.map((segment, index) => (
                        <div
                            key={index}
                            className="wheel-segment"
                            style={{
                                backgroundColor: segment.color,
                                transform: `rotate(${index * DEGREES_PER_SEGMENT}deg)`,
                            }}
                        >
                            <span className="wheel-text" style={{ color: (segment.color === '#121212' || segment.color === '#DC2626') ? 'white' : 'black' }}>
                                {(segment.value * prizeMultiplier).toLocaleString('pt-AO')} Kz
                            </span>
                        </div>
                    ))}
                </div>
                 <div className="wheel-center">
                    <button
                        onClick={handleSpin}
                        disabled={isSpinning}
                        className="w-full h-full text-white font-bold text-xl uppercase rounded-full flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSpinning ? <Spinner /> : 'Girar'}
                    </button>
                </div>
            </div>

            <div className="w-full max-w-xs text-center">
                 <label htmlFor="bet-input" className="block text-sm font-medium text-gray-300 mb-2">Valor da Aposta</label>
                 <input 
                    id="bet-input"
                    type="number"
                    value={betAmount}
                    onChange={handleBetChange}
                    placeholder="0"
                    min="0"
                    max={MAX_BET}
                    step="50"
                    disabled={isSpinning}
                    className="w-full bg-brand-black border border-brand-light-gray rounded-lg px-3 py-2 text-white text-center font-bold text-lg focus:outline-none focus:ring-2 focus:ring-brand-yellow disabled:opacity-50"
                 />
                <p className="text-xs text-gray-500 mt-1">(Mín. 50 Kz, Máx. 1000 Kz)</p>
                
                <div className="mt-4 text-center">
                    <p className="text-gray-400">Seu Saldo</p>
                    <p className="text-lg font-bold text-brand-yellow">{user.balance.toLocaleString('pt-AO', { style: 'currency', currency: 'AOA' })}</p>
                </div>
            </div>
        </div>
    );
};

export default SpinGame;