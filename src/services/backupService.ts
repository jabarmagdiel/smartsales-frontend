// src/services/backupService.ts
import apiClient from './apiClient';

export interface BackupFile {
  name: string;
  size: number;
  modified: string;
}

export const listBackups = async (): Promise<BackupFile[]> => {
  const res = await apiClient.get<{ results: BackupFile[] }>('/system/backups/');
  return res.data.results;
};

export const createBackup = async (): Promise<{ detail: string; file: string }> => {
  const res = await apiClient.post('/system/backups/create/');
  return res.data;
};

export const downloadBackup = async (filename: string): Promise<Blob> => {
  const res = await apiClient.get(`/system/backups/${encodeURIComponent(filename)}/download/`, { responseType: 'blob' });
  return res.data;
};

export const restoreBackupFromFile = async (file: File): Promise<any> => {
  const form = new FormData();
  form.append('file', file);
  const res = await apiClient.post('/system/backups/restore/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const restoreBackupByName = async (filename: string): Promise<any> => {
  const res = await apiClient.post('/system/backups/restore/', { filename });
  return res.data;
};
