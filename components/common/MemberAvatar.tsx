import React from 'react';
import { TripMember } from '../../types';

const getInitials = (name: string): string => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';

const AVATAR_COLORS = [
    'bg-blue-200 text-blue-800', 'bg-purple-200 text-purple-800', 
    'bg-green-200 text-green-800', 'bg-yellow-200 text-yellow-800', 
    'bg-pink-200 text-pink-800', 'bg-indigo-200 text-indigo-800'
];

const getAvatarColor = (name: string): string => {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash % AVATAR_COLORS.length)];
};

const MemberAvatar: React.FC<{ member: TripMember | undefined; className?: string }> = ({ member, className = '' }) => {
    if (!member) return null;
    return (
        <div 
            className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs border-2 border-surface ${getAvatarColor(member.name)} ${className}`}
            title={member.name}
        >
            {getInitials(member.name)}
        </div>
    );
};

export default MemberAvatar;
