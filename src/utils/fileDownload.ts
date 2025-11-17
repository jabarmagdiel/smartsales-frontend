/**
 * Triggers a file download in the browser
 * @param blob The file content as a Blob
 * @param filename The name of the file to be downloaded
 */
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Generates a filename with a timestamp
 * @param prefix The prefix for the filename
 * @param extension The file extension (without the dot)
 * @returns A formatted filename with timestamp
 */
export const generateFilename = (prefix: string, extension: string): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  return `${prefix}_${dateStr}_${timeStr}.${extension}`;
};
