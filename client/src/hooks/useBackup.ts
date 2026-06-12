import { useState, useEffect } from 'react';

export interface BackupData {
  timestamp: number;
  products: any[];
  processes: any[];
  version: string;
}

const BACKUP_HISTORY_KEY = 'kanban-backup-history';
const MAX_BACKUPS = 10;

export function useBackup() {
  const [backupHistory, setBackupHistory] = useState<BackupData[]>([]);

  // Load backup history
  useEffect(() => {
    const stored = localStorage.getItem(BACKUP_HISTORY_KEY);
    if (stored) {
      try {
        setBackupHistory(JSON.parse(stored));
      } catch (e) {
        console.error('Erro ao carregar histórico:', e);
      }
    }
  }, []);

  const createBackup = (products: any[], processes: any[]) => {
    const backup: BackupData = {
      timestamp: Date.now(),
      products,
      processes,
      version: '1.0'
    };

    const newHistory = [backup, ...backupHistory].slice(0, MAX_BACKUPS);
    setBackupHistory(newHistory);
    
    try {
      localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e: any) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        // Armazenamento cheio - remover backups antigos
        const olderHistory = newHistory.slice(0, Math.max(1, Math.floor(MAX_BACKUPS / 2)));
        try {
          localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(olderHistory));
          setBackupHistory(olderHistory);
          console.warn('Armazenamento cheio. Limpando backups antigos.');
        } catch (e2) {
          console.error('Erro ao limpar backups:', e2);
        }
      } else {
        console.error('Erro ao salvar backup:', e);
      }
    }
    return backup;
  };

  const exportBackup = (products: any[], processes: any[]) => {
    const backup = createBackup(products, processes);
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kanban-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (file: File): Promise<BackupData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backup = JSON.parse(e.target?.result as string) as BackupData;
          resolve(backup);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    });
  };

  const restoreFromHistory = (backup: BackupData) => {
    return backup;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return {
    backupHistory,
    createBackup,
    exportBackup,
    importBackup,
    restoreFromHistory,
    formatDate,
  };
}
