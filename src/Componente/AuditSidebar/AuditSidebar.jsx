import React, { useState, useEffect } from 'react';
import styles from './AuditSidebar.module.css';
import { fetchGetWithRetry } from '../../utils/fetchWithRetry';
import { API_URL } from '../../utils/config';

const AuditSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState([]);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const fetchLogs = async () => {
        try {
            const [iesiri, loturi, systemLogs] = await Promise.all([
                fetchGetWithRetry(`${API_URL}/api/iesiri-bere`),
                fetchGetWithRetry(`${API_URL}/api/loturi-ambalate`),
                fetchGetWithRetry(`${API_URL}/api/audit-logs`).catch(() => []) // Graceful fail
            ]);

            // Normalize and Combine
            const formattedIesiri = iesiri.map(i => ({
                id: i.id,
                type: 'IESIRE',
                label: `Ieșire: ${i.reteta}`,
                details: `${i.cantitate}L • ${i.motiv}`,
                date: new Date(i.dataIesire),
                stornat: i.stornat
            }));

            const formattedLoturi = loturi.map(l => ({
                id: l.id,
                type: 'AMBALARE',
                label: `Ambalare: ${l.reteta}`,
                details: `${l.cantitate}L • ${l.ambalaj}`,
                date: new Date(l.dataAmbalare || l.dataCreare),
                stornat: l.stornat
            }));

            const formattedSystem = Array.isArray(systemLogs) ? systemLogs.map(s => ({
                id: s.id,
                type: 'SYSTEM',
                label: s.action.replace('_', ' '),
                details: s.details,
                date: new Date(s.timestamp),
                stornat: s.action.includes('STORNO')
            })) : [];

            const combined = [...formattedIesiri, ...formattedLoturi, ...formattedSystem];
            
            // Sort desc
            const sorted = combined.sort((a, b) => b.date - a.date).slice(0, 15);
            setLogs(sorted);
        } catch (error) {
            console.error("Failed to fetch logs", error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
            // Polling for real-time updates every 5s if open
            const interval = setInterval(fetchLogs, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen]);

    return (
        <div className={`${styles.sidebarContainer} ${isOpen ? styles.open : ''}`}>
            <button className={styles.toggleButton} onClick={toggleSidebar}>
                {isOpen ? '→' : '📋'}
            </button>
            <div className={styles.header}>
                <h3>Audit Log (Last 10)</h3>
            </div>
            <div className={styles.logList}>
                {logs.length === 0 ? (
                    <div className={styles.emptyState}>Nu există înregistrări recente.</div>
                ) : (
                    logs.map((log, idx) => (
                        <div key={`${log.type}-${log.id}-${idx}`} className={`${styles.logItem} ${log.stornat ? styles.stornat : ''}`}>
                            <div className={styles.logMeta}>
                                <span>{log.date.toLocaleString()}</span>
                                <span>{log.type} #{log.id}</span>
                            </div>
                            <div className={styles.logAction}>
                                <span style={{ textDecoration: log.stornat ? 'line-through' : 'none' }}>
                                    {log.label}
                                </span>
                                {log.stornat && <span style={{color: 'var(--btn-danger)', marginLeft: '6px'}}>(STORNO)</span>}
                            </div>
                            <div className={styles.logDetails}>
                                {log.details}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AuditSidebar;
