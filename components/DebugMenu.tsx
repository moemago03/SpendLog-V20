import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { firebaseDebugInfo } from '../config';
import { UserData } from '../types';

interface DataContextState {
    data: UserData | null;
    loading: boolean;
    firebaseStatus: {
        status: string;
        message: string;
    };
}

interface DebugMenuProps {
    user: User | null;
    dataContext: DataContextState;
    activeTripId: string | null;
}

const DebugMenu: React.FC<DebugMenuProps> = ({ user, dataContext, activeTripId }) => {
    const [isDataVisible, setIsDataVisible] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const { data, loading, firebaseStatus } = dataContext;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'connected': return '#22c55e'; // green-500
            case 'connecting': return '#f59e0b'; // amber-500
            case 'error': return '#ef4444'; // red-500
            case 'not_configured': return '#a1a1aa'; // zinc-500
            default: return '#eee';
        }
    }

    if (isMinimized) {
        return (
            <button 
                onClick={() => setIsMinimized(false)}
                style={{
                    position: 'fixed',
                    top: '5px',
                    right: '5px',
                    zIndex: 9999,
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>bug_report</span>
            </button>
        )
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            color: 'white',
            padding: '8px 12px',
            zIndex: 9999,
            fontSize: '11px',
            fontFamily: 'monospace',
            maxHeight: isDataVisible ? '80vh' : 'auto',
            overflowY: 'auto',
            borderBottom: '1px solid #444',
            backdropFilter: 'blur(4px)' // A nice touch for modern browsers
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: '#60a5fa' }}>
                    SpendiLog Debug
                </p>
                <div>
                    <button 
                        onClick={() => setIsDataVisible(!isDataVisible)}
                        style={{ backgroundColor: '#444', color: 'white', border: 'none', padding: '3px 8px', cursor: 'pointer', borderRadius: '4px', marginRight: '8px' }}
                    >
                        {isDataVisible ? 'Hide' : 'Show'} JSON
                    </button>
                     <button 
                        onClick={() => setIsMinimized(true)}
                        style={{ backgroundColor: '#444', color: 'white', border: 'none', padding: '3px 8px', cursor: 'pointer', borderRadius: '4px' }}
                    >
                        Minimizza
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4px 8px', marginTop: '8px' }}>
                <span title={user?.uid}>Auth: {user ? 'OK' : 'N/A'}</span>
                <span>Firebase: {firebaseDebugInfo.isConfigured ? `OK (${firebaseDebugInfo.projectId})` : 'FAIL'}</span>
                <span>Data: {loading ? 'Loading...' : `OK (${data?.trips?.length ?? 0} trips)`}</span>
                <span title={firebaseStatus.message}>Status: <span style={{ color: getStatusColor(firebaseStatus.status), fontWeight: 'bold' }}>●</span> {firebaseStatus.status}</span>
                <span>TripID: {activeTripId || 'none'}</span>
            </div>

            {isDataVisible && (
                <pre style={{
                    backgroundColor: '#111',
                    padding: '10px',
                    marginTop: '10px',
                    borderRadius: '4px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    maxHeight: 'calc(80vh - 100px)', 
                    overflowY: 'auto'
                }}>
                    {JSON.stringify(data, null, 2)}
                </pre>
            )}
        </div>
    );
};

export default DebugMenu;