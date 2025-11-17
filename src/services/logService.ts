import apiClient from './apiClient';

export interface LogEntry {
  id: number;
  timestamp: string;
  user: {
    id: number;
    username: string;
  } | null;
  ip_address: string;
  action: string;
  created_at?: string; // For backward compatibility
}

interface LogFilterParams {
  user?: string;
  start_date?: string;
  end_date?: string;
  action?: string;
  page?: number;
  page_size?: number;
}

/**
 * Get logs with optional filtering
 */
export const getLogs = async (params: LogFilterParams = {}): Promise<{ results: LogEntry[]; count: number }> => {
  try {
    const response = await apiClient.get('/admin/logs/', { params });
    return {
      results: response.data.results || [],
      count: response.data.count || 0
    };
  } catch (error: any) {
    console.error('Error fetching logs:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch logs');
  }
};

/**
 * Export logs in the specified format (pdf, xlsx, csv)
 */
export const exportLogs = async (format: 'pdf' | 'xlsx' | 'csv', filters: Omit<LogFilterParams, 'page' | 'page_size'>): Promise<Blob> => {
  try {
    const response = await apiClient.get(`/admin/logs/export/`, {
      params: { ...filters, format },
      responseType: 'blob',
    });
    return response.data;
  } catch (error: any) {
    console.error(`Error exporting logs as ${format}:`, error.response?.data || error.message);
    throw new Error(`Failed to export logs as ${format}`);
  }
};
