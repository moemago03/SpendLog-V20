import React from 'react';
import { useNotification, NotificationType } from '../context/NotificationContext';

const ICONS: Record<NotificationType, string> = {
    success: 'task_alt',
    error: 'error',
    info: 'info',
};

const COLORS: Record<NotificationType, string> = {
    success: 'bg-primary-container text-on-primary-container',
    error: 'bg-error-container text-on-error-container',
    info: 'bg-secondary-container text-on-secondary-container',
};

const NotificationToast: React.FC<{ message: string; type: NotificationType }> = ({ message, type }) => {
    return (
        <div 
            className={`flex items-center gap-3 w-full max-w-sm p-4 rounded-2xl shadow-lg animate-toast-in ${COLORS[type]}`}
            role="alert"
        >
            <span className="material-symbols-outlined">{ICONS[type]}</span>
            <p className="font-medium text-sm flex-1">{message}</p>
        </div>
    );
};

const NotificationContainer: React.FC = () => {
    const { notifications } = useNotification();

    return (
        <>
            <div 
                aria-live="assertive"
                className="fixed bottom-24 inset-x-4 sm:bottom-6 sm:right-6 sm:left-auto flex flex-col items-center sm:items-end gap-3 z-[100] pointer-events-none"
            >
                {notifications.map(n => (
                    <NotificationToast key={n.id} message={n.message} type={n.type} />
                ))}
            </div>
            <style>{`
                @keyframes toast-in {
                    from {
                        opacity: 0;
                        transform: translateY(20px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-toast-in {
                    animation: toast-in 0.3s ease-out forwards;
                }
            `}</style>
        </>
    );
};

export default NotificationContainer;
