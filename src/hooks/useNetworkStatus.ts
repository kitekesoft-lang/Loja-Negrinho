import { useState, useEffect, useCallback } from 'react';
import { LocalPersistenceEngine, SyncQueueItem } from '../core/fiscal/storage/LocalPersistenceEngine';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const updateQueueCount = useCallback(() => {
    const queue = LocalPersistenceEngine.getSyncQueue();
    setPendingSyncCount(queue.length);
    const cfg = LocalPersistenceEngine.getCloudConfig();
    setLastSyncTime(cfg.lastSyncTimestamp);
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto sync ao voltar online
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    updateQueueCount();
    const interval = setInterval(updateQueueCount, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [updateQueueCount]);

  const triggerSync = async (): Promise<{ success: boolean; syncedItems: number }> => {
    setIsSyncing(true);

    try {
      const queue = LocalPersistenceEngine.getSyncQueue();
      const count = queue.length;

      // Simulação de sincronização robusta com timeout de rede
      await new Promise((resolve) => setTimeout(resolve, 1200));

      LocalPersistenceEngine.markAllSynced();
      updateQueueCount();

      return { success: true, syncedItems: count };
    } catch {
      return { success: false, syncedItems: 0 };
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    pendingSyncCount,
    isSyncing,
    lastSyncTime,
    triggerSync,
    updateQueueCount,
  };
}
