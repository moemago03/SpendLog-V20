import React, { useState } from 'react';

interface LoginScreenProps {
    onLogin: (password: string) => void;
}

const PASSCODE_LENGTH = 4; // Acts as max length now

const triggerHapticFeedback = () => {
    if (navigator.vibrate) {
        navigator.vibrate(10); // A light, quick vibration
    }
};

const KeypadButton: React.FC<{
    value: string | React.ReactNode;
    onClick: () => void;
    className?: string;
    isActive: boolean; // Prop for animation
}> = ({ value, onClick, className = '', isActive }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center w-16 h-16 text-3xl font-light transition-transform duration-150 focus:outline-none active:scale-90 ${isActive ? 'font-bold scale-110' : ''} ${className}`}
        aria-label={`Pulsante ${typeof value === 'string' ? value : 'icona'}`}
    >
        {value}
    </button>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [passcode, setPasscode] = useState('');
    const [isShaking, setIsShaking] = useState(false);
    const [activeKey, setActiveKey] = useState<string | null>(null); // State for animation

    const handleKeyPress = (key: string) => {
        triggerHapticFeedback();
        setActiveKey(key);
        setTimeout(() => setActiveKey(null), 150);
    };

    const handleNumberClick = (num: string) => {
        handleKeyPress(num);
        if (passcode.length < PASSCODE_LENGTH) {
            setPasscode(passcode + num);
        }
    };

    const handleBackspace = () => {
        handleKeyPress('backspace');
        setPasscode(passcode.slice(0, -1));
    };

    const handleSubmit = () => {
        handleKeyPress('submit');
        if (passcode.length > 0) {
            onLogin(passcode);
        } else {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
        }
    };

    const PasscodeDots = () => {
        const dots = [];
        for (let i = 0; i < PASSCODE_LENGTH; i++) {
            dots.push(
                <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        i < passcode.length ? 'bg-on-surface' : 'bg-on-surface/20'
                    }`}
                />
            );
        }
        return <div className={`flex justify-center items-center gap-4 ${isShaking ? 'animate-shake' : ''}`}>{dots}</div>;
    };

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col justify-center items-center gap-16 bg-gradient-to-b from-tertiary-container/30 via-surface to-primary-container/30 text-on-surface p-4">
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                    20%, 40%, 60%, 80% { transform: translateX(10px); }
                }
                .animate-shake {
                    animation: shake 0.5s ease-in-out;
                }
            `}</style>
            
            <div className="text-center space-y-8">
                <div>
                    <div className="flex justify-center items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl">receipt_long</span>
                        <span className="material-symbols-outlined text-tertiary text-3xl">bar_chart</span>
                        <span className="material-symbols-outlined text-secondary text-3xl">travel</span>
                    </div>
                    <h1 className="text-5xl font-bold tracking-tighter">SpendiLog</h1>
                </div>
                <PasscodeDots />
            </div>

            <div className="flex-shrink-0">
                <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                    {'123456789'.split('').map(num => (
                        <KeypadButton
                            key={num}
                            value={num}
                            onClick={() => handleNumberClick(num)}
                            isActive={activeKey === num}
                        />
                    ))}
                    <KeypadButton
                        value={<span className="material-symbols-outlined select-none">backspace</span>}
                        onClick={handleBackspace}
                        className="text-trip-primary"
                        isActive={activeKey === 'backspace'}
                    />
                    <KeypadButton
                        value="0"
                        onClick={() => handleNumberClick('0')}
                        isActive={activeKey === '0'}
                    />
                    <KeypadButton
                        value={<span className="material-symbols-outlined select-none">arrow_forward</span>}
                        onClick={handleSubmit}
                        className="text-trip-primary"
                        isActive={activeKey === 'submit'}
                    />
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;