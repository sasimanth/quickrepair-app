const PDFDocument = require('pdfkit');

/**
 * Compiles a PDF document buffer from invoice data
 * @param {object} invoice Data object or Mongoose Invoice document
 * @returns {Promise<Buffer>} PDF file buffer
 */
function generateInvoicePdfBuffer(invoice) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const biz = invoice.businessDetails || {};
      const cust = invoice.customerDetails || {};
      const prov = invoice.providerDetails || {};

      // Primary Colors
      const brandColor = '#2563EB';
      const darkColor = '#0F172A';
      const grayColor = '#64748B';

      // --- Header Section ---
      doc
        .fillColor(darkColor)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Fixvo', 40, 40)
        .fillColor(brandColor)
        .text('vo', 87, 40);

      doc
        .fillColor(grayColor)
        .fontSize(9)
        .font('Helvetica')
        .text(biz.tradeName || 'On-Demand Home Services & Certified Care', 40, 68);

      // Invoice Number & Date (Right Aligned)
      doc
        .fillColor(darkColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(invoice.invoiceNumber || 'TAX INVOICE', 350, 40, { align: 'right' })
        .fillColor(grayColor)
        .fontSize(9)
        .font('Helvetica')
        .text(`Date: ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}`, 350, 56, { align: 'right' })
        .text(`Status: Paid (${(invoice.paymentMethod || 'cash').toUpperCase()})`, 350, 68, { align: 'right' });

      // Divider
      doc.moveTo(40, 88).lineTo(555, 88).strokeColor('#E2E8F0').lineWidth(1).stroke();

      // --- Billing Details Box ---
      const boxTop = 100;
      doc.rect(40, boxTop, 250, 90).fillColor('#F8FAFC').fillAndStroke('#E2E8F0', 1);
      doc.rect(305, boxTop, 250, 90).fillColor('#F8FAFC').fillAndStroke('#E2E8F0', 1);

      // Billed To
      doc
        .fillColor(grayColor)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('BILLED TO', 50, boxTop + 8)
        .fillColor(darkColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(cust.name || 'Valued Customer', 50, boxTop + 22)
        .fillColor(grayColor)
        .fontSize(9)
        .font('Helvetica')
        .text(`Phone: ${cust.phone || 'N/A'}`, 50, boxTop + 36)
        .text(`Address: ${cust.address || 'N/A'}`, 50, boxTop + 50, { width: 230 });

      // Service Professional
      doc
        .fillColor(grayColor)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('SERVICE PROFESSIONAL', 315, boxTop + 8)
        .fillColor(darkColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(prov.name || 'Certified Fixvo Expert', 315, boxTop + 22)
        .fillColor(grayColor)
        .fontSize(9)
        .font('Helvetica')
        .text(`Phone: ${prov.phone || '+91 95159 80170'}`, 315, boxTop + 36)
        .text('Verification: Certified Partner', 315, boxTop + 50);

      // --- Itemized Table ---
      const tableTop = 205;
      doc.rect(40, tableTop, 515, 20).fill('#F1F5F9');

      doc
        .fillColor(grayColor)
        .fontSize(8)
        .font('Helvetica-Bold')
        .text('DESCRIPTION', 50, tableTop + 6)
        .text('CATEGORY', 340, tableTop + 6)
        .text('AMOUNT (INR)', 470, tableTop + 6, { align: 'right' });

      let yPos = tableTop + 26;
      (invoice.itemizedCharges || []).forEach((item) => {
        doc
          .fillColor(darkColor)
          .fontSize(9)
          .font('Helvetica-Bold')
          .text(item.description || 'Repair Service', 50, yPos, { width: 280 })
          .font('Helvetica')
          .fillColor(grayColor)
          .text(item.category || 'Service', 340, yPos)
          .fillColor(darkColor)
          .font('Helvetica-Bold')
          .text(`Rs. ${item.amount || 0}`, 470, yPos, { align: 'right' });

        yPos += 24;
      });

      doc.moveTo(40, yPos).lineTo(555, yPos).strokeColor('#E2E8F0').lineWidth(1).stroke();
      yPos += 10;

      // --- Summary Section ---
      doc
        .fillColor(grayColor)
        .fontSize(9)
        .font('Helvetica')
        .text('Subtotal:', 340, yPos)
        .fillColor(darkColor)
        .font('Helvetica-Bold')
        .text(`Rs. ${invoice.subTotal || 0}`, 470, yPos, { align: 'right' });

      if (invoice.discountAmount > 0) {
        yPos += 16;
        doc
          .fillColor('#047857')
          .fontSize(9)
          .font('Helvetica')
          .text('Promotional Discount:', 340, yPos)
          .font('Helvetica-Bold')
          .text(`- Rs. ${invoice.discountAmount}`, 470, yPos, { align: 'right' });
      }

      if (invoice.isGstApplicable) {
        if (invoice.cgstAmount > 0) {
          yPos += 16;
          doc
            .fillColor(grayColor)
            .fontSize(9)
            .font('Helvetica')
            .text(`CGST (${invoice.cgstRate}%):`, 340, yPos)
            .fillColor(darkColor)
            .text(`Rs. ${invoice.cgstAmount}`, 470, yPos, { align: 'right' });
        }
        if (invoice.sgstAmount > 0) {
          yPos += 16;
          doc
            .fillColor(grayColor)
            .fontSize(9)
            .font('Helvetica')
            .text(`SGST (${invoice.sgstRate}%):`, 340, yPos)
            .fillColor(darkColor)
            .text(`Rs. ${invoice.sgstAmount}`, 470, yPos, { align: 'right' });
        }
      }

      yPos += 20;
      doc.moveTo(340, yPos - 4).lineTo(555, yPos - 4).strokeColor('#E2E8F0').lineWidth(1).stroke();

      doc
        .fillColor(brandColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Total Paid:', 340, yPos)
        .text(`Rs. ${invoice.totalAmount || 0}`, 470, yPos, { align: 'right' });

      // Warranty Note
      yPos += 40;
      doc.rect(40, yPos, 515, 45).fillColor('#EFF6FF').fillAndStroke('#BFDBFE', 1);

      doc
        .fillColor('#1E3A8A')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('30-Day Fixvo Service Warranty', 52, yPos + 8)
        .font('Helvetica')
        .fontSize(8)
        .text('This service is protected under Fixvo 30-day warranty guarantee. For warranty claims or support, contact fixvosupport@gmail.com.', 52, yPos + 22, { width: 490 });

      // Footer
      doc
        .fillColor(grayColor)
        .fontSize(8)
        .font('Helvetica')
        .text(`${biz.legalName || 'Fixvo Technologies'} • ${biz.address || 'Andhra Pradesh, India'}`, 40, 780, { align: 'center' })
        .text(`Support Email: ${biz.email || 'fixvosupport@gmail.com'} • Phone: ${biz.phone || '+91 95159 80170'}`, 40, 792, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generateInvoicePdfBuffer };
