import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { fetchWithTimeout } from '@/lib/timeoutUtils';
import { getFromCache, setInCache } from '@/lib/cacheUtils';
import { TIMEOUT_CONFIG } from '@/lib/timeoutConfig';

export const useBackups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    const cacheKey = 'backups_list';
    const cached = getFromCache(cacheKey);
    
    if (cached) {
        setBackups(cached);
        setLoading(false);
    }

    try {
      const query = supabase
        .storage
        .from('backups')
        .list('', {
          limit: 100, 
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      const { data, error: err } = await fetchWithTimeout(query, TIMEOUT_CONFIG.FETCH_TIMEOUT);

      if (err) throw err;

      const formattedBackups = data.map(file => ({
        id: file.id,
        filename: file.name,
        size: file.metadata?.size || 0,
        created_at: file.created_at,
      }));

      setBackups(formattedBackups || []);
      setInCache(cacheKey, formattedBackups || [], 5);
    } catch (err) {
      console.error("Error fetching backups:", err);
      if (!cached) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBackup = async () => {
    setCreating(true);
    setProgress(10);
    try {
      const tables = ['orders', 'reservations', 'customers', 'menu_items', 'tables', 'ingredients'];
      const backupData = {};
      
      let completed = 0;
      for (const table of tables) {
        const { data, error } = await fetchWithTimeout(
            supabase.from(table).select('*').limit(2000),
            TIMEOUT_CONFIG.FETCH_TIMEOUT * 2 // Give a bit more time for backups
        );
        if (error) throw error;
        backupData[table] = data || [];
        completed++;
        setProgress(10 + (completed / tables.length) * 50);
      }

      setProgress(70);
      const zip = new JSZip();
      const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
      const filename = `backup_${dateStr}.zip`;
      
      zip.file('metadata.json', JSON.stringify({
        created_at: new Date().toISOString(),
        version: '1.0',
        tables: tables
      }));

      for (const [table, rows] of Object.entries(backupData)) {
        zip.file(`${table}.json`, JSON.stringify(rows, null, 2));
      }

      setProgress(85);
      const blob = await zip.generateAsync({ type: 'blob' });

      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(filename, blob, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      setProgress(100);
      await fetchBackups();
      return true;
    } catch (err) {
      console.error("Error creating backup:", err);
      setError(err.message);
      return false;
    } finally {
      setCreating(false);
      setProgress(0);
    }
  };

  const deleteBackup = async (filename) => {
    try {
      const { error } = await supabase.storage.from('backups').remove([filename]);
      if (error) throw error;
      await fetchBackups(); 
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const downloadBackup = async (filename) => {
    try {
      const { data, error } = await supabase.storage.from('backups').download(filename);
      if (error) throw error;
      saveAs(data, filename);
    } catch (err) {
      setError('Failed to download backup');
    }
  };

  const restoreBackup = async (file) => {
    setRestoring(true);
    try {
      const zip = await JSZip.loadAsync(file);
      if (!zip.file('metadata.json')) throw new Error('Invalid backup file');
      
      const metadata = JSON.parse(await zip.file('metadata.json').async('text'));
      const tables = metadata.tables || [];

      for (const table of tables) {
        const fileContent = await zip.file(`${table}.json`)?.async('text');
        if (fileContent) {
          const rows = JSON.parse(fileContent);
          if (rows.length > 0) {
             const chunkSize = 50;
             for (let i = 0; i < rows.length; i += chunkSize) {
                const chunk = rows.slice(i, i + chunkSize);
                await supabase.from(table).upsert(chunk);
             }
          }
        }
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setRestoring(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  return { backups, loading, creating, restoring, error, progress, createBackup, deleteBackup, downloadBackup, restoreBackup, refresh: fetchBackups };
};