import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

/**
 * Generates and downloads a PDF document from a dataset.
 * @param {string} title - The title of the document.
 * @param {Array<string>} head - An array of strings for the table headers.
 * @param {Array<Array<string>>} body - An array of arrays, where each inner array represents a row.
 * @param {string} fileName - The desired file name for the downloaded PDF.
 */
export const exportToPdf = (title, head, body, fileName) => {
  const doc = new jsPDF();

  // Set document title
  doc.setFontSize(18);
  doc.text(title, 14, 22);

  // Add generated date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Report generated on: ${dayjs().format('YYYY-MM-DD HH:mm')}`, 14, 30);

  // Add the table
  autoTable(doc, {
    startY: 35,
    head: head,
    body: body,
    theme: 'grid',
    headStyles: { fillColor: [22, 160, 133] }, // Theme color
    styles: { fontSize: 8 },
  });

  // Save the PDF
  doc.save(fileName);
};

