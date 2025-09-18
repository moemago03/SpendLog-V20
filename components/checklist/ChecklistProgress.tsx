import React from 'react';

interface ProgressCircleProps {
    completed: number;
    total: number;
}

const ChecklistProgress: React.FC<ProgressCircleProps> = ({ completed, total }) => {
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex justify-center items-center my-4 animate-fade-in">
            <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 120 120">
                    <circle
                        className="text-surface-variant"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                    />
                    <circle
                        className="text-primary"
                        strokeWidth="10"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                        strokeLinecap="round"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset: offset,
                            transform: 'rotate(-90deg)',
                            transformOrigin: '50% 50%',
                            transition: 'stroke-dashoffset 0.5s ease-out'
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col justify-center items-center">
                    <span className="text-3xl font-bold text-on-surface">{completed}
                        <span className="text-xl font-medium text-on-surface-variant">/{total}</span>
                    </span>
                    <span className="text-sm font-medium text-on-surface-variant">completati</span>
                </div>
            </div>
        </div>
    );
};

export default ChecklistProgress;