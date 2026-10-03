const Counter = require('../models/Counter');

/**
 * Generates an atomic, sequential invoice number.
 * Format: FXV/YY-YY/XXXXX (e.g., FXV/25-26/00104)
 */
async function generateSequentialInvoiceNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1 - 12

  // Financial Year calculation (April 1st start in India)
  let fyStart = year;
  let fyEnd = year + 1;
  if (month < 4) {
    fyStart = year - 1;
    fyEnd = year;
  }
  const fyString = `${String(fyStart).slice(-2)}-${String(fyEnd).slice(-2)}`;
  const counterId = `invoice_${fyString}`;

  const counter = await Counter.findOneAndUpdate(
    { id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const sequenceNumber = String(counter.seq).padStart(5, '0');
  return `FXV/${fyString}/${sequenceNumber}`;
}

module.exports = { generateSequentialInvoiceNumber };
