/**
 * Servicio de Reportes (Ciclo 2)
 * 
 * Este servicio maneja la generación y descarga de reportes en diferentes formatos.
 * Utiliza el 'apiClient' centralizado que ya incluye el interceptor de autenticación JWT.
 */

import apiClient from './apiClient';
import { generateFilename } from '../utils/fileDownload';

// --- Definiciones de Tipos ---

export interface ReportData {
  [key: string]: any;
}

export interface GeneratedReport {
  id: number;
  title: string;
  created_at: string;
  status: string;
  data: ReportData | ReportData[];
  query_type?: string;
}

export interface QueryResponse {
  query_id: number;
  results: any[];
  message: string;
  report?: GeneratedReport;
}

// --- Funciones del Servicio ---

/**
 * Obtiene un reporte por su ID
 */
export const getReport = async (reportId: number): Promise<GeneratedReport> => {
  try {
    const response = await apiClient.get<GeneratedReport>(`/reports/${reportId}/`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching report:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch report');
  }
};

/**
 * Obtiene una lista de reportes generados anteriormente
 */
export const getGeneratedReports = async (): Promise<GeneratedReport[]> => {
  try {
    const response = await apiClient.get<{ results: GeneratedReport[] }>('/reports/');
    return response.data.results || [];
  } catch (error: any) {
    console.error('Error fetching reports:', error.response?.data || error.message);
    throw new Error('Failed to fetch reports');
  }
};

/**
 * Interpreta un prompt de texto y ejecuta la consulta
 */
export const generateReportQuery = async (prompt: string): Promise<QueryResponse> => {
  try {
    const response = await apiClient.post<QueryResponse>('/reports/query/', { prompt });
    return response.data;
  } catch (error: any) {
    console.error('Error generating report query:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to interpret prompt');
  }
};

/**
 * Exporta un reporte a PDF
 */
export const exportToPDF = async (reportId: number): Promise<Blob> => {
  try {
    const response = await apiClient.post(
      '/reports/export_pdf/',
      { report_id: reportId },
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error exporting to PDF:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to export to PDF');
  }
};

/**
 * Exporta un reporte a Excel
 */
export const exportToExcel = async (reportId: number): Promise<Blob> => {
  try {
    const response = await apiClient.post(
      '/reports/export_excel/',
      { report_id: reportId },
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error exporting to Excel:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to export to Excel');
  }
};

/**
 * Función genérica para descargar un reporte en el formato especificado
 */
export const downloadReport = async (reportId: number, format: 'pdf' | 'xlsx'): Promise<void> => {
  try {
    const blob = format === 'pdf' 
      ? await exportToPDF(reportId)
      : await exportToExcel(reportId);
    
    const filename = generateFilename(`reporte_${reportId}`, format);
    
    // Usar el helper de descarga
    const { downloadFile } = await import('../utils/fileDownload');
    downloadFile(blob, filename);
    
    return Promise.resolve();
  } catch (error) {
    console.error(`Error downloading ${format}:`, error);
    return Promise.reject(error);
  }
};