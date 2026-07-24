/**
 * utils/exportCsv.ts
 * Exportación a CSV sin dependencias. En web genera un Blob y dispara la
 * descarga; en nativo no hay sistema de archivos accesible aquí, así que se
 * informa al usuario (se podría añadir expo-file-system/sharing más adelante).
 */

import { Platform } from 'react-native';
import { notifyError, notifySuccess } from './notify';

/** Escapa un valor para CSV (comillas dobles y separadores). */
function escapeCell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

/** Convierte filas a texto CSV. La primera fila son los encabezados. */
export function toCsv(rows: Array<Array<string | number | null | undefined>>): string {
  return rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

/**
 * Descarga las filas como archivo .csv.
 * Incluye BOM UTF-8 para que Excel muestre bien los acentos.
 */
export function downloadCsv(
  filename: string,
  rows: Array<Array<string | number | null | undefined>>
): void {
  if (rows.length === 0) {
    notifyError('No hay datos para exportar.');
    return;
  }

  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    notifyError(
      'La exportación de archivos está disponible en la versión web del portal.'
    );
    return;
  }

  try {
    const csv = '﻿' + toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notifySuccess(`Archivo "${link.download}" descargado (${rows.length - 1} filas).`);
  } catch {
    notifyError('No se pudo generar el archivo.');
  }
}

/** Fecha corta para nombrar archivos: 2026-07-23 */
export function fileDateStamp(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}
