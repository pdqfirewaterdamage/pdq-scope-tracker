import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildReportHTML } from './templates';

export async function generateAndSharePDF(
  project: any,
  sheet: any,
  rooms: any[]
): Promise<void> {
  const html = buildReportHTML(project, sheet, rooms);

  const { uri } = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `PDQ Report — ${project.job_name}`,
    UTI: 'com.adobe.pdf',
  });
}
