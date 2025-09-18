import React from 'react';

const SkeletonItem: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
    <div className="flex items-center gap-4 p-3" style={style}>
        <div className="w-12 h-12 flex-shrink-0 bg-surface rounded-2xl"></div>
        <div className="flex-grow space-y-2">
            <div className="h-4 w-3/4 bg-surface rounded"></div>
            <div className="h-3 w-1/2 bg-surface rounded"></div>
        </div>
        <div className="w-1/4 space-y-2">
            <div className="h-4 w-full bg-surface rounded"></div>
            <div className="h-3 w-1/2 ml-auto bg-surface rounded"></div>
        </div>
    </div>
);

const ExpenseListSkeleton: React.FC = () => {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="bg-surface-variant rounded-3xl">
                     <SkeletonItem style={{ animationDelay: `${index * 100}ms` }} />
                </div>
            ))}
        </div>
    );
};

export default ExpenseListSkeleton;